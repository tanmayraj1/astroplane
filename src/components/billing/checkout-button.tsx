"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function CheckoutButton({
  plan,
  label,
  variant = "ember-shimmer",
  className,
}: {
  plan: "plus" | "pro";
  label: string;
  variant?: "ember" | "ember-shimmer" | "ink" | "outline";
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(
          data.error === "payments_not_configured"
            ? "Payments aren't configured yet — add Stripe/Razorpay keys."
            : "Checkout failed — try again.",
        );
        setBusy(false);
      }
    } catch {
      setError("Checkout failed — try again.");
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button onClick={go} disabled={busy} variant={variant} className="w-full">
        {busy ? "Opening checkout…" : label}
      </Button>
      {error && (
        <p className="mt-2 text-center text-[11px] font-semibold text-clay">{error}</p>
      )}
    </div>
  );
}

export function PortalButton() {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setBusy(false);
  }
  return (
    <Button onClick={go} disabled={busy} variant="outline" size="sm">
      {busy ? "Opening…" : "Manage billing"}
    </Button>
  );
}

export function TopupButton({
  pack,
  label,
}: {
  pack: "s" | "m" | "l";
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setBusy(false);
  }
  return (
    <Button onClick={go} disabled={busy} variant="outline" className="w-full">
      {busy ? "Opening…" : label}
    </Button>
  );
}
