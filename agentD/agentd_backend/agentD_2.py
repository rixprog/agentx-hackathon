from .agentD_State import AgentState
from langgraph.graph import add_messages, StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from dotenv import load_dotenv
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
import sqlite3
import aiosqlite
from langgraph.prebuilt import ToolNode
from .terminal_tool import execute_shell_command
from .zapier_tools import initialize_and_get_mcp_tools 
from .file_tools import get_file_tools, create_file, write_file, read_file, replace_in_file, delete_file
from .browse_cloud_tool import browse_web_cloud
from .prompts import SYSTEM_PROMPT
import re
import os

import asyncio

load_dotenv()

# Global variables
_agent = None
zapier_tools_list = []
mcp_active = False

def format_system_info(content: str) -> str:
    """Format system information without markdown formatting."""
    # Remove markdown formatting
    content = re.sub(r'\*\*|\*|`', '', content)
    
    # Split into sections
    sections = content.split('\n*')
    
    # Format each section
    formatted_sections = []
    for section in sections:
        if not section.strip():
            continue
            
        # Remove leading/trailing whitespace and colons
        section = section.strip().strip(':')
        
        # Split into title and content
        if ':' in section:
            title, content = section.split(':', 1)
            title = title.strip()
            content = content.strip()
            
            # Special handling for disk space and memory usage
            if title == 'Disk Space' or title == 'Memory Usage':
                # Split content into lines and format as a table
                lines = content.split('\n')
                if lines:
                    # Use the first line as header
                    header = lines[0].strip()
                    # Format the rest as table rows
                    rows = [line.strip() for line in lines[1:] if line.strip()]
                    # Join with newlines
                    content = f"{header}\n" + "\n".join(rows)
            
            # Format the section
            formatted_section = f"{title}:\n{content}"
            formatted_sections.append(formatted_section)
        else:
            formatted_sections.append(section)
    
    # Join sections with newlines
    return '\n\n'.join(formatted_sections)

def format_tool_output(content: str) -> str:
    """Format tool output in a user-friendly way."""
    # Remove any markdown formatting
    content = re.sub(r'\*\*|\*|`', '', content)
    
    # Split into lines and remove empty lines
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    # Format each line as a bullet point
    formatted_lines = []
    for line in lines:
        # Remove any existing bullet points or numbers
        line = re.sub(r'^[\d\.\s\-*]+', '', line).strip()
        if line:
            formatted_lines.append(f"• {line}")
    
    # Join with newlines
    return '\n'.join(formatted_lines)

def init_chat_db():
    conn = sqlite3.connect("memory.sqlite")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            content TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        )
    ''')
    conn.commit()
    conn.close()

async def initialize_agent():
    """Initialize the LangGraph agent with necessary tools and configuration."""
    global _agent, zapier_tools_list
    
    if _agent is not None:
        return _agent

    sqlite_conn = await aiosqlite.connect("memory.sqlite", check_same_thread=False)
    memory = AsyncSqliteSaver(sqlite_conn)

    # Initialize chat DB tables
    init_chat_db()

    # Initialize Zapier tools (will return empty list if MCP is not available)
    zapier_tools_list = await initialize_and_get_mcp_tools()
    
    global mcp_active
    mcp_active = len(zapier_tools_list) > 0

    graph = StateGraph(AgentState)

    # Get Google API key from environment variable
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise RuntimeError("GOOGLE_API_KEY environment variable not set. Please set it to your Google Generative AI API key.")

    # Pass the API key to the LLM
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=google_api_key)
    # llm = ChatGroq(model="openai/gpt-oss-20b")

    # Combine all tools
    all_tools = [execute_shell_command]
    all_tools.extend(get_file_tools())
    all_tools.append(browse_web_cloud)
    
    # Only add Zapier tools if they were successfully initialized
    if zapier_tools_list:
        all_tools.extend(zapier_tools_list)

    llm_with_tools = llm.bind_tools(tools=all_tools)

    async def agentDChat(state: AgentState):
        response = await llm_with_tools.ainvoke(state["messages"])
        
        # Format system information if present
        if isinstance(response, AIMessage):
            if "system information" in response.content.lower():
                response.content = format_system_info(response.content)
            elif "tool" in response.content.lower() or "command" in response.content.lower():
                response.content = format_tool_output(response.content)
                
        return {"messages": [response]}

    def tools_router(state: AgentState):
        last_message = state["messages"][-1]
        if isinstance(last_message, ToolMessage):   
            return "chat"
        
        if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
            return "tool_node"
        else: 
            return END
        
    tool_node = ToolNode(tools=all_tools)

    graph.add_node("chat", agentDChat)
    graph.add_node("tool_node", tool_node)

    graph.add_conditional_edges(
        "chat",
        tools_router,
        {
            "tool_node": "tool_node",
            END: END
        }
    )

    graph.add_conditional_edges(
        "tool_node",
        tools_router,
        {
            "chat": "chat",
            END: END
        }
    )

    graph.set_entry_point("chat")
    _agent = graph.compile(checkpointer=memory)
    
    return _agent

async def invoke_agent(message: str, config: dict):
    """Invoke the agent with a message and yield progress and response."""
    global _agent
    
    if _agent is None:
        _agent = await initialize_agent()

    # Generate progress steps
    from .progress_gemini import generate_progress_steps
    progress_steps = generate_progress_steps(message, max_steps=6, mcp_active=mcp_active)
    
    # Yield progress steps
    for i, step in enumerate(progress_steps, 1):
        yield {"type": "progress", "step": i, "total": len(progress_steps), "message": step}
        await asyncio.sleep(0.5)  # Small delay for real-time feel

    initial_message_content = f"{SYSTEM_PROMPT}\n\nUser request: {message}"
    
    result = await _agent.ainvoke({
        "messages": [HumanMessage(content=initial_message_content)],
    }, config=config)
    print(result["messages"][-1])
    
    # Yield final result
    final_message = result["messages"][-1]
    response_content = ""
    if isinstance(final_message, AIMessage):
        response_content = final_message.content if hasattr(final_message, "content") else str(final_message)
    elif isinstance(final_message, ToolMessage):
        response_content = f"Agent executed tool. Output: {final_message.content if hasattr(final_message, 'content') else str(final_message)}"
    else:
        response_content = str(final_message)
    
    yield {"type": "response", "content": response_content}

async def summarize_chat_history(messages: list) -> str:
    """Summarize the chat history."""
    if not messages:
        return "Untitled Chat"
        
    # Simple summarization: use the first user message as the title
    for msg in messages:
        if msg.get("role") == "user":
            content = msg.get("content", "")
            # Take first 50 characters or up to first newline
            summary = content.split("\n")[0][:50]
            return summary + "..." if len(content) > 50 else summary
            
    return "Untitled Chat"

