# Python AI Services

AI-powered resume scoring, job matching, and recommendations using semantic embeddings.

---

## Local Setup

### 1. Create and activate the virtual environment

```bash
cd backend/src/python_scripts
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

### 3. Configure environment variables

Add the following to your root `.env` file:

```env
# Point Node.js to your venv Python so imports resolve correctly at runtime
PYTHON_EXECUTABLE=C:/Users/YourName/path/to/project/backend/src/python_scripts/venv/Scripts/python.exe
```

Use forward slashes even on Windows. Each developer sets their own path — this is machine-specific and must never be committed.

### 4. Configure VS Code interpreter

Add to `.vscode/settings.json` (not committed — already in `.gitignore`):

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/src/python_scripts/venv/Scripts/python.exe",
  "python.analysis.extraPaths": [
    "${workspaceFolder}/backend/src/python_scripts"
  ]
}
```

Use `bin/python` instead of `Scripts/python.exe` on Mac/Linux.

### 5. Verify the setup

```bash
# Should point inside your venv, not system Python
where python       # Windows
which python       # Mac/Linux

# Quick smoke test
python main.py score_resume <any_resume_id>
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Node.js (Express/BullMQ)               │
│  - API endpoints                        │
│  - Queue management (Layer 1 parallel)  │
│  - Cache checking                       │
│  - pythonRunner.js spawns Python        │
└──────────────┬──────────────────────────┘
               ↓ spawn (PYTHON_EXECUTABLE)
┌─────────────────────────────────────────┐
│  Python Scripts (AI/ML Layer)           │
│  - main.py CLI entry point              │
│  - services/ — domain logic             │
│  - infrastructure/ — concurrency        │
│  - utils/ — computation primitives      │
└──────────┬──────────────┬───────────────┘
           ↓              ↓
┌──────────────┐  ┌───────────────────────┐
│  MongoDB     │  │  Sentence Transformer  │
│  Embedding   │  │  all-mpnet-base-v2     │
│  Cache       │  │  (fallback only)       │
└──────────────┘  └───────────────────────┘
```

### Two-Layer Parallelism

The system uses two independent parallelism layers that complement each other:

```
Layer 1 — Node.js / BullMQ
  Multiple resumes processed simultaneously across workers.
  Each worker spawns its own Python process.

  Queue → Worker 1 → python main.py (resume A)
        → Worker 2 → python main.py (resume B)
        → Worker N → python main.py (resume N)

Layer 2 — Python / ThreadPoolExecutor
  Within a single Python process, all 5 embedding sections
  run concurrently, overlapping DB lookups and model calls.

  python main.py (resume A)
    ├── Thread: skills embeddings       → MongoDB / model
    ├── Thread: workExperience          → MongoDB / model
    ├── Thread: certifications          → model
    ├── Thread: jobTitle embedding      → MongoDB / model
    └── Thread: location embedding      → MongoDB / model

Why threads work despite the GIL:
  MongoDB calls and model inference are I/O-bound.
  The GIL releases during network/disk waits so threads
  overlap meaningfully. CPU-bound tensor math is fast
  enough that sequential execution is not a bottleneck.
```

### Performance Estimates

```
                     Before           After
                  (sequential)   (parallel + batched)
                 ─────────────  ────────────────────
  0% cache hit     ~5500ms           ~1400ms    (~4x)
 50% cache hit     ~3200ms            ~800ms    (~4x)
100% cache hit      ~900ms            ~120ms    (~7x)

Time breakdown at 0% cache hit:
                    Before    After
  DB queries         800ms    200ms   (batched + parallel)
  Model inference   4200ms   1050ms   (batched + parallel)
  Other              500ms    150ms
```

The DB cache hit rate is the biggest lever — once `skills`, `jobtitles`,
and `locations` collections are fully populated the model is rarely called.

---

## Available Commands

### 1. Resume Scoring

```bash
python main.py score_resume <resume_id>
```

**Response:**
```json
{
  "resume_id": "...",
  "overall_score": 85.5,
  "grade": "B+",
  "breakdown": {
    "completeness": 90,
    "experience": 80,
    "skills": 85,
    "certifications": 75
  },
  "total_experience_years": 5.2,
  "strengths": ["Strong backend skills"],
  "improvements": ["Add more certifications"],
  "recommendations": ["Learn AWS"],
  "overall_message": "Great resume! A few tweaks could make it stand out."
}
```

