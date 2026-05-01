import type { Provider } from "./types";

export const PROVIDERS: Provider[] = [
  {
    id: "zai",
    name: "Z AI",
    icon: "🤖",
    baseUrl: "",
    needsApiKey: false, // Optional - works without key in dev environment, needs Zhipu AI key for external deployment
    apiKeyEnvVar: "",
    protocol: "zai",
    models: [
      { id: "glm-4-plus", name: "GLM-4 Plus", isFree: true, description: "نموذج GLM المتقدم - الأقوى للبرمجة" },
      { id: "glm-4-flash", name: "GLM-4 Flash", isFree: true, description: "سريع وخفيف - ردود فورية" },
      { id: "glm-4-long", name: "GLM-4 Long", isFree: true, description: "نافذة سياق طويلة جداً" },
      { id: "glm-4-air", name: "GLM-4 Air", isFree: true, description: "متوازن بين السرعة والجودة" },
      { id: "glm-4-airx", name: "GLM-4 AirX", isFree: true, description: "نسخة محسّنة من Air" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: "🌐",
    baseUrl: "https://openrouter.ai/api/v1",
    needsApiKey: true,
    apiKeyEnvVar: "OPENROUTER_API_KEY",
    protocol: "openai",
    models: [
      { id: "deepseek/deepseek-chat-v3-0324:free", name: "DeepSeek V3", isFree: true, description: "نموذج قوي ومجاني" },
      { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek R1", isFree: true, description: "نموذج تفكير متقدم" },
      { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", isFree: true, description: "نموذج Google خفيف" },
      { id: "meta-llama/llama-4-maverick:free", name: "Llama 4 Maverick", isFree: true, description: "أحدث نموذج من Meta" },
      { id: "qwen/qwen3-235b-a22b:free", name: "Qwen3 235B", isFree: true, description: "نموذج ضخم من Alibaba" },
      { id: "microsoft/phi-4-reasoning-plus:free", name: "Phi-4 Reasoning+", isFree: true, description: "نموذج تفكير من Microsoft" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🐋",
    baseUrl: "https://api.deepseek.com",
    needsApiKey: true,
    apiKeyEnvVar: "DEEPSEEK_API_KEY",
    protocol: "openai",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat", isFree: false, description: "محادثة عامة قوية" },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner", isFree: false, description: "تفكير منطقي متقدم" },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    icon: "⚡",
    baseUrl: "https://api.groq.com/openai/v1",
    needsApiKey: true,
    apiKeyEnvVar: "GROQ_API_KEY",
    protocol: "openai",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", isFree: true, description: "سريع جداً على Groq" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", isFree: true, description: "خفيف وفوري" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", isFree: true, description: "نموذج MoE سريع" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B", isFree: true, description: "من Google" },
    ],
  },
];

export const getProvider = (id: string): Provider | undefined => {
  return PROVIDERS.find((p) => p.id === id);
};

export const getDefaultModel = (providerId: string): string => {
  const provider = getProvider(providerId);
  return provider?.models[0]?.id ?? "";
};

export const SYSTEM_PROMPT = `أنت "CodePilot" - مساعد برمجة ذكي متخصص تم تطويره بواسطة Z AI. أنت تساعد المستخدم في:
- كتابة وتحسين الأكواد البرمجية بجميع اللغات
- شرح المفاهيم البرمجية المعقدة بطريقة مبسطة
- حل المشاكل البرمجية (Debugging) والبحث عن الأخطاء
- اقتراح أفضل الممارسات وأنماط التصميم
- مراجعة الأكواد وتقديم اقتراحات للتحسين
- تصميم هيكل المشاريع واختيار التقنيات المناسبة

كن دائماً واضحاً ودقيقاً ومختصراً. استخدم أكواد برمجية منظمة مع تحديد اللغة. أجب بنفس لغة المستخدم. قدم أمثلة عملية whenever possible.`;
