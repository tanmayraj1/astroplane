import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/billing/stripe";
import {
  applySubscriptionState,
  recordPaymentEvent,
} from "@/lib/billing/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 30;

function mapStatus(s: Stripe.Subscription.Status): string {
  switch (s) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "paused":
      return "paused";
    default:
      return s;
  }
}

async function handleSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata.user_id;
  const plan = sub.metadata.plan as "plus" | "pro" | undefined;
  if (!userId || !plan) return;
  const item = sub.items.data[0];
  await applySubscriptionState({
    provider: "stripe",
    providerSubId: sub.id,
    userId,
    plan,
    status: mapStatus(sub.status),
    currentPeriodEnd: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const fresh = await recordPaymentEvent("stripe", event.id, event.type, event.data.object);
  if (!fresh) return NextResponse.json({ received: true, duplicate: true });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === "wallet_topup" && session.metadata.user_id) {
        const admin = createAdminClient();
        await admin.rpc("wallet_credit", {
          p_user_id: session.metadata.user_id,
          p_amount: Number(session.metadata.amount ?? session.amount_total ?? 0),
          p_type: "topup",
          p_provider_payment_id: String(session.payment_intent ?? session.id),
          p_note: "Stripe top-up",
        });
      } else if (session.subscription) {
        const sub = await stripe().subscriptions.retrieve(String(session.subscription));
        await handleSubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscription(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as unknown as { subscription?: string }).subscription;
      if (subId) {
        const sub = await stripe().subscriptions.retrieve(subId);
        await handleSubscription(sub);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
