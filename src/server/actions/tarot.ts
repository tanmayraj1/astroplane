"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppContext } from "@/server/services/context";
import { todayFor } from "@/server/services/daily";
import { awardKarma } from "@/server/services/karma";
import { seededDraw, cardByKey } from "@/lib/tarot/deck";

/**
 * Server-side daily draw — seeded per user+date so refresh can't reroll.
 * Free tier: 1 daily pull. Spreads are Plus-gated (checked in the spread action).
 */
export async function drawDailyCard(): Promise<{
  cardKey: string;
  reversed: boolean;
}> {
  const ctx = await getAppContext();
  const admin = createAdminClient();
  const date = todayFor(ctx);

  const { data: existing } = await admin
    .from("tarot_pulls")
    .select("card_key, reversed")
    .eq("user_id", ctx.userId)
    .eq("date", date)
    .eq("spread", "daily")
    .eq("position", 0)
    .maybeSingle();
  if (existing) return { cardKey: existing.card_key, reversed: existing.reversed };

  const [{ card, reversed }] = seededDraw(`${ctx.userId}:${date}:daily`);
  const { error } = await admin.from("tarot_pulls").insert({
    user_id: ctx.userId,
    date,
    card_key: card.key,
    reversed,
    spread: "daily",
    position: 0,
  });
  if (error) {
    // race: someone inserted first — the seed makes it identical anyway
  }
  await awardKarma(ctx.userId, "tarot_pull", null, ctx.profile.timezone);
  revalidatePath("/tarot");
  return { cardKey: card.key, reversed };
}

const SPREADS = {
  new_moon: { cards: 3, plan: "plus" },
  relationship: { cards: 5, plan: "plus" },
  career: { cards: 5, plan: "plus" },
} as const;

export async function drawSpread(spread: keyof typeof SPREADS) {
  const ctx = await getAppContext();
  if (ctx.profile.plan === "free") {
    return { error: "plus_required" as const };
  }
  const admin = createAdminClient();
  const date = todayFor(ctx);
  const cfg = SPREADS[spread];

  const { data: existing } = await admin
    .from("tarot_pulls")
    .select("card_key, reversed, position")
    .eq("user_id", ctx.userId)
    .eq("date", date)
    .eq("spread", spread)
    .order("position");
  if (existing && existing.length > 0) {
    return {
      cards: existing.map((e) => ({ cardKey: e.card_key, reversed: e.reversed })),
    };
  }

  const drawn = seededDraw(`${ctx.userId}:${date}:${spread}`, cfg.cards);
  await admin.from("tarot_pulls").insert(
    drawn.map((d, i) => ({
      user_id: ctx.userId,
      date,
      card_key: d.card.key,
      reversed: d.reversed,
      spread,
      position: i,
    })),
  );
  revalidatePath("/tarot");
  return { cards: drawn.map((d) => ({ cardKey: d.card.key, reversed: d.reversed })) };
}

const journalSchema = z.object({
  body: z.string().min(1).max(8000),
  tarotPullId: z.string().uuid().nullable().optional(),
});

export async function saveJournalEntry(input: z.infer<typeof journalSchema>) {
  const parsed = journalSchema.parse(input);
  const ctx = await getAppContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: ctx.userId,
      tarot_pull_id: parsed.tarotPullId ?? null,
      date: todayFor(ctx),
      body: parsed.body,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await awardKarma(ctx.userId, "journal", data.id, ctx.profile.timezone);
  revalidatePath("/tarot/journal");
}

/** Recurrence insight: most-pulled card in the last 30 days (min 2). */
export async function recurrenceInsight(): Promise<string | null> {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("tarot_pulls")
    .select("card_key")
    .eq("user_id", ctx.userId)
    .gte("date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  if (!data || data.length < 3) return null;
  const counts = new Map<string, number>();
  for (const p of data) counts.set(p.card_key, (counts.get(p.card_key) ?? 0) + 1);
  const [topKey, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCount < 2) return null;
  const card = cardByKey(topKey);
  if (!card) return null;
  return `${card.name} has appeared ${topCount} times this month — ${card.theme} is the season's theme.`;
}
