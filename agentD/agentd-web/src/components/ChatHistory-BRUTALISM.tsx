import React from 'react';
import { ChatSession } from '../types/chat';
import { Trash2, Plus } from 'lucide-react';

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat
}) => {
  return (
    <div className="w-80 bg-black border-r-4 border-cyan-400 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b-4 border-yellow-300">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-black border-4 border-yellow-300 text-yellow-300 font-black hover:bg-yellow-300 hover:text-black transition-none text-sm tracking-wide"
        >
          <Plus size={18} />
          NEW CHAT
        </button>
      </div>
      
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 border-b-4 border-cyan-400">
        <h3 className="text-xs font-black text-yellow-300 mb-4 tracking-wider">
          CHAT HISTORY
        </h3>
        
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm font-bold">NO CONVERSATIONS YET</p>
            <p className="text-xs mt-1 opacity-70">START YOUR FIRST CHAT TO BEGIN</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`
                group relative p-4 cursor-pointer border-4 transition-none
                ${activeSessionId === session.id 
                  ? 'bg-yellow-300 border-yellow-300 text-black' 
                  : 'bg-black border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black'
                }
              `}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm mb-1 truncate tracking-tight">
                    {session.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span>
                      {session.messages.length} MESSAGES
                    </span>
                    <span>•</span>
                    <span>
                      {session.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className={`
                    p-2 ml-2 border-3 font-black transition-none
                    ${activeSessionId === session.id
                      ? 'border-black text-black hover:bg-black'
                      : 'border-current text-current hover:bg-current hover:text-black'
                    }
                  `}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t-4 border-yellow-300 bg-black">
        <div className="text-xs text-gray-400 text-center font-black tracking-wide">
          <div className="mb-2">━━━━━━━━━━━━</div>
          <span>POWERED BY AGENTD</span>
        </div>
      </div>
    </div>
  );
};
