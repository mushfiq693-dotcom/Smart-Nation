# CivicSphere AI & ClimAct Twin

**One Nation. One Evidence Layer. From Public Data to Better Decisions.**

CivicSphere AI is an integrated public data intelligence and policy simulation platform engineered for the **DIU AI Builders Congress** (Track: *CivicSphere AI, Government, Public Service and Digital Nations*). It anchors its evidence workflows in a high-impact Bangladesh flagship vertical: **ClimAct Twin**, an equity-aware urban heat, air quality, and flood resilience simulator.

---

## 1. System Architecture: Dual-Engine AI Core

The platform strictly enforces a separation between numerical calculations and generative synthesis:

```
[1. Ingestion & Quality Gate] -> [2. Spatial Lakehouse & Dual-Engine AI] -> [3. Governance & XAI] -> [4. Civic Dashboard]
 Python, Polars, GeoPandas       DuckDB Spatial + H3, GeoParquet,           RBAC, Audit Logs,        Next.js, TypeScript,
 HDX P-code & CRS Validator      PostgreSQL/PostGIS, XGBoost + SHAP,        Provenance Tags,         MapLibre + PMTiles,
 Quality Manifest Generator      Pydantic Tool-Calling RAG Copilot          Alpha Equity Engine      Apache ECharts, EN/BN
```

- **Engine 1 (Analytical & Deterministic):** Vectorized DuckDB Spatial joins over GeoParquet, gradient-boosted hazard scoring ($\hat{R}_i$), TreeExplainer SHAP attribution, and prescriptive equity-weighted budget optimization ($P_i(\alpha_{\text{equity}})$).
- **Engine 2 (Generative & Grounded):** Tool-calling LLM Copilot (Gemini API) constrained strictly to Pydantic endpoints with structured citation payloads `{dataset_id, source_name, admin_pcode, reporting_period, provenance_class}`.

---

## 2. Monorepo Organization

```text
civicsphere-ai/
├── apps/
│   └── web/                          # Next.js 15 (App Router), MapLibre GL JS, ECharts, i18n
├── services/
│   └── api/                          # FastAPI, DuckDB Spatial, XGBoost/SHAP, Pydantic Copilot
├── pipelines/
│   └── ingest/                       # Batch ETL pipelines (HDX, Open-Meteo, OpenAQ, Copernicus, WB)
├── data/
│   ├── raw/                          # Raw archives (git-ignored)
│   ├── curated/                      # Versioned GeoParquet tables (regions, metrics, stations)
│   └── catalog/                      # dataset_manifest.json & quality_reports.json
├── docs/
│   └── policy_corpus/                # Official resilience guidelines & urban plans for RAG
├── config/
│   └── countries/bangladesh.yaml     # Country-agnostic metadata, bounding boxes, and CRS
├── docker-compose.yml                # Docker orchestrator (PostgreSQL/PostGIS, API, Web)
└── README.md                         # This file
```

---

## 3. Quick Start & Local Run

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (or run via Docker)

### Backend Setup
```bash
cd services/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Visit API Documentation: `http://localhost:8000/docs`

### Frontend Setup
```bash
cd apps/web
npm install
npm run dev
```
Visit Web Portal: `http://localhost:3000`

---

## 4. Judging Criteria Mapping (100 Points Total)

| Rubric Criterion | Weight | Platform Proof Points |
|---|---|---|
| **Innovation** | 20 pts | Prescriptive "What-If" budget optimization under real fiscal constraints + SHAP explainability + cited briefs. |
| **Technical Execution** | 20 pts | DuckDB Spatial + GeoParquet + PostGIS lakehouse; zero live external API failures; $<50\text{ms}$ spatial joins. |
| **Business Model & Scale** | 20 pts | 3-tier B2G/B2B2G hybrid revenue model; $<24$-hour country-agnostic config onboarding. |
| **Real-World Impact & Ethics** | 20 pts | Hard KPIs; explicit Equity Weighting Slider ($\alpha_{\text{equity}}$); non-PII spatial aggregation. |
| **Scalability & NRB Hub** | 10 pts | Dockerized microservices; PMTiles vector maps; dedicated NRB Civic Fellowship & Open-Model Hub. |
| **Presentation & Storytelling** | 10 pts | 5-minute live decision-making walkthrough from data gap to outcome tracking. |
