# DARPAN (दर्पण) — Pitch Deck (Phase 1)

AI-Powered Government Procurement Fraud Detection, Scoring, & Citizen Empowerment.

---

## Slide 1: The Problem (Core Pain Point)
### *Procurement Fraud: The Blindspot of Public Spending*

Public procurement in India faces systemic leakage, bid-rigging, spec-tailoring, and vendor collusions, eroding public trust and depleting national resources.

*   **Massive Financial Leakage**: Over ₹5,000 Crore is estimated to be lost annually to corrupt, uncompetitive public tenders across municipal, state, and national portals.
*   **The Auditing Gap**: Traditional vigilance audits are *reactive* and slow—taking years to compile. Less than 1% of total tenders are ever audited, leaving cartels operating with impunity.
*   **The Citizen Information Barrier**: The Right to Information (RTI) Act is a powerful anti-corruption tool, but drafting legally-sound RTI applications with specific, high-quality evidence is too complex and opaque for the average citizen.

---

## Slide 2: The Proposed Solution & Key Features
### *DARPAN (दर्पण): Real-Time Integrity & Automated Legal Action*

DARPAN acts as a digital mirror to public spending, crawling e-procurement sites to detect corruption patterns in real-time, score them, and instantly arm citizens with auto-generated legal RTI filings.

*   **Multi-Signal Integrity Scoring**: Uses 7+ distinct heuristic and NLP signal checks (e.g., Price Inflation vs. Market Prices, Specification Tailoring, Contractor Win Concentration, Single-Bid Anomalies) to flag suspicious tenders.
*   **High-Fidelity Evidence Packages**: Stores structured corruption metrics inside PostgreSQL JSONB records, providing interactive charts, price comparison details, and contractor risk metrics.
*   **Auto-Generated Legal RTI applications**: Translates complex data observations into structured legal RTI letters in one click, highlighting the exact flags and requesting official explanations.
*   **Corruption Network Mapping**: Exposes complex networks, cartels, and linked entities through a visual relationship graph of contractors and bidding history.

---

## Slide 3: Tools & Technical Stack
### *Scalable, Contract-First Architecture built for Precision and Speed*

DARPAN is built using a highly scalable, robust stack designed to handle thousands of procurement items with sub-second scoring pipelines.

*   **Frontend**: React 18, Vite (for blazing fast build/HMR), Wouter (lightweight routing), Lucide Icons, and customized Airbnb design tokens (soft shadow grids, premium Outfit/Inter fonts, Rausch primary colors).
*   **Backend**: Node.js 24 + Express 5 (latest routing capabilities) with a contract-first OpenAPI specification that drives type-safety.
*   **Database & ORM**: PostgreSQL database leveraging rich JSONB properties to store evidence packages, accessed via the type-safe Drizzle ORM.
*   **API & Code Generation**: Orval for compiling React Query hooks and Zod schemas directly from the OpenAPI contract, guaranteeing end-to-end frontend/backend contract synchronization.
*   **Detection Algorithms**: Cosine similarity NLP calculations for spec-tailoring metrics, coupled with heavy database aggregation queries to flag win concentration anomalies.

---

## Slide 4: Ideal Customer Profile (ICP)
### *Empowering the Custodians of Public Accountability*

DARPAN target users are anti-corruption actors who require data-driven leverage to audit, expose, and prevent public sector fraud.

1.  **Investigative Journalists**: Media professionals who need concrete evidence packages, risk scores, and document templates to investigate municipal and state corruption stories.
2.  **Anti-Corruption NGOs & Activists**: Organizations that monitor public expenditure and submit dozens of RTIs daily, requiring a platform to scale their oversight.
3.  **Public Sector Auditors & Vigilance Officers**: Government officials (e.g., CVC, state departments) looking for pre-disbursement alerts to block fraudulent funds before contracts are signed.
4.  **Active Citizens & RTI Advocates**: Individual taxpayers who want to hold their local municipal corporations accountable but lack the technical or legal drafting skills to submit a robust RTI.
