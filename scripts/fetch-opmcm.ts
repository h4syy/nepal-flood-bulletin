import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeOpmcmReports } from "@/lib/opmcm-normalize";

const API = "https://rescue.opmcm.gov.np/api/person-reports";
const OUT = path.join(process.cwd(), "public/data/opmcm-person-reports.json");
const LIMIT = 500;

async function fetchPage(page: number) {
  const url = `${API}?page=${page}&limit=${LIMIT}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} failed: HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const first = await fetchPage(1);
  const firstData = first.data || {};
  const total = Number(firstData.total || firstData.totalItems || firstData.count || 0);
  const pages = Number(firstData.totalPages || Math.ceil(total / LIMIT) || 1);
  const items = [...(firstData.items || [])];

  for (let page = 2; page <= pages; page += 1) {
    const json = await fetchPage(page);
    items.push(...(json.data?.items || []));
  }

  const { missing, found } = normalizeOpmcmReports(items);
  const comparable = JSON.stringify({ sourceUrl: API, total, missing, found });

  try {
    const existing = JSON.parse(await readFile(OUT, "utf8"));
    const existingComparable = JSON.stringify({
      sourceUrl: existing.sourceUrl,
      total: existing.total,
      missing: existing.missing,
      found: existing.found,
    });
    if (existingComparable === comparable) {
      console.log(`OPMCM data unchanged (${missing.length + found.length} normalized reports).`);
      return;
    }
  } catch {
    // First run, or an unreadable previous file: write a fresh snapshot.
  }

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        sourceUrl: API,
        total,
        missing,
        found,
      },
      null,
      2,
    ),
  );

  console.log(`Wrote ${missing.length + found.length} normalized OPMCM reports to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
