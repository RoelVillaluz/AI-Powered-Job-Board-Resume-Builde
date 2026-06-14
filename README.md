# AI-Powered Job Board Website with Resume Maker

![CI/CD](https://github.com/RoelVillaluz/AI-Powered-Job-Board-Resume-Builde/actions/workflows/ci-cd.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?logo=pytorch&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)
![Supertest](https://img.shields.io/badge/Supertest-000000?style=flat&logoColor=white)

A full-stack job board platform that streamlines the entire job application lifecycle — from discovery and matching to resume creation and interviews. The platform combines modern web technologies with AI-driven features to help job seekers make smarter, faster career decisions.

At its core, the system lets users search and apply for jobs, automatically generate professional resumes, and communicate directly with employers — all within a single, cohesive application.

---

## ✨ Key Highlights

- End-to-end job application platform (search → match → apply → interview)
- AI-powered insights for matching, scoring, salary estimation, and skill growth
- FastAPI microservice with a warm `all-mpnet-base-v2` model — 30–50× faster than subprocess V1
- 3-stage semantic matching: Pinecone vector retrieval → hybrid scoring → LLM reranking (reranker pending)
- Registry-driven async embedding pipeline across all entity types
- Full observability via Grafana dashboards with real-time latency and throughput metrics
- Pipeline optimized from ~2 minutes (early version) to p95 of 21s full iteration / 385ms API response

---

## 🚀 Features

### 1. AI Job Matching

Recommends relevant job postings by analyzing a user's resume and saved preferences (job type, salary range, experience level).

- Uses vector similarity to compare user skills against job requirements
- Applies preference-based weighting for more personalized results
- Outputs a transparent match score (0–100%) per job posting

Under the hood this is a 3-stage pipeline:

```
Stage 1 — Retrieval      Stage 2 — Scoring         Stage 3 — Reranking
─────────────────────    ──────────────────────     ────────────────────────
Pinecone vector search   Hybrid formula (0–100)     LLM explains + reorders
topK=20 candidates   →   skill, exp, seniority  →   Best Fit / Good Fit /
threshold + fallback     semantic, location          Stretch classification
```

Scoring formula:

```
score = (
  skill_match        × 0.40
  experience_fit     × 0.25
  semantic_sim       × 0.15
  seniority_fit      × 0.10
  location_fit       × 0.07
  cert_bonus         × 0.03
) × penalty_multiplier

Penalties:
  experience gap > 3yr   → × 0.85
  experience gap > 5yr   → × 0.70
  seniority mismatch     → × 0.80
  missing required skill → −15pts flat

Score tiers:
  80–100 → Strong Fit
  60–79  → Good Fit
  40–59  → Weak Fit
  0–39   → Poor Fit
```

### 2. AI Resume Scorer

Evaluates resumes across two dimensions:

- **Completeness** — how thoroughly each section is filled out
- **Relevance** — how well experience and content align with listed skills

Produces an actionable score with strengths, improvement areas, and recommendations.

### 3. AI Salary Predictor

Generates an estimated salary range based on the user's resume and similar job postings.

- Leverages semantic similarity between resumes and job descriptions
- Produces personalized, data-driven salary expectations
- Helps users benchmark offers and negotiate confidently

### 4. AI Personalized Skill Recommendations

Identifies skill gaps and suggests high-impact skills to learn based on saved job postings.

- Extracts current skills from the user's resume (built in-app)
- Aggregates required skills from saved job listings
- Uses a neural network to detect missing but commonly required skills
- Returns targeted recommendations to improve employability

### 5. Integrated Video Chat *(Upcoming)*

Enables direct communication between candidates and employers without leaving the platform — supporting initial screenings, follow-ups, and ongoing discussions.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React.js)                             │
│          Job Search · Resume Builder · Match Results · Chat          │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ HTTP REST + Socket.IO
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Node.js API  (Express + BullMQ)                    │
│                                                                      │
│  Routes         BullMQ Workers         DB Ownership                  │
│  /embed    →    Embedding Worker  ──→  MongoDB reads/writes          │
│  /score    →    Scoring Worker    ──→  Redis job state               │
│  /match    →    Matching Worker   ──→  Pinecone queries              │
│  /salary   →    Salary Worker     ──→  Socket.IO progress events     │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ HTTP POST (prepared payload)
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│              FastAPI AI Service  (Python microservice)               │
│                                                                      │
│  Pure compute layer — no DB access                                   │
│  all-mpnet-base-v2 loaded once at startup, warm for every request    │
│                                                                      │
│  POST /compute/generate_resume_embeddings                            │
│  POST /compute/generate_skill_embeddings                             │
│  POST /compute/generate_job_title_embeddings                         │
│  POST /compute/generate_location_embeddings                          │
│  POST /compute/score_resume                                          │
│                                                                      │
│  ThreadPoolExecutor — 5 resume sections run concurrently             │
│  skills · workExperience · certifications · jobTitle · location      │
└──────────┬──────────────────────────────────────┬────────────────────┘
           │                                      │
           ▼                                      ▼
┌─────────────────────┐               ┌───────────────────────┐
│  Pinecone           │               │  MongoDB              │
│  Vector Store       │               │                       │
│                     │               │  ResumeEmbedding      │
│  namespace: resumes │               │  JobEmbedding         │
│  namespace: jobs    │               │  Users · Jobs         │
│  768-d vectors      │               │  Resumes · Sessions   │
│  (all-mpnet-base-v2)│               └───────────────────────┘
│                     │
│  topK=20 retrieval  │               ┌───────────────────────┐
│  threshold: 500 jobs│               │  Redis                │
│  fallback → MongoDB │               │  BullMQ job queues    │
└─────────────────────┘               │  Embedding cache      │
                                      │  Poll results         │
                                      └───────────────────────┘
                                                │
                                                ▼
                                      ┌───────────────────────┐
                                      │  Grafana + Prometheus │
                                      │  Observability Stack  │
                                      │                       │
                                      │  Embedding Pipeline   │
                                      │  Matching Pipeline    │
                                      │  Latency percentiles  │
                                      │  Cache hit rates      │
                                      └───────────────────────┘
```

### How It Works 

1. **Resume Creation** — Candidates build their resume directly in the web app (no file upload or parsing — everything is entered through the resume builder UI). The Embedding Worker then splits it into sections (skills, work experience, certifications, job title, location) and sends each to FastAPI, which converts them into 768-dimensional vectors using `all-mpnet-base-v2`. All 5 sections run in parallel — total embedding time is ~500ms.
2. **Job Ingestion** — Job postings go through the same pipeline and land in Pinecone's `jobs` namespace with filterable metadata (required skills, experience level, salary range, location).
3. **Semantic Matching** — When a match is requested, Pinecone returns the top 20 most semantically similar jobs. This goes far beyond keyword search — "software engineer with React experience" will surface "frontend developer" and "UI engineer" roles even without exact wording.
4. **Scoring & Ranking** — The Scoring Worker applies a weighted formula (skills 40%, experience 25%, semantic similarity 15%, seniority 10%, location 7%, certs 3%) and applies experience/seniority penalties where applicable.
5. **Salary Estimation** — The Salary Worker estimates an expected salary range based on the resume and comparable job postings, helping candidates benchmark and negotiate.
6. **Poll for Results** — All pipeline steps are async. The client polls `GET /{step}/:jobId` until results are ready — typically under 5 seconds per step end-to-end.

---

## 🤖 AI Service — FastAPI Microservice

The AI service is a Python FastAPI microservice responsible for all ML compute. The model loads **once at startup** and stays warm in memory for every subsequent request — eliminating the cold start problem that plagued the original subprocess architecture.

### Why FastAPI (V2) vs subprocess (V1)

| | V1 — subprocess | V2 — FastAPI |
|---|---|---|
| Cold start | 10,000–20,000ms per request | 0ms (model always warm) |
| Embedding generation | ~3,500ms | ~494ms |
| Score calculation | ~2,000ms | ~380ms |
| Full pipeline (first run) | 20,000–40,000ms | ~1,300ms |
| DB coupling | Python fetched from MongoDB | Node owns DB; Python receives prepared payload |
| Scalability | Coupled to Node process | Independent service, scales separately |

**V1 subprocess architecture:**
```
Node request → spawn python → import sentence_transformers
→ load 420MB model from disk (10–20s) → compute → exit → model unloaded
```

**V2 FastAPI architecture:**
```
FastAPI starts → model loads once → stays warm

Node request → POST /compute/... → model already in memory → compute (~500ms) → return
```

### Parallel Embedding Execution

All 5 resume sections run concurrently via `ThreadPoolExecutor`. Total time is bounded by the slowest section, not the sum of all:

```
resume payload received
  ├── Thread: skills embeddings         ~228ms
  ├── Thread: workExperience embeddings ~200ms
  ├── Thread: certifications embeddings ~180ms
  ├── Thread: jobTitle embedding        ~96ms
  └── Thread: location embedding        ~89ms
                                        ─────
  Total (parallel):                     ~494ms  (not ~793ms sum)
```

PyTorch tensor operations release the GIL, so threads genuinely overlap rather than serialize.

### Setting Up the AI Service

```bash
cd ai-service
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Verify:
```
GET http://localhost:8000/health   → { "status": "ok", "model": "all-mpnet-base-v2" }
GET http://localhost:8000/docs     → interactive Swagger UI
```

Set these env vars after the first model download to skip HuggingFace network checks (~42s → ~3s startup):

```env
TRANSFORMERS_OFFLINE=1
HF_HUB_OFFLINE=1
```

---

## 🔍 Vector Database — Pinecone

**Index:** `resume-job-matching` | **Dimensions:** 768 | **Namespaces:** `resumes`, `jobs`

### Vector Composition

Resume and job vectors are weighted blends of field-level embeddings:

```
Resume vector weights          Job vector weights
──────────────────────         ──────────────────────
skills          × 0.40         skills          × 0.35
workExperience  × 0.30         requirements    × 0.25
jobTitle        × 0.15         jobTitle        × 0.20
certifications  × 0.10         experienceLevel × 0.15
location        × 0.05         location        × 0.05
```

Missing fields are excluded automatically and weights are renormalized.

### Cost & Threshold Strategy

```
Before every Pinecone query:
  COUNT active JobPostings in MongoDB (cached 5 min)
  ├── count >= 500 → Pinecone vector search
  └── count < 500  → MongoDB fallback query (free, equally accurate at small scale)

If Pinecone throws at any point:
  → catch silently → fall back to MongoDB → log error → user never sees failure
```

### Backfill

Run when first deploying, after bulk job imports, or after recovering from a Pinecone outage:

```bash
npx tsx --env-file=.env.dev src/scripts/backfillPinecone.ts
```

The script is idempotent — safe to re-run. Bypasses the 500-job threshold by design.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, CSS |
| Backend API | Node.js, Express.js |
| Job Queue | BullMQ (Redis-backed) |
| AI Service | Python, FastAPI |
| ML Model | Sentence Transformers (`all-mpnet-base-v2`, 768-d) |
| ML Framework | PyTorch, Scikit-learn |
| Vector DB | Pinecone |
| Database | MongoDB |
| Cache | Redis |
| Validation | Joi |
| Auth | JWT, bcrypt |
| Testing | Jest, Supertest |
| Load Testing | k6 |
| Observability | Grafana, Prometheus |

---

## 🎯 Project Goal

Traditional job search platforms focus on listing job openings, leaving candidates uncertain about how well they match a role, how to improve their applications, or how to move efficiently through the hiring process.

This platform transforms that passive browsing experience into an informed, guided, end-to-end workflow:

- Clearly shows how well a candidate matches a specific job through transparent, data-driven match scores
- Helps users understand *why* they are (or aren't) a good fit for a role
- Provides actionable guidance on tailoring and improving resumes for specific opportunities
- Reduces uncertainty around salary expectations and required skills using AI-driven insights
- Enables direct interview scheduling within the platform, eliminating back-and-forth emails
- Centralizes the entire job application lifecycle — discovery, application, interview, communication — in one application

---

## ⚙️ Setup and Configuration

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB (local or Atlas)
- Redis
- Pinecone account

### 1. Clone the Repository

```bash
git clone https://github.com/RoelVillaluz/AI-Powered-Job-Board-Resume-Builde.git
cd AI-Powered-Job-Board-Resume-Builde
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# AI Service
cd ../ai-service
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### 3. Environment Setup

> There are **two separate env files** — `.env` for the app, `.env.k6` for load testing.
> If you just want to run the web app, you only need `.env`.

#### `.env` — Web App (all developers)

```bash
cp .env.example .env
```

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/job_board

# Email (for notifications)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# Auth
JWT_SECRET=your_jwt_secret_key

# Environment
NODE_ENV=development
LOG_LEVEL=debug

# URLs
CLIENT_URL=http://localhost:5173
PORT=5000
AI_SERVICE_URL=http://localhost:8000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=resume-job-matching
PINECONE_ENVIRONMENT=us-east-1-aws

# AI Service — skip HF network checks after first model download
TRANSFORMERS_OFFLINE=1
HF_HUB_OFFLINE=1
```

#### `.env.k6` — Load Testing only (optional)

> Skip this entirely if you're just building or exploring the app. Only needed for running k6 performance tests.

```bash
cp .env.k6.example .env.k6
```

```env
# Target
K6_BASE_URL=http://localhost:5000

# Load profile
K6_VUS=10
K6_DURATION=5m

# Thresholds (ms) — override defaults if needed
K6_THRESHOLD_HTTP_P95=5000
K6_THRESHOLD_EMBEDDING_P95=30000
K6_THRESHOLD_MATCHING_P95=20000
K6_THRESHOLD_SALARY_P95=15000
K6_THRESHOLD_SCORING_P95=15000
```

### 4. Start Redis

```bash
# In WSL
redis-server

# Verify
redis-cli
ping   # → PONG
```

### 5. Run the App

**Option A — all services at once (recommended):**

```bash
cd backend
npm run dev
```

This uses `concurrently` to start the Node.js backend and the FastAPI AI service in parallel.

**Option B — individually:**

```bash
# Backend
cd backend && npm run server

# AI Service
cd ai-service && uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend && npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| AI Service | http://localhost:8000 |
| AI Service Docs | http://localhost:8000/docs |

### 6. Running Tests

```bash
# Run once
npm test

# Watch mode
npm run test:watch
```

---

## 📊 Grafana Dashboards

Dashboards are available at `http://localhost:3000` after starting the observability stack.
<img width="1823" height="895" alt="image" src="https://github.com/user-attachments/assets/59a35a91-82a5-4455-9315-9a8e16325a27" />
*Pipeline Health under k6 stress load — 575 requests, 100% cache hit rate, p95 831ms*

### Job Board — Embedding Pipeline

| Panel | What it shows |
|---|---|
| Total Embedding Requests | Count of embedding jobs submitted |
| Failed Embedding Requests | Pipeline errors |
| Pipeline Runs With Errors | End-to-end error count |
| Overall Cache Hit Rate | % of embeddings served from cache (red = 0%, target >80%) |
| p95 End-to-End Latency | 95th percentile full pipeline duration |
| Embedding Request Rate by Entity | Resume/s vs Job/s vs Failed/s over time |
| End-to-End Latency Percentiles | p50 and p95 by entity type |
| Resume — p95 Latency per Section | Per-section breakdown (skills, experience, etc.) |

### Job Board — Matching & Pipeline

| Panel | What it shows |
|---|---|
| Total Match Requests | Matching jobs submitted |
| Failed Match Requests | Matching errors |
| p95 Match Latency | 95th percentile match duration (currently 1.95s) |
| Pinecone Queries | Total ANN queries fired (196 at last run) |
| Fallback Triggers | Times system fell back from Pinecone to MongoDB |
| Match Latency Percentiles | p50 / p95 / p99 breakdown |
| Match Request Rate | Success/s vs Failed/s |
| Handler Request Rate by Endpoint | Per-AI-handler throughput |
| Handler p95 Latency by Endpoint | Per-handler latency |

---

## 🧪 Load/Stress Testing

Load and/or stress tests are written with [k6](https://k6.io) and cover the full async pipeline: embed → score → match → salary.
<img width="855" height="909" alt="image" src="https://github.com/user-attachments/assets/61ca3d2a-dec0-4643-80ab-6381d30eaf69" />

```bash
k6 run --env-file .env.k6 tests/load/pipeline.js
```

### Latest Results — June 13, 2026 (Stress — 30 VUs)
![Uploading image.png…]()

**Configuration:** 10 VUs · 5-minute ramp · 98 complete iterations · 0 interrupted

### Latest Results — June 13, 2026 (Stress — 30 VUs · 471 iterations)

| Metric | p95 | Threshold | Status |
|---|---|---|---|
| HTTP request duration | 443ms | < 5,000ms | ✅ |
| — Embedding step | 498ms | < 5,000ms | ✅ |
| — Matching step | 381ms | < 8,000ms | ✅ |
| — Salary step | 381ms | < 5,000ms | ✅ |
| — Scoring step | 492ms | < 3,000ms | ✅ |
| Embedding worker duration | 3.89s | < 30,000ms | ✅ |
| Matching worker duration | 3.71s | < 20,000ms | ✅ |
| Salary worker duration | 3.71s | < 15,000ms | ✅ |
| Scoring worker duration | 3.83s | < 15,000ms | ✅ |
| Full iteration duration | 19.81s | < 120,000ms | ✅ |
| HTTP failure rate | 0.00% | < 10% | ✅ |
| Check success rate | 100.00% | > 80% | ✅ |

- 3,768 total HTTP requests · 6.15 req/s
- 31MB received · 1.6MB sent
- 100% poll success across all steps
- Average worker duration across all steps: ~3.5s
- **100% cache hit rate under 30 concurrent users**

---

## 📁 Project Structure

```
.
├── frontend/                   React.js client
│   └── src/
│
├── backend/                    Node.js API + BullMQ workers
│   ├── src/
│   │   ├── config/             DB + Pinecone connections
│   │   ├── routes/             Express routes
│   │   ├── workers/            BullMQ embedding, scoring, matching, salary workers
│   │   ├── infrastructure/
│   │   │   └── pinecone/       upsert, query, threshold, fallback, afterSave hooks
│   │   ├── jobs/domains/
│   │   │   └── embedding/      vectorComposer, embeddingRegistry
│   │   └── scripts/
│   │       └── backfillPinecone.ts
│   ├── tests/
│   │   └── load/               k6 load test scripts
│   ├── .env.example
│   └── .env.k6.example
│
├── ai-service/                 FastAPI Python microservice
│   ├── app.py                  Entry point + lifespan model loading
│   ├── main_v2.py              V2 compute functions (no DB)
│   ├── routers/                embeddings.py · scoring.py · health.py
│   ├── models/                 EmbeddingModel singleton
│   ├── services/               resume_service · scoring_service · analytics_service
│   ├── infrastructure/
│   │   └── embeddings/         orchestrator · pipeline_registry · tasks
│   └── utils/                  embedding_utils · tensor_utils · date_utils
│
└── grafana/                    Dashboard JSON provisioning
```

---

## 🗺️ Roadmap

| Phase | Feature | Status |
|---|---|---|
| 1 | Pinecone setup — index, SDK, config, bootstrap | ✅ Done |
| 2 | Vector infrastructure — composer, upsert, query, threshold, fallback | ✅ Done |
| 3 | Pipeline wiring — afterSave hooks, backfill script | ✅ Done |
| 4 | Hybrid scoring layer | ✅ Done |
| 5 | Matching controller + `GET /api/resumes/:id/matches` route | ✅ Done |
| 6 | LLM reranker | 🔲 Pending |
| 7 | Cron gap-fill job + ops (BullMQ repeat, delete sync, RU alerts) | 🔲 Pending |
| 8 | Integrated video chat | 🔲 Upcoming |

---

## ⚡ Performance Optimization History

The pipeline went from ~2 minutes end-to-end (early version) to a p95 of ~21s for a full 4-step iteration, with API response times under 400ms. Here's what drove that improvement:

### Before vs After

| | Early Version | Current (June 2026) |
|---|---|---|
| Full pipeline (cold) | ~1–2 minutes | ~1.3s (warm service) |
| Embedding generation | ~3,500ms | ~494ms |
| Score calculation | ~2,000ms | ~380ms |
| API p95 response time | N/A (sync, blocking) | 385ms |
| Worker p95 (embedding) | N/A | 4.46s |
| Worker p95 (matching) | N/A | 4.95s |
| Worker p95 (salary) | N/A | 4.95s |
| Worker p95 (scoring) | N/A | 3.91s |
| Full iteration p95 | ~2 min | 21.01s |

### What Changed (in order of impact)

**1. Persistent AI Service (biggest win)**
Every request used to spawn a new Python subprocess, load the 420MB `all-mpnet-base-v2` model from disk (10–20s), run computation, then exit — discarding the model. Replaced with a FastAPI microservice that loads the model once at startup and keeps it warm. Cold start cost dropped from 10–20s per request to 0ms.

**2. Moved heavy work off the request path**
The original design was fully synchronous — users waited while the full pipeline ran inline. Introduced BullMQ background workers: the API now returns a `202 Accepted` with a `jobId` immediately, and the client polls for results. API response time dropped from pipeline duration (~minutes) to queue enqueue time (~50ms).

**3. Parallelized embedding generation**
Resume sections (skills, experience, certifications, jobTitle, location) were previously embedded sequentially. Switched to `ThreadPoolExecutor` — all 5 sections now run concurrently. Total embedding time is bounded by the slowest section, not the sum of all five.

**4. Eliminated redundant embedding generation**
Embeddings used to be regenerated on every matching request. Added `skillsEmbedding`, `titleEmbedding`, `locationEmbedding`, and `meanEmbedding` fields directly to Resume and Job documents. Embeddings are now generated once on save and reused — expensive AI compute becomes a cheap DB read on subsequent requests.

**5. Composite document vectors**
Matching previously compared individual field embeddings one-by-one (resume skills ↔ job skills, resume title ↔ job title, etc.). Replaced with weighted composite 768-d vectors per document. One Pinecone query replaces many field-level comparisons.

**6. Separated queues per pipeline step**
Originally a single processing flow handled everything. Split into five independent queues: `resume`, `job`, `matching`, `salary`, `scoring`. Each is independently scalable and failures in one don't block others.

**7. Embedding TTLs and smart refreshes**
Instead of recomputing continuously, added TTLs: resume embeddings expire after 30 days, job embeddings after 90 days. Only stale embeddings are regenerated.

**8. Cached match scores**
Resume–job score pairs are cached for 30 days. Repeat scoring requests for the same pair return instantly without recomputation.

**9. Metadata pre-filtering before Pinecone queries**
Added role, location, and experience level filters that run before the vector search, reducing the candidate pool Pinecone has to score and lowering Read Unit consumption.

**10. Observability-driven iteration**
After adding Prometheus + Grafana, optimization became data-driven rather than guesswork. p50/p95/p99 latency, cache hit rates, fallback triggers, and per-worker durations are all tracked in real time.

---

## 💰 Infrastructure Cost Analysis

> **Framing:** The Node.js backend is **deployed on Render**. The FastAPI AI service is **deployed on AWS EC2**. The scale projections below (1,000 DAU, 10,000 DAU) are architectural exercises — deliberate estimates made before scaling up, derived from real k6 load test measurements and published cloud pricing, to validate that the optimizations made during development hold up economically at production scale. AWS CloudWatch cost monitoring is planned (TBA) and will replace these projections with measured actuals once instrumented.
>
> All compute figures trace back to the k6 load test run on June 10, 2026. Render and AWS pricing use published on-demand rates (us-east-1). Numbers are directional projections, not invoiced costs.

---

### Why This Analysis Exists

Most projects stop at "it works." This analysis exists to answer what comes next: **what would it actually cost to keep running at scale, and were the architectural decisions made early the right ones?**

The optimizations in this project — persistent AI service, pre-generated embeddings, async BullMQ workers, composite vectors — each had a performance reason. But they also had a cost reason. This section makes that explicit, traces every number back to a real measurement, and shows where the tradeoffs land.

---

### Measured Baseline — k6 Load Test (June 10, 2026)

98 complete pipeline iterations (embed → score → match → salary), 10 VUs, 5 minutes. Zero failures.

**Actual compute per iteration (V2, current):**

| Step | Avg worker duration | p95 worker duration |
|---|---|---|
| Embedding | 3.48s | 4.46s |
| Matching | 3.47s | 4.95s |
| Salary | 3.47s | 4.95s |
| Scoring | 3.45s | 3.91s |
| **Total AI compute / iteration** | **~13.87s avg** | **~18.27s p95** |

The HTTP layer (queue enqueue + client poll) added only 126ms median / 386ms p95. It is not the bottleneck — the Node.js process is free within ~50ms of receiving a request.

---

### What V1 Would Have Cost (Same Workload)

V1 spawned a fresh Python subprocess per pipeline step. Each subprocess:

1. Started a new Python process from scratch
2. Imported `sentence_transformers` and loaded `all-mpnet-base-v2` (420MB) from disk — **10–20 seconds, every single call**
3. Re-encoded every resume field unconditionally — no pre-generated embeddings existed, so skills, location, job title, certifications, and work experience all went through `model.encode()` from scratch regardless of whether the resume had changed
4. Printed the result to stdout and exited — model unloaded from memory, ready to pay the full cost again on the next call

**Time comparison per pipeline step:**

| Step | V1 (cold start + full re-encoding) | V2 (warm service + cached embeddings) | Time saved |
|---|---|---|---|
| Embedding | ~15,000–23,500ms | ~3,480ms | ~11.5–20s |
| Scoring | ~12,000–22,000ms | ~3,450ms | ~8.5–18.5s |
| Matching | ~15,000–23,000ms | ~3,470ms | ~11.5–19.5s |
| Salary | ~15,000–23,000ms | ~3,470ms | ~11.5–19.5s |
| **Full iteration** | **~57,000–91,500ms (~1–1.5 min)** | **~13,870ms** | **~43–78s** |

**The redundant encoding tax, broken down:**

V1 called `model.encode()` on every field of every resume on every request, even if that resume was last updated a week ago. V2 generates and stores embeddings at save time. On a typical resume:

| Field | Items | Encode calls | Time each | Wasted per request |
|---|---|---|---|---|
| Skills | 10 | 10 | ~50ms | ~500ms |
| Work experience | 3 | 3 | ~100ms | ~300ms |
| Certifications | 2 | 2 | ~80ms | ~160ms |
| Job title | 1 | 1 | ~96ms | ~96ms |
| Location | 1 | 1 | ~89ms | ~89ms |
| **Total** | | **17 calls** | | **~1,145ms** |

In V2, those 17 model calls become a single MongoDB read (~5–15ms). Across the 5-minute k6 test (392 pipeline requests), that's roughly **449 seconds of avoidable model inference eliminated** in one test window.

---

### Design Tradeoff: Space vs Compute

Pre-generating and storing embeddings is a deliberate space-for-compute tradeoff.

**The cost:**
- Each resume stores 5 field-level embedding arrays (768 floats each) plus a composite 768-d vector → ~23KB of additional storage per resume
- Each job posting stores the same → ~23KB per job
- At 10,000 resumes + 10,000 jobs: ~460MB of additional MongoDB storage
- MongoDB Atlas free tier: 512MB total. Paid M10 cluster: 10GB at ~$57/mo — storage cost is negligible

**Why it's the right tradeoff:**

The alternative is re-running 17 `model.encode()` calls on every matching request. At 10,000 DAU with ~10,000 pipeline runs/day, that's 170,000 model inference calls per day that V2 eliminates entirely. The compute cost of those redundant calls — in CPU time, memory pressure, request latency, and real money on EC2 — grows linearly with traffic. The storage cost of the cached embeddings is fixed once written and grows only when resumes/jobs are created, not when they're queried.

Storing ~460MB of embedding vectors to avoid hundreds of thousands of daily model inference calls is not a space problem — it's the correct engineering decision, and the cost numbers below show why.

---

## Throughput & Scale Projections

From the k6 baseline: **98 iterations / 5 min ≈ 19.6 iterations/min at 10 VUs**.  
Assumes 1 full pipeline run per DAU per day.

In practice, returning users often hit cache (30-day match cache), so real compute per user can be significantly lower over time.

| Scale | Daily active users | Pipeline runs/day | V2 AI compute/day | V1 AI compute/day (equiv.) |
|---|---|---|---|---|
| Current (k6 baseline) | ~10 concurrent test load | ~98 / 5 min test run | ~0.38 hrs | ~2.48 hrs |
| 1,000 DAU | 1,000 | ~10,000 | ~38.5 hrs | ~159 hrs |
| 10,000 DAU | 10,000 | ~100,000 | ~385 hrs | ~1,590 hrs |

---

## Render — Node.js Backend (Deployed, Free Tier / Dev)

The backend is currently deployed on **Render free tier (development environment)**. There are no production users yet — performance and throughput numbers are derived from k6 load testing.

V1’s synchronous architecture kept the web process blocked during AI execution (up to ~2 minutes per request), requiring a larger instance just to maintain concurrency.

V2 instead returns `202 Accepted` in ~50ms and offloads work to **BullMQ worker processes**, decoupling request handling from compute-heavy execution.

This architectural separation is what enables low-tier hosting during early-stage usage.

| | V1 — sync + subprocess | V2 — async BullMQ (current design) |
|---|---|---|
| Web process during AI work | Blocked 1–2 min/request | Free after ~50ms |
| CPU/RAM pressure | High (inline compute) | Minimal (enqueue only) |
| Scaling strategy | Upsize single dyno | Scale workers independently |
| Web tier requirement | Standard 2X (~$50/mo) | Starter / free-tier capable |
| Worker requirement | N/A | Standard 1X (~$25/mo equivalent) |
| **Current actual cost** | Not deployed | **$0 (free tier dev usage)** |
| **Projected cost (production)** | ~$50/mo | ~$30–$32/mo |

### Render cost at scale (projected)

| Scale | V1/mo | V2/mo | Saving |
|---|---|---|---|
| 1,000 DAU | ~$100 | ~$57 | ~$43/mo |
| 10,000 DAU | ~$300 | ~$150 | ~$150/mo |

The key difference is structural: V1 scales by upgrading the web process itself, while V2 isolates compute into workers that scale independently.

---

## AWS EC2 — AI Microservice (Planned, Not Yet Deployed)

The FastAPI inference service is designed for **AWS EC2**, but it is currently not deployed. The configuration below reflects intended production architecture and estimated sizing.

The model (~420MB) loads once at startup and remains warm in memory, avoiding repeated initialization overhead.

### Planned EC2 sizing (us-east-1, on-demand estimates)

| Scale | Instance | Reason | Est. cost/mo |
|---|---|---|---|
| Current (planned baseline) | t3.small (2 vCPU, 2GB) | Single warm model, low traffic | ~$15 |
| 1,000 DAU | t3.medium (2 vCPU, 4GB) | Increased concurrency headroom | ~$30 |
| 10,000 DAU | t3.large × 2 | Horizontal scaling for inference | ~$120 |

> Reserved Instances (~40% savings) not included for conservative estimates.

---

### V1 vs V2 on EC2 (architectural comparison)

| | V1 design | V2 design |
|---|---|---|
| Model handling | Reload per subprocess/request | Load once, reused in memory |
| Memory per request | ~420MB each time | Shared single load |
| Concurrency scaling | Memory-bound | Horizontal or shared-state friendly |
| Instance requirement (5 concurrent users) | t3.large minimum | t3.small sufficient (baseline) |
| Cost efficiency | Lower (repeated loads) | Higher (model reuse) |

---

## Combined Projection (Render + Planned EC2)

> Note: Render is currently on free-tier development usage. EC2 is not yet deployed. All production values are projections.

| Scale | V1 projected/mo | V2 projected/mo | Monthly saving | Annual saving |
|---|---|---|---|---|
| Current (dev / no users) | ~$110 | ~$0–$20 | N/A | N/A |
| 1,000 DAU | ~$220 | ~$87 | ~$133 | ~$1,596 |
| 10,000 DAU | ~$780 | ~$270 | ~$510 | ~$6,120 |

---

## Key Insight

The savings come not from cheaper infrastructure, but from architectural separation:

- V1: compute executed inside request lifecycle  
- V2: compute fully decoupled into async workers + reusable model state  

This shifts scaling from “bigger machines” to “more workers only when needed”

---

## 📚 Related Documentation

Detailed technical docs for each subsystem live in the repo:

| Document | Description |
|---|---|
| [`backend/docs/vector-db.md`](./backend/docs/vector-db.md) | Vector DB layer — Pinecone setup, composite vectors, metadata schema, threshold strategy, backfill |
| [`ai-service/docs/architecture.md`](./ai-service/docs/architecture.md) | AI Service V2 architecture — FastAPI microservice, V1 vs V2 comparison, cold start solution, performance benchmarks |
| [`backend/docs/embedding-infrastructure.md`](./backend/docs/embedding-infrastructure.md) | Embedding pipeline — registry pattern, task config, parallel execution, cache outcomes |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a PR
