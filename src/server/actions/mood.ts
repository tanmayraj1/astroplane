"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/server/services/context";
import { awardKarma } from "@/server/services/karma";
import { todayFor } from "@/server/services/daily";

const schema = z.object({
  mood: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5).nullable().optional(),
  followedSuggestions: z.boolean().nullable().optional(),
});

export async function logMood(input: z.infer<typeof schema>) {
  const parsed = schema.parse(input);
  const ctx = await getAppContext();
  const supabase = await createClient();
  const date = todayFor(ctx);

  const { data, error } = await supabase
    .from("mood_checkins")
    .upsert(
      {
        user_id: ctx.userId,
        date,
        slot: "evening",
        mood: parsed.mood,
        energy: parsed.energy ?? null,
        followed_suggestions: parsed.followedSuggestions ?? null,
      },
      { onConflict: "user_id,date,slot" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await awardKarma(ctx.userId, "checkin", data.id, ctx.profile.timezone);
  revalidatePath("/today");
  revalidatePath("/patterns");
}
