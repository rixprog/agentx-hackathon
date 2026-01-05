# 🤖 AGENTD - AI Operating System Agent

<div align="center">

![AGENTD](https://img.shields.io/badge/AGENTD-AI%20OS%20Agent-6366f1?style=for-the-badge&logo=robot&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-FF6B35?style=flat-square&logo=graph&logoColor=white)

**Transform your operating system into an intelligent AI assistant**

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#) • [🐛 Issues](https://github.com/rixprog/agentx-hackathon/issues)

---

</div>

## ✨ Overview

**AGENTD** is a revolutionary AI-powered operating system agent that brings intelligence to your computer. Built with cutting-edge AI technologies, AGENTD can understand natural language commands, execute complex tasks, and integrate with external services through the Model Context Protocol (MCP).

### 🎯 Key Features

- **🧠 Advanced AI Intelligence**: Powered by Google Gemini 2.5 Flash and LangGraph
- **💻 Full System Control**: Execute terminal commands, manage files, and monitor system performance
- **🌐 Web Browsing**: Browse the internet and extract information using BrowserUse cloud
- **🔗 MCP Integration**: Connect with external services like Zapier, GitHub, and more
- **📊 Real-time Analytics**: Monitor system metrics with beautiful dashboards
- **🎨 Modern UI**: Clean, responsive interface with dark theme
- **⚡ Task Automation**: Save and rerun complex automation tasks
- **💬 Natural Chat Interface**: Communicate with your agent conversationally

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │   FastAPI Backend│    │  LangGraph Agent │
│                 │    │                 │    │                 │
│ • Chat Interface│◄──►│ • REST API      │◄──►│ • AI Reasoning   │
│ • Dashboard     │    │ • WebSocket     │    │ • Tool Execution │
│ • Agent Builder │    │ • Streaming     │    │ • Memory         │
│ • System Monitor│    │ • CORS          │    │ • State Mgmt     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Tools & MCP   │
                    │                 │
                    │ • Terminal      │
                    │ • File System   │
                    │ • Web Browsing  │
                    │ • Zapier        │
                    │ • GitHub        │
                    │ • Custom MCP    │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rixprog/agentx-hackathon.git
   cd agentx-hackathon
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install Node.js dependencies and build frontend**
   ```bash
   cd agentd-web
   npm install
   npm run build
   cd ..
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open your browser**
   ```
   http://localhost:8000
   ```

## 📋 Environment Setup

Create a `.env` file in the root directory:

```env
# AI Models (Required)
GOOGLE_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# External Services (Optional)
BROWSER_USE_API_KEY=your_browser_use_api_key
TAVILY_API_KEY=your_tavily_api_key

# Optional: LangSmith Tracing
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=agentd
```

## 🎮 Usage

### Chat Interface
- **Natural Language**: Talk to AGENTD like you would a human assistant
- **Real-time Progress**: Watch as tasks execute with live progress updates
- **Multi-session**: Manage multiple conversations simultaneously

### Agent Builder
- **Create Tasks**: Define complex automation workflows
- **Save & Reuse**: Store tasks for repeated execution
- **Status Tracking**: Monitor task execution in real-time

### System Dashboard
- **Performance Metrics**: CPU, memory, disk usage in real-time
- **Historical Data**: Analyze system performance over time
- **Resource Monitoring**: Keep track of system health

### MCP Integration
- **Zapier**: Automate workflows across 5,000+ apps
- **GitHub**: Manage repositories, issues, and pull requests
- **Custom Servers**: Add your own MCP-compatible services

## 🛠️ Available Tools

| Tool | Description | Status |
|------|-------------|--------|
| **Terminal** | Execute shell commands | ✅ Active |
| **File System** | Create, read, edit, delete files | ✅ Active |
| **Web Browsing** | Browse internet with AI assistance | ✅ Active |
| **Zapier** | 5,000+ app integrations | ✅ Active |
| **GitHub** | Repository management | ✅ Active |
| **System Metrics** | Performance monitoring | ✅ Active |

## 📁 Project Structure

```
├── app.py                    # FastAPI backend entrypoint
├── requirements.txt          # Python dependencies
├── agentd_backend/           # Backend logic
│   ├── agentD_2.py          # Main LangGraph agent
│   ├── agentD_State.py      # Agent state management
│   ├── browse_cloud_tool.py # Web browsing tool
│   ├── file_tools.py        # File system operations
│   ├── terminal_tool.py     # Terminal command execution
│   ├── zapier_tools.py      # Zapier MCP integration
│   ├── mcp_config.py        # MCP server configuration
│   ├── system_metrics.py    # System monitoring
│   ├── progress_gemini.py   # Progress step generation
│   └── prompts.py           # System prompts
├── agentd-web/              # React frontend
│   ├── src/
│   │   ├── App.tsx          # Main React app
│   │   ├── components/      # React components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AgentBuilder.tsx
│   │   │   └── ...
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── browser_mcp.json         # MCP server configuration
├── memory.sqlite           # Chat history database
└── README.md               # This file
```

## 🔧 API Reference

### Core Endpoints

```http
POST /api/chat
# Send messages to the AI agent
{
  "session_id": "session_123",
  "message": "List all files in the current directory"
}

GET /api/system-metrics
# Get real-time system performance data

POST /api/agent_tasks
# Create and manage automated tasks
{
  "name": "Daily Backup",
  "description": "Backup important files",
  "task": "Create a backup of /home/user/documents"
}

GET /api/chat_sessions
# Get all chat sessions

POST /api/chat_sessions
# Create new chat session
{
  "id": "session_123",
  "title": "My Chat Session"
}
```

### Streaming Events

```javascript
// Progress updates during task execution
{
  "type": "progress",
  "step": 2,
  "total": 6,
  "message": "Analyzing system requirements..."
}

// Final response
{
  "type": "response",
  "content": "Task completed successfully"
}
```

## 🎨 UI Features

- **Dark Theme**: Modern dark interface with neon accents
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live progress bars and status indicators
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Accessibility**: Keyboard navigation and screen reader support

## 🔒 Security

- **API Key Protection**: Secure storage of sensitive credentials
- **Input Validation**: Sanitized user inputs and command validation
- **Permission System**: Granular control over agent capabilities
- **Audit Logging**: Complete activity tracking in database

## 📊 Performance

- **Real-time Processing**: Sub-second response times
- **Efficient Memory Usage**: Optimized for long-running sessions
- **Background Processing**: Non-blocking task execution
- **Database Optimization**: SQLite with proper indexing

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Setup

```bash
# Backend development
pip install -r requirements.txt
python app.py

# Frontend development (in another terminal)
cd agentd-web
npm install
npm run dev
```

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
- Check Python version: `python --version` (should be 3.11+)
- Install dependencies: `pip install -r requirements.txt`
- Check environment variables in `.env`

**Frontend build fails**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

**MCP servers not connecting**
- Check `browser_mcp.json` configuration
- Verify API keys in `.env`
- Check backend logs for connection errors

**Database issues**
- Delete `memory.sqlite` and restart (will recreate)
- Check file permissions

### Debug Mode

Run with debug logging:
```bash
DEBUG=1 python app.py
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the intelligence
- **LangGraph** for the agent framework
- **BrowserUse** for web automation
- **Zapier** for workflow automation
- **FastAPI** for the robust backend
- **React & Vite** for the modern frontend
- **Tailwind CSS** for the beautiful styling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/rixprog/agentx-hackathon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rixprog/agentx-hackathon/discussions)

---

<div align="center">

**Made with ❤️ for the future of AI-assisted computing**

[⭐ Star us on GitHub](https://github.com/rixprog/agentx-hackathon) • [🐛 Report Issues](https://github.com/rixprog/agentx-hackathon/issues)

---

*AGENTD - Your AI Operating System Agent*

</div>
