import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vercel Cron (every 5 min): end active sessions whose last heartbeat is stale
 * so a closed tab can never keep billing.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const staleBefore = new Date(Date.now() - 90_000).toISOString();

  const { data: stale } = await admin
    .from("chat_sessions")
    .select("id")
    .eq("status", "active")
    .lt("last_tick_at", staleBefore);

  for (const s of stale ?? []) {
    await admin
      .from("chat_sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", s.id)
      .eq("status", "active");
  }

  return NextResponse.json({ swept: stale?.length ?? 0 });
}
