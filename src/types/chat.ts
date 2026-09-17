export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  error?: boolean;
}

export interface ChatSessionState {
  isOpen: boolean;
  activeAnalysisId: string | null;
  activeAnalysisTitle: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
}
