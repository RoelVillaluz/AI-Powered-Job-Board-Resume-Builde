# AI-Powered Job Board Website with Resume Maker
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
A full-stack job board platform that streamlines the entire job application lifecycle — from discovery and matching to resume creation and interviews. The platform combines modern web technologies with AI-driven features to help job seekers make smarter, faster career decisions.

At its core, the system lets users search and apply for jobs, automatically generate professional resumes, and communicate directly with employers — all within a single, cohesive application.
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
Evaluates resumes across two dimensions:

- **Completeness** — how thoroughly each section is filled out
- **Relevance** — how well experience and content align with listed skills
- **Completeness** — how thoroughly each section is filled out
- **Relevance** — how well experience and content align with listed skills

Produces an actionable score with strengths, improvement areas, and recommendations.
Produces an actionable score with strengths, improvement areas, and recommendations.

### 3. AI Salary Predictor

Generates an estimated salary range based on the user's resume and similar job postings.
Generates an estimated salary range based on the user's resume and similar job postings.

- Leverages semantic similarity between resumes and job descriptions
- Produces personalized, data-driven salary expectations
- Helps users benchmark offers and negotiate confidently
- Leverages semantic similarity between resumes and job descriptions
- Produces personalized, data-driven salary expectations
- Helps users benchmark offers and negotiate confidently

### 4. AI Personalized Skill Recommendations

Identifies skill gaps and suggests high-impact skills to learn based on saved job postings.
Identifies skill gaps and suggests high-impact skills to learn based on saved job postings.

- Extracts current skills from the user's resume (built in-app)
- Aggregates required skills from saved job listings
- Uses a neural network to detect missing but commonly required skills
- Returns targeted recommendations to improve employability
- Extracts current skills from the user's resume (built in-app)
- Aggregates required skills from saved job listings
- Uses a neural network to detect missing but commonly required skills
- Returns targeted recommendations to improve employability

### 5. Integrated Video Chat *(Upcoming)*
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

### How It Works (for Recruiters)

1. **Resume Creation** — Candidates build their resume directly in the web app. The Embedding Worker splits it into sections (skills, work experience, certifications, job title, location) and sends each to FastAPI, which converts them into 768-dimensional vectors using `all-mpnet-base-v2`. All 5 sections run in parallel — total embedding time is ~500ms.
2. **Job Ingestion** — Job postings go through the same pipeline and land in Pinecone's `jobs` namespace with filterable metadata (required skills, experience level, salary range, location).
3. **Semantic Matching** — When a match is requested, Pinecone returns the top 20 most semantically similar jobs. This goes far beyond keyword search — "software engineer with React experience" will surface "frontend developer" and "UI engineer" roles even without exact wording.
4. **Scoring & Ranking** — The Scoring Worker applies a weighted formula (skills 40%, experience 25%, semantic similarity 15%, seniority 10%, location 7%, certs 3%) and applies experience/seniority penalties where applicable.
5. **Salary Estimation** — The Salary Worker estimates an expected salary range based on the resume and comparable job postings.
6. **Poll for Results** — All pipeline steps are async. The client polls `GET /{step}/:jobId` until results are ready — typically under 5 seconds per step end-to-end.

---

## 🤖 AI Service — FastAPI Microservice

The AI service is a Python FastAPI microservice responsible for all ML compute. The model loads **once at startup** and stays warm in memory for every subsequent request.

### Why FastAPI (V2) vs subprocess (V1)

V1 spawned a new Python subprocess per request, loading the 420MB model from disk (10–20s) every single call, then discarding it. V2 loads the model once at startup and reuses it across all requests.

| | V1 — subprocess | V2 — FastAPI |
|---|---|---|
| Cold start | 10,000–20,000ms per request | 0ms (model always warm) |
| Embedding generation | ~3,500ms | ~494ms |
| Score calculation | ~2,000ms | ~380ms |
| Full pipeline (first run) | 20,000–40,000ms | ~1,300ms |
| DB coupling | Python fetched from MongoDB | Node owns DB; Python receives prepared payload |
| Scalability | Coupled to Node process | Independent service, scales separately |

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
## 🤖 AI Service — FastAPI Microservice

The AI service is a Python FastAPI microservice responsible for all ML compute. The model loads **once at startup** and stays warm in memory for every subsequent request.

### Why FastAPI (V2) vs subprocess (V1)

V1 spawned a new Python subprocess per request, loading the 420MB model from disk (10–20s) every single call, then discarding it. V2 loads the model once at startup and reuses it across all requests.

