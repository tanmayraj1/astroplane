import { notFound } from "next/navigation";
import { requireOnboarded } from "@/server/services/context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChatClient } from "@/components/chat/chat-client";
import { providerFor } from "@/lib/billing/plans";
import { formatMinor, initials } from "@/lib/utils";
import { PLANET_GLYPHS } from "@/components/icons";

export const metadata = { title: "Live session" };

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ctx = await requireOnboarded();
  const { slug } = await params;
  const supabase = await createClient();

  const { data: guide } = await supabase
    .from("guides_public")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!guide) notFound();

  const { currency } = providerFor(ctx.profile.country_code);
  const rateLabel = formatMinor(
    currency === "INR" ? guide.rate_paise_per_min : guide.rate_cents_per_min,
    currency,
  );

  // resume messages from an active session with this guide, if any
  const admin = createAdminClient();
  const { data: activeSession } = await admin
    .from("chat_sessions")
    .select("id")
    .eq("user_id", ctx.userId)
    .eq("guide_id", guide.id)
    .eq("status", "active")
    .maybeSingle();

  let initialMessages: Array<{ id: string; role: "user" | "guide" | "system"; content: string }> = [];
  if (activeSession) {
    const { data: msgs } = await admin
      .from("chat_messages")
      .select("id, role, content")
      .eq("session_id", activeSession.id)
      .order("created_at")
      .limit(100);
    initialMessages = (msgs ?? []) as typeof initialMessages;
  }
  if (initialMessages.length === 0) {
    initialMessages = [
      {
        id: "welcome",
        role: "guide",
        content: `Welcome — I'm ${guide.name}. I can see your chart. What's on your mind today?`,
      },
    ];
  }

  const { sun, moon, rising } = ctx.chart!.bigThree;
  const chartChip = `${initials(ctx.profile.display_name)} · ${sun} ${PLANET_GLYPHS.Sun}${
    rising ? ` / ${rising} ${PLANET_GLYPHS.Rising}` : ""
  } / ${moon} ${PLANET_GLYPHS.Moon}`;

  return (
    <ChatClient
      guide={{
        id: guide.id,
        slug: guide.slug,
        name: guide.name,
        craft: guide.craft,
        rateLabel,
      }}
      initialMessages={initialMessages}
      chartChip={chartChip}
    />
  );
}
