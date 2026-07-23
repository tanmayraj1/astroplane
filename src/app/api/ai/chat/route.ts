import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/server/services/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { aiConfigured, openai, TOKEN_CAPS } from "@/lib/ai/openai";
import { detectCrisis, crisisResponse } from "@/lib/ai/safety";
import { chartSummaryForAI } from "@/lib/astro";

export const maxDuration = 60;

const schema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});

/**
 * Guide chat — streams the guide persona's reply.
 * Safety gate runs BEFORE any model call. Messages persist server-side.
 */
export async function POST(request: NextRequest) {
  const ctx = await getAppContext().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { sessionId, message } = schema.parse(await request.json());
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("chat_sessions")
    .select("*, guides(name, craft, system_prompt, model)")
    .eq("id", sessionId)
    .eq("user_id", ctx.userId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "no_session" }, { status: 404 });
  if (session.status !== "active") {
    return NextResponse.json({ error: "session_" + session.status }, { status: 409 });
  }

  await admin.from("chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: message,
  });

  // ── Crisis gate — bypasses persona entirely ──
  if (detectCrisis(message)) {
    const text = crisisResponse(ctx.profile.country_code);
    await admin.from("chat_messages").insert({
      session_id: sessionId,
      role: "guide",
      content: text,
    });
    await admin
      .from("chat_sessions")
      .update({ flagged_crisis: true })
      .eq("id", sessionId);
    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Crisis": "1" },
    });
  }

  const guide = session.guides as unknown as {
    name: string;
    craft: string;
    system_prompt: string;
    model: string;
  };

  if (!aiConfigured()) {
    const text = `(${guide.name} is unavailable — the AI layer isn't configured yet. Add an OpenAI key to bring the guides online.)`;
    await admin
      .from("chat_messages")
      .insert({ session_id: sessionId, role: "guide", content: text });
    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // last 20 messages as context (token-capped by count)
  const { data: history } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(20);
  const messages = (history ?? [])
    .reverse()
    .map((m) => ({
      role: (m.role === "guide" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    }));

  const stream = await openai().chat.completions.create({
    model: guide.model || "gpt-4o-mini",
    max_tokens: TOKEN_CAPS.chat,
    temperature: 0.9,
    stream: true,
    messages: [
      {
        role: "system",
        content: `${guide.system_prompt}

Context about this client (from their Astroplane profile — use it naturally, never dump it):
- Name: ${ctx.profile.display_name ?? "unknown"}
- Chart: ${ctx.chart ? chartSummaryForAI(ctx.chart) : "no chart on file"}
- This is a paid per-minute session inside the Astroplane app. Be generous but concise; never pad for time.
- You are an AI persona, and the app discloses this. If asked directly whether you are an AI, answer honestly.`,
      },
      ...messages,
    ],
  });

  const encoder = new TextEncoder();
  let full = "";
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            full += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
      } finally {
        if (full) {
          await admin
            .from("chat_messages")
            .insert({ session_id: sessionId, role: "guide", content: full });
        }
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
