import Link from "next/link";
import { DateTime } from "luxon";
import { requireOnboarded } from "@/server/services/context";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow, Pill } from "@/components/ui";
import { PortalButton } from "@/components/billing/checkout-button";
import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const ctx = await requireOnboarded();
  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  const active = subs?.find((s) =>
    ["active", "trialing", "past_due"].includes(s.status),
  );

  return (
    <div className="px-5 pt-[52px] sm:px-8 lg:px-9 lg:pt-8">
      <header className="rise">
        <Eyebrow>Billing</Eyebrow>
        <h1 className="mt-1.5 font-display text-[28px] font-bold text-ink lg:text-[34px]">
          Your plan
        </h1>
      </header>

      <div className="mt-6 flex max-w-[560px] flex-col gap-4 pb-14">
        <section className="rise d2 rounded-[22px] border border-line bg-surface p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-display text-[22px] font-bold capitalize text-ink">
                {ctx.profile.plan}
              </div>
              {active ? (
                <p className="mt-1 text-[12px] text-muted">
                  <Pill
                    className={cn(
                      "mr-2 !px-2.5 !py-0.5 !text-[10px] capitalize",
                      active.status === "past_due" && "!text-clay",
                    )}
                  >
                    {active.status.replace("_", " ")}
                  </Pill>
                  {active.trial_end && Date.parse(active.trial_end) > Date.now()
                    ? `Trial ends ${DateTime.fromISO(active.trial_end).toFormat("LLL d")}`
                    : active.current_period_end
                      ? `${active.cancel_at_period_end ? "Ends" : "Renews"} ${DateTime.fromISO(active.current_period_end).toFormat("LLL d, yyyy")}`
                      : ""}
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-muted">
                  The habit is free — the depth is Plus.
                </p>
              )}
            </div>
            {active?.provider === "stripe" ? (
              <PortalButton />
            ) : active?.provider === "razorpay" ? (
              <p className="max-w-[160px] text-right text-[10.5px] text-faint">
                Manage via the Razorpay email receipts, or contact support.
              </p>
            ) : null}
          </div>
        </section>

        {!active && (
          <Link
            href="/paywall"
            className="rise d3 pressable-soft flex items-center justify-between rounded-[20px] bg-ink p-5 text-cream shadow-[var(--shadow-ink)]"
          >
            <span className="font-display text-[16px] font-bold">
              Start your 7-day free trial
            </span>
            <ArrowRightIcon size={15} className="text-gold-bright" />
          </Link>
        )}

        <p className="rise d4 text-[10.5px] leading-relaxed text-faint">
          Cancel anytime. Guide sessions are billed per minute from your wallet,
          never bundled into subscriptions silently.
        </p>
      </div>
    </div>
  );
}
