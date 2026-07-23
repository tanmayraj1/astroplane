import Link from "next/link";
import { requireOnboarded } from "@/server/services/context";
import { SidebarNav, MobileTabBar } from "@/components/shell/nav";
import { Logo, PLANET_GLYPHS, ArrowRightIcon } from "@/components/icons";
import { Avatar } from "@/components/ui";
import { OrbitRing } from "@/components/motion";
import { initials } from "@/lib/utils";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireOnboarded();
  const { sun, moon, rising } = ctx.chart!.bigThree;
  const bigThree = `${PLANET_GLYPHS.Sun} ${sun} · ${PLANET_GLYPHS.Moon} ${moon}${
    rising ? ` · ${PLANET_GLYPHS.Rising} ${rising.slice(0, 3)}` : ""
  }`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px]">
      {/* ── Desktop sidebar (232px, per Web design) ── */}
      <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-line bg-sidebar px-3.5 py-[22px] lg:flex">
        <Link
          href="/today"
          className="mb-7 flex items-center gap-2.5 px-2 font-display text-[18px] font-bold text-ink"
        >
          <Logo size={30} />
          Astroplane
        </Link>

        <SidebarNav />

        <div className="mt-auto flex flex-col gap-4">
          {ctx.profile.plan === "free" && (
            <Link
              href="/paywall"
              className="pressable-soft relative overflow-hidden rounded-[16px] bg-ink p-4 text-cream"
            >
              <OrbitRing size={130} duration={100} className="-right-8 -top-8 opacity-60" />
              <div className="relative">
                <div className="font-display text-[14.5px] font-bold">
                  Go deeper with Plus
                </div>
                <p className="mt-1 text-[11px] leading-snug text-[rgba(232,220,196,.7)]">
                  Full chart, deep patterns, year-ahead report.
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-gold-bright">
                  Start free trial <ArrowRightIcon size={12} />
                </span>
              </div>
            </Link>
          )}

          <Link
            href="/profile"
            className="pressable-soft flex items-center gap-2.5 rounded-[12px] px-2 py-1.5"
          >
            <Avatar label={initials(ctx.profile.display_name)} size={36} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-ink">
                {ctx.profile.display_name ?? "You"}
              </span>
              <span className="block truncate text-[10.5px] text-muted">{bigThree}</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="min-w-0 flex-1 pb-[110px] lg:pb-0">{children}</main>

      {/* ── Mobile floating glass tab bar ── */}
      <MobileTabBar />
    </div>
  );
}
