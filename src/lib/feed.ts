import { z } from "zod";
import { SITE } from "@/lib/config";
import { parseReportTime, isForeign, detectCountry } from "@/lib/derive";
import { cachedSource } from "@/lib/serverCache";

// ---------- Upstream JSON schema (kept lenient; we never reject the whole feed
// because one entry is odd) ----------

// The upstream sheet emits `null` for empty cells (not just missing keys), so
// every field is `.nullish()` (accepts string | null | undefined). Nulls are
// coerced to undefined in normalizeEntry below.
const EntrySchema = z
  .object({
    id: z.string().nullish(),
    name: z.string().nullish(),
    place: z.string().nullish(),
    phone: z.string().nullish(),
    age: z
      .union([z.string(), z.number()])
      .nullish()
      .transform((v) => (v == null ? undefined : String(v))),
    when: z.string().nullish(),
    note: z.string().nullish(),
    name_en: z.string().nullish(),
    photo: z.string().nullish(),
    reporter: z.string().nullish(),
  })
  .passthrough();

const FeedSchema = z
  .object({
    updated_at: z.string().nullish(),
    sheet: z.string().nullish(),
    responses_sheet: z.string().nullish(),
    forms: z
      .object({ missing: z.string().nullish(), found: z.string().nullish() })
      .partial()
      .passthrough()
      .nullish(),
    missing: z.array(EntrySchema).optional().default([]),
    found: z.array(EntrySchema).optional().default([]),
    matched: z.array(EntrySchema).optional().default([]),
  })
  .passthrough();

export type RawEntry = z.infer<typeof EntrySchema>;

// ---------- Normalized types used by the UI ----------

export type PersonStatus = "missing" | "found" | "deceased";

export type Person = {
  id: string;
  name: string;
  nameEn?: string;
  place?: string;
  phone?: string;
  age?: string;
  when?: string;
  note?: string;
  photo?: string;
  reportedAt?: string; // ISO time this report was filed (from the entry id)
  source?: { label: string; url: string }; // where this entry came from
  country?: string; // "Nepal" | a specific country | "Foreign"
  rescueStatus?: string; // NDRRMA status: Safe / Injured / Under Medical Care / …
  status: PersonStatus;
  flagged?: boolean;
  possiblyRescued?: boolean; // listed as missing but also appears in the rescued list
};

export type NormalizedFeed = {
  updatedAt: string | null; // upstream `updated_at`
  fetchedAt: string | null; // when we last successfully fetched
  sheetUrl: string | null;
  forms: { missing: string | null; found: string | null };
  missing: Person[];
  found: Person[];
  matchedCount: number; // reunited (missing -> found) pairs, from upstream
  counts: { missing: number; found: number };
  status: "ok" | "error" | "never";
  sourceUrl: string;
  stale: boolean; // serving cached data while the live source is failing
};

// ---------- Fetch + shared cache ----------
//
// The feed payload lives in Vercel's shared Data Cache (see serverCache.ts), so
// every instance reads the same snapshot and the upstream is fetched at most
// once per revalidate window — not once per cold serverless start (which is why
// the old fire-and-forget "background refresh" never really ran: a serverless
// instance freezes the moment it responds). A tiny per-instance parse cache
// avoids re-parsing an unchanged payload, and a per-instance "last good" lets us
// keep serving if a live fetch fails outright.

const FETCH_TIMEOUT_MS = 8_000;
const REVALIDATE_S = 180;

let parsedCache: { payload: string; feed: z.infer<typeof FeedSchema> } | null =
  null;
let lastGood: { text: string; fetchedAt: string } | null = null;

