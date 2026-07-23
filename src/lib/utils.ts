export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string | null | undefined): string {
  if (!name) return "✦";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** "10:24a", "4:48p" style compact time */
export function compactTime(iso: string | Date, tz?: string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
  return s.replace(" AM", "a").replace(" PM", "p");
}

export function formatMinor(amountMinor: number, currency: string): string {
  const major = amountMinor / 100;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
  }).format(major);
}

/** yyyy-mm-dd for a Date in a given IANA timezone */
export function localDateStr(d: Date, tz: string): string {
  return d.toLocaleDateString("en-CA", { timeZone: tz });
}
