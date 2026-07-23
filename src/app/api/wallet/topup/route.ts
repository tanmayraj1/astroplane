import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/server/services/context";
import { providerFor } from "@/lib/billing/plans";
import { stripeTopup, stripeConfigured } from "@/lib/billing/stripe";
import { razorpayTopup, razorpayConfigured } from "@/lib/billing/razorpay";

const schema = z.object({ pack: z.enum(["s", "m", "l"]) });

export async function POST(request: NextRequest) {
  const ctx = await getAppContext().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { pack } = schema.parse(await request.json());
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const { provider } = providerFor(ctx.profile.country_code);

  try {
    if (provider === "razorpay" && razorpayConfigured()) {
      const url = await razorpayTopup({
        userId: ctx.userId,
        packKey: pack,
        appUrl,
        name: ctx.profile.display_name,
        email: ctx.email,
      });
      return NextResponse.json({ url });
    }
    if (!stripeConfigured()) {
      return NextResponse.json({ error: "payments_not_configured" }, { status: 503 });
    }
    const url = await stripeTopup({
      userId: ctx.userId,
      email: ctx.email,
      packKey: pack,
      appUrl,
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("topup error", e);
    return NextResponse.json({ error: "topup_failed" }, { status: 500 });
  }
}
