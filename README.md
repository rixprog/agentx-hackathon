# 🤖 AGENTD - AI Operating System Agent

<div align="center">

![AGENTD Logo](https://img.shields.io/badge/AGENTD-AI%20OS%20Agent-5f5ce5?style=for-the-badge&logo=robot&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-FF6B35?style=flat-square&logo=graph&logoColor=white)

**An intelligent AI agent that transforms your operating system into a proactive assistant**

[🚀 Live Demo](#) • [📖 Documentation](#) • [💬 Discord](#) • [🐛 Issues](https://github.com/rixprog/agentx-hackathon/issues)

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
- **🎨 Neo-Brutalism UI**: Modern, bold interface design
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

4. **Build and run the application**
   ```bash
   # Start the backend
   cd agentD
   uvicorn app:app --reload --host 0.0.0.0 --port 8000

   # In another terminal, start the frontend
   cd agentd-web
   npm install
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:8000
   ```

## 📋 Environment Setup

Create a `.env` file in the root directory:

```env
# AI Models
GOOGLE_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# External Services
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
```

### WebSocket Events

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

## 🎨 UI Themes

AGENTD features a stunning **Neo-Brutalism** design with:

- **Bold Colors**: Vibrant gradients and high-contrast elements
- **Geometric Shapes**: Sharp edges and structured layouts
- **Typography**: Custom fonts with strong visual hierarchy
- **Animations**: Smooth transitions and micro-interactions

## 🔒 Security

- **End-to-end Encryption**: All communications are encrypted
- **API Key Protection**: Secure storage of sensitive credentials
- **Permission System**: Granular control over agent capabilities
- **Audit Logging**: Complete activity tracking

## 📊 Performance

- **Real-time Processing**: Sub-second response times
- **Efficient Memory Usage**: Optimized for long-running sessions
- **Scalable Architecture**: Handle multiple concurrent users
- **Background Processing**: Non-blocking task execution

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the intelligence
- **LangGraph** for the agent framework
- **BrowserUse** for web automation
- **Zapier** for workflow automation
- **FastAPI** for the robust backend
- **React** for the beautiful frontend

## 📞 Support

- **Documentation**: [docs.agentd.ai](https://docs.agentd.ai)
- **Discord**: [Join our community](https://discord.gg/agentd)
- **Issues**: [GitHub Issues](https://github.com/rixprog/agentx-hackathon/issues)
- **Email**: support@agentd.ai

---

<div align="center">

**Made with ❤️ by the AGENTD Team**

[⭐ Star us on GitHub](https://github.com/rixprog/agentx-hackathon) • [🐛 Report Issues](https://github.com/rixprog/agentx-hackathon/issues) • [💬 Join Discord](https://discord.gg/agentd)

---

*Transform your operating system into an intelligent assistant with AGENTD*

</div>