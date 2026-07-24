import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 24, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function SunIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19" />
    </svg>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 2.8v4M16 2.8v4M8 13.5h3M8 16.8h5" />
    </svg>
  );
}

export function WheelIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21" />
    </svg>
  );
}

export function TarotIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="4" y="4.5" width="10.5" height="15" rx="2.4" transform="rotate(-8 9 12)" />
      <rect x="9.5" y="4.5" width="10.5" height="15" rx="2.4" transform="rotate(8 15 12)" />
    </svg>
  );
}

export function GuidesIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="9" cy="8.5" r="3.4" />
      <path d="M3.4 20c.6-3.4 2.9-5.2 5.6-5.2s5 1.8 5.6 5.2" />
      <circle cx="17" cy="9.5" r="2.6" />
      <path d="M15.5 14.6c2.6-.4 4.7 1.2 5.1 4.4" />
    </svg>
  );
}

export function PatternsIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 17.5 8 11.8l3.5 3.2 4-6 5 5.5" />
      <circle cx="8" cy="11.8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4.5 12h14M13 6.5l5.5 5.5L13 17.5" />
    </svg>
  );
}

export function ArrowLeftIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M19.5 12h-14M11 6.5 5.5 12l5.5 5.5" />
    </svg>
  );
}

export function LockIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ClockIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.2V12l3.2 2.2" />
    </svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.6 15.6 4.6 4.6" />
    </svg>
  );
}

export function SendIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-7-3.5Z" />
    </svg>
  );
}

export function MoonIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M19.5 13.5A7.8 7.8 0 0 1 10.5 4.5a7.8 7.8 0 1 0 9 9Z" />
    </svg>
  );
}

export function WalletIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <path d="M3 10h18M16.5 15h1.5" />
    </svg>
  );
}

export function SettingsIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.4 5.6 16.7 7.3M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6" />
    </svg>
  );
}

export function SignOutIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M14 4H7a2.5 2.5 0 0 0-2.5 2.5v11A2.5 2.5 0 0 0 7 20h7M10.5 12h9M16.5 8.5 20 12l-3.5 3.5" />
    </svg>
  );
}

/** 4-point sparkle (the ✦ used across the design) */
export function SparkleIcon({
  size = 14,
  filled = true,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.6}
      {...props}
    >
      <path d="M12 1.5 14.6 9.4 22.5 12 14.6 14.6 12 22.5 9.4 14.6 1.5 12 9.4 9.4Z" />
    </svg>
  );
}

/** 8-point star used in tarot faces and reveal screens */
export function StarSigil({ size = 48, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      {...props}
    >
      <path d="M24 4 27.5 20.5 44 24 27.5 27.5 24 44 20.5 27.5 4 24 20.5 20.5Z" />
      <path d="M24 14 26 22 34 24 26 26 24 34 22 26 14 24 22 22Z" opacity={0.6} />
    </svg>
  );
}

/** Astroplane logo: navy circle + tilted dashed orbit + comet + gold sparkle */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="var(--ink)" />
      <ellipse
        cx="20"
        cy="20"
        rx="14"
        ry="6.5"
        stroke="#C9A15E"
        strokeWidth="1.1"
        strokeDasharray="3 3"
        transform="rotate(-22 20 20)"
      />
      <path
        d="M11 25c4-1.4 10.5-5.4 15.5-11"
        stroke="#E8DCC0"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="26.5" cy="14" r="2.4" fill="#E8DCC0" />
      <path d="m31.5 24 .9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9Z" fill="#C9A15E" />
    </svg>
  );
}

export const PLANET_GLYPHS: Record<string, string> = {
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
  Rising: "↑",
  NorthNode: "☊",
};

// U+FE0E forces monochrome text presentation — without it these render as
// colored emoji on macOS/iOS instead of the design's gold glyphs.
export const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈︎",
  Taurus: "♉︎",
  Gemini: "♊︎",
  Cancer: "♋︎",
  Leo: "♌︎",
  Virgo: "♍︎",
  Libra: "♎︎",
  Scorpio: "♏︎",
  Sagittarius: "♐︎",
  Capricorn: "♑︎",
  Aquarius: "♒︎",
  Pisces: "♓︎",
};

export const ASPECT_GLYPHS: Record<string, string> = {
  conjunction: "☌",
  sextile: "⚹",
  square: "□",
  trine: "△",
  opposition: "☍",
};
