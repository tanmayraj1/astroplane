import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanKey } from "./plans";
import { WALLET_PACKS } from "./plans";

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

async function getOrCreateCustomer(userId: string, email: string | null): Promise<string> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (row?.stripe_customer_id) return row.stripe_customer_id;

  const customer = await stripe().customers.create({
    email: email ?? undefined,
    metadata: { user_id: userId },
  });
  await admin
    .from("customers")
    .upsert({ user_id: userId, stripe_customer_id: customer.id });
  return customer.id;
}

const PRICE_ENV: Record<PlanKey, string | undefined> = {
  plus: process.env.STRIPE_PRICE_PLUS,
  pro: process.env.STRIPE_PRICE_PRO,
};

export async function stripeCheckout(opts: {
  userId: string;
  email: string | null;
  plan: PlanKey;
  appUrl: string;
}): Promise<string> {
  const customer = await getOrCreateCustomer(opts.userId, opts.email);
  const price = PRICE_ENV[opts.plan];
  if (!price) throw new Error(`Missing Stripe price for ${opts.plan}`);

  const session = await stripe().checkout.sessions.create({
    customer,
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { user_id: opts.userId, plan: opts.plan },
    },
    metadata: { user_id: opts.userId, plan: opts.plan },
    success_url: `${opts.appUrl}/billing?status=success`,
    cancel_url: `${opts.appUrl}/paywall?status=canceled`,
    allow_promotion_codes: true,
  });
  return session.url!;
}

export async function stripeTopup(opts: {
  userId: string;
  email: string | null;
  packKey: string;
  appUrl: string;
}): Promise<string> {
  const pack = WALLET_PACKS.find((p) => p.key === opts.packKey);
  if (!pack) throw new Error("bad pack");
  const customer = await getOrCreateCustomer(opts.userId, opts.email);

  const session = await stripe().checkout.sessions.create({
    customer,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pack.usd,
          product_data: { name: `Astroplane wallet credit` },
        },
        quantity: 1,
      },
    ],
    metadata: { user_id: opts.userId, kind: "wallet_topup", amount: String(pack.usd) },
    success_url: `${opts.appUrl}/wallet?status=success`,
    cancel_url: `${opts.appUrl}/wallet?status=canceled`,
  });
  return session.url!;
}

export async function stripePortal(userId: string, appUrl: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!row?.stripe_customer_id) return null;
  const session = await stripe().billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${appUrl}/billing`,
  });
  return session.url;
}
