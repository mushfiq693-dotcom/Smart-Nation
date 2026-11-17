# CivicSphere AI & ClimAct Twin: Unified Research Paper and Implementation Blueprint

**Challenge Track:** DIU AI Builders Congress — CivicSphere AI, Government, Public Service and Digital Nations  
**Challenge Area:** Smart Nation Integrated Public Data Intelligence for Planning: Data Platform, Analytics, Dashboards, Evidence-Based Policy and Outcomes  
**Flagship Pilot:** Bangladesh (National, District, and Upazila/City Corporation levels), designed with a country-agnostic architecture for cross-border replication  
**Tagline:** *One Nation. One Evidence Layer. From Public Data to Better Decisions.*  
**Project Status:** Pre-deployment research paper, engineering architecture, and hackathon MVP specification  

---

## Executive Overview

This unified research paper and engineering specification consolidates three source project documents into a single implementation-ready blueprint for the DIU AI Builders Congress hackathon. Rather than building a static chart website or an ungrounded LLM wrapper, your team will build **CivicSphere AI**—an evidence-to-action public data intelligence platform—anchored by one high-impact Bangladesh flagship vertical: **ClimAct Twin**, an equity-aware urban heat, air quality, and flood resilience simulator.

The central architectural rule is a **Dual-Engine AI Separation**: deterministic geospatial SQL (DuckDB Spatial and PostGIS) and classical machine learning (XGBoost or LightGBM with SHAP) compute every quantitative metric, while a retrieval-augmented generation (RAG) copilot explains verified outputs with inline source citations and generates reviewable policy briefs.

Verification against live API documentation and licensing terms revealed four critical operational constraints in Bangladesh that this blueprint resolves before coding begins:

1. **Geographic coverage mismatches:** NOAA DigitalCoast focuses on U.S. coastal mapping rather than providing dedicated Bangladesh sea-level datasets. Similarly, Google Environmental Insights Explorer (EIE) restricts its hyperlocal street-level air quality data to six non-Bangladesh cities and provides only web summary previews for select local areas (such as Hemayetpur in Dhaka Division) without an open programmatic city API.
2. **Strict rate limits and serverless IP bans:** Public OpenStreetMap Overpass (`overpass-api.de`) and Open-Meteo enforce strict concurrency and daily call caps, explicitly warning against uncached polling from shared-IP platforms such as Netlify, Render, or Vercel.
3. **Commercial licensing conflicts:** The WAQI (`api.waqi.info`) air quality API prohibits data caching, archiving, and use in paid applications, conflicting directly with a commercial B2G SaaS model.
4. **Dashboard-only government portals:** Public portals like `dashboard.gov.bd` operate primarily as visual Apache Superset dashboards (with agency-specific views behind login walls) rather than open reusable APIs.

To guarantee demo-day stability and clean licensing, this specification replaces U.S.-only or restricted sources with **HDX UN OCHA COD-AB boundaries**, **Copernicus DEM GLO-30**, **Open-Meteo (ERA5, Air Quality, and GloFAS v4 Flood)**, **OpenAQ v3**, **World Bank Indicators API v2**, and **pre-cached OpenStreetMap extracts** stored inside a **DuckDB Spatial, GeoParquet, and PostgreSQL/PostGIS** lakehouse.

---

## 1. Abstract

Governments collect extensive data across public services, census records, environmental monitoring, infrastructure projects, healthcare, and economic activities. However, these datasets are frequently fragmented across institutions, stored in inconsistent formats, and difficult to reconcile across changing administrative boundaries. Consequently, planners often lack timely, geographically granular, and auditable evidence when allocating constrained budgets or evaluating public programmes.

This paper proposes **CivicSphere AI**, an integrated public data intelligence platform combining data interoperability, geospatial analytics, classical machine learning, explainable AI (XAI), conversational RAG, policy scenario simulation, and outcome monitoring. Piloted in Bangladesh through its flagship vertical **ClimAct Twin**, the platform fuses subnational administrative boundaries, climate reanalysis, air quality telemetry, hydrological forecasts, elevation models, and socioeconomic indicators to identify overlapping environmental hazards and underserved communities. A tool-calling AI Copilot retrieves authorized data with explicit reporting periods and citations, while a "What-If" Policy Simulation Studio lets officials test resource allocation strategies using an explicit equity weighting factor ($\alpha_{\text{equity}}$). Designed as an AI-native prototype with privacy-by-design, role-based access control, bilingual English/Bangla support, and an NRB (Non-Resident Bangladeshi) Open-Model Hub, CivicSphere AI aims to accelerate evidence preparation and strengthen human decision-making without automating consequential governance choices.

**Keywords:** Smart Nation, GovTech, Civic AI, Digital Public Infrastructure, DuckDB Spatial, Explainable AI, Policy Simulation, Bangladesh, Responsible AI.

---

## 2. Introduction, Problem Statement, Research Objectives, and Research Questions

### 2.1 Background and Motivation

Digital government initiatives depend on institutional interoperability—the ability to connect and analyze datasets across ministries without forcing every agency to replace legacy systems. Industry benchmarks such as **CityMapper** (multimodal transit routing), **Remix** (street and transit planning across $450+$ agencies), **Zencity** (AI analysis of citizen feedback), and **Sidewalk Labs** (urban digital twins) illustrate how unifying maps, telemetry, and demographics unlocks actionable planning intelligence. Both the World Bank and OECD emphasize that trustworthy public-sector AI requires strong data governance, interoperability standards, transparent oversight, and impact measurement.

### 2.2 Problem Statement

Synthesizing the governance and urban analytics perspectives from your source documents defines six core challenges:

