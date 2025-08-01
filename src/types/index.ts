interface FileAttachment {
  name: string;
  size: number;
  type: string;
  content?: string; // base64 encoded content or file URL
  lastModified?: number;
}

interface Message {
  sender: 'user' | 'ai';
  text: string | string[];
  files?: FileAttachment[];
  timestamp?: number;
}

export type { Message, FileAttachment };