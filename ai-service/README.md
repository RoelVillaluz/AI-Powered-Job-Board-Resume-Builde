# AI Service — V2 Architecture

## Overview

The AI service is a FastAPI microservice responsible for all ML compute in the platform. It exposes HTTP endpoints that the Node.js backend calls via HTTP instead of spawning Python subprocesses. The model loads once at startup and stays warm in memory for every subsequent request.

---

## The Problem V2 Solved

### V1 — subprocess architecture

```
Node.js request
  → spawn python main.py score_resume <id>
    → Python process starts
      → import sentence_transformers     ← 420MB model loads from disk
        → load all-mpnet-base-v2         ← 10–20 seconds
          → run computation
            → print JSON to stdout
              → Python process exits     ← model unloaded from memory
```

Every single job paid the cold start penalty. The model loaded and unloaded on every request. At 10–20 seconds per cold start, any period of inactivity (Render spin-down, Lambda cold start) made the first request after idle nearly unusable.

Additional problems:
- Node and Python were tightly coupled — changing a Python function signature broke the Node subprocess call
- Python knew about the DB — it fetched resume data, checked embedding caches, wrote backfills
- No clean service boundary — business logic, DB access, and ML compute were all mixed in the same subprocess
- Impossible to scale Python independently of Node
- On AWS Lambda, the 420MB model load would exceed the 29-second API Gateway timeout on cold starts, requiring provisioned concurrency (always-on billing) just to survive

### V2 — FastAPI microservice

```
FastAPI starts
  → model loads once                     ← one-time cost at startup
  → model stays in memory forever

Node.js BullMQ worker picks up job
  → fetches prepared data from MongoDB
  → POST /compute/generate_resume_embeddings
    → FastAPI receives prepared payload  ← no DB call on Python side
      → model already warm               ← 0ms cold start
        → run computation (~500ms)
          → return { data, error }
            → Node saves to MongoDB
              → afterSave triggers next pipeline step
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Node.js (Express + BullMQ)                         │
│                                                     │
│  API Gateway     → GET/POST endpoints               │
│  Job Orchestration → BullMQ queue + workers         │
│  DB Ownership    → MongoDB reads/writes             │
│  Progress Events → Socket.IO to frontend            │
│  Pre-resolution  → fetch + resolve embeddings       │
└──────────────────────────┬──────────────────────────┘
                           │ HTTP POST
                           ↓
┌─────────────────────────────────────────────────────┐
│  FastAPI AI Service (this service)                  │
│                                                     │
│  Pure compute layer — no DB access                  │
│  Model loaded once at startup                       │
│  Receives prepared payload from Node                │
│  Returns computed result                            │
└──────────────────────────┬──────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ↓                         ↓
   all-mpnet-base-v2            ThreadPoolExecutor
   (warm in memory)             (parallel sections)
```

### Layer responsibilities

| Layer | Owns |
|---|---|
| Node.js | API, queuing, DB reads/writes, progress tracking, pre-resolution |
| FastAPI | ML compute only — embedding generation, scoring |
| Python (internal) | Model inference, parallel section execution, metrics |

---

## Project Structure

