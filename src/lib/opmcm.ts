import fs from "node:fs/promises";
import path from "node:path";
import type { Person } from "@/lib/feed";

const DATA_FILE = path.join(process.cwd(), "public/data/opmcm-person-reports.json");

type OpmcmPayload = {
  fetchedAt?: string;
  missing?: Person[];
  found?: Person[];
};

export async function getOpmcmPeople(): Promise<{ missing: Person[]; found: Person[] }> {
  let payload: OpmcmPayload;
  try {
    payload = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch {
    return { missing: [], found: [] };
  }

  return {
    missing: payload.missing || [],
    found: payload.found || [],
  };
}
