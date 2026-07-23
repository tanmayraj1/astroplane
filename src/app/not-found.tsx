import Link from "next/link";
import { Starfield } from "@/components/motion";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--grad-landing)" }}
    >
      <Starfield />
      <div className="rise eyebrow">Lost in the void</div>
      <h1 className="rise d1 mt-3 font-display text-[34px] font-bold text-ink">
        This page ran void-of-course.
      </h1>
      <p className="rise d2 mt-2 max-w-[380px] text-[13.5px] text-body">
        Whatever was here has moved on to another sign. Let&apos;s get you back
        to your day.
      </p>
      <ButtonLink href="/today" className="rise d3 mt-7">
        Back to Today
      </ButtonLink>
      <Link href="/" className="rise d4 mt-4 text-[12px] font-semibold text-muted">
        or the landing page
      </Link>
    </div>
  );
}
