"use client";

import React, { useState } from "react";
import { X, Eye, EyeOff, ExternalLink, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { PROVIDERS, getDefaultModel } from "@/lib/providers";
import { Badge } from "@/components/ui/badge";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { providerConfig, setProviderConfig } = useAppStore();
  const [showKey, setShowKey] = useState(false);

  const selectedProvider = PROVIDERS.find(
    (p) => p.id === providerConfig.provider
  );

  if (!open) return null;

  const isZAI = providerConfig.provider === "zai";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] bg-card rounded-t-2xl border-t border-border animate-in slide-in-from-bottom duration-300 overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="text-lg font-bold">⚙️ الإعدادات</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">مزود النموذج</Label>
            <div className="grid gap-2">
              {PROVIDERS.map((provider) => {
                const isProviderZAI = provider.id === "zai";
                return (
                  <button
                    key={provider.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-right ${
                      providerConfig.provider === provider.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={() => {
                      setProviderConfig({
                        provider: provider.id,
                        model: getDefaultModel(provider.id),
                      });
                    }}
                  >
                    <span className="text-2xl">{provider.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{provider.name}</span>
                        {isProviderZAI ? (
                          <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                            <Shield className="h-2.5 w-2.5 ml-1" />
                            افتراضي
                          </Badge>
                        ) : provider.models.some((m) => m.isFree) ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            مجاني
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isProviderZAI
                          ? "مدمج مباشرة - لا يحتاج مفتاح API"
                          : `${provider.models.filter((m) => m.isFree).length} نماذج مجانية`}
                      </p>
                    </div>
                    {providerConfig.provider === provider.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">النموذج</Label>
            <div className="grid gap-2">
              {selectedProvider?.models.map((model) => (
                <button
                  key={model.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-right ${
                    providerConfig.model === model.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:bg-muted"
                  }`}
                  onClick={() => setProviderConfig({ model: model.id })}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{model.name}</span>
                      {model.isFree ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 dark:text-green-400"
                        >
                          مجاني
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          مدفوع
                        </Badge>
                      )}
                      {isZAI && providerConfig.model === model.id && (
                        <Zap className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                    {model.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {model.description}
                      </p>
                    )}
                  </div>
                  {providerConfig.model === model.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* API Key - Only show for non-Z AI providers */}
          {!isZAI && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">مفتاح API</Label>
                {selectedProvider && (
                  <a
                    href={
                      selectedProvider.id === "openrouter"
                        ? "https://openrouter.ai/keys"
                        : selectedProvider.id === "deepseek"
                        ? "https://platform.deepseek.com/api_keys"
                        : selectedProvider.id === "groq"
                        ? "https://console.groq.com/keys"
                        : "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    احصل على مفتاح <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={providerConfig.apiKey}
                  onChange={(e) => setProviderConfig({ apiKey: e.target.value })}
                  placeholder={`أدخل مفتاح ${selectedProvider?.name || "API"}...`}
                  className="font-mono text-sm pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                يتم حفظ المفتاح محلياً في المتصفح فقط ولا يُرسل إلى أي خادم خارجي
                غير مزود النموذج المختار.
              </p>
            </div>
          )}

          {/* Z AI Info Card */}
          {isZAI && (
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Z AI - مدمج مباشرة</h3>
                  <p className="text-[10px] text-muted-foreground">لا يحتاج مفتاح API</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                نماذج GLM مدمجة مباشرة في التطبيق ومتاحة فوراً بدون أي إعداد إضافي.
                ما عليك سوى اختيار النموذج والبدء في المحادثة.
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <h3 className="text-sm font-semibold">💡 نصائح</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <strong>GLM-4 Plus</strong> هو الأقوى للبرمجة والتحليل المعقد
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <strong>GLM-4 Flash</strong> أسرع رد مع جودة عالية
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <strong>GLM-4 Long</strong> ممتاز لتحليل الملفات الطويلة
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                استخدم <strong>OpenRouter</strong> للوصول لعدة نماذج مجانية أخرى
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <strong>Groq</strong> يوفر سرعة فائقة مع نماذج Llama
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
