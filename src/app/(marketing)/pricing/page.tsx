import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { PLANS } from "@/lib/billing/plans";

export const metadata = { title: "Pricing" };

const FREE_FEATURES = [
  "Full daily card — wake, color, windows",
  "One tarot pull a day",
  "Big Three chart",
];

export default function PricingPage() {
  return (
    <section className="mx-auto w-full max-w-[1020px] px-5 pb-24 pt-14 lg:px-10">
      <div className="text-center">
        <div className="rise eyebrow">Pricing</div>
        <h1 className="rise d1 mt-2 font-display text-[32px] font-bold text-ink lg:text-[36px]">
          The habit is free. The depth is Plus.
        </h1>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {/* Free */}
        <div className="rise d2 flex flex-col rounded-[24px] border border-line bg-surface p-6">
          <div className="font-display text-[21px] font-bold text-ink">Free</div>
          <div className="mt-1 font-display text-[30px] font-bold text-ink">
            $0
          </div>
          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-body">
                <CheckIcon size={14} className="mt-0.5 shrink-0 text-gold" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up"
            className="pressable mt-6 rounded-full border border-gold-muted py-3 text-center text-[13.5px] font-bold text-gold-dark"
          >
            Start free
          </Link>
        </div>

        {/* Plus */}
        <div className="rise d3 relative flex flex-col rounded-[24px] border-[1.5px] border-gold-bright bg-ink p-6 text-cream shadow-[0_24px_50px_rgba(35,32,58,.3)]">
          <span
            className="absolute -top-3 right-6 rounded-full px-3.5 py-1 text-[9.5px] font-bold uppercase tracking-[1.5px] text-cta-text"
            style={{ background: "var(--grad-ember)" }}
          >
            Most loved
          </span>
          <div className="font-display text-[21px] font-bold">Plus</div>
          <div className="mt-1 font-display text-[30px] font-bold">
            $7
            <span className="text-[13px] font-semibold text-[rgba(232,220,196,.62)]">
              /mo · ₹299
            </span>
          </div>
          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            {PLANS.plus.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2.5 text-[13px] text-[rgba(241,232,212,.9)]"
              >
                <CheckIcon size={14} className="mt-0.5 shrink-0 text-gold-bright" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up?intent=plus"
            className="pressable mt-6 rounded-full py-3 text-center text-[13.5px] font-bold text-cta-text shadow-[var(--shadow-ember)]"
            style={{ background: "var(--grad-ember)" }}
          >
            Start 7-day free trial
          </Link>
        </div>

        {/* Pro */}
        <div className="rise d4 flex flex-col rounded-[24px] border border-line bg-surface p-6">
          <div className="font-display text-[21px] font-bold text-ink">Pro</div>
          <div className="mt-1 font-display text-[30px] font-bold text-ink">
            $16
            <span className="text-[13px] font-semibold text-muted">/mo · ₹899</span>
          </div>
          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            {PLANS.pro.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-body">
                <CheckIcon size={14} className="mt-0.5 shrink-0 text-gold" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up?intent=pro"
            className="pressable mt-6 rounded-full border border-gold-muted py-3 text-center text-[13.5px] font-bold text-gold-dark"
          >
            Go Pro
          </Link>
        </div>
      </div>

      <p className="rise d5 mt-8 text-center text-[11px] text-faint">
        Cancel anytime · Guide sessions billed per minute, never bundled into
        subscriptions silently.
      </p>
    </section>
  );
}
