import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/server/services/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { providerFor } from "@/lib/billing/plans";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), guideId: z.string().uuid() }),
  z.object({ action: z.literal("tick"), sessionId: z.string().uuid() }),
  z.object({ action: z.literal("end"), sessionId: z.string().uuid() }),
]);

/**
 * Chat session lifecycle. All billing derives minute indexes server-side from
 * started_at; wallet_debit_tick is idempotent per (session, minute_index), so
 * duplicate heartbeats and retries can never double-bill.
 */
export async function POST(request: NextRequest) {
  const ctx = await getAppContext().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = schema.parse(await request.json());
  const admin = createAdminClient();

  if (body.action === "start") {
    // resume an active session with this guide if one exists
    const { data: existing } = await admin
      .from("chat_sessions")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("guide_id", body.guideId)
      .eq("status", "active")
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ session: existing });
    }

    const { data: guide } = await admin
      .from("guides")
      .select("id, rate_cents_per_min, rate_paise_per_min")
      .eq("id", body.guideId)
      .eq("active", true)
      .maybeSingle();
    if (!guide) return NextResponse.json({ error: "no_guide" }, { status: 404 });

    const { currency } = providerFor(ctx.profile.country_code);
    const rate = currency === "INR" ? guide.rate_paise_per_min : guide.rate_cents_per_min;

    const { data: wallet } = await admin
      .from("wallets")
      .select("balance, currency")
      .eq("user_id", ctx.userId)
      .maybeSingle();
    const walletCurrency = wallet?.currency ?? currency;
    const effectiveRate =
      walletCurrency === "INR" ? guide.rate_paise_per_min : guide.rate_cents_per_min;

    if ((wallet?.balance ?? 0) < effectiveRate) {
      return NextResponse.json({ error: "insufficient_funds" }, { status: 402 });
    }

    const { data: session, error } = await admin
      .from("chat_sessions")
      .insert({
        user_id: ctx.userId,
        guide_id: body.guideId,
        rate_snapshot: effectiveRate,
        currency: walletCurrency,
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session });
  }

  // tick / end — verify ownership first
  const { data: session } = await admin
    .from("chat_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .eq("user_id", ctx.userId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "no_session" }, { status: 404 });

  if (body.action === "end") {
    if (session.status === "active") {
      await admin
        .from("chat_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", session.id);
    }
    return NextResponse.json({ ended: true, billedMinutes: session.billed_minutes });
  }

  // tick: bill every minute boundary crossed since start that isn't billed yet
  if (session.status !== "active") {
    return NextResponse.json({
      status: session.status,
      billedMinutes: session.billed_minutes,
    });
  }

  const elapsedMin = Math.floor(
    (Date.now() - Date.parse(session.started_at)) / 60000,
  );
  // minute_index 0 is billed on the first tick (sent right after first message)
  let balance: number | null = null;
  let aborted = false;
  for (let idx = session.billed_minutes; idx <= elapsedMin; idx++) {
    const { data, error } = await admin.rpc("wallet_debit_tick", {
      p_session_id: session.id,
      p_minute_index: idx,
    });
    if (error) break;
    if (data === -1) {
      aborted = true;
      break;
    }
    balance = data as number;
  }

  const { data: fresh } = await admin
    .from("chat_sessions")
    .select("status, billed_minutes")
    .eq("id", session.id)
    .single();

  return NextResponse.json({
    status: aborted ? "aborted_funds" : fresh?.status ?? "active",
    billedMinutes: fresh?.billed_minutes ?? session.billed_minutes,
    balance,
  });
}
