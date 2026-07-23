import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/server/services/context";
import { createClient } from "@/lib/supabase/server";
import { providerFor, inferCountry } from "@/lib/billing/plans";
import { stripeCheckout, stripeConfigured } from "@/lib/billing/stripe";
import { razorpaySubscription, razorpayConfigured } from "@/lib/billing/razorpay";

const schema = z.object({ plan: z.enum(["plus", "pro"]) });

export async function POST(request: NextRequest) {
  const ctx = await getAppContext().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { plan } = schema.parse(await request.json());
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  // pin country on first checkout (Vercel geo header → tz fallback)
  let country = ctx.profile.country_code;
  if (!country) {
    country = inferCountry(
      request.headers.get("x-vercel-ip-country"),
      ctx.profile.timezone,
    );
    if (country) {
      const supabase = await createClient();
      await supabase.from("profiles").update({ country_code: country }).eq("id", ctx.userId);
    }
  }

  const { provider } = providerFor(country);

  try {
    if (provider === "razorpay" && razorpayConfigured()) {
      const url = await razorpaySubscription({ userId: ctx.userId, plan });
      return NextResponse.json({ url });
    }
    if (!stripeConfigured()) {
      return NextResponse.json(
        { error: "payments_not_configured" },
        { status: 503 },
      );
    }
    const url = await stripeCheckout({
      userId: ctx.userId,
      email: ctx.email,
      plan,
      appUrl,
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("checkout error", e);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
