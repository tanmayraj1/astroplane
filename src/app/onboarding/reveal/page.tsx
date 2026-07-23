import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Starfield, TripleOrbit } from "@/components/motion";
import { ButtonLink } from "@/components/ui";
import { PLANET_GLYPHS } from "@/components/icons";
import type { NatalChart, Sign } from "@/lib/astro";

export const metadata = { title: "Your chart is cast" };

const SIGN_LINES: Record<string, { sun: string; moon: string; rising: string }> = {
  Aries: {
    sun: "The initiator's fire — you run on beginnings.",
    moon: "Feelings arrive fast and burn clean.",
    rising: "You arrive already in motion.",
  },
  Taurus: {
    sun: "Steady gravity — you build what lasts.",
    moon: "Comfort is your compass — slow and certain.",
    rising: "You arrive unhurried, and the room settles.",
  },
  Gemini: {
    sun: "A mind with wings — you run on questions.",
    moon: "You feel through words — naming it calms it.",
    rising: "You arrive mid-sentence, already curious.",
  },
  Cancer: {
    sun: "The keeper's heart — you run on belonging.",
    moon: "Tidal feelings — your energy moves with the water.",
    rising: "You arrive softly, reading the room first.",
  },
  Leo: {
    sun: "The performer's heart — you run on being seen.",
    moon: "Your feelings want an audience of one who matters.",
    rising: "You arrive like sunrise — impossible to miss.",
  },
  Virgo: {
    sun: "The craftsman's eye — you run on making it better.",
    moon: "Order soothes you — tending is your love language.",
    rising: "You arrive observant, already helping.",
  },
  Libra: {
    sun: "The harmonizer — you run on balance and beauty.",
    moon: "Peace is a need, not a preference.",
    rising: "You arrive graceful, weighing the air.",
  },
  Scorpio: {
    sun: "Quiet, total drive — you run on depth.",
    moon: "You feel everything, and show almost nothing.",
    rising: "You arrive with gravity — people feel it.",
  },
  Sagittarius: {
    sun: "The explorer's flame — you run on horizons.",
    moon: "Freedom is how your heart breathes.",
    rising: "You arrive like an arrow — aimed, already moving.",
  },
  Capricorn: {
    sun: "The builder's spine — you run on the long game.",
    moon: "You feel in structures — duty is devotion.",
    rising: "You arrive composed, taking the measure of things.",
  },
  Aquarius: {
    sun: "Luck via strange ideas — you run on the future.",
    moon: "You feel at a slight distance — clarity over drama.",
    rising: "You arrive unexpected, and it works.",
  },
  Pisces: {
    sun: "The dreamer's tide — you run on imagination.",
    moon: "Home is a feeling — you absorb every room.",
    rising: "You arrive like weather — atmospheric, everywhere.",
  },
};

function line(kind: "sun" | "moon" | "rising", sign: Sign | null): string {
  if (!sign) return "Add your birth time later to unlock your rising sign.";
  return SIGN_LINES[sign]?.[kind] ?? "";
}

export default async function RevealPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: row } = await supabase
    .from("natal_charts")
    .select("chart")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) redirect("/onboarding/birth");

  const chart = row.chart as NatalChart;
  const { sun, moon, rising } = chart.bigThree;

  const cards: { glyph: string; label: string; sign: string; text: string }[] = [
    { glyph: PLANET_GLYPHS.Sun, label: "Sun", sign: sun, text: line("sun", sun) },
    { glyph: PLANET_GLYPHS.Moon, label: "Moon", sign: moon, text: line("moon", moon) },
    {
      glyph: PLANET_GLYPHS.Rising,
      label: "Rising",
      sign: rising ?? "—",
      text: line("rising", rising),
    },
  ];

  return (
    <div className="fixed inset-0 overflow-y-auto bg-ink">
      <Starfield onDark />
      <div className="relative mx-auto flex min-h-full w-full max-w-[440px] flex-col items-center px-6 pb-14 pt-16">
        <div className="rise relative flex h-[190px] w-full items-center justify-center">
          <TripleOrbit size={190} />
        </div>
        <div className="rise d2 eyebrow mt-6 !text-gold-bright">Your chart is cast</div>
        <h1 className="rise d3 mt-2 text-center font-display text-[30px] font-bold leading-tight text-cream">
          Meet your Big Three.
        </h1>

        <div className="mt-8 flex w-full flex-col gap-3.5">
          {cards.map((c, i) => (
            <div
              key={c.label}
              className={`rise d${i + 4} rounded-[20px] border border-[rgba(201,161,94,.35)] bg-[rgba(252,248,240,.06)] p-5`}
            >
              <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[2.5px] text-gold-bright">
                <span className="text-[15px]">{c.glyph}</span>
                {c.label} · {c.sign}
              </div>
              <p className="mt-2 font-accent text-[16px] italic leading-relaxed text-[rgba(241,232,212,.9)]">
                &ldquo;{c.text}&rdquo;
              </p>
            </div>
          ))}
        </div>

        <ButtonLink href="/today" className="rise d7 mt-9 w-full" variant="ember-shimmer">
          Enter your Today
        </ButtonLink>
      </div>
    </div>
  );
}
