# Darpan — दर्पण

AI-Powered Government Procurement Fraud Detection. Darpan crawls Indian government procurement portals, detects fraud signals across thousands of tenders, scores them by confidence, and generates RTI applications automatically.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/darpan run dev` — run the frontend (port 19643)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080, path `/api`)
- Frontend: React + Vite (port 19643, path `/`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schema (tenders, contractors, rtis, activity tables)
- `artifacts/api-server/src/routes/` — route handlers (tenders, contractors, rtis, dashboard)
- `artifacts/darpan/src/` — React frontend
- `artifacts/darpan/src/index.css` — Airbnb design tokens (Rausch #ff385c primary, white canvas, ink text)

## Architecture decisions

- Contract-first OpenAPI spec gates both frontend codegen (React Query hooks) and backend Zod validation
- Design system follows Airbnb tokens exactly: Rausch red (#ff385c), white canvas, Inter font, one shadow tier, 8px button radius, 14px card radius
- Fraud confidence scoring: weighted sum of 7 signals (S-01 to S-07) with bonus multiplier for S-08 to S-10
- Evidence packages stored as JSONB in PostgreSQL — rich structured fraud evidence per tender
- RTI auto-generation: POST /tenders/:id/rti creates and stores a legally structured RTI application

## Product

- **Dashboard** — Live stats ticker (tenders scanned, fraud value, critical cases, RTIs filed), live fraud feed sorted by score, recent activity timeline, department leaderboard, state heatmap
- **Tenders Feed** — Searchable/filterable list of all flagged tenders with fraud score badges (critical/high/medium/low)
- **Tender Detail** — Full evidence package: executive summary, signal breakdown with confidence bars, contractor profile, price comparison (awarded vs market), RTI application generator
- **Contractor Watchlist** — High-risk contractors with CIN, risk score bar, flagged tender count
- **RTI Tracker** — All filed RTI applications with status (drafted/submitted/responded/appealed), filing dates, deadlines

## Fraud Signals

- S-01: Price Inflation (25%) — awarded price vs live market price
- S-02: Specification Tailoring (20%) — NLP similarity between spec and vendor catalog
- S-03: Contractor Win Concentration (20%) — same vendor wins >65% from one dept
- S-04: Single Bidder Anomaly (15%) — only 1 bid on nationally-listed tender above ₹25L
- S-05: Narrow Bid Window (8%) — submission window < 7 days
- S-06: New Entity Anomaly (7%) — contractor registered < 60 days before tender
- S-07: Bid Amount Clustering (5%) — multiple bids within 0.5% (possible collusion)
- S-08/09/10: Bonus signals (linked entities, spec copy-paste, after-award modification)

## User preferences

- Design must follow Airbnb design system exactly as specified in attached_assets/Pasted--Overview-Airbnb...txt
- End-to-end real working functionality (no mocks or placeholder data)
- Premium UI quality

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after OpenAPI spec changes
- Run `pnpm --filter @workspace/db run push` after schema changes
- The @theme inline block in index.css must be preserved as-is — only replace the :root CSS variable values
- Google Fonts @import must be the FIRST line in index.css

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
