import { z } from "zod";
import { SITE } from "@/lib/config";

const StationSchema = z
  .object({
    station_id: z.string().nullish(),
    name: z.string().nullish(),
    name_np: z.string().nullish(),
    district_np: z.string().nullish(),
    warning_m: z.number().nullish(),
    danger_m: z.number().nullish(),
    washed: z.boolean().nullish(),
    level_m: z.number().nullish(),
    status: z.string().nullish(),
    steady: z.string().nullish(),
    observed_at: z.string().nullish(),
    observed_npt: z.string().nullish(),
    silent: z.boolean().nullish(),
    source: z.string().nullish(),
  })
  .passthrough();

const RiversSchema = z
  .object({
    updated_at: z.string().nullish(),
    note_np: z.string().nullish(),
    stations: z.array(StationSchema).optional().default([]),
  })
  .passthrough();

export type RiverRisk = "danger" | "warning" | "normal" | "unknown";

export type Station = {
  id: string;
  name: string;
  nameNp: string;
  districtNp: string;
  warningM: number | null;
  dangerM: number | null;
  levelM: number | null;
  statusRaw: string;
  trend: "rising" | "falling" | "steady" | "unknown";
  observedAt: string | null;
  observedNpt: string | null;
  source: string | null;
  washed: boolean;
  silent: boolean;
  risk: RiverRisk;
  /** 0–100 fill for the level bar, scaled to the danger (or ~warning) threshold. */
  fillPct: number;
  /** marker position (0–100) for the warning threshold on that same bar. */
  warnMarkPct: number | null;
};

export type RiversData = {
  updatedAt: string | null;
  fetchedAt: string | null;
  status: "ok" | "error" | "never";
  stations: Station[];
  summary: {
    total: number;
    danger: number;
    warning: number;
    normal: number;
    aboveWarning: number; // danger + warning
    anyDanger: boolean;
    anyWarning: boolean;
    maxPctToDanger: number | null;
  };
};

let cache: {
  parsed: z.infer<typeof RiversSchema>;
  fetchedAt: number;
} | null = null;
let lastStatus: RiversData["status"] = "never";
let lastAttempt = 0;
const TTL_MS = 5 * 60 * 1000;
const MIN_GAP_MS = 30_000;
const TIMEOUT_MS = 8_000;

async function fetchRivers(): Promise<z.infer<typeof RiversSchema>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  lastAttempt = Date.now();
  try {
    const res = await fetch(SITE.defaultRiverUrl, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = RiversSchema.parse(await res.json());
    cache = { parsed, fetchedAt: Date.now() };
    lastStatus = "ok";
    return parsed;
  } catch (err) {
    lastStatus = "error";
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function trendOf(steady?: string | null): Station["trend"] {
  const s = (steady || "").toUpperCase();
  if (s.includes("RIS")) return "rising";
  if (s.includes("FALL")) return "falling";
  if (s.includes("STEAD")) return "steady";
  return "unknown";
}

function riskOf(level: number | null, warn: number | null, danger: number | null, status?: string | null): RiverRisk {
  if (level != null) {
    if (danger != null && level >= danger) return "danger";
    if (warn != null && level >= warn) return "warning";
    if (warn != null || danger != null) return "normal";
  }
  const s = (status || "").toUpperCase();
  if (s.includes("DANGER")) return "danger";
  if (s.includes("WARNING") && !s.includes("BELOW")) return "warning";
  if (s.includes("BELOW")) return "normal";
  return "unknown";
}

function normalize(station: z.infer<typeof StationSchema>): Station {
  const levelM = station.level_m ?? null;
  const warningM = station.warning_m ?? null;
  const dangerM = station.danger_m ?? null;
  const risk = riskOf(levelM, warningM, dangerM, station.status);

  // Bar scaled to danger threshold if present, else ~1.33x warning.
  const base = dangerM ?? (warningM != null ? warningM * 1.33 : levelM ?? 1);
  const fillPct =
    levelM != null && base > 0 ? Math.max(3, Math.min(100, (levelM / base) * 100)) : 0;
  const warnMarkPct =
    warningM != null && base > 0 ? Math.min(100, (warningM / base) * 100) : null;

  return {
    id: station.station_id || station.name || Math.random().toString(36).slice(2),
    name: station.name || station.name_np || "-",
    nameNp: station.name_np || station.name || "-",
    districtNp: station.district_np || "",
    warningM,
    dangerM,
    levelM,
    statusRaw: station.status || "",
    trend: trendOf(station.steady),
    observedAt: station.observed_at ?? null,
    observedNpt: station.observed_npt ?? null,
    source: station.source ?? null,
    washed: Boolean(station.washed),
    silent: Boolean(station.silent),
    risk,
    fillPct,
    warnMarkPct,
  };
}

export async function getRivers(): Promise<RiversData> {
  const stale = !cache || Date.now() - cache.fetchedAt > TTL_MS;

  if (!cache) {
    try {
      await fetchRivers();
    } catch {
      /* fall through to empty */
    }
  } else if (stale && Date.now() - lastAttempt > MIN_GAP_MS) {
    void fetchRivers().catch(() => {});
  }

  const empty: RiversData = {
    updatedAt: null,
    fetchedAt: cache ? new Date(cache.fetchedAt).toISOString() : null,
    status: lastStatus,
    stations: [],
    summary: {
      total: 0,
      danger: 0,
      warning: 0,
      normal: 0,
      aboveWarning: 0,
      anyDanger: false,
      anyWarning: false,
      maxPctToDanger: null,
    },
  };
  if (!cache) return empty;

  const stations = cache.parsed.stations.map(normalize);
  const danger = stations.filter((s) => s.risk === "danger").length;
  const warning = stations.filter((s) => s.risk === "warning").length;
  const normal = stations.filter((s) => s.risk === "normal").length;

  const pcts = stations
    .filter((s) => s.levelM != null && s.dangerM != null && s.dangerM > 0)
    .map((s) => (s.levelM! / s.dangerM!) * 100);
  const maxPctToDanger = pcts.length ? Math.round(Math.max(...pcts)) : null;

  return {
    updatedAt: cache.parsed.updated_at ?? null,
    fetchedAt: new Date(cache.fetchedAt).toISOString(),
    status: lastStatus,
    stations,
    summary: {
      total: stations.length,
      danger,
      warning,
      normal,
      aboveWarning: danger + warning,
      anyDanger: danger > 0,
      anyWarning: warning > 0,
      maxPctToDanger,
    },
  };
}
