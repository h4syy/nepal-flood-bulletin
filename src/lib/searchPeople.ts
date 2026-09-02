import type { Person } from "@/lib/feed";
import { romanKey } from "@/lib/translit";

export type SearchTab = "all" | "missing" | "found" | "deceased";

export type SearchCounts = {
  missing: number;
  found: number;
  deceased: number;
};

export type SearchResponse = {
  results: Person[];
  total: number;
  page: number;
  totalPages: number;
  fuzzyCount: number;
  counts: SearchCounts;
  countries: [string, number][];
  rescueStatuses: [string, number][];
};

const PAGE_SIZE = 24;

function listForTab(
  tab: SearchTab,
  lists: { missing: Person[]; found: Person[]; deceased: Person[] },
): Person[] {
  if (tab === "missing") return lists.missing;
  if (tab === "found") return lists.found;
  if (tab === "deceased") return lists.deceased;
  return [...lists.missing, ...lists.found, ...lists.deceased];
}

function countryOptions(list: Person[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const p of list) {
    if (p.country) counts.set(p.country, (counts.get(p.country) || 0) + 1);
  }
  const rank = (c: string) => (c === "Nepal" ? 0 : c === "Foreign" ? 2 : 1);
  return [...counts.entries()].sort((a, b) =>
    rank(a[0]) !== rank(b[0])
      ? rank(a[0]) - rank(b[0])
      : a[0].localeCompare(b[0]),
  );
}

function rescueStatusOptions(list: Person[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const p of list) {
    if (p.rescueStatus)
      counts.set(p.rescueStatus, (counts.get(p.rescueStatus) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function searchPeople({
  q,
  tab,
  country,
  rescueStatus,
  page,
  missing,
  found,
  deceased,
}: {
  q: string;
  tab: SearchTab;
  country: string;
  rescueStatus: string;
  page: number;
  missing: Person[];
  found: Person[];
  deceased: Person[];
}): SearchResponse {
  const list = listForTab(tab, { missing, found, deceased });
  const base = list
    .filter((p) => country === "all" || p.country === country)
    .filter((p) => rescueStatus === "all" || p.rescueStatus === rescueStatus);

  const raw = q.trim();
  let results: Person[];
  let fuzzyCount = 0;

  if (!raw) {
    results = base;
  } else {
    const plainQ = raw.toLowerCase();
    const qWords = romanKey(raw).split(" ").filter(Boolean);
    const exactName: Person[] = [];
    const exactOther: Person[] = [];
    const fuzzy: Person[] = [];

    for (const p of base) {
      const blob = [p.name, p.nameEn, p.place, p.phone, p.note, p.when]
        .filter(Boolean)
        .join(" ");
      const nameBlob = [p.name, p.nameEn].filter(Boolean).join(" ");
      const plain = blob.toLowerCase();
      const plainName = nameBlob.toLowerCase();
      const key = romanKey(blob);

      if (plainName.includes(plainQ)) exactName.push(p);
      else if (plain.includes(plainQ)) exactOther.push(p);
      else if (qWords.length > 0 && qWords.every((w) => key.includes(w)))
        fuzzy.push(p);
    }

    fuzzyCount = fuzzy.length;
    results = [...exactName, ...exactOther, ...fuzzy];
  }

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * PAGE_SIZE;

  return {
    results: results.slice(start, start + PAGE_SIZE),
    total,
    page: current,
    totalPages,
    fuzzyCount,
    counts: {
      missing: missing.length,
      found: found.length,
      deceased: deceased.length,
    },
    countries: countryOptions(list),
    rescueStatuses: rescueStatusOptions(list),
  };
}
