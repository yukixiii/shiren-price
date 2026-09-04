# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

シレン値段識別 — a React 19 + Vite + TypeScript web app for price-identifying unidentified items in 風来のシレン 5plus / 6 from shop buy/sell prices. Deployed to GitHub Pages (`base: '/shiren-price/'` in `vite.config.ts`; keep in sync with the repo name). UI text, comments, and test names are in Japanese.

## Commands

```bash
npm run dev                       # Vite dev server
npm test                          # vitest run (all tests)
npx vitest run src/engine         # run one directory / file
npx vitest run -t "ダンジョン"     # run tests matching a name
npm run build                     # tsc -b && vite build -> dist/
node scripts/validate-data.mjs src/data/shiren5.json src/data/shiren6.json   # schema/consistency check for game data
```

There is no lint script; `tsc -b` (strict, `noUnusedLocals`/`noUnusedParameters`) is the type gate and runs as part of `build`. CI (`.github/workflows/deploy.yml`) runs `npm test` then `npm run build` on every push to `main` and deploys `dist/`.

Vitest has no config file. Engine tests run in Node; DOM tests must opt in with a `// @vitest-environment jsdom` pragma at the top of the file (see `src/App.test.tsx`).

## Architecture

Three layers, with a strict dependency direction: **data (JSON) → engine (pure functions) → UI (React)**. The engine and UI depend only on the `GameData` schema in `src/types.ts`, never on a specific title.

- **`src/data/*.json`** — one file per game title, conforming to `GameData`: categories, items (base `buy`/`sell`, optional `buyPerCharge`/`sellPerCharge` + `chargeMin`/`chargeMax` for wands/pots/incense), `priceModifiers` (blessed/cursed multipliers), `rounding`, and dungeons with an inclusive `itemPool` of item names. Adding a title = add a JSON file + one import line in `src/data/index.ts` (first entry in `games` is the default). Item `name` is the primary key everywhere (identified-list storage, `itemPool`), so renaming an item is a breaking change for saved user state.
- **`src/engine/identify.ts`** — pure, stateless. `priceOf()` computes `(base + perCharge × charges) × modifier` with the game's rounding applied to the final value; `identify()` enumerates every (item × charge count × state) combination in scope and returns exact matches sorted normal → blessed → cursed; `itemsInScope()` applies category and dungeon filters; `collectPriceGroups()`/`nearestPrices()` feed the price chips and the "no match" hint. Any change to price semantics belongs here and should be covered in `identify.test.ts` (which uses a small synthetic `GameData`, not real data).
- **`src/App.tsx`** — owns all state and passes it down to presentational components in `src/components/`. Persistent state goes through `useStoredState` (localStorage, key prefix `sp:`); per-game state (dungeon, identified list) is keyed by game id (`sp:<gameId>:...`) so switching games swaps the stored values. `src/App.test.tsx` is an integration test against the real JSON data, so data edits can break it.

## Data edits

Prices and dungeon pools come from wikis; provenance, verified facts, and known-unverified items are in `src/data/NOTES.md` (index) and `NOTES-shiren5.md` / `NOTES-shiren6.md`. When changing data, update the relevant NOTES file, run `scripts/validate-data.mjs`, and run the tests. Per-title price rules differ (e.g. Shiren 6 blessed ×2 / cursed ×0.87 floor, +100 buy per charge; Shiren 5 blessed ×1.1 / cursed ×0.8, 5% per charge) and are encoded entirely in the JSON, not in code.
