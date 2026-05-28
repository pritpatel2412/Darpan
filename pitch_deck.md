# DARPAN (दर्पण) — Pitch Deck

> **"Mirror of Procurement Integrity & AI-Driven Public Accountability"**
>
> DARPAN is an advanced vigilance analytics platform that scans public procurement systems, flags bid-rigging and pricing fraud in real-time, maps corporate cartels, and automates citizen-led legal actions (RTI filings) via multilingual AI engines.

---

## 📽️ Slide 1: The Problem (Core Pain Point)

### *Procurement Fraud: The Invisible Tax on Public Infrastructure*
Public sector procurement in India accounts for up to **20% of GDP**, but systemic collusion, bid-rigging, and specification tailoring drain massive amounts of taxpayer capital annually.

*   **⚠️ The Reactive Auditing Trap**: Standard vigilance processes (e.g., CVC, state audits) are completely reactive and slow. Audits occur 2–5 years after funds are disbursed, by which point the money is gone and shell vendors are dissolved. Fewer than **1% of all public tenders** are ever audited.
*   **🤝 Monopolistic Cartel Rotations**: Bidding cartels rotate wins, share directors/addresses to submit simulated "cover bids," and artificially inflate final contract values by **2.5x to 4x** over competitive market rates.
*   **📝 Opaque Specification Tailoring**: Departments write highly customized or brand-exclusive guidelines (e.g., proprietary equipment constraints, specialized certifications) specifically tailored to one preferred vendor to lock out competitive bidders.
*   **🛑 The Citizen Action Friction**: While the **Right to Information (RTI) Act 2005** legally empowers taxpayers to demand procurement transparency, drafting a legally-binding, evidence-backed RTI inquiry is too technical and complex for the average citizen.

---

## 📽️ Slide 2: Proposed Solution & The User Journey

### *DARPAN (दर्पण): Real-Time Integrity Mirror & Automated Legal Recourse*
DARPAN transforms public spending oversight from a slow, bureaucratic audit into a **real-time, proactive, and citizen-powered defense system**.

```
[1. Live Ingestion] ──► [2. 10-Signal Engine] ──► [3. Watchlist Alerts]
                                                       │
                                                       ▼
[6. RTI Appeal Tracker] ◄── [5. AI Legal Drafting] ◄── [4. Cartel Graph]
```

### The 6-Step End-to-End User Journey
1.  **Ingestion**: Scrapers automatically ingest active and recently awarded tenders from central registries (GeM, state e-tender portals).
2.  **Diagnostic Scoring**: The **10-Signal Forensic Engine** processes every tender against pricing, specification, timing, and corporate parameters to calculate a 0-100 risk score.
3.  **Vigilance Dashboard**: Anti-corruption officers and journalists inspect a real-time high-risk alert feed, sorted by gravity.
4.  **Forensic Investigation**: The investigator clicks a flagged tender to review a deep **Evidence Package** highlighting unit-cost inflations, cosine spec-similarities, and an **Interactive Collusion Network Graph** exposing linked directors, shared corporate addresses, and bid rotation cartels.
5.  **Multilingual AI Drafting**: With one click, the investigator generates a formal RTI filing. Citizens can also use **Sarvam-powered voice queries** in Hindi or English to describe a local infrastructure failure, which is translated and converted into a structured RTI request.
6.  **Statutory Tracking**: The system registers the file and tracks the legal 30-day timeline, highlighting overdue responses to trigger second-level statutory appeals.

---

## 📽️ Slide 3: Tools & Technical Stack

### *A Scale-Out, Decoupled Architecture Built for Sub-Second Forensic Audits*
DARPAN is engineered with a high-throughput, contract-first design to sync heavy ML calculations with clean reactive dashboards:

*   **🎨 Frontend (The User Experience)**:
    *   *Next.js 16 (App Router, React 19)*: Delivers server-side rendering, exceptional SEO, and fast navigation.
    *   *Tailwind CSS v4*: Provides rapid, utility-first aesthetic rendering.
    *   *Recharts & Canvas Graphs*: Powers responsive data graphs and dynamic contractor/approver relationship mapping nodes.
*   **⚙️ Backend (The Heavy Lifter)**:
    *   *FastAPI (Python 3.11)*: High-performance asynchronous API endpoints serving predictive data.
    *   *Celery & Redis*: Asynchronous task processor that handles massive scraper pipelines, text parsing, and background AI drafting.
    *   *PostgreSQL & pgvector*: Relational storage leveraging JSONB records for granular evidence logs and vector columns for semantic specification comparison.
*   **🤖 AI Stack & External Integrations**:
    *   *NVIDIA NIMs & Groq (Llama 3.1 70B)*: Compiles raw procurement anomalies into highly formal legal RTI letters and provides detailed forensic narratives.
    *   *Sarvam AI*: Voice synthesis, transcription, and translation, translating spoken Hindi/English prompts into legal documents.
    *   *MCA21 (Corporate Registry)*: Traces company registration age, DINs, PANs, and shared corporate addresses.
    *   *TinyFish*: Runs real-time web searches to gather prevailing market rates for cost comparison (S01).
    *   *Playwright & BeautifulSoup4*: Directs background crawling of public portals.

---

## 📽️ Slide 4: Target Audience & ICP

### *Empowering the Custodians of Public Accountability*
DARPAN connects raw data-intelligence to the specific agents of change who enforce transparency in public spending:

1.  **📊 Investigative Journalists**:
    *   *Pain Point*: Lacks time and forensic data to verify corrupt procurement.
    *   *Darpan Use Case*: Downloads ready-to-publish evidence packages, price comparison charts, and corporate cartel graphs to break exclusive municipal corruption stories.
2.  **⚖️ Anti-Corruption NGOs & Activists**:
    *   *Pain Point*: Needs to submit dozens of detailed, evidence-backed inquiries weekly.
    *   *Darpan Use Case*: Automates the bulk drafting of legally sound RTI letters, monitoring statutory timelines across multiple departments.
3.  **👮 Municipal Vigilance & Government Auditors**:
    *   *Pain Point*: Traditional audits are too slow to stop fund disbursements.
    *   *Darpan Use Case*: Receives pre-disbursement alerts of collusive bidding networks and win rotations to freeze funds *before* corrupt contracts are executed.
4.  **🇮🇳 Active Taxpayers & Local Citizens**:
    *   *Pain Point*: Demands local accountability (e.g., poorly paved roads) but lacks technical and legal drafting skills.
    *   *Darpan Use Case*: Uses Hindi/English voice prompts to instantly generate, print, and track legally-binding local RTI applications.
