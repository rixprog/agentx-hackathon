import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import { ChatHistory } from './components/ChatHistory';
import { MCPServerConfig } from './components/MCPServerConfig';
import { Dashboard } from './components/Dashboard';
import { BarChart3, MessageSquare, Settings } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: <BarChart3 className="w-6 h-6" />, label: 'DASHBOARD' },
    { path: '/chat', icon: <MessageSquare className="w-6 h-6" />, label: 'CHAT' },
    { path: '/settings', icon: <Settings className="w-6 h-6" />, label: 'SETTINGS' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black border-b-4 border-yellow-300 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black border-4 border-yellow-300 flex items-center justify-center font-black text-yellow-300 text-xl">
              A
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                AGENTD
              </h1>
              <p className="text-sm text-gray-300 font-bold tracking-wide">INTELLIGENT SYSTEM ASSISTANT</p>
            </div>
          </div>
          
          <div className="flex space-x-2 ml-12">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-6 py-3 border-4 font-black text-sm tracking-wide transition-none ${
                  location.pathname === item.path
                    ? 'bg-yellow-300 border-yellow-300 text-black'
                    : 'bg-black border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black hover:border-cyan-400'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <main className="flex-1 pt-24">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/settings" element={<MCPServerConfig />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
