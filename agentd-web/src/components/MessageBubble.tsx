import React, { useState, useEffect } from 'react';
import { Message } from '../types/chat';
import { Loader2, Terminal, User, Sparkles } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

interface CommandEvent {
  type: 'start' | 'info' | 'command' | 'output' | 'error';
  content: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [displayedContent, setDisplayedContent] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [events, setEvents] = useState<CommandEvent[]>([]);
  
  const cleanContent = (content: string) => {
    let cleaned = content
      .replace(/```\n?/g, '')
      .replace(/Here is the system information:\n?/g, '')
      .trim();
    
    cleaned = cleaned.replace(/\\n/g, '\n');
    
    if (cleaned.includes('subject') && cleaned.includes('body') && cleaned.includes('@')) {
      const subjectMatch = cleaned.match(/subject[:\s]*["']([^"']+)["']/i);
      const bodyMatch = cleaned.match(/body[:\s]*["']([^"']+)["']/i);
      const emailMatch = cleaned.match(/to[:\s]*([^\s]+@[^\s]+)/i);
      
      if (subjectMatch && bodyMatch && emailMatch) {
        const subject = subjectMatch[1];
        const body = bodyMatch[1].replace(/\\n/g, '\n');
        const email = emailMatch[1];
        
        cleaned = `📧 Email Sent Successfully!

📬 To: ${email}
📋 Subject: ${subject}

📝 Body:
${body}

✅ The email has been sent successfully.`;
      }
    }
    
    return cleaned;
  };

  useEffect(() => {
    try {
      const content = message.content;
      if (content.includes('events')) {
        const parsed = JSON.parse(content);
        if (parsed.events) {
          setIsExecuting(true);
          setEvents(parsed.events);
          let currentContent = '';
          let currentIndex = 0;

          const typeNextEvent = () => {
            if (currentIndex < parsed.events.length) {
              const event = parsed.events[currentIndex];
              currentContent += `\n${event.content}`;
              setDisplayedContent(currentContent);
              currentIndex++;
              setTimeout(typeNextEvent, 100);
            } else {
              setIsExecuting(false);
            }
          };

          typeNextEvent();
        } else {
          setDisplayedContent(cleanContent(content));
        }
      } else {
        setDisplayedContent(cleanContent(content));
      }
    } catch (e) {
      setDisplayedContent(cleanContent(message.content));
    }
  }, [message.content]);

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'agent'}`}>
      {/* Avatar with Icon */}
      <div className={`message-avatar ${isUser ? 'user' : 'agent'}`}>
        {isUser ? (
          <User size={22} strokeWidth={2.5} />
        ) : (
          <Sparkles size={22} strokeWidth={2.5} />
        )}
      </div>
      
      {/* Message Bubble */}
      <div className={`message-content ${isUser ? 'user' : 'agent'}`}>
        {message.isTyping ? (
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {isExecuting && (
              <div className="flex items-center gap-2 text-xs font-medium opacity-70 border-b border-current pb-2">
                <Terminal className="w-4 h-4" />
                <span>Executing command...</span>
              </div>
            )}
            <div 
              className="chat-message-text whitespace-pre-wrap break-words" 
              style={{ 
                wordBreak: 'break-word', 
                overflowWrap: 'break-word',
                maxWidth: '100%'
              }}
            >
              {displayedContent.split('\n').map((line, index) => (
                <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
