import { DateTime } from "luxon";
import { requireOnboarded } from "@/server/services/context";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "@/components/ui";
import { TopupButton } from "@/components/billing/checkout-button";
import { WALLET_PACKS, providerFor } from "@/lib/billing/plans";
import { formatMinor } from "@/lib/utils";
import { SparkleIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export const metadata = { title: "Wallet" };

const TX_LABEL: Record<string, string> = {
  topup: "Top-up",
  chat_debit: "Guide session",
  refund: "Refund",
  promo: "Credit",
  karma_redeem: "Karma redeemed",
};

export default async function WalletPage() {
  const ctx = await requireOnboarded();
  const supabase = await createClient();

  const [{ data: wallet }, { data: txs }] = await Promise.all([
    supabase.from("wallets").select("*").eq("user_id", ctx.userId).maybeSingle(),
    supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const { currency } = providerFor(ctx.profile.country_code);
  const balance = wallet?.balance ?? 0;
  const walletCurrency = wallet?.currency ?? currency;

  return (
    <div className="px-5 pt-[52px] sm:px-8 lg:px-9 lg:pt-8">
      <header className="rise">
        <Eyebrow>Wallet</Eyebrow>
        <h1 className="mt-1.5 font-display text-[28px] font-bold text-ink lg:text-[34px]">
          Minutes with humans
        </h1>
        <p className="mt-1 text-[12.5px] text-muted">
          Guide sessions bill per minute from this balance — you always see the
          meter.
        </p>
      </header>

      <div className="mt-6 grid max-w-[820px] gap-4 pb-14 lg:grid-cols-[1fr_1.1fr]">
        <section className="rise d2 rounded-[24px] bg-ink p-6 text-cream shadow-[var(--shadow-ink)]">
          <Eyebrow onDark>Balance</Eyebrow>
          <div className="tnum mt-2 font-display text-[38px] font-bold">
            {formatMinor(balance, walletCurrency)}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[rgba(232,220,196,.7)]">
            <SparkleIcon size={11} className="text-gold-bright" />
            Roughly {Math.floor(balance / (walletCurrency === "INR" ? 6000 : 300))}{" "}
            minutes with a $3/min guide.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {WALLET_PACKS.map((p) => (
              <TopupButton
                key={p.key}
                pack={p.key}
                label={formatMinor(currency === "INR" ? p.inr : p.usd, currency)}
              />
            ))}
          </div>
        </section>

        <section className="rise d3">
          <Eyebrow className="mb-3">History</Eyebrow>
          <div className="flex flex-col gap-2">
            {(!txs || txs.length === 0) && (
              <div className="rounded-[16px] border border-line bg-surface p-5 text-[12.5px] text-muted">
                No transactions yet — top up to start a session with a guide.
              </div>
            )}
            {txs?.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface px-4 py-3"
              >
                <span>
                  <span className="block text-[13px] font-bold text-ink">
                    {TX_LABEL[t.type] ?? t.type}
                  </span>
                  <span className="block text-[10.5px] text-faint">
                    {DateTime.fromISO(t.created_at).toFormat("LLL d · h:mm a")}
                  </span>
                </span>
                <span
                  className={cn(
                    "tnum text-[13.5px] font-bold",
                    t.amount > 0 ? "text-online" : "text-clay",
                  )}
                >
                  {t.amount > 0 ? "+" : ""}
                  {formatMinor(t.amount, walletCurrency)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
