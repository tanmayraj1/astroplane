import { NextResponse, type NextRequest } from "next/server";
import { DateTime } from "luxon";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeSkyBase,
  personalizeSky,
  type NatalChart,
  type Chronotype,
  type SkyBase,
} from "@/lib/astro";
import { generateDailyCard } from "@/lib/ai/daily-card";

export const maxDuration = 300;

/**
 * Vercel Cron (hourly): pre-generate daily cards for users whose local day
 * just started (00:00–01:00 local). One small-model call per user per day;
 * unique (user_id, date) makes re-runs no-ops.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: users } = await admin
    .from("profiles")
    .select("id, display_name, chronotype, focus_areas, timezone")
    .not("onboarded_at", "is", null)
    .limit(2000);

  let generated = 0;
  const skyCache = new Map<string, SkyBase>();

  for (const u of users ?? []) {
    const tz = u.timezone || "UTC";
    const nowLocal = DateTime.now().setZone(tz);
    if (nowLocal.hour !== 0) continue; // only users whose day just began

    const date = nowLocal.toISODate()!;
    const { data: existing } = await admin
      .from("daily_cards")
      .select("id")
      .eq("user_id", u.id)
      .eq("date", date)
      .maybeSingle();
    if (existing) continue;

    const [{ data: birth }, { data: chartRow }] = await Promise.all([
      admin.from("birth_data").select("lat, lng").eq("user_id", u.id).maybeSingle(),
      admin.from("natal_charts").select("chart").eq("user_id", u.id).maybeSingle(),
    ]);
    if (!birth) continue;

    const latB = Math.round(birth.lat);
    const lngB = Math.round(birth.lng);
    const cacheKey = `${date}:${tz}:${latB}:${lngB}`;
    let base = skyCache.get(cacheKey);
    if (!base) {
      const { data: cached } = await admin
        .from("daily_sky_cache")
        .select("sky")
        .eq("date", date)
        .eq("tz", tz)
        .eq("lat_bucket", latB)
        .eq("lng_bucket", lngB)
        .maybeSingle();
      base = (cached?.sky as SkyBase) ?? computeSkyBase({ dateLocal: date, tz, lat: latB, lng: lngB });
      if (!cached) {
        await admin.from("daily_sky_cache").insert({
          date,
          tz,
          lat_bucket: latB,
          lng_bucket: lngB,
          sky: base,
        });
      }
      skyCache.set(cacheKey, base);
    }

    const chart = (chartRow?.chart as NatalChart) ?? null;
    const sky = personalizeSky(base, chart, (u.chronotype as Chronotype) ?? null);
    const { content, model, usage } = await generateDailyCard({
      sky,
      chart,
      displayName: u.display_name,
      focusAreas: u.focus_areas ?? [],
      recentMoodAvg: null,
    });
    const { error } = await admin.from("daily_cards").insert({
      user_id: u.id,
      date,
      content,
      model,
      prompt_tokens: usage?.prompt ?? null,
      completion_tokens: usage?.completion ?? null,
    });
    if (!error) generated++;
  }

  return NextResponse.json({ generated });
}
