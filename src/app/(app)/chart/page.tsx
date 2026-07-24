import Link from "next/link";
import { DateTime } from "luxon";
import { requireOnboarded } from "@/server/services/context";
import { getDailySky, todayFor } from "@/server/services/daily";
import { Eyebrow } from "@/components/ui";
import { NatalWheel } from "@/components/astro/natal-wheel";
import { placementNote, transitNote } from "@/lib/astro/notes";
import { LockIcon, PLANET_GLYPHS, ASPECT_GLYPHS, ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export const metadata = { title: "Chart" };

const ordinal = (n: number) =>
  `${n}${["th", "st", "nd", "rd"][n % 10 > 3 || (n % 100 >= 11 && n % 100 <= 13) ? 0 : n % 10]}`;

export default async function ChartPage() {
  const ctx = await requireOnboarded();
  const chart = ctx.chart!;
  const birth = ctx.birth!;
  const isFree = ctx.profile.plan === "free";

  const sky = await getDailySky(todayFor(ctx), ctx);
  const transits = sky.transitsToNatal.slice(0, isFree ? 3 : 6);

  const birthDt = DateTime.fromISO(birth.birth_date);
  const timeStr = birth.birth_time
    ? DateTime.fromISO(`2000-01-01T${birth.birth_time}`).toFormat("h:mm a").toLowerCase()
    : "time unknown";

  // Free tier: personal planets; Plus/Pro: everything
  const visible = isFree
    ? chart.bodies.filter((b) =>
        ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter"].includes(b.body),
      )
    : chart.bodies;

  return (
    <div className="px-5 pt-[52px] sm:px-8 lg:px-9 lg:pt-8">
      <header className="rise">
        <Eyebrow>
          Natal chart · {chart.houseSystem === "whole-sign" ? "Whole sign" : "Solar whole sign"}
        </Eyebrow>
        <h1 className="mt-1.5 font-display text-[28px] font-bold text-ink lg:text-[34px]">
          Your sky, {birthDt.toFormat("LLLL d yyyy")}
        </h1>
        <p className="mt-1 text-[12.5px] text-muted">
          {timeStr} · {birth.birth_place}
        </p>
      </header>

      <div className="mt-7 grid gap-[26px] pb-14 lg:grid-cols-[1fr_1.1fr]">
        {/* Wheel */}
        <div className="rise d2">
          <div className="rounded-[24px] border border-line bg-surface p-5 lg:p-8">
            <div className="hidden lg:block">
              <NatalWheel chart={chart} size={400} />
            </div>
            <div className="lg:hidden">
              <NatalWheel chart={chart} size={280} />
            </div>
            {!chart.timeKnown && (
              <p className="mt-4 text-center text-[11px] leading-relaxed text-faint">
                Cast without a birth time — solar chart, no ascendant. Add your
                birth time in{" "}
                <Link href="/profile" className="font-bold text-gold-dark">
                  your profile
                </Link>{" "}
                to unlock houses and rising.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-[18px]">
          {/* Placements */}
          <section className="rise d3">
            <Eyebrow className="mb-3">Placements</Eyebrow>
            <div className="flex flex-col gap-2">
              {(chart.ascendant ? [chart.ascendant, ...visible] : visible).map(
                (b, i) => (
                  <div
                    key={b.body}
                    className={cn(
                      `rise d${Math.min(i + 3, 12)}`,
                      "flex items-center gap-3.5 rounded-[14px] border border-line bg-surface px-4 py-3",
                    )}
                  >
                    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[rgba(176,137,71,.14)] text-[15px] text-gold-dark">
                      {b.body === "Ascendant"
                        ? PLANET_GLYPHS.Rising
                        : PLANET_GLYPHS[b.body] ?? "•"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-bold text-ink">
                        {b.body === "Ascendant" ? "Rising" : b.body} in {b.sign}
                        {b.retrograde && (
                          <span className="ml-1.5 text-[10px] font-bold text-clay">Rx</span>
                        )}
                        {b.house && b.body !== "Ascendant" && (
                          <span className="font-medium text-muted">
                            {" "}
                            · {ordinal(b.house)} house
                          </span>
                        )}
                      </span>
                      <span className="block font-accent text-[13.5px] italic text-muted">
                        {b.body === "Ascendant"
                          ? "how you arrive"
                          : placementNote(b)}
                      </span>
                    </span>
                    <span className="tnum shrink-0 text-[11px] font-bold text-faint">
                      {Math.floor(b.degree)}°
                      {String(Math.round((b.degree % 1) * 60)).padStart(2, "0")}′
                    </span>
                  </div>
                ),
              )}
            </div>
            {isFree && (
              <p className="mt-2.5 text-[11px] text-faint">
                Outer planets ({PLANET_GLYPHS.Saturn} {PLANET_GLYPHS.Uranus}{" "}
                {PLANET_GLYPHS.Neptune} {PLANET_GLYPHS.Pluto}) and all aspects ship
                with Plus.
              </p>
            )}
          </section>

          {/* Today's transits */}
          <section className="rise d5">
            <Eyebrow className="mb-3">Today&apos;s transits</Eyebrow>
            <div className="flex flex-col gap-2">
              {transits.length === 0 && (
                <div className="rounded-[14px] border border-line bg-surface px-4 py-3 text-[12.5px] text-muted">
                  A quiet sky — no tight transits to your chart today.
                </div>
              )}
              {transits.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 rounded-[14px] border border-line bg-surface px-4 py-3"
                >
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[rgba(176,137,71,.14)] text-[13px] font-bold text-gold-dark">
                    {ASPECT_GLYPHS[t.type]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-ink">
                      {t.transiting} {ASPECT_GLYPHS[t.type]}{" "}
                      {t.natal === "Ascendant" ? "Rising" : t.natal}
                      <span className="ml-1.5 text-[10px] font-semibold text-faint">
                        {t.orb.toFixed(1)}° {t.applying ? "applying" : "separating"}
                      </span>
                    </span>
                    <span className="block font-accent text-[13px] italic text-muted">
                      {transitNote(t)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Year-ahead upsell */}
          {isFree && (
            <Link
              href="/paywall"
              className="rise d6 pressable-soft flex items-center gap-4 rounded-[16px] bg-ink p-4.5 p-5 text-cream shadow-[var(--shadow-ink)]"
            >
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[rgba(201,161,94,.4)] text-gold-bright">
                <LockIcon size={17} />
              </span>
              <span className="flex-1">
                <span className="block font-display text-[15px] font-bold">
                  Year-ahead forecast
                </span>
                <span className="block text-[11px] text-[rgba(232,220,196,.7)]">
                  Full timeline in Plus
                </span>
              </span>
              <ArrowRightIcon size={15} className="text-gold-bright" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
