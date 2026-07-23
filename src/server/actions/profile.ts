"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/server/services/context";

export async function setNotificationPref(
  key: "daily_card_push" | "voc_alerts" | "guide_replies" | "email_digest",
  value: boolean,
) {
  const ctx = await getAppContext();
  const supabase = await createClient();
  await supabase
    .from("notification_prefs")
    .update({ [key]: value })
    .eq("user_id", ctx.userId);
  revalidatePath("/profile");
}

export async function savePushSubscription(subscription: unknown) {
  const ctx = await getAppContext();
  const supabase = await createClient();
  await supabase
    .from("notification_prefs")
    .update({ push_subscription: subscription })
    .eq("user_id", ctx.userId);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
