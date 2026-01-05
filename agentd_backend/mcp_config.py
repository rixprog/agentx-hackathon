from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json
from pathlib import Path
from .agentD_2 import initialize_agent,invoke_agent
router = APIRouter()

def get_config_path() -> Path:
    """Get the path to the MCP configuration file."""
    # Go up two levels from the current file to reach the root directory
    root_dir = Path(__file__).parent.parent.parent
    config_path = root_dir / "browser_mcp.json"
    print(f"DEBUG: MCP config path: {config_path.absolute()}")
    return config_path

def load_config() -> Dict[str, Any]:
    """Load the current MCP configuration."""
    config_path = get_config_path()
    print(f"DEBUG: Loading config from: {config_path}")
    if not config_path.exists():
        print("DEBUG: Config file does not exist, creating default")
        return {"mcpServers": {}}
        
    try:
        with open(config_path, 'r') as file:
            config = json.load(file)
            print(f"DEBUG: Loaded config: {config}")
            return config
    except Exception as e:
        print(f"Error reading MCP configuration: {e}")
        return {"mcpServers": {}}

def save_config(config: Dict[str, Any]) -> None:
    """Save the MCP configuration."""
    config_path = get_config_path()
    print(f"DEBUG: Saving config to: {config_path}")
    print(f"DEBUG: Config to save: {config}")
    try:
        with open(config_path, 'w') as file:
            json.dump(config, file, indent=2)
        print("DEBUG: Config saved successfully")
    except Exception as e:
        print(f"Error saving MCP configuration: {e}")
        raise

@router.get("/mcp_config")
async def get_mcp_config():
    """Get the current MCP configuration."""
    try:
        return load_config()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading MCP configuration: {str(e)}")

@router.post("/mcp_config")
async def update_mcp_config(config: Dict[str, Any]):
    """Update the MCP configuration."""
    try:
        # Load existing configuration
        current_config = load_config()
        
        # Ensure mcpServers exists in both configs
        if "mcpServers" not in current_config:
            current_config["mcpServers"] = {}
        if "mcpServers" not in config:
            config["mcpServers"] = {}
            
        # Merge new servers with existing ones
        current_config["mcpServers"].update(config["mcpServers"])
        
        # Save the merged configuration
        save_config(current_config)
        
        return {
            "status": "success", 
            "message": "MCP configuration updated successfully",
            "config": current_config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating MCP configuration: {str(e)}")

@router.post("/mcp_config/append")
async def append_mcp_server(new_server: Dict[str, Any]):
    """Append a new MCP server to the configuration file. Accepts both wrapped and unwrapped payloads."""
    try:
        print(f"DEBUG: Received payload for append: {new_server}")
        # If not wrapped, auto-wrap with a default key
        if "mcpServers" not in new_server:
            # Try to infer a key from the payload
            import uuid
            key = new_server.get("env", {}).get("CLIENT_NAME") or new_server.get("command") or f"server_{uuid.uuid4().hex[:6]}"
            wrapped = {"mcpServers": {str(key): new_server}}
        else:
            wrapped = new_server
        # Validate
        if not isinstance(wrapped["mcpServers"], dict):
            return {"status": "error", "message": "'mcpServers' must be an object."}
        # Load existing configuration
        current_config = load_config()
        if "mcpServers" not in current_config:
            current_config["mcpServers"] = {}
        # Merge new server(s) into existing config
        current_config["mcpServers"].update(wrapped["mcpServers"])
        # Save updated config
        save_config(current_config)
        return {
            "status": "success",
            "message": "MCP server(s) appended successfully.",
            "config": current_config
        }
    except Exception as e:
        print(f"Error appending MCP server: {e}")
        return {"status": "error", "message": f"Error appending MCP server: {str(e)}"} 