**Grading Scale:**
- A+ (95-100): Exceptional
- A (90-94): Excellent
- B+ (85-89): Very Good
- B (80-84): Good
- C+ (75-79): Above Average
- C (70-74): Average
- D (60-69): Below Average
- F (0-59): Needs Improvement

### 2. Resume Embeddings

Returns direct embeddings (jobTitle, location), mean embeddings (skills, workExperience, certifications), and backfill IDs for any DB entries missing embeddings. All sections computed concurrently.

```bash
python main.py generate_resume_embeddings <resume_id>
```

**Response:**
```json
{
  "resume_id": "...",
  "embeddings": {
    "jobTitle": [0.44, 0.22, ...],
    "location": [0.77, 0.99, ...]
  },
  "meanEmbeddings": {
    "skills": [0.23, 0.45, ...],
    "workExperience": [0.12, 0.88, ...],
    "certifications": [0.34, 0.56, ...]
  },
  "metrics": {
    "totalExperienceYears": 5.2
  },
  "backfill": {
    "skillIds": ["skill_id_1", "skill_id_2"],
    "jobTitleId": "title_id_or_null",
    "locationId": "location_id_or_null"
  }
}
```

### 3. Job Embeddings

Direct embeddings (jobTitle, experienceLevel, location) separated from mean embeddings (skills, requirements). All sections computed concurrently.

```bash
python main.py generate_job_embeddings <job_id>
```

**Response:**
```json
{
  "job_id": "...",
  "embeddings": {
    "jobTitle": [0.44, 0.22, ...],
    "experienceLevel": [0.66, 0.88, ...],
    "location": [0.77, 0.99, ...]
  },
  "meanEmbeddings": {
    "skills": [0.33, 0.11, ...],
    "requirements": [0.55, 0.77, ...]
  }
}
```

### 4. Skill Embeddings

```bash
python main.py generate_skill_embeddings <skill_id>
```

**Response:**
```json
{
  "skill_id": "...",
  "embedding": [0.12, 0.34, ...]
}
```

### 5. Job Title Embeddings

Uses `normalizedTitle` so aliases like "Sr. Engineer" and "Senior Engineer" produce the same vector.

```bash
python main.py generate_job_title_embeddings <title_id>
```

**Response:**
```json
{
  "title_id": "...",
  "embedding": [0.23, 0.56, ...]
}
```

### 6. Location Embeddings

```bash
python main.py generate_location_embeddings <location_id>
```

**Response:**
```json
{
  "location_id": "...",
  "embedding": [0.77, 0.99, ...]
}
```

### 7. Industry Embeddings

```bash
python main.py generate_industry_embeddings <industry_id>
```

**Response:**
```json
{
  "industry_id": "...",
  "embedding": [0.45, 0.67, ...]
}
```

---

## Embedding Cache & Backfill Strategy

Embedding generation prioritizes pre-computed DB embeddings over live model inference.

### Lookup order

1. Query the entity collection (`skills`, `jobtitles`, `locations`) by name — single batched query for all names at once
2. Use the stored `embedding` field if present (~5ms)
3. Fall back to the live model if missing from DB or embedding is null (~50-100ms)
4. Return backfill IDs for null entries so the Node.js layer can enqueue writes

```
DB hit, embedding present  →  ~5ms    tensor load only
DB hit, embedding null     →  ~50ms   model fallback + backfill ID returned
Not in DB                  →  ~50ms   model fallback
```

### Backfill workflow

After generating resume embeddings, check the `backfill` block and enqueue a write job for each returned ID:

```bash
python main.py generate_skill_embeddings <skill_id>
python main.py generate_job_title_embeddings <title_id>
python main.py generate_location_embeddings <location_id>
```

This keeps the cache warm and eliminates repeated model fallback for common entities.

---

## Observability

Every pipeline run is automatically measured and persisted. No manual instrumentation needed — it is wired into `infrastructure/embedding_orchestrator.py`.

### What is captured

- **Per-section timing** — duration in ms for each of the 5 embedding sections
- **Cache outcome per section** — `hit`, `miss`, `null_backfill`, or `skipped`
- **Total pipeline duration** — wall-clock time across all concurrent sections
- **Run summary** — hit/miss/backfill counts, slowest section, error flag

### stderr output (per run)

```
[embedding_metrics] resume=abc123 total=1342ms hits=3 misses=1 backfills=1
  ✓ skills               842.3ms  [hit]
  ✗ workExperience       310.1ms  [miss]
  ✓ certifications        89.4ms  [hit]
  ✓ jobTitle              54.2ms  [hit]
  ~ location              46.8ms  [null_backfill]
```

