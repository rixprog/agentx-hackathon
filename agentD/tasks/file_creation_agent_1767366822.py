import asyncio
from langgraph.graph import StateGraph, END
from agentd_backend.terminal_tool import execute_shell_command
from agentd_backend.zapier_tools import initialize_and_get_mcp_tools
from agentd_backend.browse_cloud_tool import browse_web_cloud
from agentd_backend.file_tools import create_file, write_file, read_file, list_directory
from typing import TypedDict, List
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

class AgentState(TypedDict):
    messages: List[BaseMessage]
    current_task: str

async def initialize_tools():
    # Initialize MCP tools as required, even if not directly used by this specific agent task.
    mcp_tools = await initialize_and_get_mcp_tools()
    # For this specific agent, execute_shell_command is directly imported and used.
    # Other file tools are also imported but not used in this specific task.
    return {"mcp_tools": mcp_tools}

def agent_node(state: AgentState):
    messages = state.get("messages", [])
    task = state.get("current_task", "No task specified for the agent.")

    messages.append(AIMessage(f"Agent received task: {task}"))

    # The task is to create an empty file named working.txt in the home directory.
    # This can be achieved using the 'touch' command via the terminal tool.
    command_to_execute = "touch ~/working.txt"

    try:
        messages.append(AIMessage(f"Attempting to execute command: '{command_to_execute}'"))
        output = execute_shell_command(command_to_execute)
        
        if output.strip():
            # If there's any output (e.g., from stderr if an error occurred, or info), log it.
            messages.append(AIMessage(f"Command output: {output.strip()}"))
        
        # Verify if the file exists (optional, but good for robust agents)
        check_command = "ls -l ~/working.txt"
        check_output = execute_shell_command(check_command)
        if "No such file or directory" in check_output or "cannot access" in check_output:
            messages.append(AIMessage(f"Verification failed: File '~/working.txt' does not appear to exist. Output: {check_output.strip()}"))
            raise Exception("File creation verification failed.")
        else:
            messages.append(AIMessage("File '~/working.txt' successfully created or already existed."))

    except Exception as e:
        messages.append(AIMessage(f"Error during file creation: {e}"))
        messages.append(AIMessage("Failed to create file '~/working.txt'."))

    return {"messages": messages}

async def main():
    # Initialize tools. For this specific agent, `execute_shell_command` is directly used.
    # mcp_tools are initialized as per requirements, even if not directly invoked by this node.
    tools = await initialize_tools() 

    graph = StateGraph(AgentState)

    # Define the single agent node for file creation
    graph.add_node("file_creator", agent_node)

    # Set the entry point for the graph
    graph.set_entry_point("file_creator")

    # The agent finishes after attempting to create the file
    graph.add_edge("file_creator", END)

    app = graph.compile()

    # Define the initial state with the task
    initial_state = {
        "messages": [HumanMessage(
            "Please create an empty file named working.txt in the user's home directory."
        )],
        "current_task": "create a file named working.txt in ~ directory.it should be empty"
    }

    print("Running the file creation agent...")
    try:
        final_state = await app.ainvoke(initial_state)
        print("\n--- Agent execution finished ---")
        for msg in final_state["messages"]:
            print(f"{msg.type}: {msg.content}")
    except Exception as e:
        print(f"\n--- An unexpected error occurred during agent execution: {e} ---")

if __name__ == "__main__":
    asyncio.run(main())