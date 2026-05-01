export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  provider: string;
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface Provider {
  id: string;
  name: string;
  icon: string;
  baseUrl: string;
  models: Model[];
  needsApiKey: boolean;
  apiKeyEnvVar: string;
  protocol: "openai" | "anthropic";
}

export interface Model {
  id: string;
  name: string;
  isFree: boolean;
  description?: string;
}

export interface ChatRequest {
  messages: Message[];
  provider: string;
  model: string;
  apiKey: string;
  stream?: boolean;
}

export interface ProviderConfig {
  provider: string;
  model: string;
  apiKey: string;
}
