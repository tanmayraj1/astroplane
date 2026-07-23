import { requireOnboarded } from "@/server/services/context";
import { Starfield } from "@/components/motion";
import { Eyebrow } from "@/components/ui";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { CheckIcon } from "@/components/icons";
import { PLANS, providerFor } from "@/lib/billing/plans";
import { formatMinor } from "@/lib/utils";

export const metadata = { title: "Go deeper" };

export default async function PaywallPage() {
  const ctx = await requireOnboarded();
  const { currency } = providerFor(ctx.profile.country_code ?? (ctx.profile.timezone === "Asia/Kolkata" ? "IN" : null));
  const price = (plan: "plus" | "pro") =>
    formatMinor(currency === "INR" ? PLANS[plan].inr : PLANS[plan].usd, currency);

  return (
    <div className="relative -mb-[110px] min-h-dvh bg-ink pb-[130px] lg:mb-0 lg:pb-16">
      <Starfield onDark />
      <div className="relative mx-auto w-full max-w-[520px] px-6 pt-[72px]">
        <Eyebrow onDark className="rise">Go deeper</Eyebrow>
        <h1 className="rise d1 mt-2 font-display text-[31px] font-bold leading-tight text-cream">
          The habit is free.
          <br />
          The depth is Plus.
        </h1>

        {/* Plus */}
        <div className="rise d2 relative mt-8 rounded-[24px] border-[1.5px] border-gold-bright bg-[rgba(252,248,240,.06)] p-6">
          <span
            className="absolute -top-3 right-6 rounded-full px-3.5 py-1 text-[9.5px] font-bold uppercase tracking-[1.5px] text-cta-text"
            style={{ background: "var(--grad-ember)" }}
          >
            Most loved
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[21px] font-bold text-cream">Plus</span>
            <span className="font-display text-[30px] font-bold text-cream">
              {price("plus")}
              <span className="text-[13px] font-semibold text-[rgba(232,220,196,.62)]">/mo</span>
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-2.5">
            {PLANS.plus.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-[rgba(241,232,212,.9)]">
                <CheckIcon size={14} className="mt-0.5 shrink-0 text-gold-bright" />
                {f}
              </li>
            ))}
          </ul>
          <CheckoutButton plan="plus" label="Start 7-day free trial" className="mt-5" />
        </div>

        {/* Pro */}
        <div className="rise d3 mt-4 rounded-[24px] border border-[rgba(201,161,94,.35)] bg-[rgba(252,248,240,.04)] p-6">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[21px] font-bold text-cream">Pro</span>
            <span className="font-display text-[30px] font-bold text-cream">
              {price("pro")}
              <span className="text-[13px] font-semibold text-[rgba(232,220,196,.62)]">/mo</span>
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-2.5">
            {PLANS.pro.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-[rgba(241,232,212,.9)]">
                <CheckIcon size={14} className="mt-0.5 shrink-0 text-gold-bright" />
                {f}
              </li>
            ))}
          </ul>
          <CheckoutButton plan="pro" label="Go Pro" variant="outline" className="mt-5" />
        </div>

        <p className="rise d4 mt-6 text-center text-[10.5px] leading-relaxed text-[rgba(232,220,196,.62)]">
          Cancel anytime · Guide sessions billed per minute, never bundled into
          subscriptions silently.
        </p>
      </div>
    </div>
  );
}
