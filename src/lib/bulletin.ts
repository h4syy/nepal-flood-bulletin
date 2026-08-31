import { SITE } from "@/lib/config";
import type { Person } from "@/lib/feed";

/**
 * Rescued-persons lists published on the community Rasuwa Flood Bulletin
 * (maintained by Niraj Bhusal). The page embeds several official rescue lists
 * as static tables under named anchors; we parse them so families can search
 * everyone in one place, and each card deep-links back to the exact section on
 * the bulletin as its source.
 *
 * Fetched live and cached in-memory; on any failure we serve the last good
 * snapshot (or nothing — the NDRRMA API still covers the core list).
 */

const BASE = SITE.attribution.url.replace(/\/+$/, ""); // no trailing slash
const HTML_URL = `${BASE}/`;
const FETCH_TIMEOUT_MS = 9_000;
const TTL_MS = 10 * 60 * 1000;

// ---- small helpers ---------------------------------------------------------

const NE_DIGITS = "०१२३४५६७८९";
const toLatin = (s = "") => s.replace(/[०-९]/g, (d) => String(NE_DIGITS.indexOf(d)));
const toDate = (s = "") => toLatin(s).replace(/।/g, "/").trim(); // २०८३।०५।१० -> 2083/05/10
const digits = (s = "") => toLatin(s).replace(/[^0-9]/g, ""); // "—"/"१४" -> ""/"14"
const isNum = (c = "") => /^[0-9०-९]+$/.test(c.trim());
const joinNote = (...xs: (string | undefined)[]) =>
  xs.map((x) => (x || "").trim()).filter(Boolean).join(" · ");

// The "देश" (country) column on the foreign list is in Devanagari.
const COUNTRY_NE: Record<string, string> = {
  "भारत": "India", "भारतीय": "India", "चीन": "China", "चिन": "China",
  "बंगलादेश": "Bangladesh", "बङ्गलादेश": "Bangladesh", "भुटान": "Bhutan",
  "श्रीलंका": "Sri Lanka", "श्री लंका": "Sri Lanka", "मलेसिया": "Malaysia",
  "मलेशिया": "Malaysia", "अमेरिका": "USA", "बेलायत": "United Kingdom",
  "इटाली": "Italy", "कोरिया": "South Korea", "टर्की": "Turkey",
  "स्विट्जरल्यान्ड": "Switzerland", "रुस": "Russia", "जर्मनी": "Germany",
  "ओमान": "Oman", "फ्रान्स": "France", "जापान": "Japan", "क्यानडा": "Canada",
  "अष्ट्रेलिया": "Australia", "अस्ट्रेलिया": "Australia",
};
const countryNe = (s = "") => {
  const t = s.trim();
  return COUNTRY_NE[t] || (t ? t : "Foreign");
};

// ---- section definitions (anchor id on the bulletin -> how to read a row) --

type Section = {
  id: string; // anchor on the bulletin page (deep-link target)
  country: string | null; // fixed country, or null to read per-row
  map: (c: string[]) => Partial<Person> & { name?: string };
};

const SECTIONS: Section[] = [
  {
    id: "suryagadhi", country: "Nepal",
    map: (c) => ({ name: c[1], place: c[2], age: toLatin(c[3]), note: joinNote(c[4], "सूर्यगढी उद्धार") }),
  },
  {
    id: "rasuwa-res", country: "Nepal",
    map: (c) => ({ name: c[1], age: toLatin(c[2]), place: c[3], note: joinNote(c[4], "रसुवा/टिमुरे उद्धार") }),
  },
  {
    id: "dao-res", country: "Nepal",
    map: (c) => ({ name: c[1], place: c[2], age: toLatin(c[3]), note: joinNote(c[4], c[5], "NDRRMA सूची") }),
  },
  {
    id: "india-res", country: "India",
    map: (c) => ({ name: c[1], note: "भारतीय नागरिक उद्धार" }),
  },
  {
    id: "trishuli1-res", country: "India",
    map: (c) => ({ name: c[1], note: "त्रिशूली-१ उद्धार" }),
  },
  {
    id: "india-cross", country: "India",
    map: (c) => ({ name: c[1], note: "भारतीय · चीनबाट नेपाल सुरक्षित प्रवेश" }),
  },
  {
    id: "army-heli-res", country: "Nepal",
    map: (c) => ({ name: c[1], place: c[2], age: toLatin(c[3]), when: toDate(c[6]), note: joinNote(c[4], c[5], "सेना/हेलि उद्धार") }),
  },
  {
    id: "foreign-res", country: null,
    map: (c) => ({ name: c[1], country: countryNe(c[2]), place: c[2], age: toLatin(c[3]), when: toDate(c[5]), note: joinNote(c[4], "विदेशी उद्धार") }),
  },
  {
    id: "heli-ktm", country: "Nepal",
    map: (c) => ({ name: c[1], note: "काठमाडौं हेलि उद्धार" }),
  },
  {
    // Injured brought to Kathmandu hospitals for treatment. Two sub-tables:
    // 7 cols [sn,name,age,gender,addr,status,remark] and
    // 8 cols [sn,name,age,addr,contact,rescueLoc,hospital,status].
    id: "treat", country: "Nepal",
    map: (c) => {
      if (c.length >= 8) {
        const phone = /\d{6,}/.test(c[4] || "") ? c[4] : undefined;
        return {
          name: c[1], age: digits(c[2]), place: c[3], phone,
          note: joinNote(c[7], c[6], "उपचार · काठमाडौं"),
        };
      }
      return {
        name: c[1], age: digits(c[2]), place: c[4],
        note: joinNote(c[3], c[5], c[6], "उपचार · काठमाडौं"),
      };
    },
  },
];

