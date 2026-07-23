"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeNatalChart, ENGINE_VERSION } from "@/lib/astro";

const birthSchema = z.object({
  displayName: z.string().min(1).max(80),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  birthPlace: z.string().min(2).max(160),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  tz: z.string().min(1),
});

export async function saveBirthDetails(input: z.infer<typeof birthSchema>) {
  const parsed = birthSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error: birthErr } = await supabase.from("birth_data").upsert({
    user_id: user.id,
    birth_date: parsed.birthDate,
    birth_time: parsed.birthTime,
    time_known: parsed.birthTime !== null,
    birth_place: parsed.birthPlace,
    lat: parsed.lat,
    lng: parsed.lng,
    tz: parsed.tz,
  });
  if (birthErr) throw new Error(birthErr.message);

  await supabase
    .from("profiles")
    .update({ display_name: parsed.displayName, timezone: parsed.tz })
    .eq("id", user.id);

  // Compute + cache the natal chart (service role — clients can't write charts)
  const chart = computeNatalChart({
    date: parsed.birthDate,
    time: parsed.birthTime,
    lat: parsed.lat,
    lng: parsed.lng,
    tz: parsed.tz,
  });
  const admin = createAdminClient();
  const { error: chartErr } = await admin.from("natal_charts").upsert({
    user_id: user.id,
    chart,
    engine_version: ENGINE_VERSION,
    computed_at: new Date().toISOString(),
  });
  if (chartErr) throw new Error(chartErr.message);
}

export async function saveChronotype(chronotype: "lark" | "early" | "mid" | "owl" | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  await supabase.from("profiles").update({ chronotype }).eq("id", user.id);
}

const FOCUS_KEYS = ["plan", "timing", "tarot", "relationships", "career", "rest"] as const;

export async function saveFocusAreas(areas: string[]) {
  const clean = areas.filter((a) => (FOCUS_KEYS as readonly string[]).includes(a));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  await supabase
    .from("profiles")
    .update({ focus_areas: clean, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);
}
