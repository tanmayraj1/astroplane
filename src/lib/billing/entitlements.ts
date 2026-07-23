import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Recompute a user's entitlements from their subscription rows.
 * Called from both webhook handlers — the single source of truth for gating.
 * Grace: entitlement survives 2 days past period end (failed-payment retry room).
 */
export async function refreshEntitlements(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: subs } = await admin
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_end")
    .eq("user_id", userId);

  const now = Date.now();
  const GRACE_MS = 2 * 86400000;

  let plan: "free" | "plus" | "pro" = "free";
  let validUntil: string | null = null;

  for (const s of subs ?? []) {
    const active =
      s.status === "active" ||
      s.status === "trialing" ||
      (s.status === "past_due" &&
        s.current_period_end &&
        Date.parse(s.current_period_end) + GRACE_MS > now);
    if (!active) continue;
    // pro outranks plus
    if (s.plan === "pro" || (s.plan === "plus" && plan === "free")) {
      plan = s.plan as "plus" | "pro";
      validUntil = s.current_period_end
        ? new Date(Date.parse(s.current_period_end) + GRACE_MS).toISOString()
        : null;
    }
  }

  await admin
    .from("entitlements")
    .upsert({ user_id: userId, plan, valid_until: validUntil, updated_at: new Date().toISOString() });
  await admin.from("profiles").update({ plan }).eq("id", userId);
}

/** Normalized subscription event applied identically for both providers. */
export interface NormalizedSubEvent {
  provider: "stripe" | "razorpay";
  providerSubId: string;
  userId: string;
  plan: "plus" | "pro";
  status: string; // trialing | active | past_due | canceled | paused
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export async function applySubscriptionState(ev: NormalizedSubEvent): Promise<void> {
  const admin = createAdminClient();
  await admin.from("subscriptions").upsert(
    {
      user_id: ev.userId,
      provider: ev.provider,
      provider_sub_id: ev.providerSubId,
      plan: ev.plan,
      status: ev.status,
      current_period_end: ev.currentPeriodEnd,
      trial_end: ev.trialEnd,
      cancel_at_period_end: ev.cancelAtPeriodEnd,
    },
    { onConflict: "provider_sub_id" },
  );
  await refreshEntitlements(ev.userId);
}

/** Idempotent webhook archive. Returns false if this event was already processed. */
export async function recordPaymentEvent(
  provider: "stripe" | "razorpay",
  eventId: string,
  type: string,
  payload: unknown,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("payment_events").insert({
    provider,
    event_id: eventId,
    type,
    payload,
    processed_at: new Date().toISOString(),
  });
  // unique violation → duplicate delivery → skip
  return !error;
}