```
ai-service/
├── app.py                              Entry point — FastAPI app + lifespan
├── main.py                             V1 CLI entry point (kept for backwards compat)
├── main_v2.py                          V2 functions — accept prepared payload, no DB
├── requirements.txt
│
├── routers/
│   ├── embeddings.py                   POST /compute/generate_* routes
│   ├── scoring.py                      POST /compute/score_resume route
│   ├── health.py                       GET /health
│   └── shared/
│       ├── __init__.py
│       ├── request.py                  ComputeRequest (Pydantic BaseModel)
│       └── response.py                 wrap() — normalizes { data, error } shape
│
├── models/
│   └── embeddings.py                   EmbeddingModel singleton (all-mpnet-base-v2)
│
├── services/
│   ├── resume_service.py               V1 — fetches from DB
│   │   └── extract_embeddings_v2()     V2 — accepts prepared dict, no DB
│   ├── scoring_service.py              ScoringService — pure computation
│   ├── analytics_service.py            AnalyticsService — insights generation
│   └── market_services/
│       ├── skill_services.py           V1 DB cache lookups (kept)
│       ├── job_title_services.py       V1 DB cache lookups (kept)
│       └── location_services.py        V1 DB cache lookups (kept)
│
├── infrastructure/
│   └── embeddings/
│       ├── embedding_orchestrator.py   V1 — parallel execution with DB cache
│       ├── embedding_orchestrator_v2.py V2 — parallel execution, no DB (planned)
│       └── embedding_tasks.py          Task wrappers with metrics
│
├── utils/
│   ├── embedding_utils.py              V1 — DB cache-aware embedding extraction
│   ├── embedding_utils_v2.py           V2 — accepts pre-resolved data (planned)
│   ├── date_utils.py                   Experience year calculations
│   ├── tensor_utils.py                 PyTorch tensor helpers
│   └── websocket_utils.py              V1 progress emitter (subprocess only)
│
└── config/
    └── database.py                     MongoDB connection (V1 only)
```

---

## API Endpoints

All endpoints follow the same contract:

```
POST /compute/{endpoint}
Content-Type: application/json

Body:     { ...prepared fields from Node }
Response: { "data": { ...result }, "error": null }
          { "data": null, "error": "message" }
```

### Embedding endpoints

| Endpoint | Body | Response |
|---|---|---|
| `POST /compute/generate_resume_embeddings` | Full resume document | `{ embeddings, meanEmbeddings, metrics }` |
| `POST /compute/generate_skill_embeddings` | `{ id, name }` | `{ embedding }` |
| `POST /compute/generate_job_title_embeddings` | `{ id, title, normalizedTitle }` | `{ embedding }` |
| `POST /compute/generate_location_embeddings` | `{ id, name }` | `{ embedding }` |
| `POST /compute/generate_industry_embeddings` | `{ id, name }` | `{ embedding }` |

### Scoring endpoint

| Endpoint | Body | Response |
|---|---|---|
| `POST /compute/score_resume` | Full resume + `totalExperienceYears` | `{ overall_score, grade, breakdown, strengths, improvements, recommendations }` |

### Health

```
GET /health
Response: { "status": "ok", "model": "all-mpnet-base-v2" }
```

---

## Versioning strategy

V1 and V2 coexist during migration. Nothing in V1 was deleted.

```
main.py          ← V1 CLI, still works for subprocess fallback
main_v2.py       ← V2 functions, accept prepared payload, called by routers

routers/         ← V2 HTTP layer, calls main_v2.py only
```

V1 functions in `main.py` still fetch from DB and are called by the old Node subprocess runner. V2 functions in `main_v2.py` accept prepared data from Node and never touch the DB.

Cutover plan:
1. All entities migrated to V2 HTTP path ✓ (resume embedding, resume scoring)
2. Market entities migrated (skill, jobTitle, location, industry) — in progress
3. Delete `main.py`, `config/database.py`, all market service DB lookups
4. Rename `main_v2.py` → `main.py`

---

## The cold start problem — solved

### Before (V1)

The `all-mpnet-base-v2` model is 420MB. Every subprocess invocation:

1. Started a new Python process
2. Imported `sentence_transformers`
3. Loaded the 420MB model from disk into memory
4. Ran the computation
5. Printed the result to stdout
6. Exited — model unloaded

**Cost per cold request: 10–20 seconds before any computation ran.**

On Render's free/starter tier, the service spun down after inactivity, making the first request after any idle period pay the full cold start cost.

### After (V2)

The `lifespan` handler in `app.py` loads the model once at FastAPI startup:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    from models.embeddings import embedding_model  # loads EmbeddingModel singleton
    yield
