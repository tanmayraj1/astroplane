"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBirthDetails } from "@/server/actions/onboarding";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Place {
  label: string;
  lat: number;
  lng: number;
  tz: string;
}

const field =
  "w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-gold";
const label =
  "mb-1.5 block text-[9.5px] font-bold uppercase tracking-[2px] text-gold";

export function BirthForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [noTime, setNoTime] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (placeQuery.length < 2 || place?.label === placeQuery) {
      setSuggestions([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(placeQuery)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, [placeQuery, place]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!place) {
      setError("Pick your birth place from the suggestions so we can locate your sky.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveBirthDetails({
        displayName: name,
        birthDate: date,
        birthTime: noTime ? null : time,
        birthPlace: place.label,
        lat: place.lat,
        lng: place.lng,
        tz: place.tz,
      });
      router.push("/onboarding/chronotype");
    } catch {
      setError("Something went wrong casting your chart. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <div className="rise d3">
        <span className={label}>Name</span>
        <input
          className={field}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maya Kapoor"
        />
      </div>

      <div className="rise d4 flex gap-3">
        <div className="flex-[1.2]">
          <span className={label}>Date of birth</span>
          <input
            className={field}
            type="date"
            required
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <span className={label}>Time</span>
          <input
            className={cn(field, noTime && "opacity-40")}
            type="time"
            value={time}
            disabled={noTime}
            required={!noTime}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <label className="rise d4 -mt-1 flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-muted">
        <input
          type="checkbox"
          checked={noTime}
          onChange={(e) => setNoTime(e.target.checked)}
          className="h-4 w-4 accent-[#B08947]"
        />
        I don&apos;t know my birth time
      </label>

      <div className="rise d5 relative z-20">
        <span className={label}>Place of birth</span>
        <input
          className={field}
          required
          value={placeQuery}
          onChange={(e) => {
            setPlaceQuery(e.target.value);
            setPlace(null);
          }}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder="Portland, Oregon"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-card)]">
            {suggestions.map((s) => (
              <li key={`${s.lat}${s.lng}`}>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-[13px] text-ink hover:bg-selected"
                  onClick={() => {
                    setPlace(s);
                    setPlaceQuery(s.label);
                    setOpen(false);
                  }}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="rise d6 text-[11.5px] leading-relaxed text-faint">
        No birth time? We&apos;ll cast a solar chart and simply skip the nudges
        that need an exact ascendant — nothing is guessed.
      </p>

      {error && (
        <p className="rounded-[10px] bg-[rgba(192,90,59,.1)] px-3 py-2 text-[11.5px] font-semibold text-clay">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={busy || !name || !date || (!time && !noTime)}
        className="rise d6 mt-1 w-full"
      >
        {busy ? "Casting your chart…" : "Cast my chart"}
      </Button>
    </form>
  );
}
