This specialized LangGraph agent, named "file agent", is designed to create an empty file named "working.txt" in the user's home directory using the `terminal` tool. It integrates a placeholder `mcp` tool as requested, which reports that no MCP servers are configured given the empty configuration. The agent is built with LangGraph, includes robust error handling, logging, and can be run as a standalone Python script.

**Key Features:**

1.  **LangGraph Framework**: Uses `langgraph.graph.StateGraph` for defining the agent's workflow.
2.  **Specialized Task Logic**: The agent's prompt is highly focused on creating `~/working.txt` using the `touch` command via the `terminal` tool.
3.  **Terminal Tool (`execute_shell_command`)**: A custom tool that safely executes shell commands using `subprocess`, capturing stdout and stderr, and handling potential errors.
4.  **MCP Tool Integration (`get_mcp_server_status`)**: A placeholder tool is included as per the requirement. Since the provided `mcp` config is empty `{}`, this tool reports that no MCP servers are available.
5.  **Error Handling and Logging**: Comprehensive `try-except` blocks for tool execution and `logging` module for tracking agent's decisions and tool outputs.
6.  **Standalone Execution**: The script is runnable directly, demonstrating the agent's execution flow.

**Before Running:**

1.  **Install necessary libraries**:
    ```bash
    pip install langchain-openai langgraph langchain_core
    ```
2.  **Set your OpenAI API Key**: The agent uses `ChatOpenAI`. You need to set your `OPENAI_API_KEY` environment variable.
    ```bash
    export OPENAI_API_KEY="your_openai_api_key_here"
    ```
    (Replace `"your_openai_api_key_here"` with your actual key).

---

