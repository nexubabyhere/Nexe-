export interface MessageAttachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64 data URL
  size?: number;
  type: 'image' | 'file' | 'code';
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: MessageAttachment[];
  groundingSources?: GroundingSource[];
  isStreaming?: boolean;
  isError?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  personaId?: string;
  systemPrompt?: string;
  isPinned?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  badge: string;
  description: string;
  systemPrompt: string;
  icon: string;
  starterPrompts: string[];
}

export interface AppSettings {
  model: string;
  temperature: number;
  searchGrounding: boolean;
  defaultPersonaId: string;
  customSystemPrompt: string;
  enterToSend: boolean;
  theme: 'dark' | 'light' | 'system';
  voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
}
