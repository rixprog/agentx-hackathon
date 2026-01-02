from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
import json
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from pathlib import Path
from typing import Dict, Any, List
import json
from contextlib import asynccontextmanager
import sqlite3
from datetime import datetime, timezone
import os
# Import backend components
from agentd_backend.agentD_2 import initialize_agent, invoke_agent, summarize_chat_history
from agentd_backend.agentD_State import AgentState
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from agentd_backend.mcp_config import router as mcp_router
from agentd_backend.system_metrics import (
    get_system_metrics, 
    get_detailed_system_info, 
    log_system_metrics, 
    get_historical_metrics
)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Serve the React frontend static files ---
frontend_dist_dir = Path(__file__).parent / "agentd-web" / "dist"

if not frontend_dist_dir.exists():
    raise RuntimeError(f"React build directory '{frontend_dist_dir.absolute()}' not found. "
                      "Please navigate to your React project and run `npm run build`.")

# Mount static files
app.mount("/assets", StaticFiles(directory=frontend_dist_dir / "assets"), name="assets")
templates = Jinja2Templates(directory=frontend_dist_dir)

# Include MCP router
app.include_router(mcp_router, prefix="/api")

def init_chat_db():
    db_path = os.path.join(os.path.dirname(__file__), "memory.sqlite")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Create chat_sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)
    # Create chat_messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    )
    """)
    conn.commit()
    conn.close()

init_chat_db()

async def periodic_metrics_logger(interval_seconds: int = 60):
    while True:
        try:
            log_system_metrics()
        except Exception as e:
            print(f"[Periodic Logger] Error logging system metrics: {e}")
        await asyncio.sleep(interval_seconds)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic - your old startup_event code goes here
    print("Initializing LangGraph agent...")
    await initialize_agent()
    print("LangGraph agent initialized.")
    # Start periodic logging in the background
    asyncio.create_task(periodic_metrics_logger(60))
    
    yield  # App runs here
    
    # Shutdown logic (optional - runs when app shuts down)
    print("Application shutting down...")



# API Routes - These must come BEFORE the catch-all route
@app.get("/api/system-metrics")
async def get_system_metrics_endpoint():
    """Get system performance metrics for the dashboard."""
    try:
        metrics = get_system_metrics()
        # Log the metrics for historical tracking
        log_system_metrics()
        return JSONResponse(content=metrics)
    except Exception as e:
        print(f"Error getting system metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting system metrics: {str(e)}")

@app.get("/api/system-info")
async def get_system_info_endpoint():
    """Get detailed system information."""
    try:
        info = get_detailed_system_info()
        return JSONResponse(content=info)
    except Exception as e:
        print(f"Error getting system info: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting system info: {str(e)}")

@app.get("/api/historical-metrics/{time_range}")
async def get_historical_metrics_endpoint(time_range: str):
    """Get historical system metrics for the specified time range."""
    try:
        valid_ranges = ['1h', '6h', '1d', '1w', '1m']
        if time_range not in valid_ranges:
            raise HTTPException(status_code=400, detail=f"Invalid time range. Must be one of: {valid_ranges}")
        
        metrics = get_historical_metrics(time_range)
        return JSONResponse(content={"metrics": metrics, "time_range": time_range})
    except Exception as e:
        print(f"Error getting historical metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting historical metrics: {str(e)}")

@app.post("/api/log-metrics")
async def log_metrics_endpoint():
    """Manually log current system metrics."""
    try:
        success = log_system_metrics()
        if success:
            return JSONResponse(content={"message": "Metrics logged successfully"})
        else:
            raise HTTPException(status_code=500, detail="Failed to log metrics")
    except Exception as e:
        print(f"Error logging metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Error logging metrics: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(payload: Dict[str, Any]):
    """Handle chat messages from the frontend with streaming progress."""
    session_id = payload.get("session_id")
    user_message_content = payload.get("message")

    if not session_id or not user_message_content:
        raise HTTPException(status_code=400, detail="Missing session_id or message in request.")

    async def event_generator():
        try:
            config = {"configurable": {"thread_id": session_id}}
            async for event in invoke_agent(user_message_content, config):
                if event["type"] == "progress":
                    yield f"data: {json.dumps({'type': 'progress', 'step': event['step'], 'total': event['total'], 'message': event['message']})}\n\n"
                elif event["type"] == "response":
                    yield f"data: {json.dumps({'type': 'response', 'content': event['content']})}\n\n"
        except Exception as e:
            print(f"Error invoking agent: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/summarize_chat")
async def summarize_chat(request: Dict[str, Any]):
    """Summarize chat history."""
    try:
        messages = request.get("messages", [])
        if not messages:
            return JSONResponse(content={"summary": "Untitled Chat"})

        summary = await summarize_chat_history(messages)
        return JSONResponse(content={"summary": summary})
    except Exception as e:
        print(f"Error summarizing chat: {e}")
        raise HTTPException(status_code=500, detail=f"Error summarizing chat: {str(e)}")

@app.get("/api/chat_sessions")
async def list_chat_sessions():
    conn = sqlite3.connect("memory.sqlite")
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC")
    sessions = [
        {"id": row[0], "title": row[1], "created_at": row[2], "updated_at": row[3]}
        for row in cursor.fetchall()
    ]
    conn.close()
    return JSONResponse(content={"sessions": sessions})

@app.get("/api/chat_sessions/{session_id}")
async def get_chat_session_messages(session_id: str):
    conn = sqlite3.connect("memory.sqlite")
    cursor = conn.cursor()
    cursor.execute("SELECT id, role, content, timestamp FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC", (session_id,))
    messages = [
        {"id": row[0], "role": row[1], "content": row[2], "timestamp": row[3]} for row in cursor.fetchall()
    ]
    conn.close()
    return JSONResponse(content={"messages": messages})

@app.post("/api/chat_sessions")
async def create_chat_session(request: Request):
    """Create a new chat session. Accepts JSON or form-encoded payloads."""
    try:
        try:
            payload = await request.json()
        except Exception:
            # fallback to form data
            form = await request.form()
            payload = dict(form)

        session_id = payload.get("id")
        # Use title if provided, else use first_message, else fallback
        title = payload.get("title") or payload.get("first_message") or payload.get("message") or "Untitled Chat"
        now = datetime.utcnow().isoformat()
        conn = sqlite3.connect("memory.sqlite")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO chat_sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)", (session_id, title, now, now))
        conn.commit()
        conn.close()
        return JSONResponse(content={"id": session_id, "title": title, "created_at": now, "updated_at": now})
    except Exception as e:
        print(f"Error creating chat session: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating chat session: {str(e)}")

@app.delete("/api/chat_sessions/{session_id}")
async def delete_chat_session(session_id: str):
    conn = sqlite3.connect("memory.sqlite")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
    cursor.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()
    return JSONResponse(content={"status": "success", "message": f"Session {session_id} deleted"})

@app.post("/api/chat_message")
async def add_chat_message(payload: Dict[str, Any]):
    session_id = payload.get("session_id")
    role = payload.get("role")
    content = payload.get("content")
    timestamp = payload.get("timestamp", datetime.utcnow().isoformat())
    if not (session_id and role and content):
        raise HTTPException(status_code=400, detail="Missing session_id, role, or content.")
    conn = sqlite3.connect("memory.sqlite")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chat_messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)", (session_id, role, content, timestamp))
    cursor.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", (timestamp, session_id))
    # If this is the user's first message and the title is generic, update the title
    if role == "user":
        cursor.execute("SELECT title FROM chat_sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        if row and row[0] in ("Untitled Chat", "New Chat"):
            cursor.execute("UPDATE chat_sessions SET title = ? WHERE id = ?", (content, session_id))
    conn.commit()
    conn.close()
    return JSONResponse(content={"status": "success"})

# Agent Tasks API
@app.get("/api/agent_tasks")
async def get_agent_tasks():
    """Get all saved agent tasks."""
    try:
        conn = sqlite3.connect("memory.sqlite")
        cursor = conn.cursor()
        
        # Create agent_tasks table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agent_tasks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                task TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_result TEXT
            )
        ''')
        
        cursor.execute("SELECT id, name, description, task, created_at, last_result FROM agent_tasks ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        
        tasks = []
        for row in rows:
            tasks.append({
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "task": row[3],
                "created_at": row[4],
                "last_result": row[5]
            })
        
        return JSONResponse(content={"tasks": tasks})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving tasks: {str(e)}")

@app.post("/api/agent_tasks")
async def create_agent_task(payload: Dict[str, Any]):
    """Create a new agent task."""
    name = payload.get("name")
    description = payload.get("description")
    task = payload.get("task")
    
    if not name or not task:
        raise HTTPException(status_code=400, detail="Missing name or task.")
    
    try:
        conn = sqlite3.connect("memory.sqlite")
        cursor = conn.cursor()
        
        # Create agent_tasks table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agent_tasks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                task TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_result TEXT
            )
        ''')
        
        task_id = f"task_{int(asyncio.get_event_loop().time() * 1000)}"
        cursor.execute(
            "INSERT INTO agent_tasks (id, name, description, task) VALUES (?, ?, ?, ?)",
            (task_id, name, description, task)
        )
        conn.commit()
        conn.close()
        
        return JSONResponse(content={
            "id": task_id,
            "name": name,
            "description": description,
            "task": task,
            "created_at": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@app.delete("/api/agent_tasks/{task_id}")
async def delete_agent_task(task_id: str):
    """Delete an agent task."""
    try:
        conn = sqlite3.connect("memory.sqlite")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM agent_tasks WHERE id = ?", (task_id,))
        conn.commit()
        conn.close()
        
        return JSONResponse(content={"status": "success", "message": f"Task {task_id} deleted"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")

# Catch-all route for frontend - This must come LAST
@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_frontend(request: Request, full_path: str):
    """Serve the React frontend."""
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000)