async function fetchJson(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch the upstream feed with failover across sources (GitHub Pages -> the
 * raw committed file) and validate its shape. Throws if none is reachable/valid.
 */
async function fetchPayload(): Promise<{ text: string; fetchedAt: string }> {
  const candidates = [
    SITE.defaultFeedUrl,
    SITE.backupFeedUrl,
    SITE.rawFeedUrl,
  ].filter((u, i, arr) => u && arr.indexOf(u) === i);

  let text: string | undefined;
  let lastErr: unknown;
  for (const url of candidates) {
    try {
      text = await fetchJson(url);
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (text === undefined) {
    throw lastErr instanceof Error ? lastErr : new Error("no feed source reachable");
  }
  FeedSchema.parse(JSON.parse(text)); // validate shape; throws if wildly wrong
  return { text, fetchedAt: new Date().toISOString() };
}

const payloadCached = cachedSource("feed", fetchPayload, REVALIDATE_S);

function normalizeEntry(
  raw: RawEntry,
  index: number,
  status: PersonStatus,
): Person {
  return {
    id: raw.id ?? `${status}-${index}-${(raw.name || "unknown").slice(0, 24)}`,
    name: raw.name || "-",
    nameEn: raw.name_en ?? undefined,
    place: raw.place ?? undefined,
    phone: raw.phone ?? undefined,
    age: raw.age ?? undefined,
    when: raw.when ?? undefined,
    note: raw.note ?? undefined,
    photo: raw.photo ?? undefined,
    reportedAt: parseReportTime(raw.id ?? undefined)?.toISOString() ?? undefined,
    source: {
      label: SITE.attribution.label,
      // Deep-link to the exact section on the source site so people land on the
      // real data (rescued vs missing), not a generic homepage.
      url: `${SITE.attribution.url}#${status === "found" ? "fam-found" : "fam-missing"}`,
    },
    country:
      detectCountry(
        [raw.name, raw.place, raw.note, raw.phone].filter(Boolean).join(" "),
      ) ??
      (isForeign({
        name: raw.name || "",
        place: raw.place ?? undefined,
        phone: raw.phone ?? undefined,
        note: raw.note ?? undefined,
      })
        ? "Foreign"
        : "Nepal"),
    status,
  };
}

// ---------- Public read API ----------

export async function getFeed(): Promise<NormalizedFeed> {
  let snap: { text: string; fetchedAt: string } | null = null;
  let fetchFailed = false;
  try {
    snap = await payloadCached();
    lastGood = snap;
  } catch {
    // Live fetch failed (and nothing cached yet) — serve this instance's last
    // good snapshot if we have one, otherwise an empty feed.
    fetchFailed = true;
    snap = lastGood;
  }

  const empty: NormalizedFeed = {
    updatedAt: null,
    fetchedAt: snap ? snap.fetchedAt : null,
    sheetUrl: null,
    forms: { missing: null, found: null },
    missing: [],
    found: [],
    matchedCount: 0,
    counts: { missing: 0, found: 0 },
    status: snap ? "ok" : "error",
    sourceUrl: SITE.defaultFeedUrl,
    stale: fetchFailed,
  };

  if (!snap) return empty;

  let feed: z.infer<typeof FeedSchema>;
  if (parsedCache && parsedCache.payload === snap.text) {
    feed = parsedCache.feed;
  } else {
    try {
      feed = FeedSchema.parse(JSON.parse(snap.text));
      parsedCache = { payload: snap.text, feed };
    } catch {
      return empty;
    }
  }

  const missing = feed.missing.map((e, i) => normalizeEntry(e, i, "missing"));
  const found = feed.found.map((e, i) => normalizeEntry(e, i, "found"));

  return {
    updatedAt: feed.updated_at ?? null,
    fetchedAt: snap.fetchedAt,
    sheetUrl: feed.sheet ?? null,
    forms: {
      missing: feed.forms?.missing ?? null,
      found: feed.forms?.found ?? null,
    },
    missing,
    found,
    matchedCount: feed.matched.length,
    counts: { missing: missing.length, found: found.length },
    status: "ok",
    sourceUrl: SITE.defaultFeedUrl,
    stale: fetchFailed,
  };
}
