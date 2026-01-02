import React, { useState, useEffect } from 'react';
import { MCPServer } from '../types/chat';
import { Settings, Server, Plus, Trash2, Check, X, Zap, Globe } from 'lucide-react';

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

    if (isOpen) {
      loadMcpConfig();
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

  if (!isOpen) return null;

  return (
    <div className="mcp-config">
      <button
        onClick={onClose}
        className="close-config"
        title="Close Config"
      >
        ✕
      </button>

      <h2 className="uppercase font-anton text-agentd-primary mb-6">
        MCP Servers
      </h2>
      <p className="text-xs font-general-sans text-agentd-text mb-6">
        Connect and configure your model context protocol servers
      </p>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bebas text-agentd-secondary uppercase letter-spacing-1">
            Connected
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 font-anton text-xs border-2 border-agentd-secondary text-agentd-border bg-agentd-secondary hover:bg-agentd-accent1 transition-all"
          >
            + ADD
          </button>
        </div>
        
        {servers.length === 0 ? (
          <div className="text-center py-8 text-agentd-text opacity-60">
            <p className="font-general-sans text-xs font-bold">NO SERVERS YET</p>
            <p className="text-xs mt-1 opacity-70">ADD ONE TO GET STARTED</p>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => (
              <div
                key={server.id}
                className="flex items-center justify-between p-3 bg-white border-2 border-agentd-border transition-all hover:shadow-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-general-sans font-bold text-sm text-agentd-text">
                      {server.name}
                    </h4>
                    <span className={`
                      px-2 py-0.5 text-xs font-anton border-2
                      ${server.isActive 
                        ? 'border-agentd-secondary bg-agentd-secondary text-agentd-border' 
                        : 'border-agentd-text bg-transparent text-agentd-text'
                      }
                    `}>
                      {server.isActive ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-xs font-general-sans text-agentd-text opacity-70">
                    {server.url || 'Local Connection'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => onToggleServer(server.id)}
                    className="p-2 border-2 border-agentd-border font-anton text-xs hover:bg-agentd-accent2 transition-all"
                    title={server.isActive ? 'Disable' : 'Enable'}
                  >
                    {server.isActive ? '✓' : '◯'}
                  </button>
                  <button
                    onClick={() => onDeleteServer(server.id)}
                    className="p-2 border-2 border-agentd-accent3 text-agentd-accent3 font-anton text-xs hover:bg-agentd-accent3 hover:text-white transition-all"
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
        <div className="border-t-2 border-agentd-border pt-6">
          <h3 className="font-bebas text-agentd-accent1 uppercase letter-spacing-1 mb-4">
            Add New Server
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-general-sans font-bold text-agentd-text mb-2">
                SERVER NAME
              </label>
              <input
                type="text"
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-agentd-border text-agentd-text font-general-sans focus:outline-none focus:border-agentd-primary"
                placeholder="e.g., GitHub Server"
              />
            </div>
            <div>
              <label className="block text-xs font-general-sans font-bold text-agentd-text mb-2">
                JSON CONFIG
              </label>
              <textarea
                value={newServer.jsonConfig}
                onChange={(e) => setNewServer({ ...newServer, jsonConfig: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-agentd-border text-agentd-text font-general-sans text-xs focus:outline-none focus:border-agentd-primary resize-none"
                placeholder='{"type": "local", "command": "npx"}'
                rows={5}
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddServer}
                className="flex-1 px-4 py-2 bg-agentd-accent1 border-2 border-agentd-border text-agentd-border font-anton text-sm hover:bg-agentd-secondary transition-all"
              >
                ADD SERVER
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border-2 border-agentd-border text-agentd-border font-anton text-sm hover:bg-white transition-all"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};