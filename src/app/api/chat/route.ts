import { NextRequest, NextResponse } from "next/server";
import { PROVIDERS, SYSTEM_PROMPT } from "@/lib/providers";

async function handleZAI(
  messages: { role: string; content: string }[],
  model: string,
  stream: boolean
): Promise<Response> {
  // Dynamically import z-ai-web-dev-sdk (server-only)
  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  const zai = await ZAI.create();

  const chatMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: (m.role as "user" | "assistant" | "system"),
      content: m.content,
    })),
  ];

  if (stream) {
    // Get full response first, then simulate streaming for smooth UX
    const completion = await zai.chat.completions.create({
      model,
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    const fullContent = completion.choices?.[0]?.message?.content || "";
    const encoder = new TextEncoder();

    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          // Send content in word-sized chunks for a natural typing feel
          const words = fullContent.split(/(\s+)/);
          for (const word of words) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: word })}\n\n`)
            );
            // Small delay between chunks for typing effect
            await new Promise((r) => setTimeout(r, 15));
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
  const completion = await zai.chat.completions.create({
    model,
    messages: chatMessages,
    temperature: 0.7,
    max_tokens: 4096,
  });

  const content = completion.choices?.[0]?.message?.content || "لا يوجد رد";
  return NextResponse.json({ content });
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
      return NextResponse.json(
        { error: "مزود غير معروف" },
        { status: 400 }
      );
    }

    // Z AI uses built-in SDK - no API key needed
    if (providerId === "zai") {
      return handleZAI(messages, model, stream);
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
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
