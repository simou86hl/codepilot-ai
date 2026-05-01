"use client";

import React, { useRef, useEffect, useState } from "react";
import { Send, Sparkles, Square, Trash2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "./chat-bubble";
import { useAppStore } from "@/lib/store";
import { PROVIDERS } from "@/lib/providers";
import type { Message } from "@/lib/types";

interface ChatViewProps {
  onOpenSettings: () => void;
}

export function ChatView({ onOpenSettings }: ChatViewProps) {
  const {
    currentSessionId,
    sessions,
    providerConfig,
    isStreaming,
    setStreaming,
    createSession,
    addMessage,
    updateLastAssistantMessage,
    setCurrentSessionId,
    deleteSession,
    clearAllSessions,
    updateSessionTitle,
    getCurrentSession,
  } = useAppStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const currentSession = getCurrentSession();
  const currentProvider = PROVIDERS.find((p) => p.id === providerConfig.provider);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Ensure we have a session
  useEffect(() => {
    if (!currentSessionId) {
      createSession();
    }
  }, [currentSessionId, createSession]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createSession();
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    addMessage(sessionId, userMessage);
    setInput("");

    const assistantMessage: Message = {
      id: `msg_${Date.now()}_assistant`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    addMessage(sessionId, assistantMessage);
    setStreaming(true);

    // Auto-title from first message
    const session = useAppStore.getState().sessions.find((s) => s.id === sessionId);
    if (session && session.messages.length <= 2) {
      const title = text.length > 40 ? text.slice(0, 40) + "..." : text;
      updateSessionTitle(sessionId, title);
    }

    try {
      abortRef.current = new AbortController();

      const allMessages = [
        ...(session?.messages || [])
          .filter((m) => m.role !== "assistant" || m.content)
          .slice(-20),
        userMessage,
      ];

      const isZAI = providerConfig.provider === "zai";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          provider: providerConfig.provider,
          model: providerConfig.model,
          apiKey: providerConfig.apiKey,
          stream: !isZAI,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        let errorMsg = "حدث خطأ غير متوقع";
        try {
          const text = await response.text();
          if (text) {
            try {
              const errorData = JSON.parse(text);
              errorMsg = errorData.error || errorMsg;
            } catch {
              errorMsg = text.slice(0, 200);
            }
          }
        } catch {
          // response body unreadable
        }
        updateLastAssistantMessage(
          sessionId,
          `❌ **خطأ:** ${errorMsg}`
        );
        return;
      }

      // Z AI returns JSON directly - simulate typing effect on frontend
      if (isZAI) {
        let data: any;
        try {
          data = await response.json();
        } catch {
          updateLastAssistantMessage(sessionId, "❌ استجابة غير صالحة من Z AI");
          return;
        }

        const fullContent = data?.content || "لا يوجد رد";
        // Simulate word-by-word typing effect
        const words = fullContent.split(/(\s+)/);
        let displayed = "";
        for (let i = 0; i < words.length; i++) {
          displayed += words[i];
          updateLastAssistantMessage(sessionId, displayed);
          await new Promise((r) => setTimeout(r, 20));
        }
        return;
      }

      // Other providers: real SSE streaming
      const reader = response.body?.getReader();
      if (!reader) {
        updateLastAssistantMessage(sessionId, "❌ لا يمكن قراءة الاستجابة");
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              updateLastAssistantMessage(sessionId, accumulated);
            }
          } catch {
            // Skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        updateLastAssistantMessage(
          sessionId,
          `❌ حدث خطأ: ${err.message}`
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">CodePilot AI</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {currentProvider?.icon} {currentProvider?.models.find(m => m.id === providerConfig.model)?.name || "اختر نموذج"}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5 text-muted-foreground"
          onClick={onOpenSettings}
        >
          ⚙️ الإعدادات
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* History Sidebar (Mobile Drawer) */}
        {showHistory && (
          <div className="absolute inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowHistory(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-card border-l border-border animate-in slide-in-from-right duration-200 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="font-semibold text-sm">المحادثات</h2>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={clearAllSessions}
                    title="حذف الكل"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-sm h-10"
                  onClick={() => {
                    createSession();
                    setShowHistory(false);
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  محادثة جديدة
                </Button>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                      session.id === currentSessionId
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      setShowHistory(false);
                    }}
                  >
                    <span className="flex-1 truncate text-right">
                      {session.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    لا توجد محادثات بعد
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-4 pb-4">
            {currentSession?.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[60dvh] text-center px-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">CodePilot AI</h2>
                <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-8">
                  مساعدك البرمجي الذكي. اسأل عن أي كود، وستحصل على إجابة دقيقة مع أمثلة عملية.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  {[
                    { emoji: "🐛", text: "أصلح هذا البق في الكود" },
                    { emoji: "📝", text: "اكتب دالة فرز بـ Python" },
                    { emoji: "📚", text: "اشرح مفهوم REST API" },
                    { emoji: "⚡", text: "حسّن أداء هذا الكود" },
                  ].map((item) => (
                    <button
                      key={item.text}
                      className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-xs text-right"
                      onClick={() => {
                        setInput(item.text);
                        textareaRef.current?.focus();
                      }}
                    >
                      <span>{item.emoji}</span>
                      <span className="line-clamp-2">{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {currentSession?.messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isStreaming={
                  isStreaming &&
                  msg.role === "assistant" &&
                  msg.id ===
                    currentSession.messages[currentSession.messages.length - 1]?.id
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/80 backdrop-blur-lg sticky bottom-0 safe-area-bottom">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {!providerConfig.apiKey && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
              ⚠️ يرجى إضافة مفتاح API من صفحة الإعدادات لبدء المحادثة
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك البرمجي هنا..."
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all min-h-[48px] max-h-[120px]"
                rows={1}
                disabled={isStreaming}
              />
            </div>
            {isStreaming ? (
              <Button
                size="icon"
                className="h-11 w-11 rounded-xl bg-destructive hover:bg-destructive/90 flex-shrink-0"
                onClick={handleStop}
              >
                <Square className="h-4 w-4" fill="currentColor" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-11 w-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex-shrink-0 shadow-lg shadow-emerald-500/20"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {currentProvider?.icon} {currentProvider?.name} •{" "}
            {currentProvider?.models.find((m) => m.id === providerConfig.model)?.name}
          </p>
        </div>
      </div>
    </div>
  );
}
