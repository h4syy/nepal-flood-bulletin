import { z } from "zod";
import { SITE } from "@/lib/config";
import { cachedSource } from "@/lib/serverCache";

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

const REVALIDATE_S = 180;
const TIMEOUT_MS = 8_000;

async function fetchRivers(): Promise<{ parsed: z.infer<typeof RiversSchema>; fetchedAt: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(SITE.defaultRiverUrl, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = RiversSchema.parse(await res.json());
    return { parsed, fetchedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timer);
  }
}

// Shared across instances; fetched at most once per revalidate window (see #8/#9).
const riversCached = cachedSource("rivers", fetchRivers, REVALIDATE_S);

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
  let snap: { parsed: z.infer<typeof RiversSchema>; fetchedAt: string } | null = null;
  try {
    snap = await riversCached();
  } catch {
    /* fall through to empty */
  }

  if (!snap) {
    return {
      updatedAt: null,
      fetchedAt: null,
      status: "error",
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
  }

  const stations = snap.parsed.stations.map(normalize);
  const danger = stations.filter((s) => s.risk === "danger").length;
  const warning = stations.filter((s) => s.risk === "warning").length;
  const normal = stations.filter((s) => s.risk === "normal").length;

  const pcts = stations
    .filter((s) => s.levelM != null && s.dangerM != null && s.dangerM > 0)
    .map((s) => (s.levelM! / s.dangerM!) * 100);
  const maxPctToDanger = pcts.length ? Math.round(Math.max(...pcts)) : null;

  return {
    updatedAt: snap.parsed.updated_at ?? null,
    fetchedAt: snap.fetchedAt,
    status: "ok",
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
