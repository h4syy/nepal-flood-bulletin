import { NextResponse } from "next/server";
import { getFeed } from "@/lib/feed";

// Runs per request so it always reflects the current feed — but getFeed() reads
// the shared Data Cache (see serverCache.ts), so a hit here does NOT refetch the
// upstream, and the Cache-Control header lets Vercel's CDN serve most hits from
// the edge without invoking the function at all. This replaces the old bare
// force-dynamic (a fresh function + upstream refetch on every hit — see #9).
export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await getFeed();
  return NextResponse.json(feed, {
    headers: {
      // Edge-cache for 3 min, then serve stale for 10 more while revalidating.
      "Cache-Control": "public, s-maxage=180, stale-while-revalidate=600",
    },
  });
}