```

`EmbeddingModel` is a Python singleton — `__new__` returns the same instance on every call. The model loads exactly once and stays in memory for the lifetime of the process.

**Cold start cost after V2: 0ms per request. Model is always warm.**

The one-time startup cost (42 seconds including HuggingFace cache checks) happens once when the container starts, then never again until a restart.

Set these env vars to skip HuggingFace network checks on startup after first download:

```env
TRANSFORMERS_OFFLINE=1
HF_HUB_OFFLINE=1
```

Reduces startup time from ~42 seconds to ~3 seconds.

---

## Performance gains

### Embedding generation (resume)

| Metric | V1 (subprocess) | V2 (FastAPI) | Improvement |
|---|---|---|---|
| Cold start | 10,000–20,000ms | 0ms | ∞ |
| Embedding generation | ~3,500ms | ~494ms | 7× faster |
| Total per job | ~15,000–25,000ms | ~500ms | 30–50× faster |

### Scoring

| Metric | V1 (subprocess) | V2 (FastAPI) | Improvement |
|---|---|---|---|
| Cold start | 10,000–20,000ms | 0ms | ∞ |
| Score calculation | ~2,000ms | ~380ms | 5× faster |
| Total per job | ~12,000–22,000ms | ~380ms | 30–60× faster |

### Full pipeline (embedding + scoring, first run)

| Version | Total time |
|---|---|
| V1 | 20,000–40,000ms |
| V2 | ~1,300ms |

### Cache hit performance (warm embeddings in DB)

When Node pre-resolves embeddings before calling FastAPI (planned), the model is never called for cached items:

```
V2 cache hit: ~100ms   (DB lookup only, no model inference)
V2 cache miss: ~500ms  (model inference)
```

---

## Hypothetical AWS cost savings (1,000 jobs/day)

| Line item | V1 | V2 | Saving |
|---|---|---|---|
| Node.js ECS Fargate | $70/mo | $35/mo | $35/mo |
| Python compute | $60/mo | $0 (included in FastAPI) | $60/mo |
| Provisioned concurrency | $85/mo | $0 (not needed) | $85/mo |
| Lambda timeout retries | $40/mo | $0 (eliminated) | $40/mo |
| FastAPI ECS Fargate | $0 | $70/mo | -$70/mo |
| **Total** | **~$255/mo** | **~$105/mo** | **~$150/mo (59%)** |

*MongoDB Atlas and Redis ElastiCache excluded — unchanged between versions.*

**Why provisioned concurrency was required in V1 on AWS:**
Lambda's default cold start + 420MB model load exceeded the 29-second API Gateway timeout. Provisioned concurrency kept Lambda instances warm 24/7 to avoid this — billing for idle capacity even at zero traffic. V2 on ECS Fargate is always-on by design, model warm, no provisioned concurrency needed.

**Why retry cost was high in V1:**
Timeout failures on cold-start requests caused BullMQ to retry jobs 3 times. Each retry paid the cold start cost again. V2 has near-zero retry cost since requests complete in under 1 second.

---

## Local setup

### 1. Create and activate virtual environment

```bash
cd ai-service
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```env
# .env.dev
MONGO_URI=mongodb+srv://...   # V1 only — not needed once V2 migration complete
AI_SERVICE_URL=http://localhost:8000
TRANSFORMERS_OFFLINE=1         # skip HF network checks after first download
HF_HUB_OFFLINE=1
```

### 4. Start the service

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Add to Node `package.json` to run both services together:

```json
"scripts": {
    "ai":  "cd ../ai-service && venv\\Scripts\\uvicorn app:app --host 0.0.0.0 --port 8000 --reload",
    "dev": "concurrently \"npm run server\" \"npm run ai\""
}
```

### 5. Verify

```
GET  http://localhost:8000/health
GET  http://localhost:8000/docs     ← interactive Swagger UI
```

---

## ML Model

**Model:** `all-mpnet-base-v2` (Sentence Transformers)
- **Embedding dimensions:** 768
- **Max sequence length:** 384 tokens
- **Inference time (warm):** ~50–100ms per encoding
- **First run:** downloads ~420MB, cached at `~/.cache/torch/sentence_transformers/`
- **Subsequent runs:** loads from local cache in ~3 seconds

---

## Parallel embedding execution

Resume embedding generation runs all 5 sections concurrently via `ThreadPoolExecutor`:

