import type { Provider } from "./types";

export const PROVIDERS: Provider[] = [
  {
    id: "zai",
    name: "Z AI",
    icon: "🤖",
    baseUrl: "",
    needsApiKey: true,
    apiKeyEnvVar: "ZHIPU_API_KEY",
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
      { id: "z-ai/glm-4.5-air:free", name: "GLM-4.5 Air", isFree: true, description: "نموذج GLM مجاني - متوازن وممتاز للبرمجة" },
      { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", isFree: true, description: "نموذج Google مجاني وخفيف" },
      { id: "z-ai/glm-4.7-flash", name: "GLM-4.7 Flash", isFree: false, description: "سريع جداً من أحدث جيل" },
      { id: "z-ai/glm-4.7", name: "GLM-4.7", isFree: false, description: "أقوى نموذج GLM للبرمجة" },
      { id: "deepseek/deepseek-chat", name: "DeepSeek V3", isFree: false, description: "قوي جداً في البرمجة" },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1", isFree: false, description: "تفكير منطقي متقدم" },
      { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick", isFree: false, description: "أحدث نموذج من Meta" },
      { id: "qwen/qwen3-235b-a22b", name: "Qwen3 235B", isFree: false, description: "نموذج ضخم من Alibaba" },
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