// ---- HTML table parsing ----------------------------------------------------

function sliceSection(html: string, id: string): string {
  const i = html.indexOf(`id="${id}"`);
  if (i < 0) return "";
  const start = html.lastIndexOf("<section", i);
  let end = html.indexOf("<section", i + 1);
  if (end < 0) end = html.length;
  return html.slice(start < 0 ? i : start, end);
}

function tableRows(sectionHtml: string): string[][] {
  return (sectionHtml.match(/<tr[\s\S]*?<\/tr>/g) || []).map((tr) =>
    (tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) || []).map((cell) =>
      cell
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim(),
    ),
  );
}

export function parseBulletin(html: string): Person[] {
  const people: Person[] = [];
  for (const sec of SECTIONS) {
    const rows = tableRows(sliceSection(html, sec.id));
    for (const c of rows) {
      if (c.length < 2 || !isNum(c[0])) continue; // skip headers / label rows
      const p = sec.map(c);
      const name = (p.name || "").trim();
      if (name.length < 2) continue;
      people.push({
        id: `bul-${sec.id}-${toLatin(c[0])}`,
        name,
        place: p.place?.trim() || undefined,
        phone: p.phone?.trim() || undefined,
        age: p.age && p.age !== "-" ? p.age : undefined,
        when: p.when || undefined,
        note: p.note || undefined,
        country: p.country ?? sec.country ?? "Nepal",
        rescueStatus: "Rescued",
        source: { label: SITE.attribution.label, url: `${BASE}/#${sec.id}` },
        status: "found",
      });
    }
  }
  return people;
}

// ---- hospital facility totals (HEOC-style table inside #treat) -------------

export type HospitalStat = {
  name: string;
  total: string;
  discharged: string;
  referred: string;
  isTotal: boolean;
};

export function parseHospitalStats(html: string): HospitalStat[] {
  const rows = tableRows(sliceSection(html, "treat"));
  return rows
    .filter(
      (c) =>
        c.length === 4 &&
        c[0] &&
        !isNum(c[0]) &&
        !/अस्पताल|सि\.नं/.test(c[0]) && // skip the header row
        /[\d०-९]/.test(c[1]), // has a numeric total
    )
    .map((c) => ({
      name: c[0],
      total: toLatin(c[1]),
      discharged: toLatin(c[2] || ""),
      referred: toLatin(c[3] || ""),
      isTotal: /जम्मा|कुल|total/i.test(c[0]),
    }));
}

// ---- fetch + cache (HTML fetched once, both views derived from it) ----------

let htmlCache: { html: string; at: number } | null = null;
let inflight: Promise<string> | null = null;

async function fetchHtml(): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(HTML_URL, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (html.length) htmlCache = { html, at: Date.now() };
    return html;
  } finally {
    clearTimeout(timer);
  }
}

async function getHtml(): Promise<string> {
  if (htmlCache && Date.now() - htmlCache.at < TTL_MS) return htmlCache.html;
  if (!inflight) {
    inflight = fetchHtml()
      .catch(() => htmlCache?.html ?? "") // serve stale snapshot, else empty
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function getBulletinRescued(): Promise<Person[]> {
  const html = await getHtml();
  return html ? parseBulletin(html) : [];
}

export async function getHospitalStats(): Promise<HospitalStat[]> {
  const html = await getHtml();
  return html ? parseHospitalStats(html) : [];
}
