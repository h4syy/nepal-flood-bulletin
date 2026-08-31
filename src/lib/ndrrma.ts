import type { Person } from "@/lib/feed";
import { detectCountry } from "@/lib/derive";

/**
 * Live official person data from NDRRMA's public API — both the rescued-persons
 * and the missing-persons lists. Fetched server-side and cached in memory.
 *
 * limit=-1 (and limits >~1500) truncate the response, so we paginate at a size
 * that always returns valid JSON. NDRRMA also throttles *concurrent* requests
 * from one IP (7 parallel took ~13s), so we page through them sequentially.
 */

const RESCUED_URL = "https://ndrrma.gov.np/api/v1/rescues/rescued-persons/";
const MISSING_URL = "https://ndrrma.gov.np/api/v1/rescues/missing-persons/";
const PAGE = 1000;
const SOURCE = { label: "NDRRMA", url: "https://ndrrma.gov.np/np/misc-report/380" };

const TTL_MS = 10 * 60 * 1000;
const MIN_GAP_MS = 60_000;
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

type CacheBox = { c: { people: Person[]; at: number } | null; last: number };
const rescuedBox: CacheBox = { c: null, last: 0 };
const missingBox: CacheBox = { c: null, last: 0 };

async function load(
  url: string,
  normalize: (rows: unknown[]) => Person[],
  box: CacheBox,
): Promise<Person[]> {
  const stale = !box.c || Date.now() - box.c.at > TTL_MS;
  if (box.c && !stale) return box.c.people;
  if (box.c && stale && Date.now() - box.last < MIN_GAP_MS) return box.c.people;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  box.last = Date.now();
  try {
    const { rows, count } = await fetchAllRows(url, controller.signal);
    const people = normalize(rows);
    // We "got it all" if we pulled ~every page. Only overwrite the cache with a
    // complete fetch (reflects a real change) or a bigger one — a flaky partial
    // fetch must never shrink what we already show.
    const complete = count > 0 && rows.length >= count * 0.95;
    if (people.length && (complete || !box.c || people.length >= box.c.people.length)) {
      box.c = { people, at: Date.now() };
    }
    return box.c?.people ?? people;
  } catch {
    return box.c?.people ?? [];
  } finally {
    clearTimeout(timer);
  }
}

export function getNdrrmaRescued(): Promise<Person[]> {
  return load(RESCUED_URL, normalizeRescued, rescuedBox);
}

export function getNdrrmaMissing(): Promise<Person[]> {
  return load(MISSING_URL, normalizeMissing, missingBox);
}

// Official aggregate totals — a tiny, always-valid call (the full list flakes,
// this doesn't). NDRRMA's rescued total includes records with no published
// name, so it runs ahead of what we can make searchable.
const STATUS_COUNTS_URL = "https://ndrrma.gov.np/api/v1/rescues/status-counts/";
let countsCache: { data: { rescued: number; missing: number }; at: number } | null =
  null;

export async function getNdrrmaCounts(): Promise<{ rescued: number; missing: number }> {
  if (countsCache && Date.now() - countsCache.at < TTL_MS) return countsCache.data;
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
    const data = {
      rescued: Number(sc?.total_count) || 0,
      missing: Number(mp?.count) || 0,
    };
    if (data.rescued || data.missing) countsCache = { data, at: Date.now() };
    return countsCache?.data ?? data;
  } finally {
    clearTimeout(timer);
  }
}
