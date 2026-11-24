export type ServiceStatus = 'idle' | 'running' | 'stopped';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  showUnlockPrompt?: boolean;
  isError?: boolean;
}

export interface PresetQuestion {
  id: string;
  questionBn: string;
  questionAlt: string;
  presetAnswer?: string;
  triggersUnlockPrompt?: boolean;
}
