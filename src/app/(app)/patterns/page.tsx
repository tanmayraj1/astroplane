import Link from "next/link";
import { requireOnboarded } from "@/server/services/context";
import { computePatterns } from "@/server/services/patterns";
import { Eyebrow } from "@/components/ui";
import { SparkleIcon, LockIcon, ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export const metadata = { title: "Your patterns" };

export default async function PatternsPage() {
  const ctx = await requireOnboarded();
  const data = await computePatterns(ctx);
  const isFree = ctx.profile.plan === "free";

  return (
    <div className="px-5 pt-[52px] sm:px-8 lg:px-9 lg:pt-8">
      <header className="rise">
        <Eyebrow>Your patterns</Eyebrow>
        <h1 className="mt-1.5 font-display text-[28px] font-bold text-ink lg:text-[34px]">
          What your logs actually say
        </h1>
        <p className="mt-1 text-[12.5px] text-muted">
          Built only from your own check-ins — correlation, never fate.
        </p>
      </header>

      <div className="mt-6 grid max-w-[820px] gap-4 pb-14 lg:grid-cols-2">
        {/* Streak card */}
        <section className="rise d2 rounded-[24px] bg-ink p-6 text-cream shadow-[var(--shadow-ink)] lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <Eyebrow onDark>Check-in streak</Eyebrow>
              <div className="mt-1 font-display text-[30px] font-bold">
                {data.streak} {data.streak === 1 ? "day" : "days"}
              </div>
            </div>
            <div className="flex items-end gap-1.5">
              {data.heat.map((on, i) => (
                <span
                  key={i}
                  className="w-[18px] rounded-[6px]"
                  style={{
                    height: 12 + i * 5,
                    background: on
                      ? `rgba(201,161,94,${0.55 + i * 0.06})`
                      : "rgba(252,248,240,.08)",
                    animation: `barGrow .5s cubic-bezier(.22,1.18,.36,1) ${i * 0.06}s both`,
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-[rgba(232,220,196,.7)]">
            <SparkleIcon size={11} className="text-gold-bright" />
            Every check-in sharpens tomorrow&apos;s card. +10 karma each.
          </p>
        </section>

        {/* Insights */}
        {data.insights.map((ins, i) => (
          <section
            key={i}
            className={`rise d${i + 3} flex items-start gap-5 rounded-[24px] border border-line bg-surface p-6`}
          >
            <div className="flex h-[72px] items-end gap-2 pt-1">
              <span
                className="w-[16px] rounded-t-[4px] bg-gold-pale"
                style={{
                  height: `${Math.max(ins.barA * 68, 8)}px`,
                  animation: "barGrow .6s cubic-bezier(.22,1.18,.36,1) .2s both",
                  transformOrigin: "bottom",
                }}
              />
              <span
                className="w-[16px] rounded-t-[4px] bg-gold"
                style={{
                  height: `${Math.max(ins.barB * 68, 8)}px`,
                  animation: "barGrow .6s cubic-bezier(.22,1.18,.36,1) .3s both",
                  transformOrigin: "bottom",
                }}
              />
            </div>
            <div>
              <div className="font-display text-[26px] font-bold text-ink">
                {ins.stat}
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-body">{ins.text}</p>
              <p className="mt-1.5 text-[10px] font-semibold text-faint">
                n = {ins.n} · from your logs only
              </p>
            </div>
          </section>
        ))}

        {data.insights.length === 0 && (
          <section className="rise d3 rounded-[24px] border border-line bg-surface p-7 lg:col-span-2">
            <p className="text-[13.5px] font-semibold text-ink">
              Your patterns are still forming.
            </p>
            <p className="mt-1.5 max-w-[480px] text-[12.5px] leading-relaxed text-muted">
              Insights appear only once your own logged data reaches statistical
              signal — usually after about two weeks of evening check-ins and a
              handful of sky-timed tasks. Nothing here is ever invented.
            </p>
            <p className="mt-3 text-[12px] font-bold text-gold-dark">
              {data.totalCheckins} check-in{data.totalCheckins === 1 ? "" : "s"} logged so far
            </p>
          </section>
        )}

        {/* Plus upsell */}
        {isFree && (
          <Link
            href="/paywall"
            className="rise d5 pressable-soft flex items-center gap-4 rounded-[20px] bg-ink p-5 text-cream shadow-[var(--shadow-ink)] lg:col-span-2"
          >
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[rgba(201,161,94,.4)] text-gold-bright">
              <LockIcon size={17} />
            </span>
            <span className="flex-1">
              <span className="block font-display text-[15px] font-bold">
                Mood × transit heatmaps
              </span>
              <span className="block text-[11px] text-[rgba(232,220,196,.7)]">
                Deep patterns and CSV export ship with Plus.
              </span>
            </span>
            <ArrowRightIcon size={15} className="text-gold-bright" />
          </Link>
        )}

        <p
          className={cn(
            "text-[10.5px] leading-relaxed text-faint lg:col-span-2",
            "rise d6",
          )}
        >
          Shown only when your own logged data reaches statistical signal —
          correlation, never fate. Your logs never train anyone else&apos;s card.
        </p>
      </div>
    </div>
  );
}
