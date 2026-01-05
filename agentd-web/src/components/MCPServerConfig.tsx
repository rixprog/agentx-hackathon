import React, { useState, useEffect } from 'react';
import { MCPServer } from '../types/chat';
import { X, Zap, ExternalLink } from 'lucide-react';

interface MCPServerConfigProps {
  servers: MCPServer[];
  onAddServer: (server: Omit<MCPServer, 'id'>) => void;
  onDeleteServer: (serverId: string) => void;
  onToggleServer: (serverId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MCPServerConfig: React.FC<MCPServerConfigProps> = ({
  servers,
  onAddServer,
  onDeleteServer,
  onToggleServer,
  isOpen,
  onClose
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServer, setNewServer] = useState({
    name: '',
    jsonConfig: ''
  });
  const [zapierUrl, setZapierUrl] = useState('');
  const [zapierMessage, setZapierMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load existing MCP configuration on component mount
  useEffect(() => {
    const loadMcpConfig = async () => {
      try {
        const response = await fetch('/api/mcp_config');
        if (!response.ok) {
          throw new Error('Failed to load MCP configuration');
        }
        const config = await response.json();
        console.log('Loaded MCP configuration:', config);
      } catch (error) {
        console.error('Error loading MCP configuration:', error);
      }
    };

    const loadZapierUrl = async () => {
      try {
        const response = await fetch('/api/zapier_mcp');
        if (response.ok) {
          const data = await response.json();
          setZapierUrl(data.url || '');
        }
      } catch (error) {
        console.error('Error loading Zapier MCP URL:', error);
      }
    };

    if (isOpen) {
      loadMcpConfig();
      loadZapierUrl();
    }
  }, [isOpen]);

  const handleAddServer = async () => {
    try {
      const serverConfig = JSON.parse(newServer.jsonConfig);
      const serverName = newServer.name;

      // Create the new server configuration
      const newServerConfig = {
        mcpServers: {
          [serverName]: serverConfig
        }
      };

      // Send the configuration to the backend
      const response = await fetch('/api/mcp_config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newServerConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to update MCP configuration');
      }

      const result = await response.json();

      if (result.status === 'success') {
        // Add the server to the UI
        onAddServer({
          ...serverConfig,
          name: serverName,
          isActive: true
        });

        setNewServer({ name: '', jsonConfig: '' });
        setShowAddForm(false);
        console.log('MCP configuration updated successfully:', result.config);
      } else {
        throw new Error(result.message || 'Failed to update MCP configuration');
      }
    } catch (error) {
      console.error('Error updating MCP configuration:', error);
      alert('Invalid JSON configuration or failed to update. Please check the format and try again.');
    }
  };

  const handleConnectZapier = async () => {
    setZapierMessage(null);
    try {
      const response = await fetch('/api/zapier_mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: zapierUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setZapierMessage({ type: 'success', text: 'Zapier MCP connected successfully! ✨' });
      } else {
        setZapierMessage({ type: 'error', text: data.detail || 'Failed to connect' });
      }
    } catch (error) {
      setZapierMessage({ type: 'error', text: 'Failed to connect. Please try again.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mcp-config">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
        title="Close"
      >
        <X size={20} />
      </button>

      <h2 className="font-bold text-white mb-6 text-lg pixelated">
        MCP Servers
      </h2>
      <p className="text-xs font-medium text-white/70 mb-6">
        Connect and configure your model context protocol servers
      </p>

      {/* Zapier MCP Quick Connect */}
      <div className="mb-8 p-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-2xl backdrop-blur">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold text-white text-sm pixelated">
            Quick Connect - Zapier MCP
          </h3>
        </div>

        <p className="text-xs text-white/70 mb-4">
          Connect directly to your Zapier AI Actions.{' '}
          <a
            href="https://actions.zapier.com/settings/mcp/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-300 hover:text-orange-200 inline-flex items-center gap-1 underline"
          >
            Get your URL
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>

        <div className="space-y-3">
          <input
            type="text"
            value={zapierUrl}
            onChange={(e) => setZapierUrl(e.target.value)}
            placeholder="https://actions.zapier.com/mcp/YOUR_KEY/sse"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-white/40 font-medium text-sm focus:outline-none focus:border-orange-400/50 rounded-xl"
          />

          <button
            onClick={handleConnectZapier}
            disabled={!zapierUrl.trim()}
            className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold text-sm hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl"
          >
            Connect Zapier
          </button>

          {zapierMessage && (
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${zapierMessage.type === 'success'
                ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                : 'bg-red-500/20 border border-red-500/40 text-red-300'
              }`}>
              {zapierMessage.text}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm pixelated">
            Connected
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 font-medium text-xs border border-white/20 text-white bg-white/10 hover:bg-white/20 transition-all rounded-xl"
          >
            + Add Server
          </button>
        </div>

        {servers.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <p className="text-xs font-medium pixelated">No Servers Yet</p>
            <p className="text-xs mt-1 opacity-70">Add one to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => (
              <div
                key={server.id}
                className="flex items-center justify-between p-3 bg-white/10 border border-white/15 transition-all hover:shadow-md rounded-2xl backdrop-blur"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-white">
                      {server.name}
                    </h4>
                    <span className={`
                      px-2 py-0.5 text-xs font-medium border rounded
                      ${server.isActive
                        ? 'border-green-400/40 bg-green-400/10 text-green-300'
                        : 'border-white/20 bg-white/5 text-white/60'
                      }
                    `}>
                      {server.isActive ? 'Active' : 'Off'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-white/60">
                    {server.url || 'Local Connection'}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => onToggleServer(server.id)}
                    className="p-2 border border-white/20 font-medium text-xs hover:bg-white/20 transition-all rounded-lg"
                    title={server.isActive ? 'Disable' : 'Enable'}
                  >
                    {server.isActive ? '✓' : '○'}
                  </button>
                  <button
                    onClick={() => onDeleteServer(server.id)}
                    className="p-2 border border-red-500/30 text-red-400 font-medium text-xs hover:bg-red-500/20 transition-all rounded-lg"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="border-t border-white/15 pt-6">
          <h3 className="font-semibold text-white text-sm mb-4 pixelated">
            Add New Server
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-2 pixelated">
                Server Name
              </label>
              <input
                type="text"
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-white/40 font-medium focus:outline-none focus:border-white/40 rounded-xl"
                placeholder="e.g., GitHub Server"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-2 pixelated">
                JSON Config
              </label>
              <textarea
                value={newServer.jsonConfig}
                onChange={(e) => setNewServer({ ...newServer, jsonConfig: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-white/40 font-medium text-xs focus:outline-none focus:border-white/40 rounded-xl resize-none"
                placeholder='{"type": "local", "command": "npx"}'
                rows={5}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddServer}
                className="flex-1 px-4 py-2 bg-indigo-600/30 border border-indigo-500/30 text-white font-medium text-sm hover:bg-indigo-600/40 transition-all rounded-xl"
              >
                Add Server
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-white/20 text-white font-medium text-sm hover:bg-white/10 transition-all rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};