import Link from "next/link";
import { Logo } from "@/components/icons";
import { getUser } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser().catch(() => null);

  return (
    <div className="min-h-dvh" style={{ background: "var(--grad-landing)" }}>
      <header className="glass-landing sticky top-0 z-40 border-b border-[rgba(227,213,182,.6)]">
        <div className="mx-auto flex h-[62px] w-full max-w-[1280px] items-center justify-between px-5 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-[19px] font-bold text-ink"
          >
            <Logo size={30} />
            Astroplane
          </Link>
          <nav className="hidden items-center gap-7 text-[13.5px] font-semibold text-body sm:flex">
            <Link href="/#how" className="hover:text-ink">
              How it works
            </Link>
            <Link href="/#guides" className="hover:text-ink">
              Guides
            </Link>
            <Link href="/pricing" className="hover:text-ink">
              Pricing
            </Link>
          </nav>
          <Link
            href={user ? "/today" : "/sign-up"}
            className="pressable rounded-full bg-ink px-5 py-2.5 text-[12.5px] font-bold text-cream"
          >
            {user ? "Open the app" : "Get started"}
          </Link>
        </div>
      </header>
      {children}
      <footer className="border-t border-[rgba(227,213,182,.6)] py-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-3 px-5 text-center">
          <Logo size={26} />
          <p className="text-[11px] text-faint">
            © {new Date().getFullYear()} Astroplane · Guidance is reflective —
            never medical, legal, or financial advice.
          </p>
          <p className="text-[11px] text-faint">
            <Link href="/pricing" className="font-semibold">
              Pricing
            </Link>{" "}
            · <Link href="/sign-up" className="font-semibold">Create account</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