1. **Fragmented public data silos:** Education, healthcare, climate, transport, infrastructure, and expenditure records reside across separate agencies in incompatible CSV, XLSX, PDF, and GIS formats.
2. **Limited cross-sector spatial analysis:** Single-indicator dashboards fail to reveal where extreme heat, particulate pollution, flood risk, and socioeconomic vulnerability overlap.
3. **Slow manual evidence preparation:** Analysts spend excessive time cleaning files, reconciling misspelled district/upazila names, and recomputing indicators manually before planning meetings.
4. **Absence of counterfactual and equity-aware simulation:** Planners lack tools to compare budget trade-offs before spending, and unadjusted historical datasets often under-represent low-income or informal settlements that lack sensor coverage.
5. **Inaccessible and unverifiable analytics:** Nontechnical officials struggle to write multi-table spatial queries, while generic chatbots hallucinate statistics without traceable provenance.
6. **Weak outcome monitoring:** Tracking expenditure or activity counts alone does not verify whether an intervention measurably improved resilience, service access, or equity against a baseline.

### 2.3 Research Objectives

The primary objective is to design and prototype an integrated public data intelligence platform that converts fragmented public data into traceable, equitable policy evidence. Specific objectives are to:

1. Build a modular data ingestion and interoperability layer with automated schema and geometry quality checks.
2. Establish a unified data catalogue tracking source, publication date, reporting period, spatial coverage, licence, and provenance class.
3. Deliver interactive geospatial dashboards comparing districts, upazilas/city corporations, and hexagonal grid cells.
4. Implement a grounded AI Copilot restricted to deterministic analytical tools with inline citations.
5. Build an explainable policy simulation studio featuring SHAP attributions and an equity weighting control.
6. Provide a closed-loop outcome tracker linking approved scenarios to baselines, targets, responsible institutions, and review dates.
7. Embed privacy-by-design, RBAC, audit logging, prompt-injection defenses, Bangla/English localisation, and an NRB Open-Model Hub.
8. Evaluate the prototype against quantitative accuracy, citation fidelity, security, and usability targets.

### 2.4 Research Questions

| Research ID | Research Question | Concrete Implementation Mechanism |
|---|---|---|
| **RQ1** | How can heterogeneous spatial, environmental, and socioeconomic datasets be integrated while preserving provenance and reporting periods? | Python ETL pipelines normalizing HDX P-codes and `OGC:CRS84` geometry into versioned GeoParquet and PostgreSQL data catalogues. |
| **RQ2** | Can a source-grounded AI assistant reduce evidence-retrieval effort while maintaining calculation accuracy and citation fidelity? | LLM orchestrator restricted to Pydantic-validated, read-only DuckDB/FastAPI analytical endpoints returning explicit source and period badges. |
| **RQ3** | How can geospatial analytics, XAI, and scenario modeling expose regional service gaps without presenting correlations as causes? | Classical ML hazard scoring paired with SHAP feature attributions, explicit exploratory scenario labels, and an equity weighting slider ($\alpha_{\text{equity}}$). |
| **RQ4** | Which technical and governance controls are necessary for responsible AI-assisted public planning? | RBAC, non-PII spatial aggregation, prompt-injection guards, immutable audit logs, and human sign-off gates. |
| **RQ5** | How can policy outcomes be monitored systematically using baselines, targets, and follow-up observations? | Policy Outcomes Tracker storing baseline metrics, measurable targets, responsible agencies, and evaluation methods. |

---

## 3. Flagship Vertical Selection: ClimAct Twin on CivicSphere AI

Attempting to build all eight CivicSphere modules and all three urban intelligence concepts during a hackathon risks shipping disconnected prototypes. Instead, **CivicSphere AI** serves as the reusable national governance and data platform, while **ClimAct Twin** serves as the single, end-to-end flagship vertical.

| Candidate Vertical | Target Planning Problem | Bangladesh Open-Data Readiness | AI & Technical Complexity | Hackathon Decision |
|---|---|---|---|---|
| **ClimAct Twin** (Heat, Air Quality & Flood Resilience) | Deadly urban heat islands, $\text{PM}_{2.5}$ pollution spikes, and monsoon/river flood exposure | **High:** HDX COD-AB, Open-Meteo (ERA5/AQ/GloFAS v4), OpenAQ v3, Copernicus GLO-30, and World Bank v2 are open | **Optimal:** XGBoost/LightGBM spatial risk scoring + SHAP + constrained budget optimization + RAG briefs | **Primary Flagship MVP:** Highest data reliability, visual impact, and real-time slider feedback |
| **SafeStreet Vision** (Road Safety & Micro-Mobility) | Pedestrian fatality hotspots and missing sidewalks or crosswalks | **Moderate-Low:** OSM road geometry exists, but standardized street-view imagery and crash datasets are sparse | **High compute overhead:** YOLO/VLM street auditing + reinforcement learning routing | **Phase 2 Roadmap:** Present as an extensible future plugin |
| **SynthCity** (Agentic Zoning & Housing Simulator) | Gentrification, housing deficits, and traffic bottlenecks from zoning changes | **Low for sprint timeline:** Requires granular household microdata and live transit feeds | **Very high complexity:** Multi-agent LLM + Monte Carlo demographic microsimulation | **Phase 2 Roadmap:** Present as an extensible future plugin |

---

## 4. Verified Data Sources and Bangladesh Reconciliation

Every external source in the earlier draft blueprints was verified for geographic coverage, API limits, and licensing compatibility. Research published in *Urban Studies* also highlights that proprietary, "tech-down" corporate urban dashboards (such as Google EIE) can obscure local context and opaque data-generation assumptions. Grounding CivicSphere AI on open, auditable standards reinforces institutional trust and transparency.