| | V1 — subprocess | V2 — FastAPI |
|---|---|---|
| Cold start | 10,000–20,000ms per request | 0ms (model always warm) |
| Embedding generation | ~3,500ms | ~494ms |
| Score calculation | ~2,000ms | ~380ms |
| Full pipeline (first run) | 20,000–40,000ms | ~1,300ms |
| DB coupling | Python fetched from MongoDB | Node owns DB; Python receives prepared payload |
| Scalability | Coupled to Node process | Independent service, scales separately |

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
git clone https://github.com/RoelVillaluz/AI-Powered-Job-Board-Resume-Builde.git
cd AI-Powered-Job-Board-Resume-Builde
```

### 2. Install Dependencies
### 2. Install Dependencies

```bash
# Backend
# Backend
cd backend
npm install

# Frontend
cd ../frontend

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

#### `.env` — Web App

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/job_board

# Email
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# Auth
# Auth
JWT_SECRET=your_jwt_secret_key

# Environment
# Environment
NODE_ENV=development
LOG_LEVEL=debug

# URLs
# URLs
CLIENT_URL=http://localhost:5173
PORT=5000
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_URL=http://localhost:8000

# Redis
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

```env
# Target
K6_BASE_URL=http://localhost:5000

# Load profile
K6_VUS=10
K6_DURATION=5m

# Thresholds (ms)
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
redis-cli ping   # → PONG
```

### 5. Run the App

**Option A — all services at once (recommended):**

```bash
cd backend
npm run dev
```

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

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| AI Service | http://localhost:8000 |
| AI Service Docs | http://localhost:8000/docs |

### 6. Running Tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

---

## 📊 Grafana Dashboards

Dashboards available at `http://localhost:3000` after starting the observability stack.

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
| p95 Match Latency | 95th percentile match duration |
| Pinecone Queries | Total ANN queries fired |
| Fallback Triggers | Times system fell back from Pinecone to MongoDB |
| Match Latency Percentiles | p50 / p95 / p99 breakdown |
| Match Request Rate | Success/s vs Failed/s |
| Handler Request Rate by Endpoint | Per-AI-handler throughput |
| Handler p95 Latency by Endpoint | Per-handler latency |

---

## 🧪 Load Testing

Load tests cover the full async pipeline: embed → score → match → salary.

```bash
k6 run --env-file .env.k6 tests/load/pipeline.js
```

### Latest Results — June 10, 2026

**Configuration:** 10 VUs · 5-minute ramp · 98 complete iterations · 0 interrupted · all thresholds passed ✅

| Metric | p95 | Threshold | Status |
|---|---|---|---|
| HTTP request duration | 385.83 ms | < 5,000 ms | ✅ |
| — Embedding step | 300.04 ms | < 5,000 ms | ✅ |
| — Matching step | 373.37 ms | < 8,000 ms | ✅ |
| — Salary step | 352.55 ms | < 5,000 ms | ✅ |
| — Scoring step | 487.80 ms | < 3,000 ms | ✅ |
| Embedding worker duration | 4.46 s | < 30,000 ms | ✅ |
| Matching worker duration | 4.95 s | < 20,000 ms | ✅ |
| Salary worker duration | 4.95 s | < 15,000 ms | ✅ |
| Scoring worker duration | 3.91 s | < 15,000 ms | ✅ |
| Full iteration duration | 21.01 s | < 120,000 ms | ✅ |
| HTTP failure rate | 0.00% | < 10% | ✅ |
| Check success rate | 100.00% | > 80% | ✅ |

- 784 total HTTP requests at 2.60 req/s
- 6.5 MB received · 326 kB sent
- 100% poll success across all pipeline steps

---

## ⚡ Performance Optimization History

The pipeline went from ~2 minutes end-to-end to a p95 of ~21s for a full 4-step iteration, with API response times under 400ms.

### What Changed (in order of impact)

**1. Persistent AI Service (biggest win)**
Every request used to spawn a new Python subprocess, load the 420MB model from disk (10–20s), run computation, then exit. Replaced with a FastAPI microservice that loads the model once at startup. Cold start cost dropped from 10–20s per request to 0ms.

**2. Moved heavy work off the request path**
Introduced BullMQ background workers: the API now returns `202 Accepted` with a `jobId` immediately, and the client polls for results. API response time dropped from pipeline duration (~minutes) to queue enqueue time (~50ms).

**3. Parallelized embedding generation**
Resume sections were previously embedded sequentially. Switched to `ThreadPoolExecutor` — all 5 sections now run concurrently. Total embedding time is bounded by the slowest section, not the sum.

