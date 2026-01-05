export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MCPServer {
  id: string;
  name: string;
  isActive: boolean;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}