import type { PlacedBody, TransitAspect } from "./types";

const HOUSE_DOMAIN: Record<number, string> = {
  1: "self and arrival",
  2: "worth and resources",
  3: "words and near things",
  4: "home and roots",
  5: "play and creation",
  6: "craft and daily rhythm",
  7: "partnership",
  8: "depth and shared stakes",
  9: "exploration",
  10: "work in the world",
  11: "friends and futures",
  12: "the inner life",
};

const PLANET_NOTES: Record<string, (domain: string) => string> = {
  Sun: (d) => `identity through ${d}`,
  Moon: (d) => `feelings live in ${d}`,
  Mercury: (d) => `thinks in ${d}`,
  Venus: (d) => `loves through ${d}`,
  Mars: (d) => `drive aimed at ${d}`,
  Jupiter: (d) => `luck grows in ${d}`,
  Saturn: (d) => `lessons arrive via ${d}`,
  Uranus: (d) => `breaks the rules of ${d}`,
  Neptune: (d) => `dreams through ${d}`,
  Pluto: (d) => `transforms through ${d}`,
  NorthNode: (d) => `growth points toward ${d}`,
};

export function placementNote(b: PlacedBody): string {
  const domain = HOUSE_DOMAIN[b.house ?? 1] ?? "the day";
  return PLANET_NOTES[b.body]?.(domain) ?? domain;
}

const ASPECT_SYMBOL: Record<string, string> = {
  conjunction: "☌",
  sextile: "⚹",
  square: "□",
  trine: "△",
  opposition: "☍",
};

/**
 * Translate TimeWindow machine reason codes into short human chips,
 * e.g. "Venus hour", "Moon △ your Sun", "Moon void of course".
 */
export function windowReasonNotes(reasons: string[]): string[] {
  const out: string[] = [];
  for (const r of reasons) {
    if (r.startsWith("hour_ruler_is_chart_ruler:")) {
      out.push(`${r.split(":")[1]} hour — your chart ruler`);
    } else if (r.startsWith("hour_ruler_")) {
      out.push(`${r.split(":")[1]} hour`);
    } else if (r === "moon_void_of_course") {
      out.push("Moon void of course");
    } else if (r.startsWith("moon_")) {
      const m = r.match(/^moon_(\w+)_natal_(\w+)$/);
      if (m) {
        const sym = ASPECT_SYMBOL[m[1]] ?? m[1];
        out.push(`Moon ${sym} your ${m[2] === "Ascendant" ? "rising" : m[2]}`);
      }
    }
  }
  // de-dup, and let "X hour — your chart ruler" absorb its plain "X hour" chip
  const unique = [...new Set(out)];
  const deduped = unique.filter(
    (chip) =>
      !unique.some((other) => other !== chip && other.startsWith(`${chip} — `)),
  );
  return deduped.slice(0, 3);
}

export function transitNote(t: TransitAspect): string {
  switch (t.type) {
    case "trine":
    case "sextile":
      return `Green light — ${t.transiting.toLowerCase()}'s ease reaches your ${t.natal === "Ascendant" ? "rising" : `natal ${t.natal}`}.`;
    case "square":
      return `Friction worth using — pressure from ${t.transiting} on your natal ${t.natal}.`;
    case "opposition":
      return t.transiting === "Saturn"
        ? "A slow yes is still a yes."
        : `Something asks for balance between ${t.transiting} and your natal ${t.natal}.`;
    case "conjunction":
      return `${t.transiting} sits on your natal ${t.natal} — amplified, for better and louder.`;
  }
}
