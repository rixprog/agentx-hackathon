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
    <div className="chat-sidebar">
      {/* Header */}
      <div>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bebas text-lg letter-spacing-1 bg-white/15 backdrop-blur-2xl text-white border border-white/30 font-bold hover:bg-white/25 transition-all rounded-lg"
        >
          <Plus size={18} />
          NEW CHAT
        </button>
      </div>
      
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-2 border-t border-white/20 pt-4">
        <h3 className="text-xs font-anton text-c3ff16 mb-3 tracking-widest uppercase text-shadow-sm">
          RECENT CHATS
        </h3>
        
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <p className="text-xs font-general-sans font-bold">NO CHATS YET</p>
            <p className="text-xs mt-1 opacity-70">CREATE ONE TO GET STARTED</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`
                chat-session-item group
                ${activeSessionId === session.id ? 'active' : ''}
              `}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-general-sans text-sm mb-1 truncate font-bold text-white">
                    {session.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs font-general-sans opacity-70">
                    <span>{session.messages.length} msg</span>
                    <span>•</span>
                    <span>{session.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="p-1 hover:opacity-100 opacity-70 transition-opacity text-white"
                  title="Delete chat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-white/20 pt-3 text-center text-xs font-general-sans opacity-70">
        <p className="m-0 font-bold text-white">✦ AGENTD ✦</p>
      </div>
    </div>
  );
};
