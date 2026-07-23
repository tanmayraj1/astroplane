import { DateTime } from "luxon";
import { requireOnboarded } from "@/server/services/context";
import { createClient } from "@/lib/supabase/server";
import { recurrenceInsight } from "@/server/actions/tarot";
import { Eyebrow } from "@/components/ui";
import { cardByKey } from "@/lib/tarot/deck";
import { StarSigil, SparkleIcon } from "@/components/icons";

export const metadata = { title: "Tarot journal" };

export default async function TarotJournalPage() {
  const ctx = await requireOnboarded();
  const supabase = await createClient();

  const [{ data: pulls }, insight] = await Promise.all([
    supabase
      .from("tarot_pulls")
      .select("id, date, card_key, reversed, created_at")
      .eq("user_id", ctx.userId)
      .eq("spread", "daily")
      .order("date", { ascending: false })
      .limit(40),
    recurrenceInsight(),
  ]);

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("tarot_pull_id, body, date")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(80);

  const entryFor = (pullId: string, date: string) =>
    entries?.find((e) => e.tarot_pull_id === pullId)?.body ??
    entries?.find((e) => e.tarot_pull_id === null && e.date === date)?.body ??
    null;

  return (
    <div className="px-5 pt-[52px] sm:px-8 lg:px-9 lg:pt-8">
      <header className="rise">
        <Eyebrow>Tarot journal</Eyebrow>
        <h1 className="mt-1.5 font-display text-[28px] font-bold text-ink lg:text-[34px]">
          {pulls?.length ?? 0} pulls, one thread.
        </h1>
      </header>

      {insight && (
        <div className="rise d2 mt-5 flex items-start gap-3 rounded-[18px] border border-[rgba(176,137,71,.3)] bg-[rgba(176,137,71,.14)] p-4">
          <SparkleIcon size={14} className="mt-0.5 shrink-0 text-gold-dark" />
          <p className="text-[13px] font-semibold leading-relaxed text-gold-dark">
            {insight}
          </p>
        </div>
      )}

      <div className="mt-6 flex max-w-[640px] flex-col gap-3 pb-14">
        {(!pulls || pulls.length === 0) && (
          <div className="rise d3 rounded-[20px] border border-line bg-surface p-8 text-center">
            <StarSigil size={40} className="mx-auto text-gold-muted" />
            <p className="mt-3 text-[13.5px] font-semibold text-muted">
              No pulls yet — your first card is waiting on the Tarot screen.
            </p>
          </div>
        )}
        {pulls?.map((p, i) => {
          const card = cardByKey(p.card_key);
          if (!card) return null;
          const note = entryFor(p.id, p.date);
          return (
            <div
              key={p.id}
              className={`rise d${Math.min(i + 3, 12)} flex items-start gap-4 rounded-[22px] border border-line bg-surface p-4`}
            >
              <div className="flex h-[64px] w-[44px] shrink-0 items-center justify-center rounded-[8px] border border-line bg-card-face">
                <StarSigil size={22} className="text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14px] font-bold text-ink">
                    {card.name}
                    {p.reversed && (
                      <span className="ml-1.5 text-[10px] font-bold text-clay">
                        Reversed
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[10.5px] font-bold uppercase tracking-[1px] text-faint">
                    {DateTime.fromISO(p.date).toFormat("LLL d")}
                  </span>
                </div>
                <p className="mt-1 font-accent text-[13.5px] italic leading-relaxed text-muted">
                  {note ?? (p.reversed ? card.reversed : card.upright)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
