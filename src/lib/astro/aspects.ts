import {
  ASPECTS,
  sep,
  type NatalAspect,
  type PlacedBody,
  type AspectType,
} from "./types";

const LUMINARIES = new Set(["Sun", "Moon"]);

function orbLimit(a: PlacedBody["body"], b: PlacedBody["body"]): number {
  if (LUMINARIES.has(a) || LUMINARIES.has(b)) return 8;
  if (a === "Ascendant" || b === "Ascendant") return 6;
  return 6;
}

/** All major aspects between the given placed bodies (natal-to-natal). */
export function detectAspects(bodies: PlacedBody[]): NatalAspect[] {
  const out: NatalAspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const A = bodies[i];
      const B = bodies[j];
      if (A.body === "NorthNode" && B.body === "NorthNode") continue;
      const d = sep(A.lon, B.lon);
      for (const asp of ASPECTS) {
        const orb = Math.abs(d - asp.angle);
        if (orb <= orbLimit(A.body, B.body)) {
          out.push({ a: A.body, b: B.body, type: asp.type, orb: +orb.toFixed(2) });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

/** Aspect between two raw longitudes within a max orb, or null. */
export function aspectBetween(
  lonA: number,
  lonB: number,
  maxOrb: number,
): { type: AspectType; orb: number } | null {
  const d = sep(lonA, lonB);
  for (const asp of ASPECTS) {
    const orb = Math.abs(d - asp.angle);
    if (orb <= maxOrb) return { type: asp.type, orb: +orb.toFixed(2) };
  }
  return null;
}
