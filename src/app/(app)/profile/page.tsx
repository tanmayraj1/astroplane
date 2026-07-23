import Link from "next/link";
import { DateTime } from "luxon";
import { requireOnboarded } from "@/server/services/context";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Eyebrow, Pill } from "@/components/ui";
import { Toggle, SignOutButton } from "@/components/profile/controls";
import { ArrowRightIcon, PLANET_GLYPHS, WalletIcon } from "@/components/icons";
import { initials, formatMinor } from "@/lib/utils";

export const metadata = { title: "Profile" };

const FOCUS_LABELS: Record<string, string> = {
  plan: "Plan my day",
  timing: "Timing big moves",
  tarot: "Tarot & reflection",
  relationships: "Relationships",
  career: "Career",
  rest: "Rest & health",
};

export default async function ProfilePage() {
  const ctx = await requireOnboarded();
  const supabase = await createClient();

  const [{ data: prefs }, { data: wallet }] = await Promise.all([
    supabase
      .from("notification_prefs")
      .select("*")
      .eq("user_id", ctx.userId)
      .maybeSingle(),
    supabase.from("wallets").select("balance, currency").eq("user_id", ctx.userId).maybeSingle(),
  ]);

  const birth = ctx.birth!;
  const { sun, moon, rising } = ctx.chart!.bigThree;
  const birthStr = `${DateTime.fromISO(birth.birth_date).toFormat("LLL d yyyy")} · ${
    birth.birth_time
      ? DateTime.fromISO(`2000-01-01T${birth.birth_time}`).toFormat("h:mm a").toLowerCase()
      : "time unknown"
  } · ${birth.birth_place.split(",")[0]}`;

  return (
    <div className="px-5 pt-[52px] sm:px-8 lg:px-9 lg:pt-8">
      <header className="rise">
        <Eyebrow>Profile</Eyebrow>
        <div className="mt-4 flex items-center gap-4">
          <Avatar label={initials(ctx.profile.display_name)} size={64} />
          <div>
            <h1 className="font-display text-[24px] font-bold text-ink">
              {ctx.profile.display_name ?? "You"}
            </h1>
            <p className="mt-0.5 text-[12.5px] text-muted">
              {PLANET_GLYPHS.Sun} {sun} · {PLANET_GLYPHS.Moon} {moon}
              {rising ? ` · ${PLANET_GLYPHS.Rising} ${rising}` : ""}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-6 flex max-w-[560px] flex-col gap-3.5 pb-14">
        {/* Plan / upgrade */}
        {ctx.profile.plan === "free" ? (
          <Link
            href="/paywall"
            className="rise d2 pressable-soft flex items-center justify-between gap-4 rounded-[20px] p-5 text-cta-text shadow-[var(--shadow-ember)]"
            style={{ background: "var(--grad-ember)" }}
          >
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[1.5px] opacity-80">
                Free plan
              </span>
              <span className="mt-0.5 block font-display text-[16px] font-bold">
                Unlock full chart depth &amp; patterns
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-[rgba(255,247,234,.2)] px-4 py-2 text-[12.5px] font-bold">
              Upgrade
            </span>
          </Link>
        ) : (
          <Link
            href="/billing"
            className="rise d2 pressable-soft flex items-center justify-between rounded-[20px] bg-ink p-5 text-cream"
          >
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[1.5px] text-gold-bright">
                {ctx.profile.plan} plan
              </span>
              <span className="mt-0.5 block font-display text-[16px] font-bold">
                Manage subscription
              </span>
            </span>
            <ArrowRightIcon size={15} className="text-gold-bright" />
          </Link>
        )}

        {/* Wallet */}
        <Link
          href="/wallet"
          className="rise d3 pressable-soft flex items-center gap-4 rounded-[18px] border border-line bg-surface p-4.5 p-5"
        >
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[rgba(176,137,71,.14)] text-gold-dark">
            <WalletIcon size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-[13.5px] font-bold text-ink">Wallet</span>
            <span className="block text-[11.5px] text-muted">
              {wallet
                ? `${formatMinor(wallet.balance, wallet.currency)} for guide sessions`
                : "Top up for guide sessions"}
            </span>
          </span>
          <ArrowRightIcon size={14} className="text-faint" />
        </Link>

        {/* Settings rows */}
        <div className="rise d4 divide-y divide-line-soft rounded-[20px] border border-line bg-surface">
          <div className="flex items-center gap-4 p-4.5 p-5">
            <span className="flex-1">
              <span className="block text-[13.5px] font-bold text-ink">
                Cosmic notifications
              </span>
              <span className="block text-[11.5px] text-muted">
                Windows, wind-down &amp; new-moon prompts
              </span>
            </span>
            <Toggle prefKey="daily_card_push" initial={prefs?.daily_card_push ?? true} />
          </div>
          <div className="flex items-center gap-4 p-5">
            <span className="flex-1">
              <span className="block text-[13.5px] font-bold text-ink">
                Void-of-course alerts
              </span>
              <span className="block text-[11.5px] text-muted">
                A heads-up before the Moon goes quiet
              </span>
            </span>
            <Toggle prefKey="voc_alerts" initial={prefs?.voc_alerts ?? true} />
          </div>
          <Link
            href="/onboarding/birth"
            className="flex items-center gap-4 p-5"
          >
            <span className="flex-1">
              <span className="block text-[13.5px] font-bold text-ink">Birth details</span>
              <span className="block text-[11.5px] text-muted">{birthStr}</span>
            </span>
            <ArrowRightIcon size={14} className="text-faint" />
          </Link>
          <Link href="/onboarding/focus" className="flex items-center gap-4 p-5">
            <span className="flex-1">
              <span className="block text-[13.5px] font-bold text-ink">Focus areas</span>
              <span className="mt-1 flex flex-wrap gap-1.5">
                {ctx.profile.focus_areas.length > 0 ? (
                  ctx.profile.focus_areas.map((f) => (
                    <Pill key={f} className="!px-2.5 !py-1 !text-[10px]">
                      {FOCUS_LABELS[f] ?? f}
                    </Pill>
                  ))
                ) : (
                  <span className="text-[11.5px] text-muted">Not set</span>
                )}
              </span>
            </span>
            <ArrowRightIcon size={14} className="text-faint" />
          </Link>
          <div className="p-5">
            <span className="block text-[13.5px] font-bold text-ink">Privacy &amp; data</span>
            <span className="block text-[11.5px] leading-relaxed text-muted">
              Your logs never train anyone else&apos;s card. Journals are never
              read by AI without your explicit action.
            </span>
          </div>
        </div>

        <div className="rise d5 mt-2 px-2">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
