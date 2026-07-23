import { Starfield } from "@/components/motion";
import { Logo } from "@/components/icons";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10"
      style={{ background: "var(--grad-landing)" }}
    >
      <Starfield />
      <Link
        href="/"
        className="rise mb-8 flex items-center gap-2.5 font-display text-[20px] font-bold text-ink"
      >
        <Logo size={34} />
        Astroplane
      </Link>
      {children}
      <p className="rise d4 mt-8 max-w-[340px] text-center text-[10.5px] leading-relaxed text-faint">
        Guidance on Astroplane is reflective — never medical, legal, or
        financial advice.
      </p>
    </div>
  );
}
