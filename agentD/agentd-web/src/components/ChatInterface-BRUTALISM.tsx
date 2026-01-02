import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatHistory } from './ChatHistory';
import { MCPServerConfig } from './MCPServerConfig';
import { Message, ChatSession, MCPServer } from '../types/chat';
import { Send, Settings, Menu, X } from 'lucide-react';

function parseDate(date: string | Date): Date {
  return date instanceof Date ? date : new Date(date);
}

export const ChatInterface: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [showMcpConfig, setShowMcpConfig] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isTyping]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/chat_sessions')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load sessions');
        return res.json();
      })
      .then(data => {
        const loadedSessions: ChatSession[] = (data.sessions || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          messages: [],
          createdAt: parseDate(s.created_at),
          updatedAt: parseDate(s.updated_at),
        }));
        setSessions(loadedSessions);
        if (loadedSessions.length > 0) setActiveSessionId(loadedSessions[0].id);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Failed to load sessions');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;
    fetch(`/api/chat_sessions/${activeSessionId}`)
      .then(res => res.json())
      .then(data => {
        setSessions(prev => prev.map(s =>
          s.id === activeSessionId
            ? { ...s, messages: (data.messages || []).map((m: any) => ({
                id: m.id.toString(),
                content: m.content,
                role: m.role,
                timestamp: parseDate(m.timestamp),
              })) }
            : s
        ));
      });
  }, [activeSessionId]);

  useEffect(() => {
    if (!loading && !creatingSession && sessions.length === 0 && !activeSessionId) {
      setCreatingSession(true);
      (async () => {
        await createNewSession();
        setCreatingSession(false);
      })();
    }
  }, [loading, creatingSession, sessions, activeSessionId]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createNewSession = useCallback(async (firstMessage?: string) => {
    try {
      const newId = generateId();
      const payloadObj = { id: newId, title: firstMessage || 'Untitled Chat' };
      let headers: any = { 'Content-Type': 'application/json' };
      let bodyPayload: string;
      try {
        bodyPayload = JSON.stringify(payloadObj);
      } catch (err) {
        console.error('Failed to stringify session payload', err);
        bodyPayload = new URLSearchParams({ id: String(payloadObj.id), title: String(payloadObj.title) }).toString();
        headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      }

      const res = await fetch('/api/chat_sessions', {
        method: 'POST',
        headers,
        body: bodyPayload,
      });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      const newSession: ChatSession = {
        id: data.id,
        title: data.title,
        messages: [],
        createdAt: parseDate(data.created_at),
        updatedAt: parseDate(data.updated_at),
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    } catch (e: any) {
      setError(e.message || 'Failed to create session');
    }
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      await createNewSession(inputMessage);
      const res = await fetch('/api/chat_sessions');
      const data = await res.json();
      const loadedSessions: ChatSession[] = (data.sessions || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        messages: [],
        createdAt: parseDate(s.created_at),
        updatedAt: parseDate(s.updated_at),
      }));
      setSessions(loadedSessions);
      if (loadedSessions.length > 0) setActiveSessionId(loadedSessions[0].id);
      return;
    }
    const userMessage: Message = {
      id: generateId(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date(),
    };
    await fetch('/api/chat_message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: currentSessionId,
        role: 'user',
        content: userMessage.content,
        timestamp: userMessage.timestamp.toISOString(),
      }),
    });
    setSessions(prev => prev.map(session =>
      session.id === currentSessionId
        ? { ...session, messages: [...session.messages, userMessage], updatedAt: new Date() }
        : session
    ));

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && (currentSession.title === 'Untitled Chat' || currentSession.title === 'New Chat')) {
      fetch('/api/chat_sessions')
        .then(res => res.json())
        .then(data => {
          const loadedSessions: ChatSession[] = (data.sessions || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            messages: [],
            createdAt: parseDate(s.created_at),
            updatedAt: parseDate(s.updated_at),
          }));
          setSessions(loadedSessions);
          setActiveSessionId(currentSessionId);
        });
    }
    setInputMessage('');
    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, message: userMessage.content }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const aiResponseContent = data.response || 'No response from AI.';
      const aiMessage: Message = {
        id: generateId(),
        content: aiResponseContent,
        role: 'assistant',
        timestamp: new Date(),
      };
      await fetch('/api/chat_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          role: 'assistant',
          content: aiMessage.content,
          timestamp: aiMessage.timestamp.toISOString(),
        }),
      });
      setSessions(prev => prev.map(session =>
        session.id === currentSessionId
          ? { ...session, messages: [...session.messages, aiMessage], updatedAt: new Date() }
          : session
      ));
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        content: `Error: Could not get response from AI. ${error instanceof Error ? error.message : String(error)}`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setSessions(prev => prev.map(session =>
        session.id === currentSessionId
          ? { ...session, messages: [...session.messages, errorMessage], updatedAt: new Date() }
          : session
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    await fetch(`/api/chat_sessions/${sessionId}`, { method: 'DELETE' });
    setSessions(prev => {
      const updatedSessions = prev.filter(s => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
      }
      return updatedSessions;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addMcpServer = (server: Omit<MCPServer, 'id'>) => {
    const newServer: MCPServer = {
      ...server,
      id: generateId(),
      isActive: true
    };
    setMcpServers(prev => [...prev, newServer]);
  };

  const deleteMcpServer = (serverId: string) => {
    setMcpServers(prev => prev.filter(s => s.id !== serverId));
  };

  const toggleMcpServer = (serverId: string) => {
    setMcpServers(prev => prev.map(server =>
      server.id === serverId
        ? { ...server, isActive: !server.isActive }
        : server
    ));
  };

  if (loading || creatingSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-white text-lg font-black border-4 border-yellow-300 px-8 py-6">
          ⏳ LOADING CHAT SESSIONS...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="bg-black border-4 border-red-500 text-red-300 p-6 font-bold">
          <div className="font-black mb-2 text-xl">⚠️ ERROR</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      {showSidebar && (
        <ChatHistory
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onDeleteSession={deleteSession}
          onNewChat={createNewSession}
        />
      )}
      <div className="flex-1 flex flex-col bg-black border-l-4 border-cyan-400">
        <div className="bg-black border-b-4 border-yellow-300 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-3 border-3 border-cyan-400 text-cyan-400 lg:hidden font-black hover:bg-cyan-400 hover:text-black transition-none"
            >
              {showSidebar ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black border-4 border-yellow-300 flex items-center justify-center font-black text-yellow-300">
                A
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-wider">
                  AGENTD CHAT
                </h1>
                <p className="text-xs text-gray-300 font-bold">
                  {activeSession ? activeSession.title : 'Select or start a new chat'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowMcpConfig(true)}
            className="p-3 border-3 border-cyan-400 text-cyan-400 font-black hover:bg-cyan-400 hover:text-black transition-none"
            title="Configure MCP Servers"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-black space-y-6">
          {activeSession ? (
            <>
              {activeSession.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isTyping && (
                <MessageBubble
                  message={{
                    id: 'typing',
                    content: '',
                    role: 'assistant',
                    timestamp: new Date(),
                    isTyping: true
                  }}
                />
              )}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center border-4 border-yellow-300 p-12 bg-black">
                <h2 className="text-4xl font-black text-yellow-300 mb-4">
                  WELCOME TO AGENTD
                </h2>
                <p className="text-white font-bold mb-8 text-lg">Start a conversation to explore infinite possibilities</p>
                <button
                  onClick={createNewSession}
                  className="px-8 py-4 bg-black border-4 border-yellow-300 text-yellow-300 font-black hover:bg-yellow-300 hover:text-black transition-none text-lg"
                >
                  START NEW CHAT
                </button>
              </div>
            </div>
          )}
        </div>

        {activeSession && (
          <div className="border-t-4 border-cyan-400 bg-black p-6">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="ASK AGENTD ANYTHING..."
                  className="w-full resize-none bg-black border-4 border-cyan-400 text-white font-bold text-lg placeholder-gray-500 px-6 py-4 pr-16 min-h-[60px] max-h-32 focus:border-yellow-300 focus:outline-none transition-none"
                  rows={1}
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-3 bg-black border-4 border-yellow-300 text-yellow-300 font-black hover:bg-yellow-300 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-none"
                >
                  <Send size={20} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm text-gray-400 font-bold">
                <span>PRESS ENTER TO SEND, SHIFT+ENTER FOR NEW LINE</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-300"></div>
                  {mcpServers.filter(s => s.isActive).length} MCP SERVER(S) CONNECTED
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <MCPServerConfig
        servers={mcpServers}
        onAddServer={addMcpServer}
        onDeleteServer={deleteMcpServer}
        onToggleServer={toggleMcpServer}
        isOpen={showMcpConfig}
        onClose={() => setShowMcpConfig(false)}
      />
    </div>
  );
};
