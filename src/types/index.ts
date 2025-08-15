interface FileAttachment {
  name: string;
  size: number;
  type: string;
  content?: string; // base64 encoded content or file URL
  lastModified?: number;
}

interface Message {
  messageId: any;
  sender: 'user' | 'ai';
  text: string | string[];
  files?: FileAttachment[];
  timestamp?: number;
}

interface ChatlinksProps {
  id: string;
  title: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: (chatId: string) => void;
}

interface AIModel {
  name: string;
  displayName: string;
  icon: string;
  description: string;
  apiKeyPrefix: string;
}

type ModelName = 'ChatGPT' | 'Gemini' | 'Claude' | 'GPT-4' | 'DALL-E';

export type { Message, FileAttachment, ChatlinksProps, AIModel, ModelName };