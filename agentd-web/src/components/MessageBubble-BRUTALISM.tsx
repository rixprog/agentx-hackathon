import React, { useState, useEffect } from 'react';
import { Message } from '../types/chat';
import { Loader2, Terminal } from 'lucide-react';

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
    <div className={`flex items-start gap-4 mb-8 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        w-12 h-12 flex items-center justify-center flex-shrink-0 font-black border-4 text-lg
        ${isUser 
          ? 'bg-black border-yellow-300 text-yellow-300' 
          : 'bg-white border-cyan-400 text-black'
        }
      `}>
        {isUser ? 'U' : 'A'}
      </div>
      
      {/* Message Bubble */}
      <div className={`
        max-w-[75%] px-6 py-4 border-4 font-bold text-base
        ${isUser 
          ? 'bg-black border-yellow-300 text-white rounded-none rounded-br-sm' 
          : 'bg-gray-900 border-cyan-400 text-white rounded-none rounded-bl-sm'
        }
      `}>
        {message.isTyping ? (
          <div className="flex items-center gap-2 font-black">
            <Loader2 className="w-5 h-5 animate-spin text-yellow-300" />
            <span>THINKING...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {isExecuting && (
              <div className="flex items-center gap-2 text-sm text-cyan-400 font-black">
                <Terminal className="w-4 h-4" />
                <span>EXECUTING COMMAND...</span>
              </div>
            )}
            <div className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed tracking-tight" style={{ 
              wordBreak: 'break-word', 
              overflowWrap: 'break-word',
              maxWidth: '100%'
            }}>
              {displayedContent.split('\n').map((line, index) => (
                <div key={index} className={line.trim() === '' ? 'h-3' : ''}>
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