### 4.1 Verified Ingestion Matrix

| Layer | Earlier Draft Idea | Verified Source for Bangladesh | Endpoints / Access Details | Rate Limits & Technical Constraints | License & Commercial Status |
|---|---|---|---|---|---|
| **Administrative Boundaries** | Generic census / OSM borders | HDX UN OCHA `cod-ab-bgd` v03 (BBS March 2025 alignment, reviewed June 2025) | `bgd_admin_boundaries.geojson.zip` ($36.0\text{ MB}$): $8$ Divisions (ADM1), $64$ Districts (ADM2), $507$ COD ADM3 units ($495$ Upazilas + $12$ City Corporations) | ADM4 (ward level) is *not* officially confirmed or maintained as a COD dataset; verify locally before ward-level claims | CC BY-IGO; safe for public and institutional analytics |
| **Urban Form & Basemaps** | Live Overpass / OSM queries | Pre-cached OpenStreetMap / Overture extracts converted to GeoParquet & PMTiles | Batch download regional extracts (roads, parks, water, health facilities, schools) offline | Public `overpass-api.de` caps at $2$ concurrent connections/IP, $< 10,000$ queries/day, $< 1\text{ GB}$/day, requires unique `User-Agent`, and bans fast-deploy hosts like Netlify/Lovable | ODbL (attribution required); never query Overpass synchronously on user clicks |
| **Elevation & Terrain** | NOAA DigitalCoast Sea Level Rise Viewer | Copernicus DEM GLO-30 ($30\text{ m}$ resolution) | AWS S3 OpenTopography: `aws s3 cp s3://raster/COP30/ . --recursive --endpoint-url https://opentopography.s3.sdsc.edu --no-sign-request` | Open LiDAR coverage in Bangladesh is $0$ datasets, making Copernicus GLO-30 the standard open elevation baseline | Free worldwide reproduction and adaptation with attribution |
| **Flood Hydrology** | NOAA coastal flood tools | Open-Meteo Flood API (GloFAS v4) + optional BWDB FFWC API | `/v1/flood` returning daily `river_discharge` ($\text{m}^3/\text{s}$) at $0.05^\circ$ ($\approx 5\text{ km}$) from 1984 to 7-month forecast (`timezone=GMT`, `past_days=92` default); BWDB FFWC (`api.ffwc.gov.bd`) provides 24–48 h station forecasts | Vary coordinates by $0.1^\circ$ if $5\text{ km}$ grid misses target river channel; BWDB FFWC requires registration via `api.support@bwdb.gov.bd` | Open-Meteo free tier is CC BY 4.0 non-commercial; paid plans available for commercial B2G |
| **Air Quality Telemetry** | "BlueSky API" / EPA AirNow / Google EIE | OpenAQ API v3 (Bangladesh ID `128`, ISO `BD`) + Open-Meteo Air Quality API | `https://api.openaq.org/v3/locations` with `X-API-Key` header; Open-Meteo AQ covers $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{CO}$, $\text{NO}_2$, $\text{O}_3$, UV worldwide with no auth | OpenAQ v3 strictly enforces $60\text{ req/min}$ and $2,000\text{ req/hour}$ (tightened enforcement Sep 2026); handle `x-ratelimit-*` headers | OpenAQ supports open access with attribution; **avoid WAQI** (`api.waqi.info`) because terms forbid caching, archiving, and paid apps |
| **Heat & Historical Climate** | Google EIE Tree Canopy / generic feeds | Open-Meteo Historical Weather (ERA5 / ERA5-Land) + Forecast API | ERA5 ($0.25^\circ$, 1940–present) and ERA5-Land ($0.1^\circ$, 1950–present) for `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `dew_point_2m` | Free tier: $600\text{ calls/min}$, $5,000\text{/hour}$, $10,000\text{/day}$, $300,000\text{/month}$ (weighted by ensembles/variables); shared-IP warning on Vercel/Netlify/Render; batch comma-separated coordinates | CC BY 4.0 non-commercial free tier; upgrade to `customer-api.open-meteo.com` for commercial tiers |
| **Socioeconomic & Local Context** | World Bank + BBS + `dashboard.gov.bd` | World Bank Indicators API v2 + BBS Census 2022 reports | `https://api.worldbank.org/v2/country/BGD/indicator/{code}?format=json&mrv=5&gapfill=Y` (up to $60$ indicators separated by `;`) | World Bank V1 retired June 2020; `dashboard.gov.bd` is an Apache Superset UI portal with login-gated agency views rather than an open API | World Bank data is open; clearly label any sub-district downscaling as estimated or synthetic |

**Operational Rule for Demo Stability:** Never trigger live external calls to Open-Meteo, OpenAQ, or Overpass directly from frontend clicks. Run scheduled backend ingestion jobs to populate GeoParquet and PostgreSQL caches so the live demo operates with sub-second local latency and zero 429 rate-limit failures.

---

## 5. System Architecture and Dual-Engine AI Core

Instead of deploying heavy distributed streaming clusters (Kafka/Spark) unsuitable for a 7-day hackathon sprint, CivicSphere AI uses a lean, cloud-ready four-layer architecture:

```
[1. Ingestion & Quality Gate] -> [2. Spatial Lakehouse & Dual-Engine AI] -> [3. Governance & XAI] -> [4. Civic Dashboard]
 Python, Polars, GeoPandas       DuckDB Spatial + H3, GeoParquet,           RBAC, Audit Logs,        Next.js, TypeScript,
 HDX P-code & CRS Validator      PostgreSQL/PostGIS, XGBoost + SHAP,        Provenance Tags,         MapLibre + PMTiles,
 Quality Manifest Generator      Pydantic Tool-Calling RAG Copilot          Alpha Equity Engine      Apache ECharts, EN/BN
```

