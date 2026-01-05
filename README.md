# agentD System

agentD System is a full-stack AI agent platform with a FastAPI backend and a modern React (Vite + Tailwind) frontend. It features:

- **LangGraph/LLM-powered chat** with real-time streaming
- **System dashboard** with live and historical metrics (CPU, memory, disk, power, etc.)
- **MCP server integration** (add/manage custom model servers)
- **Beautiful, modern UI** matching the chat theme
- **Email, terminal, and system tools**

---

## Project Structure

```
agentD/
├── app.py                # FastAPI backend entrypoint
├── agentd_backend/        # Backend logic (system metrics, tools, MCP config, etc.)
├── agentd-web/            # React frontend (Vite + Tailwind)
├── browser_mcp.json      # MCP server configuration
├── requirements.txt      # Python dependencies
└── README.md             # This file
```

---

## Backend Setup (FastAPI)

1. **Clone the repo and switch to the correct branch:**

   ```bash
   git clone <your-repo-url>
   cd agentD
   git checkout agentd_system
   ```

2. **Create and activate a virtual environment:**

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend server:**
   ```bash
   python3 app.py
   ```
   The backend will start on `http://localhost:8000` by default.

---

## Frontend Setup (React + Vite)

1. **Navigate to the frontend directory:**

   ```bash
   cd agentd-web
   ```

2. **Install Node.js dependencies:**

   ```bash
   npm install
   ```

3. **Build the frontend:**

   ```bash
   npm run build
   ```

   This will output production files to `agentd-web/dist/`.

4. **(Optional) Run in development mode:**
   ```bash
   npm run dev
   ```
   The dev server will start on `http://localhost:5173` (API calls will still go to the backend).

---

## Configuration

- **MCP Servers:**
  - Add or edit MCP servers via the dashboard UI or by editing `browser_mcp.json`.
- **Environment Variables:**
  - Place any secrets (API keys, etc.) in a `.env` file (not committed to git).

---

## Features

- Modern chat UI with streaming LLM responses
- System dashboard with real-time and historical metrics
- Add/manage custom MCP servers
- Email, terminal, and system tools
- Responsive, beautiful design

---

## Troubleshooting

- If you see missing dependencies, run `pip install -r requirements.txt` and `npm install` again.
- For port conflicts, change the port in `app.py` or `agentd-web/vite.config.ts`.
- For MCP config issues, check backend logs and `browser_mcp.json`.

---

## License

MIT (or your preferred license)
