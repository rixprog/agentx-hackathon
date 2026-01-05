import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

import { ChatInterface } from './components/ChatInterface';

import { Dashboard } from './components/Dashboard';
import { AgentBuilder } from './components/AgentBuilder';

import {
  BarChart3,
  MessageSquare,
  Bot,
  Sparkles
} from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <BarChart3 className="w-6 h-6" />, label: 'DASHBOARD' },
    { path: '/chat', icon: <MessageSquare className="w-6 h-6" />, label: 'CHAT' },
    { path: '/agent-builder', icon: <Bot className="w-6 h-6" />, label: 'AGENT BUILDER' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-80 z-50 bg-white/8 backdrop-blur-3xl border-r border-white/15 p-6 shadow-2xl flex flex-col">

      {/* Logo Section */}
      <div className="flex items-center gap-4 mb-12">
        <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-teal-400 to-lime-400 backdrop-blur-xl border border-white/30 rounded-xl flex items-center justify-center text-white shadow-xl flex-shrink-0">
          <Sparkles className="w-8 h-8 animate-slow-spin" />
        </div>

        <div>
          <h1
            className="text-2xl text-white tracking-tight"
            style={{ fontFamily: "'Pixelify Sans', sans-serif", fontWeight: 600 }}
          >
            AGENTD
          </h1>
          <p className="text-xs text-white/60 tracking-wide">
            System Assistant
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col space-y-3 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-5 py-3 rounded-xl text-sm tracking-wider transition-all duration-300
              ${location.pathname === item.path
                ? 'bg-white/15 backdrop-blur-xl border border-white/30 text-white shadow-xl'
                : 'bg-white/8 backdrop-blur-xl border border-white/15 text-white/80 hover:bg-white/12 hover:border-white/25 hover:text-white'
              }
            `}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-[#0f1923] via-[#1a2942] to-[#132847] text-white">
        <Navigation />
        <main className="flex-1 ml-80">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/agent-builder" element={<AgentBuilder />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
