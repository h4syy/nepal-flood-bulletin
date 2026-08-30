# Nepal Flood 2026 — Rescue & Relief Search

**One searchable place to find people missing, rescued, or recovered in the
Rasuwa / Bhotekoshi–Trishuli flood (August 2026).** It pulls together official
government sources and the community bulletin so families don't have to hunt
across a dozen websites, X posts and PDFs to look for one person.

🔗 **Live:** https://nepalflood2026.vercel.app

> Built solo over a 3-day holiday (27–30 Aug 2026) to help during the disaster.
> It works and it's live — but to take it further it needs contributors.
> **If that's you, jump to [Contributing](#contributing--help-wanted).**

---

## Why this exists

When the flood hit, person-level information was scattered everywhere — NDRRMA,
the NDRRMA **SETU** registry, Nepal Police (unidentified bodies), hospitals via
HEOC, the PM's office rescue portal, embassies, news outlets, and a community
bulletin. A family looking for **one** relative had to check **all** of them.

This site aggregates those into one fast, bilingual search — every record keeps
its own source and links back to it.

## What it does

- **Search-first** — ~5,000+ people across **Missing**, **Rescued**, and
  **Unidentified** (recovered), searchable by name, place, or phone.
- **Nepali _and_ romanized search** with fuzzy matching — `binod`, `vinod` and
  `बिनोद` all find the same person; exact matches rank first, close matches
  follow with a "verify identity" caution.
- **Every card is sourced** and deep-links back to where the record came from.
- **"May already be rescued"** flag when someone in the missing list also
  appears in the rescued list (same name + age).
- **Kailash Mansarovar Yatra notice** — the Isha "S3" and Kolkata pilgrim
  groups who are out of contact, routed to official consular contacts.
- **Hospitals** — facility totals (admitted / discharged / referred).
- **Live updates**, emergency hotlines, and the official PM Disaster Relief Fund
  donate link.
- **Bilingual** (English / नेपाली), mobile-first.

## Data sources

Fetched live at request time and cached in memory (with graceful fallback), then
merged and de-duplicated across sources by romanized name + age:

| Source | What it provides |
| --- | --- |
| **NDRRMA SETU** (`setu.ndrrma.gov.np`) | Official person-level missing / found / rescued registry |
| **NDRRMA API** (`ndrrma.gov.np`) | Rescued-persons list |
| **Nepal Police** (`udb.nepalpolice.gov.np`) | Unidentified recovered bodies |
| **HEOC** (`heoc.mohp.gov.np`) | Hospital facility totals |
| **OPMCM** rescue portal | Lost & found reports |
| **DAO offices / MoFA / DHM** | District rescue lists, foreign-national tracing, hydrology |
| **Rasuwa Flood Bulletin** — [Niraj Bhusal](https://github.com/nirajbhusal) (individual maintained) | Consolidated rescue / missing / hospital lists |

**Full credit to Niraj Bhusal / the [Rasuwa Flood Bulletin](https://nirajbhusal.github.io/rasuwa-flood-bulletin/)** — a huge amount of the reconciliation work lives there. We aggregate to help people search; we are **not** the rescuing authority. Records may be updated at their source after appearing here, and some matches are fuzzy or transliterated, so **re-confirm a person's identity with the official source before acting.**

## How it works

- **Next.js 14 (App Router) · TypeScript · Tailwind · Vercel.** No database, no
  login, no environment variables.
- Each source is a small module in `src/lib/` that fetches live server-side and
  caches in memory (10–15 min) with a stale/empty fallback if it's unreachable.
- `src/app/page.tsx` runs all fetches in parallel, merges them, dedupes, and
  renders. Search runs client-side over the merged list.

Rough map:

```
src/
  app/page.tsx          # fetch all sources → merge → dedupe → render
  lib/
    setu.ts             # NDRRMA SETU registry (paginated HTML)
    ndrrma.ts           # NDRRMA rescued-persons API
    bulletin.ts         # Niraj's bulletin (8+ embedded lists) + hospital totals
    police.ts           # Nepal Police unidentified bodies
    tweetRescued.ts     # hand-transcribed official snapshots
    feed.ts             # community feed + the shared Person type
    translit.ts         # Devanagari → roman for fuzzy search
  components/           # Hero, SearchRescue, PersonCard, KailashAlert, …
```

## Run locally

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development setup and contribution instructions.

## Contributing — help wanted 🙏

This started as a 3-day solo build during a holiday. To make it genuinely
sustainable and useful long-term, it needs help. **High-impact areas:**

- **Server-side search / scale.** Right now every record ships to the browser
  for instant search. Moving search server-side would keep mobile fast *and*
  let us ingest much larger sources (e.g. the 8k+ OPMCM portal). This is the
  single biggest improvement available.
- **More official sources.** Parsers for additional government / hospital feeds —
  each source is ~30 lines (see below).
- **Data quality.** Verifying and correcting hand-transcribed snapshots
  (`src/lib/tweetRescued.ts`, `dao.ts`), and improving dedup + transliteration.
- **Translations & accessibility.**
- **Reliability.** Better caching (ISR/edge), source-health monitoring.

For detailed instructions on adding a data source, see [CONTRIBUTING.md](CONTRIBUTING.md).

**To contribute:** open an issue or a PR. Have a new official data source, a
correction, or want to help? Reach out — [@yash_paudel](https://x.com/yash_paudel)
· [@sanzinme](https://x.com/sanzinme).

## Disclaimer

For awareness and to help people search. This is not an official rescue
authority and is not affiliated with any government body. Information may be
incomplete, out of date, or fuzzy-matched — verify critical details, especially
a person's identity, with the official source or authorities before acting.

## License

[MIT](LICENSE) © 2026 Yash Paudel and contributors. Contributions are welcome
under the same license.

---

Built by [@yash_paudel](https://x.com/yash_paudel) & [@sanzinme](https://x.com/sanzinme).
Data from NDRRMA, SETU, Nepal Police, HEOC, DAO offices, MoFA, DHM, and the
Rasuwa Flood Bulletin by Niraj Bhusal.
