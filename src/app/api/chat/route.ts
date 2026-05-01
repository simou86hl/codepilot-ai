import { NextRequest, NextResponse } from "next/server";
import { PROVIDERS, SYSTEM_PROMPT } from "@/lib/providers";

// Try to load ZAI config from .z-ai-config files (for internal Z AI environments)
async function loadZAIConfig(): Promise<{ baseUrl: string; apiKey: string } | null> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const os = await import("os");

    const configPaths = [
      path.join(process.cwd(), ".z-ai-config"),
      path.join(os.homedir(), ".z-ai-config"),
      "/etc/.z-ai-config",
    ];

    for (const filePath of configPaths) {
      try {
        const configStr = await fs.readFile(filePath, "utf-8");
        const config = JSON.parse(configStr);
        if (config.baseUrl && config.apiKey) {
          return config;
        }
      } catch {
        // Continue to next path
      }
    }
  } catch {
    // fs module not available or other error
  }
  return null;
}

async function handleZAI(
  messages: { role: string; content: string }[],
  model: string,
  userApiKey?: string
): Promise<Response> {
  const chatMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  // Strategy 1: Use user-provided Zhipu AI API key (works everywhere)
  if (userApiKey) {
    return callZhipuAPI(chatMessages, model, userApiKey);
  }

  // Strategy 2: Try internal Z AI SDK (works in Z AI dev environment)
  const internalConfig = await loadZAIConfig();
  if (internalConfig) {
    return callInternalAPI(chatMessages, model, internalConfig);
  }

  // Strategy 3: No config available
  return NextResponse.json(
    {
      error:
        "Z AI غير متاح في هذه البيئة. للحصول على مفتاح مجاني من Zhipu AI، تفضل بزيارة:\nhttps://open.bigmodel.cn/\n\nثم أضف المفتاح في صفحة الإعدادات.",
    },
    { status: 503 }
  );
}

async function callZhipuAPI(
  chatMessages: { role: string; content: string }[],
  model: string,
  apiKey: string
): Promise<Response> {
  try {
    const response = await fetch(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model === "glm-4-plus" ? "glm-4-plus" : model,
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Zhipu API error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `خطأ من Zhipu AI: ${response.status} - ${errorText.slice(0, 200)}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "لا يوجد رد من النموذج";

    return NextResponse.json({ content, provider: "zai", model });
  } catch (err: any) {
    console.error("Zhipu API call failed:", err);
    return NextResponse.json(
      { error: `فشل الاتصال بـ Zhipu AI: ${err?.message || "خطأ غير معروف"}` },
      { status: 502 }
    );
  }
}

async function callInternalAPI(
  chatMessages: { role: string; content: string }[],
  model: string,
  config: { baseUrl: string; apiKey: string; chatId?: string; token?: string; userId?: string }
): Promise<Response> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "X-Z-AI-From": "Z",
    };
    if (config.chatId) headers["X-Chat-Id"] = config.chatId;
    if (config.userId) headers["X-User-Id"] = config.userId;
    if (config.token) headers["X-Token"] = config.token;

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 4096,
        thinking: { type: "disabled" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Internal ZAI API error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `خطأ من خدمة Z AI الداخلية: ${response.status} - ${errorText.slice(0, 200)}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "لا يوجد رد من النموذج";

    return NextResponse.json({ content, provider: "zai", model });
  } catch (err: any) {
    console.error("Internal ZAI call failed:", err);
    return NextResponse.json(
      { error: `فشل الاتصال بـ Z AI: ${err?.message || "خطأ غير معروف"}` },
      { status: 502 }
    );
  }
}

async function handleOpenAICompatible(
  provider: (typeof PROVIDERS)[0],
  providerId: string,
  messages: { role: string; content: string }[],
  model: string,
  apiKey: string,
  stream: boolean
): Promise<Response> {
  const chatMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as string,
      content: m.content,
    })),
  ];

  const extraHeaders: Record<string, string> = {};
  if (providerId === "openrouter") {
    extraHeaders["HTTP-Referer"] = "https://codepilot.app";
    extraHeaders["X-Title"] = "CodePilot AI";
  }

  if (stream) {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `خطأ من المزود: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const encoder = new TextEncoder();
    const streamResponse = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
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
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {
                // Skip malformed JSON chunks
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(streamResponse, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Non-streaming
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: `خطأ من المزود: ${response.status} - ${errorText}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "لا يوجد رد";

  return NextResponse.json({ content });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, provider: providerId, model, apiKey, stream } = await req.json();

    const provider = PROVIDERS.find((p) => p.id === providerId);
    if (!provider) {
      return NextResponse.json({ error: "مزود غير معروف" }, { status: 400 });
    }

    // Z AI - uses internal SDK or public Zhipu AI API
    if (providerId === "zai") {
      return handleZAI(messages, model, apiKey);
    }

    // Other providers need API key
    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح API مطلوب. يرجى إعداده من صفحة الإعدادات." },
        { status: 400 }
      );
    }

    return handleOpenAICompatible(
      provider,
      providerId,
      messages,
      model,
      apiKey,
      stream
    );
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: `حدث خطأ أثناء معالجة الطلب: ${error?.message || "خطأ غير معروف"}`,
      },
      { status: 500 }
    );
  }
}
