# Contributing

Thanks for contributing to Nepal Flood 2026.

## Local Development

### Prerequisites

* Node.js
* npm

### Setup

Clone the repository and install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

No configuration is required. The application fetches the live data sources on the first request.

## Project Structure

The project uses Next.js 14 with the App Router, TypeScript, and Tailwind CSS.

```text
src/
├── app/
│   └── page.tsx          # Fetches, merges, deduplicates, and renders data
├── lib/
│   ├── setu.ts           # NDRRMA SETU registry
│   ├── ndrrma.ts         # NDRRMA rescued-persons API
│   ├── bulletin.ts       # Rasuwa Flood Bulletin and hospital totals
│   ├── police.ts         # Nepal Police unidentified bodies
│   ├── tweetRescued.ts   # Hand-transcribed official snapshots
│   ├── feed.ts           # Community feed and shared Person type
│   └── translit.ts       # Devanagari → Roman transliteration
└── components/           # Reusable UI components
```

Each data source is implemented as a separate module in `src/lib/`.

The source modules return data that is combined in `src/app/page.tsx`. The page runs the source fetches in parallel, merges the results, removes duplicates, and renders the combined data.

## Adding a Data Source

Adding a new data source is intentionally small. Each source should be implemented as a module in `src/lib/` that returns `Person[]`.

### 1. Create a source module

Create a new file under `src/lib/`.

For example:

```text
src/lib/mysource.ts
```

Import the shared `Person` type:

```typescript
import type { Person } from "@/lib/feed";
```

Create a function that fetches and parses the source:

```typescript
export async function getMySource(): Promise<Person[]> {
  const res = await fetch(URL, { cache: "no-store" });
  return parse(await res.text());
}
```

The parser should return records using the shared `Person` structure.

### 2. Add the source to `page.tsx`

Import the new source function in:

```text
src/app/page.tsx
```

Then add the function to the existing `Promise.all(...)` that fetches the data sources.

For example:

```typescript
const results = await Promise.all([
  getSetu(),
  getNdrRma(),
  getPolice(),
  getMySource(),
]);
```

The new source will then go through the existing merge and deduplication flow.

### 3. Test the source

Run the application locally and verify that the new source is fetched correctly and that its records appear in the application without affecting existing sources.

## Pull Requests

Before opening a pull request:

* Keep changes focused on one issue or improvement.
* Run the project locally and verify your changes.
* Make sure existing functionality still works.
* Use a clear commit message describing the change.
* Explain what changed and how you tested it in the pull request description.
* Link the relevant issue when applicable.
* Avoid unrelated changes in the same pull request.
