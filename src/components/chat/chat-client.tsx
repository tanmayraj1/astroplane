"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, Button } from "@/components/ui";
import { ArrowLeftIcon, SendIcon } from "@/components/icons";
import { cn, formatMinor, initials } from "@/lib/utils";

interface Msg {
  id: string;
  role: "user" | "guide" | "system";
  content: string;
}

interface SessionInfo {
  id: string;
  started_at: string;
  billed_minutes: number;
  rate_snapshot: number;
  currency: string;
  status: string;
}

export function ChatClient({
  guide,
  initialMessages,
  chartChip,
}: {
  guide: {
    id: string;
    slug: string;
    name: string;
    craft: string;
    rateLabel: string;
  };
  initialMessages: Msg[];
  chartChip: string;
}) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [funds, setFunds] = useState<"ok" | "out">("ok");
  const [startError, setStartError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<SessionInfo | null>(null);
  sessionRef.current = session;

  const scroll = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── session start ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", guideId: guide.id }),
      });
      if (cancelled) return;
      if (res.status === 402) {
        setFunds("out");
        return;
      }
      const data = await res.json();
      if (data.session) setSession(data.session);
      else setStartError("Couldn't start the session — try again.");
    })();
    return () => {
      cancelled = true;
      const s = sessionRef.current;
      if (s) {
        navigator.sendBeacon?.(
          "/api/chat/session",
          new Blob(
            [JSON.stringify({ action: "end", sessionId: s.id })],
            { type: "application/json" },
          ),
        );
      }
    };
  }, [guide.id]);

  // ── heartbeat ticks (20s) + local timer (1s) ──
  useEffect(() => {
    if (!session) return;
    const t0 = Date.parse(session.started_at);
    const timer = setInterval(() => setElapsed(Date.now() - t0), 1000);
    const beat = setInterval(async () => {
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tick", sessionId: session.id }),
      });
      const data = await res.json();
      if (data.status === "aborted_funds") {
        setFunds("out");
        clearInterval(beat);
      }
    }, 20000);
    return () => {
      clearInterval(timer);
      clearInterval(beat);
    };
  }, [session]);

  useEffect(scroll, [messages, typing, scroll]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !input.trim() || typing) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [
      ...m,
      { id: `u${Date.now()}`, role: "user", content: text },
    ]);
    setTyping(true);

    // first message triggers the first billed minute
    void fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "tick", sessionId: session.id }),
    });

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, message: text }),
      });
      if (!res.ok || !res.body) {
        setTyping(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const id = `g${Date.now()}`;
      let acc = "";
      let first = true;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (first) {
          setTyping(false);
          setMessages((m) => [...m, { id, role: "guide", content: acc }]);
          first = false;
        } else {
          setMessages((m) =>
            m.map((msg) => (msg.id === id ? { ...msg, content: acc } : msg)),
          );
        }
      }
    } finally {
      setTyping(false);
    }
  }

  const mm = Math.floor(elapsed / 60000);
  const ss = Math.floor((elapsed % 60000) / 1000);
  const spend = session
    ? formatMinor(session.rate_snapshot * Math.max(mm, 0), session.currency)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-page lg:relative lg:z-auto lg:h-[calc(100dvh)] lg:bg-transparent">
      {/* Glass header */}
      <header className="glass-header flex items-center gap-3 border-b border-line px-4 pb-3 pt-[52px] lg:pt-4">
        <Link
          href={`/guides/${guide.slug}`}
          aria-label="Back"
          className="pressable flex h-[36px] w-[36px] items-center justify-center rounded-full border border-line-btn bg-surface text-body"
        >
          <ArrowLeftIcon size={15} />
        </Link>
        <Avatar label={initials(guide.name)} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold text-ink">{guide.name}</div>
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-online">
            <span className="h-[6px] w-[6px] rounded-full bg-online" /> Live session
          </div>
        </div>
        <span className="tnum rounded-full bg-ink px-3.5 py-1.5 text-[11.5px] font-bold text-cream">
          {mm}:{String(ss).padStart(2, "0")} · {guide.rateLabel}/min
        </span>
      </header>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex max-w-[640px] flex-col gap-3">
          <div className="self-center rounded-full border border-line bg-surface px-4 py-1.5 text-[9px] font-bold uppercase tracking-[1.5px] text-faint">
            Chart shared · {chartChip}
          </div>
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[82%] whitespace-pre-wrap px-4 py-3 text-[13.5px] leading-relaxed",
                m.role === "user"
                  ? "self-end rounded-[18px] rounded-br-[6px] bg-ink text-cream"
                  : "self-start rounded-[18px] rounded-bl-[6px] border border-line bg-surface text-ink-2",
              )}
            >
              {m.content}
            </div>
          ))}
          {typing && (
            <div className="flex gap-1.5 self-start rounded-[18px] rounded-bl-[6px] border border-line bg-surface px-4 py-3.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="blink h-[6px] w-[6px] rounded-full bg-line-check"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}
          {spend && mm > 0 && (
            <div className="self-center text-[10px] font-semibold text-faint">
              {spend} so far
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className="glass-header border-t border-line px-4 pb-6 pt-3 lg:pb-4"
      >
        <div className="mx-auto flex max-w-[640px] items-center gap-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your timing…"
            disabled={!session || funds === "out"}
            className="flex-1 rounded-full border border-line bg-surface px-5 py-3 text-[13.5px] text-ink outline-none placeholder:text-faint focus:border-gold"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!session || !input.trim() || typing || funds === "out"}
            className="pressable flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full text-cta-text shadow-[var(--shadow-ember)] disabled:opacity-50"
            style={{ background: "var(--grad-ember)" }}
          >
            <SendIcon size={17} />
          </button>
        </div>
      </form>

      {/* Insufficient funds sheet */}
      {funds === "out" && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-[rgba(35,32,58,.5)] p-4 backdrop-blur-[4px] sm:items-center">
          <div className="rise w-full max-w-[380px] rounded-[24px] border border-line bg-surface p-6 text-center shadow-[var(--shadow-card)]">
            <div className="eyebrow">Out of minutes</div>
            <h2 className="mt-2 font-display text-[20px] font-bold text-ink">
              Top up to keep talking
            </h2>
            <p className="mt-1.5 text-[12.5px] text-muted">
              Your wallet can&apos;t cover the next minute. The session is
              paused — nothing else will be charged.
            </p>
            <div className="mt-5 flex gap-3">
              <Link href="/wallet" className="flex-1">
                <Button className="w-full">Top up wallet</Button>
              </Link>
              <Link href="/guides" className="flex-1">
                <Button variant="outline" className="w-full">
                  End session
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      {startError && (
        <p className="absolute inset-x-0 top-[110px] mx-auto w-fit rounded-full bg-[rgba(192,90,59,.12)] px-4 py-2 text-[12px] font-bold text-clay">
          {startError}
        </p>
      )}
    </div>
  );
}
