import { unstable_cache } from "next/cache";

/**
 * Store an upstream fetch's RESULT in Vercel's Data Cache instead of a
 * module-scoped variable.
 *
 * Why this exists (issues #8 / #9): module-level caches — and the throttle
 * timestamps built on top of them — live inside a single serverless instance.
 * Under load Vercel spins up many instances and recycles them on cold starts,
 * so those caches don't survive and the "hit each source at most once per N
 * seconds" guarantee silently applies *per instance*, not globally. A traffic
 * spike then hammers a fragile upstream (e.g. the NDRRMA disaster API) exactly
 * when it can least cope, and most page views refetch every source from cold.
 *
 * `unstable_cache` is shared across every instance, survives cold starts,
 * dedupes concurrent callers, and revalidates on a timer (stale-while-
 * revalidate). Net effect: each source is fetched at most once per `revalidate`
 * window across the whole fleet, and page views are served from the shared
 * cache instead of refetching.
 *
 * Note: the wrapped function must be pure (no cookies()/headers()/request
 * state) — our source fetchers already are.
 */
export function cachedSource<T>(
  key: string,
  fetcher: () => Promise<T>,
  revalidateSeconds = 180,
) {
  return unstable_cache(fetcher, [`source:${key}`], {
    revalidate: revalidateSeconds,
    tags: [`source:${key}`],
  });
}
