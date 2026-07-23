"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SunIcon,
  CalendarIcon,
  WheelIcon,
  TarotIcon,
  GuidesIcon,
  PatternsIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/today", label: "Today", Icon: SunIcon },
  { href: "/planner", label: "Planner", Icon: CalendarIcon },
  { href: "/chart", label: "Chart", Icon: WheelIcon },
  { href: "/tarot", label: "Tarot", Icon: TarotIcon },
  { href: "/guides", label: "Guides", Icon: GuidesIcon },
  { href: "/patterns", label: "Patterns", Icon: PatternsIcon },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-[3px]">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "pressable-soft flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13.5px] font-bold transition-colors",
              active
                ? "bg-[rgba(176,137,71,.16)] text-ink"
                : "text-muted hover:text-ink",
            )}
          >
            <Icon size={19} className={active ? "text-gold-dark" : "text-muted"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

const TAB_ITEMS = NAV_ITEMS.filter((i) => i.label !== "Patterns");

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <div className="glass fixed inset-x-3.5 bottom-3.5 z-40 mb-safe flex h-[64px] items-center justify-around rounded-[22px] border border-line shadow-[var(--shadow-tabbar)] lg:hidden">
      {TAB_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "pressable relative flex flex-col items-center gap-1 px-3 py-1.5",
              active ? "text-ink" : "text-faint",
            )}
          >
            <Icon size={21} />
            <span className="text-[9.5px] font-bold tracking-[.3px]">{label}</span>
            {active && (
              <span className="absolute -bottom-0.5 h-[4px] w-[4px] rounded-full bg-gold" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