### 5.1 Spatial Lakehouse: DuckDB Spatial + GeoParquet + PostGIS

DuckDB's `spatial` extension executes vectorized, columnar spatial queries (`ST_Read`, `ST_Within`, `ST_Distance_Sphere`, `ST_Transform`, and `SPATIAL_JOIN`) directly over GeoParquet files in-process inside FastAPI without needing a separate analytical cluster. Combining **DuckDB Spatial + H3** for analytical aggregations and nearest-neighbor queries (`row_number()` over `ST_Distance_Sphere`) with **PostgreSQL + PostGIS** for transactional state (users, data catalogue, audit logs, and outcome targets) gives your team both speed and persistence.

Two critical geospatial engineering safeguards must be enforced in DuckDB:
- Store raw geographic coordinates in `OGC:CRS84` (longitude, latitude) to avoid the `EPSG:4326` axis-order trap.
- Transform geometries via `ST_Transform` into a planar meter-based CRS (such as UTM Zone 45N / 46N for Bangladesh) before calculating polygon areas or distance buffers.

On the frontend, converting static boundary and built-density layers into **PMTiles** and serving them to **MapLibre GL JS** eliminates backend tile-server infrastructure costs completely.

### 5.2 Dual-Engine AI Core and Mathematical Specification

The Dual-Engine Core strictly separates numerical inference from natural-language synthesis:

1. **Analytical / ML Engine (Hard Numbers):**
   - **Composite Climate Hazard Risk Score ($\hat{R}_i$):** A gradient-boosted tree model (**XGBoost** or **LightGBM**) ingests regional environmental and terrain features per ADM2/ADM3 unit or H3 cell $i$: historical/forecast `apparent_temperature` anomalies, $\text{PM}_{2.5}$ threshold exceedance frequency, Copernicus GLO-30 mean/low-lying elevation fraction, GloFAS `river_discharge` percentile (`river_discharge_p75`), and OSM built-up versus green/water cover ratios. It outputs a normalized hazard score $\hat{R}_i \in [0, 1]$.
   - **SHAP Explainability Layer:** TreeExplainer (`shap`) computes local feature attributions $\phi_{i,k}$ for every region $i$ and feature $k$, explaining *why* a district or upazila was flagged (e.g., $+0.24$ from low elevation and GloFAS spike vs. $+0.18$ from heat anomaly and sparse canopy).
   - **Equity-Weighted Priority Score ($P_i$):** To operationalize the Ethical AI Equity Guardrail from your strategy blueprint, the Policy Simulation Studio computes a proposed resource-allocation ranking score:

$$P_i(\alpha_{\text{equity}}) = w_{\text{risk}} \cdot \hat{R}_i \cdot \left(1 + \alpha_{\text{equity}} \cdot V_i\right) \cdot \text{PopNorm}_i$$

Where:
- $\hat{R}_i \in [0, 1]$ is the ML-derived normalized hazard risk score.
- $V_i \in [0, 1]$ is a socioeconomic vulnerability and sensor-scarcity index, preventing data-poor or low-income settlements from being penalized by sparse historical monitoring.
- $\text{PopNorm}_i \in [0, 1]$ is normalized exposed population.
- $w_{\text{risk}} > 0$ is the sector priority weight.
- $\alpha_{\text{equity}} \ge 0$ is the planner-controlled **Equity Weighting Factor** slider.

When $\alpha_{\text{equity}} = 0$, the optimizer allocates a constrained demonstration budget (e.g., $\$500,000$) purely by hazard-population exposure; increasing $\alpha_{\text{equity}}$ shifts marginal allocations toward high-vulnerability, under-monitored areas and recalculates estimated intervention coverage in real time. Every simulated impact metric is explicitly labeled as an assumption-based **Scenario Estimate**, never a causal forecast.

2. **Generative / RAG Copilot Engine (Explanation & Policy Briefs):**
   - **Grounded Tool Calling:** The LLM (e.g., Gemini via tool-calling API) is prohibited from writing raw SQL or inventing statistics. It can only invoke whitelisted, Pydantic-typed FastAPI/DuckDB tools (e.g., `get_top_risk_regions`, `get_region_shap_drivers`, `run_budget_simulation`).
   - **Hybrid Document RAG:** Policy guidelines, urban cooling/drainage manuals, and dataset methodology notes stored in `docs/policy_corpus` are retrieved via PostgreSQL full-text search (or pgvector) so answers combine live regional statistics with municipal policy context.
   - **Mandatory Citation Payload:** Every Copilot answer and generated Policy Brief attaches structured citation badges containing `{dataset_id, source_name, admin_pcode, reporting_period, provenance_class}`.

---

## 6. CivicSphere AI Platform Modules and Policy Workflow

### 6.1 Eight Platform Modules (Design Vision vs. Hackathon Scope)

Your frontend should look like a national government intelligence portal rather than a generic chatbot:

