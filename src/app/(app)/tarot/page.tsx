import Link from "next/link";
import { DateTime } from "luxon";
import { requireOnboarded } from "@/server/services/context";
import { todayFor } from "@/server/services/daily";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow, Pill } from "@/components/ui";
import { DailyPull } from "@/components/tarot/flip-card";
import { ArrowRightIcon, LockIcon } from "@/components/icons";

export const metadata = { title: "Tarot" };

const SPREADS = [
  { key: "new_moon", name: "New Moon", detail: "3 cards · 5 min" },
  { key: "relationship", name: "Relationship", detail: "5 cards · 12 min" },
  { key: "career", name: "Career", detail: "5 cards · 12 min" },
];

export default async function TarotPage() {
  const ctx = await requireOnboarded();
  const date = todayFor(ctx);
  const supabase = await createClient();

  const [{ data: pull }, { count: journalCount }] = await Promise.all([
    supabase
      .from("tarot_pulls")
      .select("card_key, reversed, interpretation")
      .eq("user_id", ctx.userId)
      .eq("date", date)
      .eq("spread", "daily")
      .eq("position", 0)
      .maybeSingle(),
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.userId),
  ]);

  const dt = DateTime.fromISO(date, { zone: ctx.profile.timezone });
  const isFree = ctx.profile.plan === "free";

  return (
    <div className="px-5 pt-[52px] sm:px-8 lg:px-9 lg:pt-8">
      <header className="rise flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Daily pull</Eyebrow>
          <h1 className="mt-1.5 font-display text-[28px] font-bold text-ink lg:text-[34px]">
            One card for {dt.toFormat("LLLL d")}
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">
            The deck is shuffled to your chart.
          </p>
        </div>
        <Link href="/tarot/journal" className="pressable shrink-0">
          <Pill>Journal · {journalCount ?? 0}</Pill>
        </Link>
      </header>

      <div className="mt-8 pb-14">
        <div className="rise d2">
          <DailyPull
            initial={
              pull
                ? {
                    cardKey: pull.card_key,
                    reversed: pull.reversed,
                    interpretation:
                      (pull.interpretation as { text?: string } | null)?.text ?? null,
                  }
                : null
            }
            sunSign={ctx.chart?.bigThree.sun ?? null}
          />
        </div>

        {/* Guided spreads */}
        <section className="rise d4 mt-10">
          <Eyebrow className="mb-3">Guided spreads</Eyebrow>
          <div className="grid gap-3 sm:grid-cols-3">
            {SPREADS.map((s) => (
              <Link
                key={s.key}
                href={isFree ? "/paywall" : `/tarot?spread=${s.key}`}
                className="pressable-soft liftable flex items-center justify-between gap-3 rounded-[18px] border border-line bg-surface p-4"
              >
                <span>
                  <span className="block text-[14px] font-bold text-ink">{s.name}</span>
                  <span className="block text-[11px] text-muted">{s.detail}</span>
                </span>
                {isFree ? (
                  <LockIcon size={15} className="text-faint" />
                ) : (
                  <ArrowRightIcon size={14} className="text-gold-dark" />
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Human read upsell */}
        <Link
          href="/guides?filter=tarot"
          className="rise d5 pressable-soft mt-6 flex items-center justify-between gap-4 rounded-[20px] bg-ink p-5 text-cream shadow-[var(--shadow-ink)]"
        >
          <span>
            <span className="block font-display text-[16px] font-bold">
              Want a human read on this card?
            </span>
            <span className="mt-0.5 block text-[11.5px] text-[rgba(232,220,196,.7)]">
              Live tarot readers from $3/min — clearly credentialed.
            </span>
          </span>
          <ArrowRightIcon size={16} className="shrink-0 text-gold-bright" />
        </Link>
      </div>
    </div>
  );
}