```python
import os
import logging
import subprocess
from typing import TypedDict, Annotated, List, Union
from datetime import datetime

# LangChain and LangGraph imports
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# --- 1. Set up Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- 2. Define Tools ---

@tool
def execute_shell_command(command: str) -> str:
    """
    Executes a shell command and returns its stdout and stderr.
    Handles potential errors during command execution.
    """
    logger.info(f"Executing shell command: '{command}'")
    try:
        # Using shell=True for convenience, but be cautious with untrusted input.
        # For an agent generating its own commands, this is a common pattern.
        process = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            check=True,  # Raise CalledProcessError for non-zero exit codes
            timeout=60   # Add a timeout for safety
        )
        output = process.stdout.strip()
        if process.stderr:
            # Log stderr as a warning, but include it in the output for the agent
            logger.warning(f"Command '{command}' produced stderr: {process.stderr.strip()}")
            output = f"STDOUT:\n{output}\nSTDERR:\n{process.stderr.strip()}"
        logger.info(f"Command '{command}' executed successfully.")
        return output
    except subprocess.CalledProcessError as e:
        error_msg = (f"Error executing command: '{command}'. Exit code: {e.returncode}.\n"
                     f"STDOUT: {e.stdout.strip()}\nSTDERR: {e.stderr.strip()}")
        logger.error(error_msg)
        return error_msg
    except FileNotFoundError:
        error_msg = f"Error: Command '{command.split()[0]}' not found. Make sure it's in your PATH."
        logger.error(error_msg)
        return error_msg
    except Exception as e:
        error_msg = f"An unexpected error occurred while executing command '{command}': {e}"
        logger.error(error_msg, exc_info=True)
        return error_msg

# Placeholder for MCP tool integration
# The prompt specified an empty config: {}
mcp_servers_config = {} 

@tool
def get_mcp_server_status(server_name: str = "all") -> str:
    """
    Retrieves the status of an MCP server or all configured servers.
    Reports that no servers are configured if `mcp_servers_config` is empty.
    """
    if not mcp_servers_config:
        logger.warning("No MCP servers are configured (mcp_servers_config is empty).")
        return "No MCP servers are configured. Cannot retrieve server status."
    
    # In a real scenario, this would connect to actual MCP servers based on mcp_servers_config
    # and return real status for the specified server_name.
    logger.info(f"Attempted to get status for MCP server(s): {server_name}. "
                "This is a placeholder, actual MCP interaction not implemented.")
    return f"MCP server '{server_name}' status: [Placeholder - No actual servers configured from config {mcp_servers_config}]"

# List of all tools available to the agent
tools = [execute_shell_command, get_mcp_server_status]

# --- 3. Define Agent State ---

class AgentState(TypedDict):
    """
    Represents the state of our agent's graph.
    - messages: A list of messages detailing the interaction history.
    """
    messages: Annotated[List[BaseMessage], lambda x: x] # Appends new messages

# --- 4. Create the specialized agent (LLM chain) ---

# This prompt is highly specialized for creating a file.
# It guides the LLM to use the `terminal` tool with a specific command.
AGENT_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", 
         "You are a 'file agent' specialized in creating files. "
         "Your primary and only goal is to create an empty file named 'working.txt' in the user's home directory ('~/'). "
         "You MUST use the 'terminal' tool for this. The command to create an empty file is `touch`. "
         "Do NOT try to use any other tools unless absolutely necessary for debugging if `touch` specifically fails and you need to inspect the environment. "
         "Once the file is successfully created, report 'File 'working.txt' created successfully in the home directory.' "
         "If you encounter an error (e.g., from the terminal tool), report the error details clearly and indicate that the file could not be created. "
         "If the terminal tool reports success, your final message should be a confirmation of file creation."
         "\n\nAvailable tools: {tool_names}"
        ),
        ("placeholder", "{messages}"), # This will be filled by the LangGraph state with chat history
    ]
)

# Initialize the LLM. Ensure OPENAI_API_KEY is set in your environment.
try:
    llm = ChatOpenAI(model="gpt-4o", temperature=0) # gpt-4o is excellent for tool calling
    logger.info("Using OpenAI LLM (gpt-4o).")
except Exception as e:
    logger.error(f"Failed to initialize ChatOpenAI. Ensure 'langchain-openai' is installed and OPENAI_API_KEY is set: {e}")
    # Fallback or exit if LLM is critical
    llm = None
    exit("LLM not configured. Exiting.") 

# Create the LLM chain for the agent's decision-making
# It uses the prompt, passes it to the LLM, and binds the tools, allowing the LLM
# to generate tool calls in its output.
agent_runnable = AGENT_PROMPT | llm.bind_tools(tools)

# --- 5. Define Graph Nodes ---

def call_agent(state: AgentState):
    """
    Node to invoke the LLM agent to decide the next action based on the current state (messages).
    """
    logger.debug("--- Calling Agent (LLM) ---")
    messages = state["messages"]
    
    # Invoke the LLM with the current chat history and available tool names.
    # The LLM will decide whether to call a tool or produce a final answer.
    response = agent_runnable.invoke({"messages": messages, "tool_names": [t.name for t in tools]})
    logger.debug(f"Agent raw response: {response}")
    
    # Return the LLM's response message to update the state.
    return {"messages": [response]}


def call_tool(state: AgentState):
    """
    Node to execute the tool chosen by the agent.
    """
    logger.debug("--- Calling Tool ---")
    last_message = state["messages"][-1]
    
    # The agent's last message should contain tool_calls
    if not last_message.tool_calls:
        error_msg = f"Agent's last message did not contain tool calls: {last_message}"
        logger.error(error_msg)
        # Return an AI message indicating an internal error for the agent to process
        return {"messages": [AIMessage(content=f"Internal error: Agent did not provide a tool call as expected. {error_msg}")]}

    tool_outputs = []
    for tool_call in last_message.tool_calls:
        tool_name = tool_call.name
        tool_args = tool_call.args
        
        logger.info(f"Invoking tool: '{tool_name}' with args: {tool_args}")
        try:
            # Find and execute the corresponding tool function from our list of tools
            selected_tool = next(t for t in tools if t.name == tool_name)
            output = selected_tool.invoke(tool_args)
            logger.info(f"Tool '{tool_name}' output (first 200 chars): {str(output)[:200]}...")
            # Append the tool's output as a ToolMessage, linking it to the tool_call_id
            tool_outputs.append(ToolMessage(content=str(output), tool_call_id=tool_call.id))
        except Exception as e:
            error_message = f"Error invoking tool '{tool_name}' with args {tool_args}: {e}"
            logger.error(error_message, exc_info=True)
            tool_outputs.append(ToolMessage(content=error_message, tool_call_id=tool_call.id))

    # Return the list of ToolMessages to update the state.
    return {"messages": tool_outputs}

# --- 6. Define Graph Edges and Logic ---

def should_continue(state: AgentState):
    """
    Determines the next step in the graph based on the last message in the state.
    - If the agent requested a tool, route to `tools`.
    - If a tool just executed, route back to `agent` to process the output.
    - Otherwise (e.g., agent produced a final answer), end the graph.
    """
    logger.debug("--- Determining Next Step ---")
    last_message = state["messages"][-1]

    # If the last message from the agent contains tool calls, we need to execute them.
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        logger.debug("Agent requested a tool call. Routing to 'tools' node.")
        return "call_tool"
    
    # If the last message is a ToolMessage, it means a tool was just executed.
    # The agent needs to process this output to decide its next step (e.g., final answer).
    if isinstance(last_message, ToolMessage):
        logger.debug("Tool output received. Routing back to 'agent' for processing.")
        return "continue" # Go back to agent to process tool output

    # If neither of the above, it implies the agent has produced a final, non-tool-calling message.
    logger.debug("Agent produced a final answer. Routing to END.")
    return "end"


# --- 7. Build the LangGraph Workflow ---

def create_file_agent_graph():
    """
    Creates and compiles the LangGraph workflow for the file agent.
    """
    workflow = StateGraph(AgentState)

    workflow.add_node("agent", call_agent) # Node for LLM decision-making
    workflow.add_node("tools", call_tool)   # Node for tool execution

    workflow.set_entry_point("agent") # The graph starts by calling the agent

    # Define conditional edges from the 'agent' node
    workflow.add_conditional_edges(
        "agent",
        should_continue, # The function to determine the next state
        {
            "call_tool": "tools",  # If should_continue returns "call_tool", go to "tools"
            "continue": "agent",   # If should_continue returns "continue", go back to "agent"
            "end": END             # If should_continue returns "end", terminate the graph
        }
    )
    
    # After tool execution, always route back to the agent to process the tool's output
    workflow.add_edge("tools", "agent")

    # Compile the graph into an executable application
    app = workflow.compile()
    logger.info("LangGraph file agent compiled successfully.")
    return app

# --- 8. Main Execution Logic ---

if __name__ == "__main__":
    logger.info("Starting specialized File Agent execution.")

    # Initialize and compile the graph
    app = create_file_agent_graph()

    # Define the initial input message for the agent's specific task.
    # This acts as the user's instruction to the agent.
    initial_instruction = HumanMessage(
        content="Please create an empty file named 'working.txt' in my home directory (~/). "
                "Confirm once it's done or report any errors."
    )

    print("\n--- Agent Conversation ---")
    try:
        # Run the agent and stream the intermediate states.
        # 'stream_mode="values"' yields the complete state object at each step.
        final_output = None
        for step, s in enumerate(app.stream({"messages": [initial_instruction]}, stream_mode="values")):
            current_node = list(s.keys())[0] # Get the name of the active node
            current_messages = s[current_node]["messages"]
            last_message = current_messages[-1] # Get the latest message in the state
            
            print(f"\n--- Step {step+1} (Node: {current_node}) ---")
            if isinstance(last_message, AIMessage):
                print(f"AI: {last_message.content}")
                if last_message.tool_calls:
                    print(f"AI requested tool calls: {last_message.tool_calls}")
            elif isinstance(last_message, ToolMessage):
                print(f"Tool Output: {last_message.content}")
            elif isinstance(last_message, HumanMessage):
                print(f"Human: {last_message.content}")
            
            # Keep track of the final output (assuming the last AIMessage without tool_calls is the final answer)
            if current_node == "agent" and isinstance(last_message, AIMessage) and not last_message.tool_calls:
                final_output = last_message.content

        print("\n--- Agent Run Completed ---")
        if final_output:
            print(f"Final Agent Report: {final_output}")
        else:
            print("Agent finished without a clear final report message.")

        # --- Verification Step (Optional) ---
        home_dir = os.path.expanduser("~")
        file_path = os.path.join(home_dir, "working.txt")
        print(f"\n--- Verifying file creation at: {file_path} ---")
        if os.path.exists(file_path):
            logger.info(f"Verification: File '{file_path}' exists.")
            print(f"SUCCESS: File '{file_path}' was found.")
            
            # --- Cleanup (Optional) ---
            # Uncomment the following lines to remove the created file after verification
            # os.remove(file_path)
            # logger.info(f"Verification: File '{file_path}' removed for cleanup.")
            # print(f"File '{file_path}' has been removed.")
        else:
            logger.warning(f"Verification: File '{file_path}' DOES NOT exist.")
            print(f"FAILURE: File '{file_path}' was NOT found.")

    except Exception as e:
        logger.error(f"An unexpected error occurred during agent execution: {e}", exc_info=True)
        print(f"\nERROR: Agent execution failed: {e}")

