import { NextResponse, type NextRequest } from "next/server";
import { verifyRazorpaySignature } from "@/lib/billing/razorpay";
import {
  applySubscriptionState,
  recordPaymentEvent,
} from "@/lib/billing/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 30;

interface RzpSubEntity {
  id: string;
  status: string;
  current_end: number | null;
  start_at: number | null;
  notes?: { user_id?: string; plan?: string };
}

function mapStatus(s: string): string {
  switch (s) {
    case "created":
    case "authenticated":
      return "trialing";
    case "active":
      return "active";
    case "halted":
    case "pending":
      return "past_due";
    case "cancelled":
    case "expired":
      return "canceled";
    case "paused":
      return "paused";
    default:
      return s;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature || !verifyRazorpaySignature(body, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(body) as {
    event: string;
    payload: Record<string, { entity: Record<string, unknown> }>;
  };
  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    `${payload.event}:${Date.now()}`;

  const fresh = await recordPaymentEvent("razorpay", eventId, payload.event, payload);
  if (!fresh) return NextResponse.json({ received: true, duplicate: true });

  if (payload.event.startsWith("subscription.")) {
    const sub = payload.payload.subscription?.entity as unknown as RzpSubEntity;
    const userId = sub?.notes?.user_id;
    const plan = sub?.notes?.plan as "plus" | "pro" | undefined;
    if (sub && userId && plan) {
      await applySubscriptionState({
        provider: "razorpay",
        providerSubId: sub.id,
        userId,
        plan,
        status: mapStatus(sub.status),
        currentPeriodEnd: sub.current_end
          ? new Date(sub.current_end * 1000).toISOString()
          : null,
        trialEnd: sub.start_at ? new Date(sub.start_at * 1000).toISOString() : null,
        cancelAtPeriodEnd: false,
      });
    }
  }

  if (payload.event === "payment.captured" || payload.event === "payment_link.paid") {
    const payment = (payload.payload.payment?.entity ?? {}) as {
      id?: string;
      amount?: number;
      notes?: { user_id?: string; kind?: string; amount?: string };
    };
    if (payment.notes?.kind === "wallet_topup" && payment.notes.user_id && payment.id) {
      const admin = createAdminClient();
      await admin.rpc("wallet_credit", {
        p_user_id: payment.notes.user_id,
        p_amount: Number(payment.notes.amount ?? payment.amount ?? 0),
        p_type: "topup",
        p_provider_payment_id: payment.id,
        p_note: "Razorpay top-up",
      });
    }
  }

  return NextResponse.json({ received: true });
}
