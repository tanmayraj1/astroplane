export const PLANS = {
  plus: {
    name: "Plus",
    usd: 700, // cents/mo
    inr: 29900, // paise/mo
    trialDays: 7,
    features: [
      "Full chart — all placements & aspects",
      "Unlimited tarot & guided spreads",
      "Deep patterns — mood × transit",
      "Year-ahead forecast report",
    ],
  },
  pro: {
    name: "Pro",
    usd: 1600,
    inr: 89900,
    trialDays: 7,
    features: [
      "Everything in Plus",
      "$15 guide credit monthly",
      "Priority booking with top guides",
    ],
  },
} as const;
export type PlanKey = keyof typeof PLANS;

export const WALLET_PACKS = [
  { key: "s", usd: 300, inr: 19900 },
  { key: "m", usd: 700, inr: 49900 },
  { key: "l", usd: 1500, inr: 99900 },
] as const;

/** IN → razorpay/INR; everyone else → stripe/USD. */
export function providerFor(countryCode: string | null | undefined): {
  provider: "stripe" | "razorpay";
  currency: "USD" | "INR";
} {
  if (countryCode === "IN" && process.env.RAZORPAY_KEY_ID) {
    return { provider: "razorpay", currency: "INR" };
  }
  return { provider: "stripe", currency: "USD" };
}

/** Fallback country inference when profile has none: Vercel geo header, then tz. */
export function inferCountry(
  geoHeader: string | null,
  timezone: string | null,
): string | null {
  if (geoHeader) return geoHeader.toUpperCase();
  if (timezone === "Asia/Kolkata" || timezone === "Asia/Calcutta") return "IN";
  return null;
}