### MongoDB document schema (if you choose to persist metrics)

```javascript
{
  entityType: "resume",
  entityId: "abc123",
  startedAt: ISODate,
  completedAt: ISODate,
  totalDurationMs: 1342.0,
  cacheHits: 3,
  cacheMisses: 1,
  nullBackfills: 1,
  slowestSection: "skills",
  hadErrors: false,
  sections: [
    { section: "skills",         durationMs: 842.3, cacheOutcome: "hit" },
    { section: "workExperience", durationMs: 310.1, cacheOutcome: "miss" },
    { section: "certifications", durationMs: 89.4,  cacheOutcome: "hit" },
    { section: "jobTitle",       durationMs: 54.2,  cacheOutcome: "hit" },
    { section: "location",       durationMs: 46.8,  cacheOutcome: "null_backfill" }
  ]
}
```

### Useful queries (once collection is created)

These queries assume you have created an `embeddingmetrics` collection and wired `embedding_metrics.py` to write to it.

```javascript
// Average total duration over last 7 days
db.embeddingmetrics.aggregate([
  { $match: { startedAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } },
  { $group: { _id: "$entityType", avgMs: { $avg: "$totalDurationMs" } } }
])

// Cache hit rate per entity type
db.embeddingmetrics.aggregate([
  { $group: {
    _id: "$entityType",
    totalHits:   { $sum: "$cacheHits" },
    totalMisses: { $sum: "$cacheMisses" }
  }}
])

// Slowest runs
db.embeddingmetrics
  .find({ totalDurationMs: { $gt: 3000 } })
  .sort({ totalDurationMs: -1 })
  .limit(10)

// Sections that most often miss (backfill candidates)
db.embeddingmetrics.aggregate([
  { $unwind: "$sections" },
  { $match: { "sections.cacheOutcome": "miss" } },
  { $group: { _id: "$sections.section", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

---

## Project Structure

```
backend/src/python_scripts/
├── main.py                         # CLI entry point
├── requirements.txt                # Python dependencies
├── venv/                           # Local virtual environment (not committed)
│
├── config/
│   └── database.py                 # MongoDB connection
│
├── models/
│   └── embeddings.py               # Sentence transformer (all-mpnet-base-v2)
│
├── services/
│   ├── resume_service.py           # Resume data & embeddings
│   ├── job_service.py              # Job data & embeddings
│   ├── scoring_service.py          # Resume scoring logic
│   ├── similarity_service.py       # Cosine similarity calculations
│   ├── comparison_service.py       # Resume-job matching
│   ├── analytics_service.py        # Insights & recommendations
│   └── market_services/
│       ├── skill_services.py       # DB cache lookup for skills
│       ├── job_title_services.py   # DB cache lookup for job titles
│       └── location_services.py    # DB cache lookup for locations
│       └── industry_services.py    # DB cache lookup for industries
│
├── infrastructure/
│   ├── embedding_orchestrator.py   # Parallel section coordination (ThreadPoolExecutor)
│   └── embedding_metrics.py        # Observability — timing, cache outcomes, DB write
│
├── utils/
│   ├── embedding_utils.py          # Per-section extraction (DB-cache aware)
│   ├── date_utils.py               # Experience year calculations
│   ├── tensor_utils.py             # PyTorch tensor helpers
│   └── websocket_utils.py          # Progress event emitter
│
└── clustering/
    └── job_clustering.py           # K-Means clustering for jobs
