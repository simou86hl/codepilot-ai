import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatSession, ProviderConfig, Message } from "./types";

interface AppState {
  // Chat
  currentSessionId: string | null;
  sessions: ChatSession[];
  providerConfig: ProviderConfig;
  isStreaming: boolean;

  // Actions
  setCurrentSessionId: (id: string | null) => void;
  createSession: () => string;
  deleteSession: (id: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateLastAssistantMessage: (sessionId: string, content: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  clearAllSessions: () => void;
  setProviderConfig: (config: Partial<ProviderConfig>) => void;
  setStreaming: (streaming: boolean) => void;
  getCurrentSession: () => ChatSession | undefined;
}

const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  provider: "zai",
  model: "glm-4-plus",
  apiKey: "",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentSessionId: null,
      sessions: [],
      providerConfig: DEFAULT_PROVIDER_CONFIG,
      isStreaming: false,

      setCurrentSessionId: (id) => set({ currentSessionId: id }),

      createSession: () => {
        const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const newSession: ChatSession = {
          id,
          title: "محادثة جديدة",
          messages: [],
          provider: get().providerConfig.provider,
          model: get().providerConfig.model,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: id,
        }));
        return id;
      },

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          currentSessionId:
            state.currentSessionId === id ? null : state.currentSessionId,
        })),

      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...s.messages, message],
                  updatedAt: Date.now(),
                }
              : s
          ),
        })),

      updateLastAssistantMessage: (sessionId, content) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const msgs = [...s.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
              msgs[lastIdx] = { ...msgs[lastIdx], content };
            }
            return { ...s, messages: msgs, updatedAt: Date.now() };
          }),
        })),

      updateSessionTitle: (sessionId, title) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, title } : s
          ),
        })),

      clearAllSessions: () => set({ sessions: [], currentSessionId: null }),

      setProviderConfig: (config) =>
        set((state) => ({
          providerConfig: { ...state.providerConfig, ...config },
        })),

      setStreaming: (streaming) => set({ isStreaming: streaming }),

      getCurrentSession: () => {
        const state = get();
        return state.sessions.find((s) => s.id === state.currentSessionId);
      },
    }),
    {
      name: "codepilot-storage",
    }
  )
);
