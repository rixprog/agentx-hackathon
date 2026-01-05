import asyncio
import os
import subprocess
import operator
from typing import TypedDict, Annotated, Sequence

from langchain_core.tools import tool
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, FunctionMessage, SystemMessage
from langchain_community.chat_models import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor
from langgraph.checkpoint.memory import MemorySaver

class AgentState(TypedDict):
    """
    Represents the state of our agent.
    Messages: A sequence of messages passed between the agent and tools.
    """
    messages: Annotated[Sequence[BaseMessage], operator.add]

@tool
def execute_shell_command(command: str) -> str:
    """
    Executes a shell command and returns its output.
    Handles potential errors in command execution.
    """
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True,
            timeout=60
        )
        output = result.stdout.strip()
        error = result.stderr.strip()
        if error:
            return f"Command executed with output:\n{output}\nError:\n{error}"
        return f"Command executed successfully. Output:\n{output}"
    except subprocess.CalledProcessError as e:
        return (
            f"Command failed with exit code {e.returncode}.\n"
            f"STDOUT:\n{e.stdout}\n"
            f"STDERR:\n{e.stderr}"
        )
    except subprocess.TimeoutExpired as e:
        return (
            f"Command timed out after {e.timeout} seconds.\n"
            f"STDOUT:\n{e.stdout}\n"
            f"STDERR:\n{e.stderr}"
        )
    except Exception as e:
        return f"An unexpected error occurred while executing command: {e}"

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

tools_list = [execute_shell_command]
tool_executor = ToolExecutor(tools_list)

async def agent_node(state: AgentState):
    """
    The agent node that decides whether to call a tool or respond directly.
    """
    messages = state["messages"]
    system_instruction = SystemMessage(
        content="You are an AI assistant that can execute shell commands. "
                "Your primary goal is to help the user create or manage files using the 'execute_shell_command' tool. "
                "If the user asks you to create a file, use the 'execute_shell_command' tool to do so. "
                "Always respond with the result of the command execution, or inform the user if you cannot perform the task."
    )
    response = await llm.ainvoke([system_instruction] + messages, tools=tools_list)
    return {"messages": [response]}

async def tool_node(state: AgentState):
    """
    The tool node that executes tool calls made by the agent.
    """
    messages = state["messages"]
    last_message = messages[-1]

    outputs = []
    for tool_call in last_message.tool_calls:
        try:
            output = await tool_executor.ainvoke(tool_call)
            outputs.append(FunctionMessage(name=tool_call["name"], content=str(output), tool_call_id=tool_call["id"]))
        except Exception as e:
            outputs.append(FunctionMessage(name=tool_call["name"], content=f"Error executing tool '{tool_call['name']}': {e}", tool_call_id=tool_call["id"]))

    return {"messages": outputs}

def should_continue(state: AgentState) -> str:
    """
    Determines whether the agent should continue by calling a tool or finish.
    """
    messages = state["messages"]
    last_message = messages[-1]

    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "continue_tools"
    return "end"

workflow = StateGraph(AgentState)

workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)

workflow.set_entry_point("agent")

workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "continue_tools": "tools",
        "end": END
    }
)

workflow.add_edge("tools", "agent")

app = workflow.compile(checkpointer=MemorySaver())

async def main():
    file_name = "working.txt"
    file_path = os.path.join(os.path.expanduser('~'), file_name)
    
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"Cleaned up existing '{file_path}' before starting.")

    print(f"Agent Goal: Create an empty file named '{file_name}' in the home directory (~).\n")
    print(f"Target file path: '{file_path}'\n")

    initial_message_content = (
        f"Please create an empty file named '{file_name}' in my home directory. "
        f"You should use the 'execute_shell_command' tool for this. "
        f"The specific command to create it is: 'touch {file_path}'."
    )
    initial_message = HumanMessage(content=initial_message_content)

    print("--- Starting Agent Run ---")
    final_agent_response = None
    async for s in app.astream({"messages": [initial_message]}):
        if "__end__" not in s:
            print(s)
            print("---")
            if "agent" in s and s["agent"]["messages"] and isinstance(s["agent"]["messages"][-1], AIMessage):
                final_agent_response = s["agent"]["messages"][-1].content
        else:
            if s["__end__"]["messages"]:
                last_msg = s["__end__"]["messages"][-1]
                if isinstance(last_msg, AIMessage):
                    final_agent_response = last_msg.content
                elif isinstance(last_msg, FunctionMessage):
                    final_agent_response = f"Tool executed successfully. Output: {last_msg.content}"

    print("\n--- Agent Run Complete ---")
    if final_agent_response:
        print(f"Final Agent Summary: {final_agent_response}")
    else:
        print("No final agent summary available.")

    print("\n--- Verification ---")
    if os.path.exists(file_path):
        print(f"SUCCESS: File '{file_path}' exists.")
        if os.path.getsize(file_path) == 0:
            print(f"SUCCESS: File '{file_path}' is empty.")
        else:
            print(f"WARNING: File '{file_path}' is NOT empty (size: {os.path.getsize(file_path)} bytes).")
    else:
        print(f"FAILURE: File '{file_path}' does NOT exist.")
        print("Please check the agent's output for any errors during command execution.")

if __name__ == "__main__":
    asyncio.run(main())