1. **National Intelligence Dashboard (Must Have):** Overview cards (Data Sources, Indicators, Regions), interactive MapLibre choropleth/H3 map, sector and time filters, and clear demo/official data provenance labels.
2. **Integrated Public Data Hub (Must Have):** Searchable data catalogue showing schema validation status, missing-value percentages, P-code reconciliation alerts, licence metadata, and update timestamps.
3. **AI Policy Copilot (Must Have):** Natural-language analytical assistant backed by deterministic DuckDB/ML tool calls and clickable citation drawers.
4. **Regional Gap Explorer (Must Have):** District and upazila side-by-side comparison across heat, $\text{PM}_{2.5}$, flood discharge, elevation, and sensor gaps.
5. **ClimAct Twin Policy Simulation Studio (Must Have):** Interactive "What-If" sliders for total budget, sector weights ($w_{\text{risk}}$), intervention mix (e.g., urban tree canopy, cool roofs, drainage retention), and $\alpha_{\text{equity}}$, paired with SHAP explainability cards.
6. **AI Policy Brief Generator (Must Have):** One-click structured export containing policy question, key findings, cited evidence, compared alternatives, explicit assumptions, limitations, and proposed evaluation metrics.
7. **Policy Outcomes Tracker (Should Have):** Persist a chosen scenario with baseline value, target metric, responsible institution, target geography, review date, and evaluation method.
8. **Governance, Trust & NRB Hub (Should Have):** Displays RBAC permissions, immutable AI/scenario audit logs, data-quality reports, known limitations, and the **NRB Civic Fellowship & Open-Model Hub**.

### 6.2 The 7-Step AI-Native Policy Workflow

The live platform connects every module into one continuous decision chain:

1. **Ask a policy question:** e.g., *"Which districts in Bangladesh face the highest overlapping heat-index and flood-exposure risk while lacking air-quality stations?"*
2. **Find and validate data:** Inspect coverage, reporting periods, and missing-station flags in the Data Hub.
3. **Calculate and visualize:** Run deterministic DuckDB spatial queries and XGBoost scoring across HDX boundaries.
4. **Explain the evidence:** Review SHAP feature contributions, reporting periods, and provenance badges.
5. **Simulate interventions:** Test budget allocation trade-offs across varying $\alpha_{\text{equity}}$ settings.
6. **Generate a reviewable policy brief:** Export a cited brief for human review and approval.
7. **Track outcomes:** Register baseline-to-target KPIs in the Policy Outcomes Tracker.

---

## 7. Responsible AI, Governance, Localisation, and NRB Ecosystem

### 7.1 Security, Privacy, and Governance Controls

- **Role-Based Access Control (RBAC):** Server-side enforcement distinguishing Public Transparency Portal users, Municipal Analysts, Policy Reviewers, and System Admins.
- **Privacy by Design:** Strictly aggregate statistics at ADM2/ADM3 or H3 grid levels; no personally identifiable information (PII), individual tracking, or unblurred street imagery.
- **Prompt-Injection and Tool-Safety Guards:** Input sanitization, strict Pydantic argument schemas, read-only database roles for analytical tools, and zero LLM-generated SQL.
- **Provenance Labeling:** Every metric displays whether it is `Official Observation` (e.g., BBS Census, OpenAQ station), `Model Reanalysis / Estimate` (e.g., ERA5, GloFAS), or `Synthetic Demo Data`.
- **Immutable Audit Logs and Human-in-the-Loop:** Log every dataset import, AI query, slider run, and brief export; prohibit the AI from autonomously approving spending or eligibility.

### 7.2 Localisation and Inclusive Design

Support **Bangla (`বাংলা`) and English (`EN`)** interface toggles using structured i18n dictionaries, pairing official HDX P-codes with familiar local names. Ensure keyboard navigation, readable colorblind-safe map palettes, mobile responsiveness, and compact vector tile payloads (PMTiles) for low-bandwidth environments.

### 7.3 NRB Civic Fellowship and Open-Model Hub

To fulfill the 10-point Scalability and NRB Collaboration criterion substantively, include a dedicated **NRB Open-Model Hub** inside the Governance Centre. Through standardized Python/Pydantic plugin interfaces and GitHub pull-request workflows, Non-Resident Bangladeshi urban planners, hydrologists, and AI engineers abroad can contribute localized risk-calibration models, benchmark local KPIs against global smart-city metrics, and perform independent algorithmic equity audits without accessing restricted internal datasets.

---

## 8. Business Model, Cross-Border Scaling, and Judging Alignment

### 8.1 Hybrid B2G + B2B2G Monetization Model

1. **Tier 1 — GovSaaS (B2G):** Annual platform subscriptions for city corporations, municipal planning authorities, and ministries covering the internal Simulation Studio and Public Transparency Portal.
2. **Tier 2 — Development Finance & Climate Verification (B2B2G):** Outcome-monitoring and baseline-verification licenses for multilateral banks, NGOs, and climate funds (World Bank, ADB, UNDP) auditing resilience grants.
3. **Tier 3 — Commercial Risk API (B2B):** Aggregate spatial risk intelligence APIs for insurers, utilities, and infrastructure developers—explicitly funded to transition external feeds (such as Open-Meteo) onto paid commercial subscriptions (`customer-api.open-meteo.com`).

**Under-24-Hour Cross-Border Deployment:** Because core pipelines consume global standards (HDX COD-AB GeoJSON, OpenStreetMap, Copernicus DEM, Open-Meteo, OpenAQ, and World Bank v2) separated from country-specific configuration files (boundaries, language strings, currency, and admin hierarchy), onboarding a peer city such as Manila, Jakarta, or Nairobi requires only swapping the bounding box and config manifest.

### 8.2 Mapping to the 100-Point Hackathon Rubric

