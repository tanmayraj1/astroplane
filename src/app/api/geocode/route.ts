import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/server";

/**
 * Birth-place search proxy → Open-Meteo geocoding (free, keyless, includes IANA tz).
 * GET /api/geocode?q=Portland
 */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`,
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) return NextResponse.json({ results: [] });

  const data = (await res.json()) as {
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      country: string;
      admin1?: string;
      timezone: string;
    }>;
  };

  return NextResponse.json({
    results: (data.results ?? []).map((r) => ({
      label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
      lat: r.latitude,
      lng: r.longitude,
      tz: r.timezone,
    })),
  });
}
