import { cache } from "react";
import { getFeed } from "@/lib/feed";
import { getRivers } from "@/lib/rivers";
import { getRecentUpdates } from "@/lib/updates";
import {
  getNdrrmaRescued,
  getNdrrmaMissing,
  getNdrrmaCounts,
} from "@/lib/ndrrma";
import { getBulletinRescued, getHospitalStats } from "@/lib/bulletin";
import { getPoliceBodies } from "@/lib/police";
import { getDaoRescued } from "@/lib/dao";
import { getTweetRescued } from "@/lib/tweetRescued";
import { getOpmcmPeople } from "@/lib/opmcm";
import { romanKey } from "@/lib/translit";
import { deriveKpis } from "@/lib/metrics";
import type { Person } from "@/lib/feed";

// Dedupe repeated entries from the same source without hiding matching records
// reported by another source.
function dedupePeople(lists: Person[][]): Person[] {
  const seen = new Set<string>();
  const out: Person[] = [];
  for (const list of lists) {
    for (const p of list) {
      const name = romanKey(p.name)
        .split(" ")
        .filter(Boolean)
        .sort()
        .join(" ");
      const source = p.source?.label || p.source?.url || "";
      const key = `${p.status}|${source}|${name}|${p.age || ""}`;
      if (p.name && p.name !== "-" && seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

/**
 * Fetches every source, merges + dedupes them, and derives the counts + KPIs.
 * Wrapped in React `cache()` so the several streamed sections on the page share
 * a single computation per request instead of each re-fetching.
 */
export const getDirectory = cache(async () => {
  const [feed, rivers, updates, ndrrma, ndrrmaMissing, bulletin, police, official, opmcm] =
    await Promise.all([
      getFeed(),
      getRivers(),
      getRecentUpdates(),
      getNdrrmaRescued(),
      getNdrrmaMissing(),
      getBulletinRescued(),
      getPoliceBodies(),
      getNdrrmaCounts(), // official aggregate totals (tiny, reliable)
      getOpmcmPeople(),
    ]);
  const hospitalStats = await getHospitalStats();

  const ndrrmaIds = new Set([
    ...ndrrma.map((p) => p.id.replace(/^ndrrma-/, "")),
    ...ndrrmaMissing.map((p) => p.id.replace(/^ndrrma-miss-/, "")),
  ]);
  const notInNdrrma = (p: Person) => !p.ndrrmaId || !ndrrmaIds.has(p.ndrrmaId);

  const found = dedupePeople([
    ndrrma,
    bulletin,
    getTweetRescued(),
    feed.found,
    getDaoRescued(),
    opmcm.found.filter(notInNdrrma),
  ]);
  const missingRaw = dedupePeople([ndrrmaMissing, feed.missing, opmcm.missing.filter(notInNdrrma)]);

  // Flag anyone in the missing list who also appears in the rescued list
  // (same name + age) — they may already be safe.
  const foundKeys = new Set(
    found.filter((p) => p.age).map((p) => `${romanKey(p.name)}|${p.age}`),
  );
  const missing = missingRaw.map((p) =>
    p.age && foundKeys.has(`${romanKey(p.name)}|${p.age}`)
      ? { ...p, possiblyRescued: true }
      : p,
  );

  const deceased = police;

  // OPMCM stays fully searchable (it's in `missing`/`found` above), but it never
  // feeds the headline. The hero counts and the KPI reflect only our curated /
  // official sources, so the site never claims, say, ~10k "missing" sourced from
  // a crowd-aggregated national registry. OPMCM records still surface by name for
  // any family searching, each carrying its own "national registry" label.
  const isOpmcm = (p: Person) => p.source?.label === "OPMCM Lost & Found";
  const curatedMissing = missing.filter((p) => !isOpmcm(p));
  const curatedFound = found.filter((p) => !isOpmcm(p));

  const merged = {
    ...feed,
    missing,
    found,
    // Headline counts: curated sources only (OPMCM is searchable, not counted).
    counts: { missing: curatedMissing.length, found: curatedFound.length },
  };
  const kpis = deriveKpis(
    {
      ...merged,
      missing: curatedMissing,
      found: curatedFound,
      counts: { missing: curatedMissing.length, found: curatedFound.length },
    },
    rivers,
  );

  return { feed, updates, merged, deceased, hospitalStats, kpis, official };
});
