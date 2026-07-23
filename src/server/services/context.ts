import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { NatalChart } from "@/lib/astro";

export interface AppContext {
  userId: string;
  email: string | null;
  profile: {
    display_name: string | null;
    chronotype: "lark" | "early" | "mid" | "owl" | null;
    focus_areas: string[];
    timezone: string;
    country_code: string | null;
    plan: "free" | "plus" | "pro";
    onboarded_at: string | null;
  };
  birth: {
    lat: number;
    lng: number;
    tz: string;
    birth_place: string;
    birth_date: string;
    birth_time: string | null;
    time_known: boolean;
  } | null;
  chart: NatalChart | null;
  karma: number;
  streak: { current: number; longest: number };
}

/** Per-request cached app context. Redirects to sign-in/onboarding as needed. */
export const getAppContext = cache(async (): Promise<AppContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [profileRes, birthRes, chartRes, karmaRes, streakRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("birth_data").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("natal_charts").select("chart").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("karma_balance", { p_user_id: user.id }),
    supabase.from("streaks").select("current, longest").eq("user_id", user.id).maybeSingle(),
  ]);

  const profile = profileRes.data;
  if (!profile) redirect("/sign-in");

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: {
      display_name: profile.display_name,
      chronotype: profile.chronotype,
      focus_areas: profile.focus_areas ?? [],
      timezone: profile.timezone ?? "UTC",
      country_code: profile.country_code,
      plan: profile.plan ?? "free",
      onboarded_at: profile.onboarded_at,
    },
    birth: birthRes.data ?? null,
    chart: (chartRes.data?.chart as NatalChart) ?? null,
    karma: (karmaRes.data as number) ?? 0,
    streak: streakRes.data ?? { current: 0, longest: 0 },
  };
});

/** Gate for app screens: requires completed onboarding. */
export async function requireOnboarded(): Promise<AppContext> {
  const ctx = await getAppContext();
  if (!ctx.birth || !ctx.chart) redirect("/onboarding/birth");
  return ctx;
}
