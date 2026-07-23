import Link from "next/link";
import { requireOnboarded } from "@/server/services/context";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow, Avatar } from "@/components/ui";
import { providerFor } from "@/lib/billing/plans";
import { cn, formatMinor, initials } from "@/lib/utils";

export const metadata = { title: "Guides" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "astrologer", label: "Astrologers" },
  { key: "tarot", label: "Tarot" },
  { key: "healer", label: "Healers" },
];

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const ctx = await requireOnboarded();
  const { filter = "all", q } = await searchParams;
  const supabase = await createClient();
  const { currency } = providerFor(ctx.profile.country_code);

  let query = supabase.from("guides_public").select("*").order("rating", {
    ascending: false,
  });
  if (filter !== "all") query = query.eq("category", filter);
  if (q) query = query.or(`name.ilike.%${q}%,craft.ilike.%${q}%`);
  const { data: guides } = await query;

  return (
    <div className="px-5 pt-[52px] sm:px-8 lg:px-9 lg:pt-8">
      <header className="rise">
        <Eyebrow>Guides</Eyebrow>
        <h1 className="mt-1.5 font-display text-[28px] font-bold text-ink lg:text-[34px]">
          A human, when you want one
        </h1>
        <p className="mt-1 text-[12.5px] text-muted">
          Vetted astrologers, readers &amp; healers — clearly credentialed.
        </p>
      </header>

      {/* Search */}
      <form className="rise d1 mt-5 max-w-[560px]" action="/guides" method="get">
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by craft or question…"
          className="w-full rounded-full border border-line bg-surface px-5 py-3 text-[13.5px] text-ink outline-none placeholder:text-faint focus:border-gold"
        />
      </form>

      {/* Filters */}
      <div className="rise d2 mt-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/guides" : `/guides?filter=${f.key}`}
            className={cn(
              "pressable rounded-full border px-4 py-2 text-[12px] font-bold",
              filter === f.key
                ? "border-transparent bg-ink text-cream"
                : "border-line-btn bg-surface text-body",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Guide cards */}
      <div className="mt-5 grid gap-4 pb-10 sm:grid-cols-2 lg:max-w-[900px]">
        {guides?.map((g, i) => {
          const rate = formatMinor(
            currency === "INR" ? g.rate_paise_per_min : g.rate_cents_per_min,
            currency,
          );
          return (
            <div
              key={g.id}
              className={`rise d${Math.min(i + 3, 12)} liftable rounded-[22px] border border-line bg-surface p-5`}
            >
              <div className="flex items-start gap-3.5">
                <span className="relative">
                  <Avatar label={initials(g.name)} size={48} />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-[12px] w-[12px] rounded-full border-2 border-surface",
                      g.is_online ? "bg-online" : "bg-line-check",
                    )}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[15px] font-bold text-ink">
                      {g.name}
                    </span>
                    <span className="shrink-0 text-[12.5px] font-bold text-gold-dark">
                      {rate}/min
                    </span>
                  </div>
                  <p className="text-[12px] font-semibold text-muted">{g.craft}</p>
                  <p className="mt-1 text-[11px] text-faint">
                    ★ {Number(g.rating).toFixed(1)} ·{" "}
                    {g.session_count >= 1000
                      ? `${(g.session_count / 1000).toFixed(1)}k`
                      : g.session_count}{" "}
                    sessions · {g.years_practice} yrs ·{" "}
                    <span className={g.is_online ? "font-bold text-online" : ""}>
                      {g.is_online ? "Online" : "Away"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2.5">
                <Link
                  href={`/guides/${g.slug}/chat`}
                  className="pressable flex-1 rounded-full bg-ink py-2.5 text-center text-[12.5px] font-bold text-cream"
                >
                  Chat now
                </Link>
                <Link
                  href={`/guides/${g.slug}`}
                  className="pressable flex-1 rounded-full border border-gold-muted py-2.5 text-center text-[12.5px] font-bold text-gold-dark"
                >
                  View profile
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <p className="max-w-[640px] pb-14 text-[10.5px] leading-relaxed text-faint">
        Our guides are AI personas trained with practitioner oversight, clearly
        disclosed — human practitioners join the same marketplace soon, labeled
        separately. Licensed therapists are always labeled separately from
        spiritual practitioners. Guidance here is reflective — never medical,
        legal, or financial advice.
      </p>
    </div>
  );
}
