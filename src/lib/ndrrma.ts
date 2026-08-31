import type { Person } from "@/lib/feed";
import { detectCountry } from "@/lib/derive";
import { cachedSource } from "@/lib/serverCache";

/**
 * Live official person data from NDRRMA's public API — both the rescued-persons
 * and the missing-persons lists. Fetched server-side and stored in Vercel's
 * shared Data Cache (see serverCache.ts) so the list is pulled at most once per
 * revalidate window across the whole fleet — not once per serverless instance.
 *
 * limit=-1 (and limits >~1500) truncate the response, so we paginate at a size
 * that always returns valid JSON. NDRRMA also throttles *concurrent* requests
 * from one IP (7 parallel took ~13s), so we page through them sequentially.
 */

const RESCUED_URL = "https://ndrrma.gov.np/api/v1/rescues/rescued-persons/";
const MISSING_URL = "https://ndrrma.gov.np/api/v1/rescues/missing-persons/";
const PAGE = 1000;
const SOURCE = { label: "NDRRMA", url: "https://ndrrma.gov.np/np/misc-report/380" };

// How long the shared cache serves a snapshot before revalidating in the
// background. This is now the *global* fetch cadence for the NDRRMA list.
const REVALIDATE_S = 180;
const TIMEOUT_MS = 30_000;

