import "server-only";
import { DateTime } from "luxon";
import { createAdminClient } from "@/lib/supabase/admin";

export const KARMA_POINTS = {
  task_done: 5,
  checkin: 10,
  tarot_pull: 5,
  journal: 5,
  streak_bonus: 20,
} as const;

/**
 * Award karma (idempotent per kind+ref via unique index) and advance the streak.
 * Server-only — clients cannot forge karma.
 */
export async function awardKarma(
  userId: string,
  kind: keyof typeof KARMA_POINTS,
  refId: string | null,
  tz: string,
): Promise<void> {
  const admin = createAdminClient();
  const today = DateTime.now().setZone(tz).toISODate()!;

  const { error } = await admin.from("karma_events").insert({
    user_id: userId,
    kind,
    points: KARMA_POINTS[kind],
    ref_id: refId,
    date: today,
  });
  // duplicate (kind, ref) → already awarded; nothing else to do
  if (error) return;

  // streak advances on check-ins only (the design's "14-day streak" = daily check-ins)
  if (kind !== "checkin") return;

  const { data: streak } = await admin
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!streak) return;

  const yesterday = DateTime.fromISO(today).minus({ days: 1 }).toISODate()!;
  let current = 1;
  if (streak.last_active_date === today) return; // already counted today
  if (streak.last_active_date === yesterday) current = streak.current + 1;

  const longest = Math.max(current, streak.longest ?? 0);
  await admin
    .from("streaks")
    .update({ current, longest, last_active_date: today, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  // milestone bonus every 7 days
  if (current > 0 && current % 7 === 0) {
    await admin.from("karma_events").insert({
      user_id: userId,
      kind: "streak_bonus",
      points: KARMA_POINTS.streak_bonus,
      ref_id: null,
      date: today,
    });
  }
}
