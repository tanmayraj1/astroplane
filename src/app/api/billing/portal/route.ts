import { NextResponse, type NextRequest } from "next/server";
import { getAppContext } from "@/server/services/context";
import { stripePortal, stripeConfigured } from "@/lib/billing/stripe";

export async function POST(request: NextRequest) {
  const ctx = await getAppContext().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const url = await stripePortal(ctx.userId, appUrl);
  if (!url) return NextResponse.json({ error: "no_customer" }, { status: 404 });
  return NextResponse.json({ url });
}