async function fetchPage(
  base: string,
  offset: number,
  signal: AbortSignal,
): Promise<{ rows: unknown[]; count: number }> {
  const res = await fetch(`${base}?limit=${PAGE}&offset=${offset}`, {
    signal,
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return {
    rows: Array.isArray(json?.results) ? json.results : [],
    count: Number(json?.count) || 0,
  };
}

async function fetchAllRows(
  base: string,
  signal: AbortSignal,
): Promise<{ rows: unknown[]; count: number }> {
  const first = await fetchPage(base, 0, signal);
  let rows = first.rows;
  for (let o = PAGE; o < first.count; o += PAGE) {
    // retry a flaky page a couple of times; on a hard failure skip it (a small
    // gap) rather than dropping every later page.
    let got: { rows: unknown[]; count: number } | null = null;
    for (let attempt = 0; attempt < 3 && !got; attempt++) {
      try {
        got = await fetchPage(base, o, signal);
      } catch {
        /* retry */
      }
    }
    if (got) rows = rows.concat(got.rows);
  }
  return { rows, count: first.count };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function country(r: any, extra: string): string | undefined {
  const natRaw = String(r?.nationality ?? "").trim().toLowerCase();
  if (r?.country) return String(r.country).trim();
  if (natRaw === "nepali") return "Nepal";
  if (natRaw === "foreign") return detectCountry(extra) ?? "Foreign";
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hasName = (r: any) =>
  String(r?.name_ne ?? "").trim() || String(r?.name ?? "").trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRescued(rows: any[]): Person[] {
  return rows.filter(hasName).map((r) => {
    const nameEn = String(r?.name ?? "").trim();
    const nameNe = String(r?.name_ne ?? "").trim();
    const display = nameNe || nameEn || "-";
    const loc = r?.rescued_location ?? {};
    const place = String(loc?.title_ne || loc?.title || "").trim() || undefined;
    const remarks = String(r?.remarks ?? "").trim();
    const c = country(r, [nameEn, nameNe, remarks].join(" "));

    const parts: string[] = [];
    if (r?.rescued_date) parts.push(`Rescued ${r.rescued_date}`);
    if (r?.status?.title) parts.push(String(r.status.title));
    if (c && c !== "Nepal") parts.push(c);
    if (remarks) parts.push(remarks);

    return {
      id: `ndrrma-${r?.id ?? Math.random().toString(36).slice(2)}`,
      name: display,
      nameEn: nameEn && nameEn !== display ? nameEn : undefined,
      place,
      age: r?.age != null ? String(r.age) : undefined,
      note: parts.join(" · ") || undefined,
      source: SOURCE,
      country: c,
      rescueStatus: r?.status?.title ? String(r.status.title) : undefined,
      status: "found" as const,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMissing(rows: any[]): Person[] {
  return rows.filter(hasName).map((r) => {
    const nameEn = String(r?.name ?? "").trim();
    const nameNe = String(r?.name_ne ?? "").trim();
    const display = nameNe || nameEn || "-";
    const remarks = String(r?.remarks ?? "").trim();
    const gender = String(r?.gender ?? "").trim();
    const c = country(r, [nameEn, nameNe, remarks].join(" "));

    const parts: string[] = [];
    if (gender) parts.push(gender);
    if (c && c !== "Nepal") parts.push(c);
    if (remarks) parts.push(remarks);

    return {
      id: `ndrrma-miss-${r?.id ?? Math.random().toString(36).slice(2)}`,
      name: display,
      nameEn: nameEn && nameEn !== display ? nameEn : undefined,
      age: r?.age != null ? String(r.age) : undefined,
      when: r?.last_contact ? String(r.last_contact) : undefined,
      note: parts.join(" · ") || undefined,
      source: SOURCE,
      country: c,
      status: "missing" as const,
    };
  });
}

// One full sequential page-through of a list, tagged with whether we believe we
// pulled every row. Cached in the shared Data Cache so it runs at most once per
// revalidate window across all instances.
async function loadFresh(
  url: string,
  normalize: (rows: unknown[]) => Person[],
): Promise<{ people: Person[]; complete: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const { rows, count } = await fetchAllRows(url, controller.signal);
    const complete = count > 0 && rows.length >= count * 0.95;
    return { people: normalize(rows), complete };
  } finally {
    clearTimeout(timer);
  }
}

const rescuedCached = cachedSource(
  "ndrrma-rescued",
  () => loadFresh(RESCUED_URL, normalizeRescued),
  REVALIDATE_S,
);
const missingCached = cachedSource(
  "ndrrma-missing",
  () => loadFresh(MISSING_URL, normalizeMissing),
  REVALIDATE_S,
);

// Anti-shrink net: NDRRMA occasionally returns a short response even paging
// sequentially. The shared cache guards the fetch *frequency*; this guards the
// *value* so a flaky partial can never shrink what we already show. A snapshot
// only replaces the best when it's marked complete (reflects a real change) or
// is at least as large. Per-instance, but cheap and purely additive on top of
// the shared cache.
let bestRescued: Person[] = [];
let bestMissing: Person[] = [];

function keepBest(
  best: Person[],
  next: { people: Person[]; complete: boolean } | null,
): Person[] {
  if (!next || !next.people.length) return best;
  if (next.complete || next.people.length >= best.length) return next.people;
  return best;
}

export async function getNdrrmaRescued(): Promise<Person[]> {
  let snap: { people: Person[]; complete: boolean } | null = null;
  try {
    snap = await rescuedCached();
  } catch {
    /* keep last good */
  }
  bestRescued = keepBest(bestRescued, snap);
  return bestRescued;
}

export async function getNdrrmaMissing(): Promise<Person[]> {
  let snap: { people: Person[]; complete: boolean } | null = null;
  try {
    snap = await missingCached();
  } catch {
    /* keep last good */
  }
  bestMissing = keepBest(bestMissing, snap);
  return bestMissing;
}

// Official aggregate totals — a tiny, always-valid call (the full list flakes,
// this doesn't). NDRRMA's rescued total includes records with no published
// name, so it runs ahead of what we can make searchable.
const STATUS_COUNTS_URL = "https://ndrrma.gov.np/api/v1/rescues/status-counts/";

const countsCached = cachedSource(
  "ndrrma-counts",
  async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    try {
      const [sc, mp] = await Promise.all([
        fetch(STATUS_COUNTS_URL, { signal: controller.signal, cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch(`${MISSING_URL}?limit=1`, { signal: controller.signal, cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);
      return {
        rescued: Number(sc?.total_count) || 0,
        missing: Number(mp?.count) || 0,
      };
    } finally {
      clearTimeout(timer);
    }
  },
  REVALIDATE_S,
);

export async function getNdrrmaCounts(): Promise<{ rescued: number; missing: number }> {
  try {
    return await countsCached();
  } catch {
    return { rescued: 0, missing: 0 };
  }
}