| Criterion (Weight) | Target Band | Winning Proof Points in Your Prototype |
|---|---|---|
| **Innovation** ($20\text{ pts}$) | $16\text{–}20$ | Prescriptive "What-If" budget optimization + SHAP + cited Policy Briefs + closed-loop Outcome Tracker |
| **Technical Execution** ($20\text{ pts}$) | $16\text{–}20$ | DuckDB Spatial + GeoParquet + PostGIS; XGBoost/LightGBM + SHAP; Pydantic tool-calling RAG; zero runtime API failures |
| **Business Model & Global Readiness** ($20\text{ pts}$) | $16\text{–}20$ | 3-tier B2G/B2B2G model + clean commercial licensing awareness + $< 24\text{-hour}$ cross-border config onboarding |
| **Real-World Impact & Ethical AI** ($20\text{ pts}$) | $16\text{–}20$ | Scenario KPIs + interactive $\alpha_{\text{equity}}$ fairness slider + non-PII spatial aggregation + provenance badges |
| **Scalability & NRB Collaboration** ($10\text{ pts}$) | $8\text{–}10$ | Dockerized microservices, OGC GeoJSON/PMTiles APIs, and functional NRB Open-Model Hub tab |
| **Presentation & Storytelling** ($10\text{ pts}$) | $8\text{–}10$ | Cohesive 5-minute live workflow from fragmented Bangladesh data to brief export and outcome tracking |

---

## 9. Ready-to-Code Implementation Specification

### 9.1 Recommended Monorepo Structure

The directory layout below separates the Next.js frontend, FastAPI intelligence backend, batch ingestion pipelines, data catalogue manifests, and RAG policy corpus so team members can work in parallel:

```text
civicsphere-ai/
├── apps/
│   └── web/                          # Next.js (App Router) + TypeScript
│       ├── src/app/                  # Dashboard, Data Hub, Simulator, Copilot, Outcomes, Governance
│       ├── src/components/           # MapLibreCanvas, EChartsPanel, ShapCard, EquitySlider, BriefViewer
│       ├── src/i18n/                 # en.json, bn.json (Bangla/English dictionaries)
│       └── public/tiles/             # Static PMTiles (Bangladesh ADM1/2/3 & H3 overlays)
├── services/
│   └── api/                          # Python 3.11 + FastAPI
│       ├── app/main.py               # FastAPI app, CORS, RBAC & audit middleware
│       ├── app/routers/              # /regions, /data-hub, /simulate, /copilot, /briefs, /outcomes, /governance
│       ├── app/engines/
│       │   ├── spatial_duckdb.py     # DuckDB spatial + h3 queries over GeoParquet
│       │   ├── ml_risk_shap.py       # XGBoost/LightGBM inference + SHAP explanations
│       │   ├── equity_optimizer.py   # P_i(alpha_equity) budget allocator
│       │   └── rag_copilot.py        # Tool-calling LLM + policy corpus retrieval + citations
│       ├── app/db/                   # SQLAlchemy/PostGIS models & migrations
│       └── tests/                    # Pytest: ingestion, deterministic SQL parity, RBAC, prompt-injection
├── pipelines/
│   └── ingest/                       # Batch ETL scripts (never run synchronously on UI click)
│       ├── 01_fetch_hdx_bounds.py    # HDX cod-ab-bgd v03 -> OGC:CRS84 GeoParquet + PMTiles
│       ├── 02_fetch_climate_aq.py    # Open-Meteo (ERA5, AQ, GloFAS) + OpenAQ v3 (BD id 128)
│       ├── 03_fetch_terrain_wb.py    # Copernicus GLO-30 zonal stats + World Bank v2 (BGD)
│       ├── 04_build_features.py      # DuckDB spatial joins + H3 hex aggregation + quality gate
│       └── 05_train_risk_model.py    # Train hazard scorer & precompute SHAP values
├── data/
│   ├── raw/                          # Ignored in Git; downloaded archives
│   ├── curated/                      # Versioned GeoParquet files (regions.parquet, metrics.parquet)
│   └── catalog/                      # dataset_manifest.json & quality_reports.json
├── docs/
│   └── policy_corpus/                # Public urban climate, drainage, & heat guidelines for RAG
├── config/
│   └── countries/bangladesh.yaml     # Country-agnostic config (ADM hierarchy, CRS, currency, lang)
└── docker-compose.yml                # api, web, postgres (postgis/postgis:16-3.4)
```

### 9.2 Core Database Schema (PostgreSQL + PostGIS)

PostgreSQL with PostGIS stores transactional governance records, catalogue metadata, audit logs, and outcome targets, while DuckDB handles high-speed analytical queries over curated GeoParquet files:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Unified Data Catalogue & Quality Gate
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    source_org TEXT NOT NULL,
    license TEXT NOT NULL,
    provenance_class TEXT CHECK (provenance_class IN ('Official', 'Reanalysis_Estimate', 'Synthetic_Demo')),
    reporting_period TEXT NOT NULL,
    quality_score NUMERIC(4,2),
    missing_pct NUMERIC(5,2),
    quality_report JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Policy Simulation Scenarios
CREATE TABLE policy_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by TEXT NOT NULL,
    admin_level TEXT NOT NULL,
    budget_usd NUMERIC(14,2) NOT NULL,
    alpha_equity NUMERIC(4,2) NOT NULL,
    sector_weights JSONB NOT NULL,
    allocations JSONB NOT NULL,
    is_exploratory BOOLEAN DEFAULT TRUE,
    approved_by_human BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Closed-Loop Policy Outcomes Tracker
CREATE TABLE policy_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES policy_scenarios(id),
    title TEXT NOT NULL,
    target_pcode TEXT NOT NULL,
    responsible_agency TEXT NOT NULL,
    indicator_code TEXT NOT NULL,
    baseline_value NUMERIC NOT NULL,
    target_value NUMERIC NOT NULL,
    observed_value NUMERIC,
    status TEXT CHECK (status IN ('Planned', 'Active', 'Under_Review', 'Completed')),
    review_date DATE NOT NULL,
    evidence_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Immutable Governance & AI Audit Log
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    payload_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.3 DuckDB Analytical Spatial Query Pattern

