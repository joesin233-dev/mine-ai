# MINE AI — V0.1 (Stage 1: Foundation)

Company intelligence engine. Core intelligence is self-built — no external
AI/LLM API is used anywhere in this system.

## What Stage 1 actually does

- Full project scaffold matching the locked architecture.
- All shared TypeScript data models (`models/types.ts`).
- A working file-based storage layer (`storage/fileStore.ts`) — the only
  module that touches disk.
- A **working** upload endpoint (`/api/upload`) and Upload page (`/upload`):
  pick a CSV/XLSX file, it gets saved to `data/uploads/`, and a placeholder
  dataset record is saved to `data/processed/`.
- All 9 screens exist as real routes, but 8 of them are intentionally
  placeholder pages — they say plainly which stage will implement them.
  Nothing pretends to be finished analysis.
- All later-stage API routes (`/api/discover`, `/api/investigate`,
  `/api/evidence`, `/api/economic`, `/api/report`) return a clear
  "not yet implemented" response rather than fake data.
- One test file for the storage layer, and a synthetic fixture CSV
  (`tests/fixtures/sample-production.csv`) with a deliberate ~14% production
  drop correlated with a downtime increase, for later stages to detect.

## What Stage 1 deliberately does NOT do

- No parsing of CSV/XLSX contents yet (Stage 2).
- No statistics, profiling, trend/anomaly detection (Stages 3–4).
- No investigation, diagnostics, evidence, confidence, or economic
  calculations (Stages 5–8).
- No report generation (Stage 10).

## Running it

This was built without internet access in the dev sandbox, so dependencies
have not been installed or run here. To run it yourself:

```bash
npm install
npm run dev       # starts the app locally
npm test          # runs the Stage 1 storage test
```

Then deploy by pushing to GitHub and connecting the repo to Vercel — no
extra configuration needed, since storage is local files (no database, no
API keys required).

## Locked rules (do not violate in later stages)

- No Claude/OpenAI/Gemini or any external AI API.
- No Supabase/Firebase/Postgres unless explicitly approved.
- Correlation/association must never be presented as causation.
- Every finding must be explainable through evidence, confidence, and
  limitations.
- Economic impact must never be invented — missing inputs are requested
  from the user, never guessed.
