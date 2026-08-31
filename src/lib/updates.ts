import { SITE } from "@/lib/config";

/**
 * Live "what just changed" feed for the floating panel. Two sources, combined:
 *  1. latest.json on the bulletin (a static file — always reachable, no rate
 *     limit): the maintainer's headline update, e.g. "हराएको सूची — नयाँ २ नाम…".
 *  2. the source repo's commit history via the public GitHub API (best-effort;
 *     unauthenticated GitHub rate-limits hard, so this often drops out on a
 *     busy server — the latest.json item keeps the panel alive regardless).
 * Cached in memory.
 */

export type UpdateItem = {
  date: string; // ISO
  message: string; // headline / first line of the commit message
  sha: string; // short sha (empty for the latest.json headline)
  url: string; // link to the change
};

const BULLETIN = "https://nirajbhusal.github.io/rasuwa-flood-bulletin/";
const LATEST_URL = `${BULLETIN}latest.json`;

let cache: { items: UpdateItem[]; at: number } | null = null;
const TTL_MS = 3 * 60 * 1000;
const TIMEOUT_MS = 8_000;

async function fetchLatest(signal: AbortSignal): Promise<UpdateItem[]> {
  try {
    const res = await fetch(LATEST_URL, { signal, cache: "no-store" });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const j: any = await res.json();
    const title = String(j?.title ?? "").trim();
    const body = String(j?.body ?? "").trim();
    const message = [title, body].filter(Boolean).join(" — ");
    if (!message) return [];
    const rel = String(j?.url ?? "");
    const url = rel.startsWith("http")
      ? rel
      : `${BULLETIN}${rel.replace(/^\.?\//, "")}`;
    return [{ date: String(j?.updated_at ?? ""), message, sha: "", url }];
  } catch {
    return [];
  }
}

async function fetchCommits(signal: AbortSignal): Promise<UpdateItem[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${SITE.repo}/commits?path=family.json&per_page=12`,
      {
        signal,
        cache: "no-store",
        headers: {
          accept: "application/vnd.github+json",
          "user-agent": "nepal-flood-bulletin",
        },
      },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    return (Array.isArray(data) ? data : []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => ({
        date: c?.commit?.author?.date ?? c?.commit?.committer?.date ?? "",
        message: String(c?.commit?.message ?? "").split("\n")[0],
        sha: String(c?.sha ?? "").slice(0, 7),
        url: c?.html_url ?? "",
      }),
    );
  } catch {
    return [];
  }
}

export async function getRecentUpdates(): Promise<UpdateItem[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const [latest, commits] = await Promise.all([
      fetchLatest(controller.signal),
      fetchCommits(controller.signal),
    ]);
    const items = [...latest, ...commits];
    if (items.length) cache = { items, at: Date.now() };
    return items.length ? items : (cache?.items ?? []);
  } finally {
    clearTimeout(timer);
  }
}
