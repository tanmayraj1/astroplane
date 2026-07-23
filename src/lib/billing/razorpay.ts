import "server-only";
import Razorpay from "razorpay";
import crypto from "node:crypto";
import type { PlanKey } from "./plans";
import { WALLET_PACKS } from "./plans";

let _rzp: Razorpay | null = null;
export function razorpay(): Razorpay {
  if (!_rzp) {
    _rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return _rzp;
}

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

const PLAN_ENV: Record<PlanKey, string | undefined> = {
  plus: process.env.RAZORPAY_PLAN_PLUS,
  pro: process.env.RAZORPAY_PLAN_PRO,
};

/**
 * Create a Razorpay subscription (7-day trial via start_at) and return its
 * hosted checkout short_url for redirect.
 */
export async function razorpaySubscription(opts: {
  userId: string;
  plan: PlanKey;
}): Promise<string> {
  const planId = PLAN_ENV[opts.plan];
  if (!planId) throw new Error(`Missing Razorpay plan for ${opts.plan}`);

  const sub = await razorpay().subscriptions.create({
    plan_id: planId,
    total_count: 60, // monthly × 5 years max horizon
    customer_notify: 1,
    start_at: Math.floor(Date.now() / 1000) + 7 * 86400, // 7-day trial
    notes: { user_id: opts.userId, plan: opts.plan },
  });
  return (sub as unknown as { short_url: string }).short_url;
}

/** One-time wallet top-up via Payment Link (hosted page, UPI + cards). */
export async function razorpayTopup(opts: {
  userId: string;
  packKey: string;
  appUrl: string;
  name?: string | null;
  email?: string | null;
}): Promise<string> {
  const pack = WALLET_PACKS.find((p) => p.key === opts.packKey);
  if (!pack) throw new Error("bad pack");

  const link = await razorpay().paymentLink.create({
    amount: pack.inr,
    currency: "INR",
    description: "Astroplane wallet credit",
    customer: {
      name: opts.name ?? "Astroplane member",
      email: opts.email ?? undefined,
    },
    notes: { user_id: opts.userId, kind: "wallet_topup", amount: String(pack.inr) },
    callback_url: `${opts.appUrl}/wallet?status=success`,
    callback_method: "get",
  });
  return link.short_url;
}

/** Verify the X-Razorpay-Signature webhook HMAC. */
export function verifyRazorpaySignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
