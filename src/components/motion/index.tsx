import { cn } from "@/lib/utils";

/* Deterministic pseudo-random star positions (stable across renders/SSR) */
const STARS = [
  { x: 6, y: 12, s: 3, d: 0, gold: true },
  { x: 14, y: 64, s: 2, d: 0.8, gold: false },
  { x: 22, y: 30, s: 2.5, d: 1.6, gold: true },
  { x: 33, y: 8, s: 2, d: 0.4, gold: false },
  { x: 44, y: 48, s: 3, d: 2.2, gold: true },
  { x: 55, y: 18, s: 2, d: 1.2, gold: false },
  { x: 64, y: 70, s: 2.5, d: 0.2, gold: true },
  { x: 73, y: 34, s: 2, d: 1.9, gold: false },
  { x: 82, y: 10, s: 3, d: 0.6, gold: true },
  { x: 90, y: 55, s: 2, d: 1.4, gold: false },
  { x: 95, y: 26, s: 2.5, d: 2.6, gold: true },
  { x: 39, y: 82, s: 2, d: 3, gold: false },
  { x: 12, y: 88, s: 2.5, d: 2, gold: true },
  { x: 68, y: 90, s: 2, d: 1.1, gold: false },
];

export function Starfield({
  onDark = false,
  withShootingStar = true,
  className,
}: {
  onDark?: boolean;
  withShootingStar?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {STARS.map((st, i) => (
        <span
          key={i}
          className="twinkle absolute rounded-full"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            background: onDark
              ? st.gold
                ? "#C9A15E"
                : "#F1E8D4"
              : st.gold
                ? "#B08947"
                : "#C05A3B",
            animationDelay: `${st.d}s`,
            animationDuration: `${3.2 + (i % 3) * 0.4}s`,
          }}
        />
      ))}
      {withShootingStar && (
        <span
          className="absolute left-[8%] top-[18%] h-[2px] w-[46px] rounded-full"
          style={{
            background: onDark
              ? "linear-gradient(90deg, transparent, #F1E8D4)"
              : "linear-gradient(90deg, transparent, #B08947)",
            animation: "shoot 8s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}

/** Slow-rotating dashed orbit ring — decorative around dark cards */
export function OrbitRing({
  size = 220,
  duration = 90,
  reverse = false,
  className,
  color = "rgba(201,161,94,.4)",
}: {
  size?: number;
  duration?: number;
  reverse?: boolean;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={cn("pointer-events-none absolute", className)}
      style={{
        animation: `${reverse ? "spinBack" : "spinSlow"} ${duration}s linear infinite`,
      }}
    >
      <circle
        cx="100"
        cy="100"
        r="96"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="4 7"
      />
      <circle cx="100" cy="4" r="3" fill={color} />
    </svg>
  );
}

/** Moon dial: double ring with a crescent, slow spin — Today hero + landing */
export function MoonDial({ size = 72, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        className="spin-slow absolute inset-0"
      >
        <circle
          cx="40"
          cy="40"
          r="38"
          fill="none"
          stroke="rgba(201,161,94,.5)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <circle cx="40" cy="2.5" r="2.5" fill="#C9A15E" />
      </svg>
      <svg width={size} height={size} viewBox="0 0 80 80" className="absolute inset-0">
        <circle cx="40" cy="40" r="27" fill="none" stroke="rgba(201,161,94,.3)" strokeWidth="1" />
        <path
          d="M46 24a18 18 0 1 0 0 32 14.5 14.5 0 0 1 0-32Z"
          fill="#C9A15E"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

/** Triple concentric spinning orbits — Big Three reveal screen */
export function TripleOrbit({ size = 240, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <OrbitRing size={size} duration={70} className="inset-0" />
      <OrbitRing
        size={size * 0.72}
        duration={95}
        reverse
        className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        color="rgba(201,161,94,.28)"
      />
      <OrbitRing
        size={size * 0.46}
        duration={120}
        className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        color="rgba(232,220,196,.3)"
      />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[26px] text-gold-bright">
        ✦
      </span>
    </div>
  );
}
