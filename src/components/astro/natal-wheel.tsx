import type { NatalChart } from "@/lib/astro";
import { SIGN_GLYPHS } from "@/components/icons";
import { SIGNS } from "@/lib/astro";

const PLANET_COLORS: Record<string, string> = {
  Sun: "#B08947",
  Moon: "#23203A",
  Mercury: "#8D7A57",
  Venus: "#C05A3B",
  Mars: "#C05A3B",
  Jupiter: "#B08947",
  Saturn: "#6E6653",
  Uranus: "#8D7A57",
  Neptune: "#6E6653",
  Pluto: "#23203A",
  NorthNode: "#8D7A57",
};

/**
 * Natal wheel — concentric rings, zodiac glyphs, planet dots, aspect polygon.
 * Rendered at any size (400 desktop / 280 mobile per designs).
 * Chart orientation: Ascendant (or 0° Aries) at 9 o'clock, zodiac counter-clockwise.
 */
export function NatalWheel({ chart, size = 400 }: { chart: NatalChart; size?: number }) {
  const C = 200; // internal coordinate center
  const ascLon = chart.ascendant?.lon ?? 0;

  // ecliptic longitude → SVG angle (ASC at left/180°, zodiac counter-clockwise)
  const toAngle = (lon: number) => (180 + (lon - ascLon)) * (Math.PI / 180) * -1;
  const pt = (lon: number, r: number) => {
    const a = toAngle(lon);
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
  };

  const planets = chart.bodies.filter((b) => b.body !== "NorthNode");
  const tightAspects = chart.aspects
    .filter(
      (a) =>
        a.orb < 5 &&
        a.a !== "NorthNode" &&
        a.b !== "NorthNode" &&
        a.type !== "conjunction",
    )
    .slice(0, 12);

  const lonOf = (name: string) =>
    name === "Ascendant"
      ? chart.ascendant?.lon ?? 0
      : chart.bodies.find((b) => b.body === name)?.lon ?? 0;

  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className="mx-auto block"
      role="img"
      aria-label="Natal chart wheel"
    >
      {/* slowly-spinning dashed outer ring */}
      <g className="spin-slower" style={{ transformOrigin: "200px 200px" }}>
        <circle
          cx={C}
          cy={C}
          r={192}
          fill="none"
          stroke="#C9AE7E"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
        <circle cx={C} cy={8} r={3} fill="#C9AE7E" />
      </g>

      <circle cx={C} cy={C} r={172} fill="none" stroke="#DECBA0" strokeWidth="1" />
      <circle cx={C} cy={C} r={132} fill="none" stroke="#E7DABC" strokeWidth="1" />
      <circle cx={C} cy={C} r={66} fill="none" stroke="#EFE4C9" strokeWidth="1" />

      {/* sign-boundary spokes */}
      {Array.from({ length: 12 }, (_, i) => {
        const lon = i * 30;
        const p1 = pt(lon, 132);
        const p2 = pt(lon, 172);
        return (
          <line
            key={i}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="#E7DABC"
            strokeWidth="1"
          />
        );
      })}

      {/* zodiac glyphs mid-sign */}
      {SIGNS.map((s, i) => {
        const p = pt(i * 30 + 15, 152);
        return (
          <text
            key={s}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="15"
            fill="#8D7A57"
            style={{ fontFamily: "var(--font-accent)" }}
          >
            {SIGN_GLYPHS[s]}
          </text>
        );
      })}

      {/* aspect lines */}
      {tightAspects.map((a, i) => {
        const p1 = pt(lonOf(a.a), 66);
        const p2 = pt(lonOf(a.b), 66);
        const harmonious = a.type === "trine" || a.type === "sextile";
        return (
          <line
            key={i}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={harmonious ? "#B08947" : "#C05A3B"}
            strokeWidth="1"
            opacity="0.5"
          />
        );
      })}

      {/* planet dots + glyph labels */}
      {planets.map((b) => {
        const p = pt(b.lon, 110);
        const label = pt(b.lon, 92);
        return (
          <g key={b.body}>
            <circle cx={p.x} cy={p.y} r={5} fill={PLANET_COLORS[b.body] ?? "#23203A"} />
            <circle cx={p.x} cy={p.y} r={8.5} fill="none" stroke="#DECBA0" strokeWidth="1" />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fill="#6E6653"
            >
              {glyph(b.body)}
            </text>
          </g>
        );
      })}

      {/* Ascendant marker */}
      {chart.ascendant && (
        <g>
          <line
            x1={pt(ascLon, 172).x}
            y1={pt(ascLon, 172).y}
            x2={pt(ascLon, 192).x}
            y2={pt(ascLon, 192).y}
            stroke="#B08947"
            strokeWidth="2"
          />
          <text
            x={pt(ascLon, 183).x}
            y={pt(ascLon, 183).y - 10}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="#B08947"
          >
            ASC
          </text>
        </g>
      )}
    </svg>
  );
}

function glyph(body: string): string {
  const map: Record<string, string> = {
    Sun: "☉",
    Moon: "☽",
    Mercury: "☿",
    Venus: "♀",
    Mars: "♂",
    Jupiter: "♃",
    Saturn: "♄",
    Uranus: "♅",
    Neptune: "♆",
    Pluto: "♇",
  };
  return map[body] ?? "•";
}
