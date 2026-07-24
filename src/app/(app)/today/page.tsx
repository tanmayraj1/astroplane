import Link from "next/link";
import { DateTime } from "luxon";
import { requireOnboarded } from "@/server/services/context";
import { getDailySky, getOrCreateDailyCard, todayFor } from "@/server/services/daily";
import { createClient } from "@/lib/supabase/server";
import { AiDisclosure, Eyebrow, Pill } from "@/components/ui";
import { MoonDial, OrbitRing } from "@/components/motion";
import { NudgeList } from "@/components/today/nudges";
import { MoodCheckin } from "@/components/today/mood";
import { ArrowRightIcon, SparkleIcon, PLANET_GLYPHS, SIGN_GLYPHS } from "@/components/icons";
import { windowReasonNotes } from "@/lib/astro/notes";

export const metadata = { title: "Today" };

function fmtW(iso: string, tz: string) {
  return DateTime.fromISO(iso, { zone: "utc" })
    .setZone(tz)
    .toFormat("h:mma")
    .toLowerCase()
    .replace(":00", "");
}

export default async function TodayPage() {
  const ctx = await requireOnboarded();
  const tz = ctx.profile.timezone;
  const date = todayFor(ctx);
  const sky = await getDailySky(date, ctx);
  const card = await getOrCreateDailyCard(ctx, date, sky);

  const supabase = await createClient();
  const { data: moodRow } = await supabase
    .from("mood_checkins")
    .select("mood")
    .eq("user_id", ctx.userId)
    .eq("date", date)
    .eq("slot", "evening")
    .maybeSingle();

  const dt = DateTime.fromISO(date, { zone: tz });
  const eyebrowDate = dt.toFormat("cccc · LLLL d").toUpperCase();
  const firstName = (ctx.profile.display_name ?? "there").split(" ")[0];
  const power = card.windows.find((w) => w.kind === "power");
  const friction = card.windows.find((w) => w.kind === "friction");
  const { sun, moon, rising } = ctx.chart!.bigThree;

  return (
    <div className="px-5 pt-[52px] sm:px-8 lg:px-9 lg:pt-8">
      {/* Header */}
      <header className="rise flex items-start justify-between gap-4">
        <div>
          <Eyebrow>
            {eyebrowDate} · {sky.moon.phaseName.toUpperCase()} IN {sky.moon.sign.toUpperCase()}
          </Eyebrow>
          <h1 className="mt-1.5 font-display text-[30px] font-bold text-ink lg:text-[34px]">
            Hello,{" "}
            <span className="font-accent italic text-clay">{firstName}</span>
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 pt-1">
          <Pill className="whitespace-nowrap">
            <SparkleIcon size={10} className="text-gold" /> {ctx.karma} karma
            {ctx.streak.current > 0 && ` · ${ctx.streak.current}-day streak`}
          </Pill>
        </div>
      </header>

      {/* Big three pills (mobile) */}
      <div className="rise d1 mt-3 flex gap-2 lg:hidden">
        <Pill>{PLANET_GLYPHS.Sun} {sun}</Pill>
        <Pill>{PLANET_GLYPHS.Moon} {moon}</Pill>
        {rising && <Pill>{PLANET_GLYPHS.Rising} {rising}</Pill>}
      </div>

      <div className="mt-6 grid gap-[18px] pb-12 lg:grid-cols-[1.55fr_1fr]">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-[18px]">
          {/* Hero ink card */}
          <section className="rise d2 relative overflow-hidden rounded-[26px] bg-ink p-6 text-cream shadow-[var(--shadow-ink-lg)]">
            <OrbitRing size={220} duration={110} className="-right-16 -top-16 opacity-50" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <Eyebrow onDark>Today&apos;s card</Eyebrow>
                <MoonDial size={64} className="-mt-1 shrink-0" />
              </div>
              <h2 className="mt-2 max-w-[420px] font-display text-[22px] font-bold leading-snug lg:text-[23px]">
                {card.headline}
              </h2>
              <p className="mt-3 max-w-[460px] text-[13px] leading-relaxed text-[rgba(232,220,196,.8)]">
                {card.body}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[rgba(201,161,94,.25)] pt-4">
                <AiDisclosure onDark />
                <Link
                  href="/planner"
                  className="flex shrink-0 items-center gap-1 text-[11.5px] font-bold text-gold-bright"
                >
                  Week ahead <ArrowRightIcon size={12} />
                </Link>
              </div>
            </div>
          </section>

          {/* Windows */}
          <section className="rise d3 grid gap-3 sm:grid-cols-2">
            {power ? (
              <div className="rounded-[20px] border border-[rgba(176,137,71,.3)] bg-[rgba(176,137,71,.14)] p-4.5 p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[2px] text-gold-dark">
                  Power window
                </div>
                <div className="tnum mt-1 font-display text-[19px] font-bold text-ink">
                  {fmtW(power.startUtc, tz)} – {fmtW(power.endUtc, tz)}
                </div>
                <p className="mt-1 text-[11.5px] font-semibold text-gold-dark">
                  {card.power_blurb ?? "Start things. Ask. Send."}
                </p>
                {windowReasonNotes(power.reasons).length > 0 && (
                  <p className="mt-2 border-t border-[rgba(176,137,71,.22)] pt-2 text-[10.5px] leading-relaxed text-gold-dusty">
                    {windowReasonNotes(power.reasons).join(" · ")}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-[20px] border border-line bg-surface p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[2px] text-gold">
                  Power window
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  A quiet sky today — no strong window. Tend what already exists.
                </p>
              </div>
            )}
            {friction && (
              <div className="rounded-[20px] border border-[rgba(192,90,59,.3)] bg-[rgba(192,90,59,.12)] p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[2px] text-clay">
                  Friction window
                </div>
                <div className="tnum mt-1 font-display text-[19px] font-bold text-ink">
                  {fmtW(friction.startUtc, tz)} – {fmtW(friction.endUtc, tz)}
                </div>
                <p className="mt-1 text-[11.5px] font-semibold text-clay">
                  {card.friction_blurb ?? "Hold signatures and launches."}
                </p>
                {windowReasonNotes(friction.reasons).length > 0 && (
                  <p className="mt-2 border-t border-[rgba(192,90,59,.2)] pt-2 text-[10.5px] leading-relaxed text-clay/80">
                    {windowReasonNotes(friction.reasons).join(" · ")}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Void-of-course alert */}
          {sky.moon.voidOfCourse && (
            <section className="rise d4 flex items-center gap-3 rounded-[16px] border border-line-soft bg-surface-alt px-4 py-3">
              <span className="text-[15px] text-gold">☽</span>
              <p className="text-[11.5px] leading-relaxed text-body">
                <span className="font-bold text-ink">Moon void of course</span>{" "}
                {fmtW(sky.moon.voidOfCourse.startUtc, tz)} –{" "}
                {fmtW(sky.moon.voidOfCourse.endUtc, tz)} — drift, don&apos;t
                launch. She enters {SIGN_GLYPHS[sky.moon.voidOfCourse.ingressSign]}{" "}
                {sky.moon.voidOfCourse.ingressSign} after.
              </p>
            </section>
          )}

          {/* Nudges */}
          <section className="rise d4">
            <Eyebrow className="mb-3">Nudges</Eyebrow>
            <NudgeList nudges={card.nudges} date={date} />
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-[18px]">
          <section className="rise d3 grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-line bg-surface p-4">
              <div className="text-[9.5px] font-bold uppercase tracking-[2px] text-gold">
                Wake
              </div>
              <div className="tnum mt-1.5 font-display text-[17px] font-bold text-ink">
                {card.wake ? `${card.wake.start}–${card.wake.end}` : "—"}
              </div>
              <div className="mt-0.5 text-[10.5px] text-muted">your window</div>
            </div>
            <div className="rounded-[18px] border border-line bg-surface p-4">
              <div className="text-[9.5px] font-bold uppercase tracking-[2px] text-gold">
                Wind-down
              </div>
              <div className="tnum mt-1.5 font-display text-[17px] font-bold text-ink">
                {card.windDown ?? "—"}
              </div>
              <div className="mt-0.5 text-[10.5px] text-muted">screens off</div>
            </div>
            <div className="col-span-2 rounded-[18px] border border-line bg-surface p-4">
              <div className="text-[9.5px] font-bold uppercase tracking-[2px] text-gold">
                Color of the day
              </div>
              <div className="mt-1.5 flex items-center gap-2.5">
                <span
                  className="breathe h-[26px] w-[26px] rounded-full"
                  style={{ background: card.color.css }}
                />
                <div>
                  <div className="font-display text-[17px] font-bold text-ink">
                    {card.color.name}
                  </div>
                  <div className="text-[10.5px] text-muted">{card.color_blurb}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Tarot teaser */}
          <Link
            href="/tarot"
            className="rise d5 pressable-soft relative overflow-hidden rounded-[20px] bg-ink p-5 text-cream shadow-[var(--shadow-ink)]"
          >
            <OrbitRing size={140} duration={90} reverse className="-right-10 -bottom-10 opacity-50" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <div className="font-display text-[17px] font-bold">
                  Your card is waiting
                </div>
                <p className="mt-1 text-[11.5px] text-[rgba(232,220,196,.7)]">
                  One pull for {dt.toFormat("LLLL d")} — shuffled to your chart.
                </p>
              </div>
              <span className="flex items-center gap-1 text-[12px] font-bold text-gold-bright">
                Reveal it <ArrowRightIcon size={13} />
              </span>
            </div>
          </Link>

          {/* Evening check-in */}
          <section className="rise d6 rounded-[20px] border border-line bg-surface p-5">
            <Eyebrow className="mb-4">Evening check-in</Eyebrow>
            <MoodCheckin initialMood={moodRow?.mood ?? null} />
          </section>
        </div>
      </div>
    </div>
  );
}