**4. Eliminated redundant embedding generation**
Embeddings used to be regenerated on every matching request. Added embedding fields directly to Resume and Job documents — generated once on save, reused as a cheap DB read on subsequent requests.

**5. Composite document vectors**
Matching previously compared individual field embeddings one-by-one. Replaced with weighted composite 768-d vectors per document — one Pinecone query replaces many field-level comparisons.

**6. Separated queues per pipeline step**
Split into five independent queues: `resume`, `job`, `matching`, `salary`, `scoring`. Each scales independently and failures in one don't block others.

**7. Embedding TTLs and smart refreshes**
Added TTLs: resume embeddings expire after 30 days, job embeddings after 90 days. Only stale embeddings are regenerated.

**8. Cached match scores**
Resume–job score pairs are cached for 30 days. Repeat scoring requests return instantly without recomputation.

**9. Metadata pre-filtering before Pinecone queries**
Added role, location, and experience level filters that run before the vector search, reducing the candidate pool and lowering Read Unit consumption.

**10. Observability-driven iteration**
After adding Prometheus + Grafana, optimization became data-driven. p50/p95/p99 latency, cache hit rates, fallback triggers, and per-worker durations are all tracked in real time.

---

## 💰 Infrastructure Cost Analysis

> **Framing:** The Node.js backend is deployed on Render. The FastAPI AI service is planned for AWS EC2. Scale projections below are architectural exercises derived from real k6 load test measurements and published cloud pricing — not invoiced costs. AWS CloudWatch cost monitoring is planned and will replace these projections with measured actuals once deployed.

### Measured Baseline — k6 Load Test (June 10, 2026)

98 complete pipeline iterations, 10 VUs, 5 minutes. Zero failures.

| Step | Avg worker duration | p95 worker duration |
|---|---|---|
| Embedding | 3.48s | 4.46s |
| Matching | 3.47s | 4.95s |
| Salary | 3.47s | 4.95s |
| Scoring | 3.45s | 3.91s |
| **Total AI compute / iteration** | **~13.87s avg** | **~18.27s p95** |

### Design Tradeoff: Space vs Compute

Pre-generating and storing embeddings trades storage for compute. Each resume/job stores ~23KB of embedding data (5 field vectors + composite). At 10,000 resumes + 10,000 jobs that's ~460MB — well within MongoDB Atlas paid tier limits (~$57/mo for M10 at 10GB).

The alternative is re-running 17 `model.encode()` calls on every matching request. At 10,000 DAU, that's ~170,000 avoidable model inference calls per day. Storing 460MB of vectors to eliminate those calls is the correct tradeoff.

### Throughput & Scale Projections

From the k6 baseline: ~19.6 iterations/min at 10 VUs. Assumes 1 full pipeline run per DAU per day. Returning users often hit the 30-day match cache, so real compute per user is lower over time.

| Scale | Pipeline runs/day | V2 AI compute/day | V1 AI compute/day |
|---|---|---|---|
| k6 baseline | ~98 / 5 min | ~0.38 hrs | ~2.48 hrs |
| 1,000 DAU | ~10,000 | ~38.5 hrs | ~159 hrs |
| 10,000 DAU | ~100,000 | ~385 hrs | ~1,590 hrs |

### Render — Node.js Backend

Currently on free tier (development). V2's async BullMQ architecture returns `202 Accepted` in ~50ms and offloads compute to workers, keeping the web process free and enabling low-tier hosting during early usage.

| Scale | V1 projected/mo | V2 projected/mo |
|---|---|---|
| Current (dev) | ~$110 | ~$0–20 |
| 1,000 DAU | ~$100 | ~$57 |
| 10,000 DAU | ~$300 | ~$150 |

### AWS EC2 — AI Microservice (Planned)

Not yet deployed. The model loads once at startup and stays warm, avoiding repeated initialization.

| Scale | Instance | Est. cost/mo |
|---|---|---|
| Baseline | t3.small (2 vCPU, 2GB) | ~$15 |
| 1,000 DAU | t3.medium (2 vCPU, 4GB) | ~$30 |
| 10,000 DAU | t3.large × 2 | ~$120 |

### Combined Projection

| Scale | V1 projected/mo | V2 projected/mo | Monthly saving |
|---|---|---|---|
| Current (dev) | ~$110 | ~$0–20 | N/A |
| 1,000 DAU | ~$220 | ~$87 | ~$133 |
| 10,000 DAU | ~$780 | ~$270 | ~$510 |

The savings come from architectural separation — compute fully decoupled into async workers + reusable model state — not from cheaper infrastructure.

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

## 📚 Related Documentation

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