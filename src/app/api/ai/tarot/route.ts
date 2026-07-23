import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppContext } from "@/server/services/context";
import { todayFor } from "@/server/services/daily";
import { aiConfigured, openai, DEFAULT_MODEL, TOKEN_CAPS } from "@/lib/ai/openai";
import { cardByKey } from "@/lib/tarot/deck";
import { chartSummaryForAI } from "@/lib/astro";

export const maxDuration = 60;

/**
 * POST /api/ai/tarot — streams the interpretation for today's daily pull.
 * The card itself was drawn server-side (seeded); this only phrases it.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ctx = await getAppContext();
  const date = todayFor(ctx);
  const admin = createAdminClient();

  const { data: pull } = await admin
    .from("tarot_pulls")
    .select("id, card_key, reversed, interpretation")
    .eq("user_id", ctx.userId)
    .eq("date", date)
    .eq("spread", "daily")
    .eq("position", 0)
    .maybeSingle();
  if (!pull) return NextResponse.json({ error: "no_pull" }, { status: 404 });

  const card = cardByKey(pull.card_key);
  if (!card) return NextResponse.json({ error: "bad_card" }, { status: 500 });

  // cached interpretation → return as a single chunk
  const cached = pull.interpretation as { text?: string } | null;
  if (cached?.text) {
    return new Response(cached.text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const sunSign = ctx.chart?.bigThree.sun ?? null;
  const baseline = `${card.name}${pull.reversed ? " (reversed)" : ""} — ${
    pull.reversed ? card.reversed : card.upright
  }.`;

  if (!aiConfigured()) {
    const text = `${baseline} ${
      sunSign ? `For your ${sunSign} Sun, this lands close to home. ` : ""
    }Sit with what it stirs — the card is a mirror, not a verdict.\n\nJournal · What is this card pointing at in your day?`;
    await admin
      .from("tarot_pulls")
      .update({ interpretation: { text, generatedBy: "rules" } })
      .eq("id", pull.id);
    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const stream = await openai().chat.completions.create({
    model: DEFAULT_MODEL,
    max_tokens: TOKEN_CAPS.tarot,
    temperature: 0.9,
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are the tarot voice of Astroplane. Interpret the user's daily card against their chart. Structure: (1) one italicizable epigraph line (max 8 words, poetic), (2) a 2-3 sentence interpretation tying the card's meaning to their Sun sign and today's context — specific, warm, zero doom, (3) a final line starting exactly with "Journal · " followed by one reflective question. Never give medical/legal/financial advice. Total under 120 words. Plain text, no markdown.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          card: card.name,
          reversed: pull.reversed,
          baseMeaning: pull.reversed ? card.reversed : card.upright,
          theme: card.theme,
          chart: ctx.chart ? chartSummaryForAI(ctx.chart) : "unknown",
          date,
        }),
      },
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
        await admin
          .from("tarot_pulls")
          .update({ interpretation: { text: full, generatedBy: "ai" } })
          .eq("id", pull.id);
      } catch {
        controller.enqueue(encoder.encode(full ? "" : baseline));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