```

### Layer responsibilities

```
main.py              CLI dispatch only — no business logic
services/            Domain logic — what to fetch, what the result means
infrastructure/      Concurrency + observability — how to run and measure it
utils/               Computation primitives — how to compute one embedding
```

---

---

## Caching Strategy

| Operation | Cache Collection | TTL | Cache Key |
|-----------|-----------------|-----|-----------|
| Resume Embeddings | `resumeembeddings` | 90 days | `resume: ObjectId` |
| Resume Score | `resumescores` | 7 days | `resume: ObjectId` |
| Job Embeddings | `jobpostingembeddings` | 90 days | `jobPosting: ObjectId` |
| Resume-Job Comparison | `resumejobcomparisons` | 30 days | `resume + jobPosting` |
| Skill Embeddings | `skills.embedding` | Permanent | `skill: ObjectId` |
| Job Title Embeddings | `jobtitles.embedding` | Permanent | `title: ObjectId` |
| Location Embeddings | `locations.embedding` | Permanent | `location: ObjectId` |

---

## ML Model

**Model:** `all-mpnet-base-v2` (Sentence Transformers)
- **Embedding Size:** 768 dimensions
- **Max Sequence Length:** 384 tokens
- **Performance:** ~50-100ms per encoding (called only on cache miss)
- **First run:** downloads ~400MB, cached at `~/.cache/torch/sentence_transformers/`

---

## Database Schema

### Resumes Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  summary: String,
  skills: [{
    _id: ObjectId,   // ref: 'Skill'
    name: String,
    level: String,   // 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  }],
  jobTitle: {
    _id: ObjectId,   // ref: 'JobTitle'
    name: String,
  },
  location: {
    _id: ObjectId,   // ref: 'Location'
    name: String,
  },
  workExperience: [{
    jobTitle: String,
    company: String,
    startDate: Date,
    endDate: Date,   // or "present"
    responsibilities: [String]
  }],
  education: [{
    degree: String,
    institution: String,
    graduationDate: Date
  }],
  certifications: [{ name: String, issuer: String }]
}
```

### Job Postings Collection
```javascript
{
  _id: ObjectId,
  title: String,
  company: String,
  location: {
    _id: ObjectId,   // ref: 'Location'
    name: String,
  },
  jobTitle: {
    _id: ObjectId,   // ref: 'JobTitle'
    name: String,
  },
  experienceLevel: String,   // "Entry" | "Mid" | "Senior"
  status: String,            // "active" | "closed"
  skills: [{
    _id: ObjectId,   // ref: 'Skill'
    name: String,
  }],
  requirements: String[] | {   // Old schema: array of strings
    description: String,       // New schema: structured object
    education: String,
    yearsOfExperience: Number,
    certifications: [String]
  },
  description: String
}
```

### Shared Entity Collections
```javascript
// skills, jobtitles, locations, industries
{
  _id: ObjectId,
  name: String,        // normalizedTitle for jobtitles
  embedding: [Number]  // 768-dim float array; null = backfill needed
}
```


---

## Error Handling

All commands return JSON with an `error` field on failure:

```json
{ "error": "Resume not found: invalid_id" }
```

**Common errors:**
- `Resume not found` — invalid or missing `resume_id`
- `Job not found` — invalid or missing `job_id`
- `Skill / Job title / Location / Industry not found` — invalid entity ID
- `Failed to generate embedding` — model loading failed or input too long
- `MongoDB connection error` — database unreachable

Individual embedding sections that fail inside the orchestrator are isolated — one failing section does not abort the rest. The failed section returns `None` and the error is logged to stderr.

---

## Troubleshooting

### `ModuleNotFoundError: No module named 'torch'` at runtime

Node.js is using system Python instead of the venv. Set `PYTHON_EXECUTABLE` in `.env` to your venv Python path and restart the server.

### Pylance shows import errors in VS Code

VS Code is pointing at the wrong interpreter. Set `python.defaultInterpreterPath` in `.vscode/settings.json` to your venv path and reload (`Ctrl+Shift+P` → Developer: Reload Window).

### `.vscode/settings.json` appearing in git staged changes

It was tracked before being added to `.gitignore`. Untrack it:
```bash
git rm --cached .vscode/settings.json
git commit -m "chore: untrack .vscode/settings.json"
```

### Module import errors

```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend/src/python_scripts"
```

### Memory issues with large batches

```bash
BATCH_SIZE=16 python main.py batch_compare ...
```

---

## Testing

```bash
# Run all tests
pytest tests/

# Test specific service
pytest tests/test_scoring_service.py

# With coverage
pytest --cov=services tests/
```

---

## Future Enhancements

- [ ] Add education level matching
- [ ] Implement experience level validation
- [ ] Add location-based scoring
- [ ] Extract soft skills from descriptions
- [ ] Add role type detection (Frontend/Backend/Full Stack)
- [ ] Implement weighted skill importance
- [ ] Add collaborative filtering
- [ ] Support for multiple languages
- [ ] Expose `compare_resume_job` and `get_recommendations` via `main.py` CLI
- [ ] Persist embedding metrics to a dedicated collection for trend analysis

---

## Contributing

When adding new commands:

1. Add the function to `main.py`
2. Add the corresponding service in `services/`
3. Add an instrumented task wrapper in `infrastructure/embedding_orchestrator.py`
4. Update this README with the command, response shape, and any schema changes
5. Add tests in `tests/`
