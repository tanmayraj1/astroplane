import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboarded } from "@/server/services/context";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui";
import { OrbitRing } from "@/components/motion";
import { ArrowLeftIcon, ClockIcon } from "@/components/icons";
import { providerFor } from "@/lib/billing/plans";
import { formatMinor, initials } from "@/lib/utils";

export default async function GuideProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ctx = await requireOnboarded();
  const { slug } = await params;
  const supabase = await createClient();
  const { data: guide } = await supabase
    .from("guides_public")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!guide) notFound();

  const { currency } = providerFor(ctx.profile.country_code);
  const rate = formatMinor(
    currency === "INR" ? guide.rate_paise_per_min : guide.rate_cents_per_min,
    currency,
  );

  return (
    <div className="mx-auto max-w-[560px] pb-14">
      {/* Ink header */}
      <div className="relative overflow-hidden bg-ink px-6 pb-14 pt-[64px] lg:rounded-b-[28px]">
        <OrbitRing size={200} duration={100} className="-right-14 -top-14 opacity-50" />
        <Link
          href="/guides"
          className="pressable relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[rgba(201,161,94,.35)] text-cream"
          aria-label="Back to guides"
        >
          <ArrowLeftIcon size={16} />
        </Link>
      </div>

      <div className="px-6">
        {/* Overlapping avatar */}
        <div className="rise -mt-[38px] flex items-end gap-4">
          <span className="rounded-full border-[3px] border-sidebar">
            <Avatar label={initials(guide.name)} size={76} />
          </span>
          <div className="pb-1">
            <h1 className="font-display text-[22px] font-bold text-ink">{guide.name}</h1>
            <p className="text-[12.5px] font-semibold text-muted">{guide.craft}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="rise d2 mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Rating", value: `★ ${Number(guide.rating).toFixed(1)}` },
            {
              label: "Sessions",
              value:
                guide.session_count >= 1000
                  ? `${(guide.session_count / 1000).toFixed(1)}k`
                  : String(guide.session_count),
            },
            { label: "Practice", value: `${guide.years_practice} yrs` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[16px] border border-line bg-surface p-3.5 text-center"
            >
              <div className="font-display text-[17px] font-bold text-ink">{s.value}</div>
              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[1.5px] text-gold">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="rise d3 mt-4 rounded-[20px] border border-line bg-surface p-5">
          <div className="eyebrow mb-2">About</div>
          <p className="font-accent text-[15.5px] italic leading-relaxed text-ink-2">
            &ldquo;{guide.bio}&rdquo;
          </p>
          {guide.is_ai && (
            <p className="mt-3 border-t border-line-soft pt-3 text-[10.5px] leading-relaxed text-faint">
              ✦ {guide.name} is an AI persona trained with practitioner
              oversight — always disclosed, never pretending to be human.
            </p>
          )}
        </div>

        {/* Availability */}
        <div className="rise d4 mt-4 flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2.5 text-[12px] font-semibold text-body">
          <ClockIcon size={15} className="text-gold-dark" />
          {guide.is_online ? "Available now" : "Away — leave a message and start when they return"}
        </div>

        {/* CTAs */}
        <div className="rise d5 mt-5 flex gap-3">
          <Link
            href={`/guides/${guide.slug}/chat`}
            className="pressable flex-[1.2] rounded-full py-3.5 text-center text-[14px] font-bold text-cta-text shadow-[var(--shadow-ember)]"
            style={{ background: "var(--grad-ember)" }}
          >
            Chat now · {rate}/min
          </Link>
          <Link
            href="/wallet"
            className="pressable flex-1 rounded-full border border-gold-muted py-3.5 text-center text-[14px] font-bold text-gold-dark"
          >
            Top up wallet
          </Link>
        </div>
      </div>
    </div>
  );
}
