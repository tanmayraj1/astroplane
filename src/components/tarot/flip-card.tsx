"use client";

import { useState, useTransition } from "react";
import { drawDailyCard } from "@/server/actions/tarot";
import { saveJournalEntry } from "@/server/actions/tarot";
import { cardByKey, type TarotCard } from "@/lib/tarot/deck";
import { Button } from "@/components/ui";
import { StarSigil, SparkleIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

function CardFace({ card, reversed }: { card: TarotCard; reversed: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-between rounded-[20px] border-[1.5px] border-line bg-card-face p-5",
        reversed && "rotate-180",
      )}
    >
      <span className="font-display text-[14px] font-bold tracking-[2px] text-gold-dark">
        {card.arcana === "major" ? card.numeral : ""}
      </span>
      <div className="flex flex-1 items-center justify-center text-gold">
        {card.arcana === "major" ? (
          <StarSigil size={84} className="text-gold" />
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from(
              { length: Math.min(rankCount(card), 9) },
              (_, i) => (
                <SparkleIcon key={i} size={14} className="text-gold" />
              ),
            )}
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="mb-1 h-px w-[70px] bg-line-soft" />
        <span className="text-[10.5px] font-bold uppercase tracking-[2.5px] text-ink">
          {card.name}
        </span>
      </div>
    </div>
  );
}

function rankCount(card: TarotCard): number {
  const idx = parseInt(card.key.split("_")[1] ?? "1", 10);
  return idx <= 10 ? idx : 1;
}

function CardBack() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-ink p-4">
      <div className="flex h-full w-full items-center justify-center rounded-[14px] border border-[rgba(201,161,94,.4)]">
        <svg width="120" height="120" viewBox="0 0 120 120" className="breathe">
          <circle cx="60" cy="60" r="44" fill="none" stroke="#C9A15E" strokeWidth="1" opacity=".7" />
          <circle cx="60" cy="60" r="30" fill="none" stroke="#C9A15E" strokeWidth="1" opacity=".5" />
          <path
            d="M60 16 71 49 104 60 71 71 60 104 49 71 16 60 49 49Z"
            fill="none"
            stroke="#C9A15E"
            strokeWidth="1.2"
          />
          <circle cx="60" cy="60" r="5" fill="#C9A15E" />
        </svg>
      </div>
    </div>
  );
}

export function DailyPull({
  initial,
  sunSign,
}: {
  initial: { cardKey: string; reversed: boolean; interpretation: string | null } | null;
  sunSign: string | null;
}) {
  const [flipped, setFlipped] = useState(false);
  const [pull, setPull] = useState(initial);
  const [reading, setReading] = useState(initial?.interpretation ?? "");
  const [streaming, setStreaming] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalText, setJournalText] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);
  const [busy, startTransition] = useTransition();

  const card = pull ? cardByKey(pull.cardKey) : null;

  async function streamReading() {
    setStreaming(true);
    try {
      const res = await fetch("/api/ai/tarot", { method: "POST" });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setReading(acc);
      }
    } finally {
      setStreaming(false);
    }
  }

  function reveal() {
    if (flipped) return;
    startTransition(async () => {
      let result: { cardKey: string; reversed: boolean; interpretation: string | null };
      if (pull) {
        result = pull;
      } else {
        const drawn = await drawDailyCard();
        result = { ...drawn, interpretation: null };
      }
      setPull(result);
      setFlipped(true);
      if (!result.interpretation) void streamReading();
    });
  }

  function saveJournal() {
    startTransition(async () => {
      await saveJournalEntry({ body: journalText });
      setJournalSaved(true);
      setJournalOpen(false);
    });
  }

  // Split reading: first line = epigraph, rest = body, "Journal ·" line separated
  const lines = reading.split("\n").filter((l) => l.trim());
  const epigraph = lines[0] ?? "";
  const journalLine = lines.find((l) => l.startsWith("Journal"));
  const bodyLines = lines.slice(1).filter((l) => !l.startsWith("Journal"));

  return (
    <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:gap-10">
      {/* Card */}
      <div className="mx-auto">
        <button
          onClick={reveal}
          disabled={busy}
          className="flip-scene block h-[344px] w-[212px] lg:h-[382px] lg:w-[236px]"
          aria-label={flipped ? card?.name : "Tap to reveal your card"}
        >
          <div
            className={cn(
              "flip-card relative h-full w-full shadow-[0_22px_50px_rgba(35,32,58,.35)]",
              flipped && "flipped",
            )}
          >
            <div className="flip-face absolute inset-0">
              <CardBack />
            </div>
            <div className="flip-face flip-face-front absolute inset-0">
              {card && <CardFace card={card} reversed={pull!.reversed} />}
            </div>
          </div>
        </button>
        <p
          className={cn(
            "mt-4 text-center text-[10px] font-bold uppercase tracking-[3px] text-faint transition-opacity duration-[400ms]",
            flipped && "opacity-0",
          )}
        >
          Tap to reveal
        </p>
      </div>

      {/* Reveal panel */}
      {flipped && card && (
        <div className="rise flex flex-col gap-4">
          <div>
            <div className="eyebrow">
              {sunSign ? `For your ${sunSign} Sun` : "Your card"}
              {pull!.reversed && " · Reversed"}
            </div>
            <p className="mt-2 font-accent text-[22px] italic leading-snug text-ink lg:text-[25px]">
              {epigraph || `${card.name} — ${pull!.reversed ? card.reversed : card.upright}.`}
              {streaming && !epigraph && <span className="blink">▋</span>}
            </p>
          </div>
          {bodyLines.length > 0 && (
            <p className="max-w-[440px] text-[13.5px] leading-relaxed text-body">
              {bodyLines.join(" ")}
              {streaming && <span className="blink text-gold">▋</span>}
            </p>
          )}
          <div className="h-px bg-line-soft" />
          <p className="text-[13px] text-body">
            <span className="font-bold text-ink">Journal ·</span>{" "}
            {journalLine?.replace(/^Journal\s*·\s*/, "") ??
              "What is this card pointing at in your day?"}
          </p>

          {journalOpen ? (
            <div className="flex flex-col gap-3">
              <textarea
                autoFocus
                rows={4}
                maxLength={8000}
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Write it down before it fades…"
                className="w-full rounded-[16px] border border-line bg-surface px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-gold"
              />
              <div className="flex gap-3">
                <Button onClick={saveJournal} disabled={busy || !journalText.trim()} size="sm">
                  {busy ? "Saving…" : "Save entry"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setJournalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button size="sm" onClick={() => setJournalOpen(true)} disabled={journalSaved}>
                {journalSaved ? "Journaled ✦" : "Journal this pull"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFlipped(false);
                  setTimeout(() => setFlipped(true), 1000);
                }}
              >
                Shuffle again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
