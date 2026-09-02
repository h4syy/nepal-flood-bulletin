import type { Person, PersonStatus } from "@/lib/feed";
import { detectCountry, isForeign } from "@/lib/derive";
import { romanKey } from "@/lib/translit";

const SOURCE_URL = "https://rescue.opmcm.gov.np";

export type OpmcmReport = {
  _id?: string;
  type?: string;
  fullName?: string;
  approximateAge?: string | number | null;
  locationText?: string | null;
  eventAt?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isDuplicate?: boolean | null;
  source?: string | null;
  ndrrmaId?: number | null;
  importRef?: string | null;
};

const FLOOD_SOURCE_TAGS = new Set(["setu", "ndrrma-rescued", "flood-victims-tracking"]);

const FLOOD_DISTRICT_KEYWORDS = [
  "rasuwa", "nuwakot", "sindhupalchok", "dhading",
  "रसुवा", "नुवाकोट", "सिन्धुपाल्चोक", "धादिङ",
];

function isFloodLinked(raw: OpmcmReport): boolean {
  const src = (raw.source ?? "").toLowerCase().trim();
  if (FLOOD_SOURCE_TAGS.has(src)) return true;
  const ref = (raw.importRef ?? "").toLowerCase();
  if (
    ref.startsWith("ndrrma-rescued:") ||
    ref.startsWith("setu:") ||
    ref.startsWith("flood-victims-tracking:")
  )
    return true;
  const blob = `${raw.locationText ?? ""} ${raw.description ?? ""}`.toLowerCase();
  return FLOOD_DISTRICT_KEYWORDS.some((kw) => blob.includes(kw));
}

function statusFrom(type?: string): PersonStatus | null {
  if (type === "lost") return "missing";
  if (type === "found") return "found";
  return null;
}

function imageUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.startsWith("http") ? value : `${SOURCE_URL}${value}`;
}

function reportUrl(id?: string): string {
  return id ? `${SOURCE_URL}/person-reports/${id}` : SOURCE_URL;
}

function normalizeReport(raw: OpmcmReport, index: number): Person | null {
  if (raw.isDuplicate) return null;

  const status = statusFrom(raw.type);
  if (!status) return null;

  const name = raw.fullName?.trim();
  if (!name || name === "-") return null;
  const nameTokens = romanKey(name).split(" ").filter(Boolean);
  if (nameTokens.length < 2) return null;

  const blob = [name, raw.locationText, raw.description].filter(Boolean).join(" ");

  return {
    id: `opmcm-${raw._id || index}`,
    name,
    place: raw.locationText || undefined,
    age: raw.approximateAge == null ? undefined : String(raw.approximateAge),
    when: raw.eventAt ? new Date(raw.eventAt).toISOString() : undefined,
    note: raw.description || undefined,
    photo: imageUrl(raw.imageUrl),
    source: { label: "OPMCM Lost & Found", url: reportUrl(raw._id) },
    country:
      detectCountry(blob) ??
      (isForeign({ name, place: raw.locationText || undefined, note: raw.description || undefined })
        ? "Foreign"
        : "Nepal"),
    rescueStatus: status === "found" ? "Community-reported found" : undefined,
    status,
    ndrrmaId: raw.ndrrmaId != null ? String(raw.ndrrmaId) : undefined,
    floodLinked: isFloodLinked(raw),
  };
}

function dedupeKey(person: Person): string {
  const name = romanKey(person.name)
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");
  return [person.status, name, person.age || ""].join("|");
}

export function normalizeOpmcmReports(items: OpmcmReport[]): {
  missing: Person[];
  found: Person[];
} {
  const seen = new Set<string>();
  const missing: Person[] = [];
  const found: Person[] = [];

  items.forEach((item, index) => {
    const person = normalizeReport(item, index);
    if (!person) return;

    const key = dedupeKey(person);
    if (seen.has(key)) return;
    seen.add(key);

    if (person.status === "missing") missing.push(person);
    else if (person.status === "found") found.push(person);
  });

  return { missing, found };
}