Inside `spatial_duckdb.py`, DuckDB loads the `spatial` and `h3` extensions to run vectorized joins across GeoParquet files using `OGC:CRS84` geometry and metric projections:

```sql
INSTALL spatial; LOAD spatial;

-- Join air-quality monitoring stations to HDX ADM2/ADM3 polygons & detect sensor-scarce regions
SELECT
    r.adm2_pcode,
    r.adm2_en,
    r.adm2_bn,
    COUNT(s.station_id) AS openaq_station_count,
    AVG(c.apparent_temp_anomaly) AS mean_heat_anomaly,
    AVG(f.glofas_p75_discharge) AS mean_flood_p75,
    AVG(e.elevation_p10_m) AS low_lying_elev_m
FROM read_parquet('data/curated/bgd_adm2_regions.parquet') r
LEFT JOIN read_parquet('data/curated/openaq_bd_stations.parquet') s
    ON ST_Within(s.geom, r.geom)
LEFT JOIN read_parquet('data/curated/climate_summary.parquet') c
    ON r.adm2_pcode = c.adm2_pcode
LEFT JOIN read_parquet('data/curated/flood_summary.parquet') f
    ON r.adm2_pcode = f.adm2_pcode
LEFT JOIN read_parquet('data/curated/elevation_summary.parquet') e
    ON r.adm2_pcode = e.adm2_pcode
GROUP BY r.adm2_pcode, r.adm2_en, r.adm2_bn
ORDER BY mean_heat_anomaly DESC;
```

### 9.4 Core FastAPI Endpoints

Every endpoint validates inputs with Pydantic, logs actions to `audit_logs`, and attaches source provenance metadata:

| Method & Path | Purpose | Key Request / Response Fields |
|---|---|---|
| `GET /api/v1/regions` | Fetch regional indicators & risk scores for MapLibre/ECharts | Query: `level=adm2\|adm3\|h3`, `sector`; Returns: P-code, EN/BN names, `risk_score`, `vulnerability_idx`, `provenance` |
| `GET /api/v1/regions/{pcode}/explain` | Return SHAP feature breakdown and data quality flags | Returns: base value, top SHAP feature drivers, station count, reporting periods |
| `GET /api/v1/data-hub/datasets` | List ingested datasets and quality gate reports | Returns: source, licence, `missing_pct`, geometry validation pass/fail, last sync timestamp |
| `POST /api/v1/simulate` | Run ClimAct Twin "What-If" equity budget allocation | Body: `budget_usd`, `alpha_equity`, `w_risk`, `intervention_type`; Returns: ranked allocations + scenario disclaimer |
| `POST /api/v1/copilot/query` | Ask grounded analytical questions | Body: `question`, `lang=en\|bn`; Returns: Markdown answer, tool calls executed, clickable citation badges |
| `POST /api/v1/briefs/generate` | Generate structured Policy Brief from a simulated scenario | Body: `scenario_id`, `lang`; Returns: structured brief (question, evidence, alternatives, assumptions, limitations) |
| `GET/POST /api/v1/outcomes` | Create and monitor Policy Outcomes Tracker records | Body: `scenario_id`, `target_pcode`, `baseline_value`, `target_value`, `responsible_agency`, `review_date` |
| `GET /api/v1/governance/nrb-hub` | Fetch audit logs and NRB Open-Model Hub contributor plugins | Returns: recent audit events, model cards, registered NRB calibration modules |

### 9.5 Seven-Day Hackathon Build Plan

| Day | Core Engineering Milestones |
|---|---|
| **Day 1: Setup & Schemas** | Initialize monorepo (`apps/web`, `services/api`, `pipelines/ingest`); download HDX `cod-ab-bgd` v03 GeoJSON; register OpenAQ v3 API key; write `docker-compose.yml`, PostgreSQL schema, and `bangladesh.yaml`. |
| **Day 2: Batch ETL & Quality Gate** | Implement ingestion scripts for HDX boundaries, Open-Meteo (ERA5, AQ, GloFAS v4), OpenAQ v3 (country `128`), World Bank v2 (`BGD`), Copernicus GLO-30 stats, and cached OSM green/built footprints; generate GeoParquet, PMTiles, and automated quality reports. |
| **Day 3: ML Risk, SHAP & Simulator** | Train XGBoost/LightGBM risk scorer, compute SHAP explanations, build `equity_optimizer.py` ($P_i(\alpha_{\text{equity}})$), and expose `/regions` and `/simulate` endpoints. |
| **Day 4: Grounded Copilot & Briefs** | Build `rag_copilot.py` with hybrid search over `docs/policy_corpus`, Pydantic tool-calling to DuckDB endpoints, prompt-injection sanitization, citation badges, and `/briefs/generate`. |
| **Day 5: Next.js & MapLibre UI** | Build Dashboard, Data Hub, Regional Gap Explorer, MapLibre GL JS + PMTiles choropleth/H3 map, Apache ECharts panels, Budget and $\alpha_{\text{equity}}$ sliders, and SHAP explainability cards. |
| **Day 6: Outcomes, Governance & i18n** | Implement Outcome Tracker persistence, Governance Audit + NRB Open-Model Hub tab, `EN`/`বাংলা` toggle, and Pytest suite verifying SQL parity and RBAC. |
| **Day 7: Hardening & Pitch Prep** | Confirm zero live external API dependencies during UI interactions, scan Git for leaked secrets, test low-bandwidth rendering, record a backup demo video, and rehearse the 5-minute demo. |

### 9.6 Five-Minute Live Demo Script

