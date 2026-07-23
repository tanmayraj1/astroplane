import "server-only";
import { DateTime } from "luxon";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeSkyBase,
  personalizeSky,
  type SkyBase,
  type DailySky,
  type NatalChart,
  type Chronotype,
} from "@/lib/astro";
import { generateDailyCard, type DailyCardContent } from "@/lib/ai/daily-card";
import type { AppContext } from "./context";

/**
 * Daily sky. The location-shared base (planetary hours, moon + void-of-course,
 * positions) is cached per (date, tz, 1°-bucketed lat/lng) in daily_sky_cache —
 * shared across every user in that bucket. Personal transits/windows/sleep are
 * recomputed per user (pure math, milliseconds).
 */
export async function getDailySky(
  dateLocal: string,
  ctx: AppContext,
): Promise<DailySky> {
  const lat = ctx.birth?.lat ?? 28.61;
  const lng = ctx.birth?.lng ?? 77.21;
  const tz = ctx.profile.timezone || ctx.birth?.tz || "UTC";
  const latB = Math.round(lat);
  const lngB = Math.round(lng);

  const admin = createAdminClient();
  let base: SkyBase | null = null;

  const { data: cached } = await admin
    .from("daily_sky_cache")
    .select("sky")
    .eq("date", dateLocal)
    .eq("tz", tz)
    .eq("lat_bucket", latB)
    .eq("lng_bucket", lngB)
    .maybeSingle();

  if (cached) {
    base = cached.sky as SkyBase;
  } else {
    base = computeSkyBase({ dateLocal, tz, lat: latB, lng: lngB });
    // best-effort insert; unique constraint absorbs races
    await admin.from("daily_sky_cache").insert({
      date: dateLocal,
      tz,
      lat_bucket: latB,
      lng_bucket: lngB,
      sky: base,
    });
  }

  return personalizeSky(
    base,
    ctx.chart as NatalChart | null,
    (ctx.profile.chronotype as Chronotype) ?? null,
  );
}

/** Today's local date string for the user. */
export function todayFor(ctx: AppContext): string {
  const tz = ctx.profile.timezone || "UTC";
  return DateTime.now().setZone(tz).toISODate()!;
}

/**
 * Idempotent daily-card fetch-or-generate:
 * unique (user_id, date) makes concurrent generation safe.
 */
export async function getOrCreateDailyCard(
  ctx: AppContext,
  dateLocal: string,
  sky: DailySky,
): Promise<DailyCardContent> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("daily_cards")
    .select("content")
    .eq("user_id", ctx.userId)
    .eq("date", dateLocal)
    .maybeSingle();
  if (existing) return existing.content as DailyCardContent;

  // recent mood average (last 7 entries) for tone context
  const { data: moods } = await admin
    .from("mood_checkins")
    .select("mood")
    .eq("user_id", ctx.userId)
    .order("date", { ascending: false })
    .limit(7);
  const recentMoodAvg =
    moods && moods.length > 0
      ? +(moods.reduce((a, m) => a + m.mood, 0) / moods.length).toFixed(1)
      : null;

  const { content, model, usage } = await generateDailyCard({
    sky,
    chart: ctx.chart as NatalChart | null,
    displayName: ctx.profile.display_name,
    focusAreas: ctx.profile.focus_areas,
    recentMoodAvg,
  });

  const { error } = await admin.from("daily_cards").insert({
    user_id: ctx.userId,
    date: dateLocal,
    content,
    model,
    prompt_tokens: usage?.prompt ?? null,
    completion_tokens: usage?.completion ?? null,
  });
  // unique-violation race: another request generated it first — read theirs
  if (error) {
    const { data: raced } = await admin
      .from("daily_cards")
      .select("content")
      .eq("user_id", ctx.userId)
      .eq("date", dateLocal)
      .maybeSingle();
    if (raced) return raced.content as DailyCardContent;
  }
  return content;
}
