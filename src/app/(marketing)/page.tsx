import Link from "next/link";
import { Starfield, MoonDial } from "@/components/motion";
import { ArrowRightIcon, SparkleIcon, MoonIcon } from "@/components/icons";

export default function LandingPage() {
  return (
    <>
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden">
        <Starfield />
        <div className="relative mx-auto grid w-full max-w-[1280px] gap-12 px-5 pb-12 pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-10 lg:pb-16 lg:pt-[64px]">
          {/* Copy */}
          <div className="flex flex-col items-start justify-center">
            <div className="rise text-[11.5px] font-bold uppercase tracking-[5px] text-gold">
              The daily planner that knows your sky
            </div>
            <h1 className="rise d1 mt-4 font-display text-[42px] font-extrabold leading-[1.12] text-ink sm:text-[52px] lg:text-[58px]">
              Your day,{" "}
              <span className="font-accent font-semibold italic text-clay">
                already written
              </span>{" "}
              in the stars
            </h1>
            <p className="rise d2 mt-5 max-w-[460px] text-[15px] leading-relaxed text-body">
              Wake windows, power hours, tarot and gentle nudges — cast fresh
              from your birth chart every morning. A planner you open daily, not
              a horoscope you check when you&apos;re anxious.
            </p>
            <Link
              href="/sign-up"
              className="rise d3 pressable mt-7 inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-[15px] font-bold text-cta-text shadow-[var(--shadow-ember-lg)] shimmer-bg"
            >
              Cast your chart free <ArrowRightIcon size={16} />
            </Link>
            <p className="rise d4 mt-3.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-faint">
              <SparkleIcon size={10} className="text-gold" />
              Guided by AI Planner — trained by our astrologers
            </p>

            {/* Stats */}
            <div className="rise d5 mt-10 flex items-center gap-6">
              {[
                { v: "Real", l: "ephemeris math" },
                { v: "1 min", l: "to cast your chart" },
                { v: "6", l: "vetted guides" },
              ].map((s, i) => (
                <div key={s.l} className="flex items-center gap-6">
                  {i > 0 && <span className="h-[34px] w-px bg-gold-pale" />}
                  <div>
                    <div className="font-display text-[22px] font-bold text-ink">
                      {s.v}
                    </div>
                    <div className="text-[10.5px] font-semibold text-muted">{s.l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating phone visual */}
          <div className="relative mx-auto hidden min-h-[480px] w-full max-w-[420px] items-center justify-center sm:flex">
            <div
              className="floaty absolute left-[6%] top-[14%] h-[360px] w-[240px] rounded-[34px] bg-deco-card opacity-80"
              style={{ "--r": "-9deg", background: "var(--deco-card)" } as React.CSSProperties}
            />
            <div
              className="floaty relative h-[400px] w-[260px] rounded-[34px] bg-ink p-6 text-cream shadow-[var(--shadow-float)]"
              style={{ "--r": "5deg", animationDelay: ".6s" } as React.CSSProperties}
            >
              <div className="text-[9px] font-bold uppercase tracking-[2.5px] text-gold-bright">
                New Moon in Leo
              </div>
              <p className="mt-2 font-display text-[17px] font-bold leading-snug">
                A clean page — set one intention before noon.
              </p>
              <div className="mt-5 flex justify-center">
                <MoonDial size={110} />
              </div>
              <div className="mt-6 rounded-[14px] bg-[rgba(252,248,240,.07)] p-3 text-[10.5px] leading-snug text-[rgba(232,220,196,.85)]">
                ✦ Power window 10:24 – 12:01 — start things, ask, send.
              </div>
              <div className="mt-2.5 flex items-center gap-2 rounded-[14px] bg-[rgba(252,248,240,.07)] p-3 text-[10.5px] leading-snug text-[rgba(232,220,196,.85)]">
                <MoonIcon size={13} className="shrink-0 text-gold-bright" />
                Wind-down 10:30 pm — the moon runs void overnight.
              </div>
            </div>
            <Link
              href="/guides"
              className="floaty absolute -bottom-1 right-0 flex items-center gap-2.5 rounded-full border border-line bg-surface py-2.5 pl-3 pr-4 text-[12px] font-bold text-ink shadow-[0_18px_38px_rgba(64,52,30,.22)]"
              style={{ "--r": "0deg", animationDelay: "1.2s" } as React.CSSProperties}
            >
              <span className="breathe flex h-[26px] w-[26px] items-center justify-center rounded-full bg-ink text-[12px] text-gold-bright">
                ✦
              </span>
              Need a human read?{" "}
              <span className="font-semibold text-gold-dark">First session cheap →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section id="how" className="mx-auto w-full max-w-[1280px] px-5 pb-20 lg:px-10">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "A planner, not a feed",
              body: "Tasks auto-timed into your power windows, friction hours flagged before you book the hard conversation. The sky becomes a scheduling assistant.",
            },
            {
              title: "Tarot that remembers",
              body: "Daily pulls are journaled automatically. When a card keeps returning, we surface the season's theme — your deck becomes a diary.",
            },
            {
              title: "Humans on demand",
              body: "Astrologers, tarot readers and healers — clearly credentialed, billed per minute from a wallet you control. AI personas today, human practitioners next.",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className={`rise d${i + 2} liftable rounded-[22px] border border-line bg-surface p-6`}
            >
              <SparkleIcon size={16} className="text-gold" />
              <h3 className="mt-3 font-display text-[19px] font-bold text-ink">
                {f.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-body">{f.body}</p>
            </div>
          ))}
        </div>

        {/* Guides strip */}
        <div id="guides" className="mt-16 rounded-[28px] bg-ink p-8 text-cream lg:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="eyebrow !text-gold-bright">Guides</div>
              <h2 className="mt-2 font-display text-[28px] font-bold leading-tight lg:text-[34px]">
                A human, when you want one.
              </h2>
              <p className="mt-3 max-w-[480px] text-[13.5px] leading-relaxed text-[rgba(232,220,196,.8)]">
                Evolutionary astrology, Vedic muhurat timing, shadow-work tarot,
                breathwork — every guide reads your actual chart, not your sun
                sign. Sessions bill per minute, and the meter is always visible.
              </p>
              <Link
                href="/sign-up"
                className="pressable mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(201,161,94,.5)] px-6 py-3 text-[13px] font-bold text-gold-bright"
              >
                Meet the guides <ArrowRightIcon size={14} />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {[
                ["Selene Marsh", "Evolutionary astrology", "$4/min · ★4.9"],
                ["Priya Anand", "Vedic astrology · muhurat", "$5/min · ★5.0"],
                ["Ines Calloway", "Tarot · shadow work", "$3/min · ★4.8"],
              ].map(([name, craft, meta]) => (
                <div
                  key={name}
                  className="flex items-center gap-3.5 rounded-[18px] border border-[rgba(201,161,94,.3)] bg-[rgba(252,248,240,.05)] p-4"
                >
                  <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[rgba(201,161,94,.2)] font-display text-[15px] font-bold text-gold-bright">
                    {name.split(" ").map((w) => w[0]).join("")}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[14px] font-bold">{name}</span>
                    <span className="block text-[11px] text-[rgba(232,220,196,.65)]">
                      {craft}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-gold-bright">{meta}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <h2 className="font-display text-[28px] font-bold text-ink lg:text-[34px]">
            The sky already has a plan for you.
          </h2>
          <Link
            href="/sign-up"
            className="pressable mt-6 inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-[15px] font-bold text-cta-text shadow-[var(--shadow-ember-lg)] shimmer-bg"
          >
            Cast your chart free <ArrowRightIcon size={16} />
          </Link>
          <p className="mt-3 text-[11px] text-faint">
            Free forever tier · no card needed · 1 minute to your Big Three
          </p>
        </div>
      </section>
    </>
  );
}