```
resume payload received
  ├── Thread: skills embeddings         → model encode batch
  ├── Thread: workExperience embeddings → model encode batch
  ├── Thread: certifications embeddings → model encode batch
  ├── Thread: jobTitle embedding        → model encode single
  └── Thread: location embedding        → model encode single
```

Total time is bounded by the slowest section, not the sum of all sections. On a warm model with no DB lookups, all 5 sections complete in ~500ms total.

**Why threads work despite the GIL:**
Model inference releases the GIL during C extension calls (PyTorch tensor operations). Sections genuinely overlap rather than serializing.

---

## Observability

Every pipeline run emits timing and cache outcome metrics to stderr:

```
[embedding_metrics] resume=abc123 total=494ms hits=3 misses=0 backfills=0
  ✓ skills               228.3ms  [hit]
  ✓ location              88.9ms  [hit]
  ✓ jobTitle              96.0ms  [hit]
  ✗ workExperience         0.0ms  [skipped]
  ✗ certifications         0.0ms  [skipped]
```

Cache outcomes:
- `hit` — embedding loaded from DB, no model call
- `miss` — not in DB, model was called
- `null_backfill` — in DB but embedding field is null, model called + backfill queued
- `skipped` — section empty (no skills, no certifications, etc.)

---

## Error handling

All endpoints return `{ data, error }` — never raw exceptions:

```json
{ "data": null, "error": "Resume not found: invalid_id" }
```

Individual embedding sections that fail inside the orchestrator are isolated — one failing section does not abort the rest. The failed section returns `None` and the error is logged.

---

## Architectural decisions

### Decision 1 — HTTP over subprocess

**Before:** Node spawned `python main.py <command> <id>` for every job.
**After:** Node calls `POST /compute/{endpoint}` with a prepared payload.

**Why:** Subprocess spawning creates a new Python process per job. Each process cold-starts the model. HTTP to a persistent FastAPI process hits a model that's already in memory. The subprocess approach fundamentally cannot avoid cold starts — the fix requires a persistent process, which requires a network boundary.

### Decision 2 — Node owns the DB, Python owns compute

**Before:** Python fetched resume data from MongoDB, checked embedding caches in the skills/jobTitles/locations collections, wrote backfill updates.
**After:** Node fetches all data, pre-resolves cached embeddings, sends the complete prepared payload to FastAPI. Python receives data and computes — no DB connection needed.

**Why:** Clear service boundaries. Python doesn't need a MongoDB connection, credentials, or knowledge of the schema. If the DB changes, only Node needs updating. Python is now a pure stateless compute service that can be scaled, replaced, or tested in isolation.

### Decision 3 — Model singleton + lifespan loading

**Before:** Model loaded per subprocess invocation.
**After:** `EmbeddingModel` uses `__new__` to enforce singleton pattern. `lifespan` in `app.py` triggers the import at startup, guaranteeing the model is warm before the first request arrives.

**Why:** A 420MB model must be loaded once and reused. The singleton pattern ensures multiple FastAPI route handlers share the same model instance. Loading in `lifespan` (not on first request) eliminates the first-request penalty entirely.

### Decision 4 — Versioned parallel migration

**Before:** Single `main.py` with DB-coupled functions.
**After:** `main.py` kept untouched. `main_v2.py` added with DB-free equivalents. Routers call V2 only. V1 still works via subprocess for any unmigrted entities.

**Why:** Zero-downtime migration. V1 and V2 run in parallel. Each entity migrates independently. If V2 breaks, V1 fallback is one config change in Node's registry. No big-bang cutover.

### Decision 5 — Pydantic `extra = "allow"` on request body

**Before:** Each endpoint had a typed request schema.
**After:** Single `ComputeRequest` with `model_config = {"extra": "allow"}`.

**Why:** Node sends different shapes per entity — resume sends the full document, market entities send just `{ id, name }`. A single permissive schema avoids maintaining separate Pydantic models per entity. FastAPI still validates content-type and JSON structure; field validation happens implicitly when the computation function accesses the fields it needs.