1. **0:00–0:30 (The Hook):** Frame the real cost of reactive planning as heatwaves, $\text{PM}_{2.5}$ spikes, and monsoon floods hit vulnerable Bangladeshi districts while public data remains fragmented.
2. **0:30–1:30 (Data Hub & National Dashboard):** Show real HDX boundaries fused with Open-Meteo, OpenAQ, and Copernicus DEM layers, and highlight how the Data Hub flags missing air-quality stations rather than hiding gaps.
3. **1:30–2:30 (AI Copilot & SHAP Explainability):** Ask the Copilot which districts face overlapping heat and flood exposure, open a citation badge showing the exact reporting period and DuckDB source, and inspect the SHAP driver breakdown.
4. **2:30–3:30 (ClimAct Twin Simulator & Outcomes):** Move the Budget and $\alpha_{\text{equity}}$ sliders to show resources shifting toward underserved, high-risk districts, export a Policy Brief, and save a measurable target into the Outcome Tracker.
5. **3:30–4:30 (Architecture & Governance):** Present the Dual-Engine design, prompt-injection and privacy guardrails, audit logs, and the NRB Open-Model Hub.
6. **4:30–5:00 (Business Model & Global Scale):** Close with the 3-tier B2G/B2B2G revenue model, under-24-hour cross-border city onboarding, and prototype validation targets.

---

## 10. Evaluation Framework, Production Checklist, and Limitations

### 10.1 Prototype Acceptance Targets (Pre-Deployment Gates)

These metrics define verification targets to test before demo day rather than empirically measured field outcomes:

| Evaluation Dimension | Proposed Acceptance Target | Verification Method |
|---|---|---|
| **Data Ingestion** | $100\%$ of test-suite schemas and file formats ingested cleanly | Automated Pytest ingestion suite |
| **Data Quality** | Invalid schemas, nulls, duplicate P-codes, and CRS/geometry errors flagged | Geometry quality gates & JSON manifests |
| **Analytical Correctness** | $\ge 95\%$ exact agreement with deterministic reference answers | Automated parity tests against reference DuckDB SQL |
| **AI Grounding & Citations** | $\ge 90\%$ of audited factual claims supported by citations; $\ge 95\%$ citation source/period accuracy | Manual and scripted audit of sampled Copilot/Brief outputs |
| **Security & Access Control** | $0$ unresolved critical/high issues on pre-demo checklist | RBAC negative tests, secret scan, prompt-injection checks |
| **Usability & Localisation** | $\ge 5$ test users complete core tasks across EN and Bangla responsive views | Task-completion walkthroughs & keyboard/bandwidth checks |

### 10.2 Pre-Demo Engineering Checklist

- [ ] Every dataset has provenance, licensing, reporting period, and update metadata.
- [ ] Synthetic or downscaled demo values are explicitly labeled and never presented as official statistics.
- [ ] No external rate-limited APIs (OpenAQ, Open-Meteo, Overpass) are called synchronously on frontend clicks.
- [ ] API keys and secrets are excluded from Git and managed via `.env` / environment variables.
- [ ] Bangla and English labels, mobile responsiveness, and keyboard navigation are tested.

### 10.3 Scientific and Operational Limitations

1. **Spatial and temporal granularity:** Global grids (ERA5-Land at $\approx 11\text{ km}$, ERA5 at $\approx 25\text{ km}$, GloFAS at $\approx 5\text{ km}$) reflect regional conditions rather than street-by-street microclimates, and official ADM4 ward boundaries in Bangladesh are not maintained as standardized COD datasets.
2. **Correlation is not causation:** SHAP attributions and hazard overlays measure statistical associations; proving causal policy impact requires quasi-experimental designs and post-implementation control baselines.
3. **Scenario sensitivity:** Simulated budget outcomes depend directly on planner-chosen weights and cost parameters and must remain labeled as exploratory scenarios.
4. **Commercial licensing transition:** Deploying CivicSphere AI for commercial B2G or private-sector clients requires upgrading non-commercial API tiers (such as Open-Meteo's free tier) to commercial subscriptions and formalizing agency data-sharing agreements.

---

## 11. References and Verified Data Starting Points

1. OECD, *Digital Government Outlook 2026: Adopting and Governing AI in Government* and *Strengthening Digital Public Infrastructure and Data Governance*.
2. World Bank, *Interoperability Towards a Data-Driven Public Sector*, *GovTech Maturity Index 2025 Update*, and *Indicators API v2 Documentation*.
3. Humanitarian Data Exchange (HDX) & OCHA ROAP, *Bangladesh - Subnational Administrative Boundaries (COD-AB v03)*, sourced from Bangladesh Bureau of Statistics (BBS).
4. Bangladesh Bureau of Statistics (BBS), *Preliminary Report on Population and Housing Census 2022*.
5. European Space Agency / Copernicus & OpenTopography, *Copernicus GLO-30 Digital Elevation Model*.
6. Open-Meteo, *Historical Weather API (ERA5 / ERA5-Land)*, *Air Quality API*, *Flood API (GloFAS v4)*, and *API Terms & Pricing*.
7. OpenAQ, *OpenAQ API v3 Documentation, Countries Resource, Rate Limits, and Terms of Use*.
8. Flood Forecasting and Warning Centre (FFWC), Bangladesh Water Development Board (BWDB), *FFWC API Documentation*.
9. OpenStreetMap Wiki, *Overpass API Usage Policy*, and ZQM Computing, *DuckDB Spatial Cookbook*.
10. Harkin, R., *A Gift from Heaven: Google's Environmental Insights Explorer and its Tech-Down Approach to Monitor Urban Sustainability Beyond Local Contexts*, Urban Studies.