# AI-Powered Resume + Job Matching — Vector DB Layer

## What This Is

A 3-stage intelligent matching system built on top of the existing embedding pipeline.
Replaces binary keyword overlap with semantic vector search, structured scoring, and LLM reranking.

```
Stage 1 — Retrieval      Stage 2 — Scoring         Stage 3 — Reranking
─────────────────────    ──────────────────────     ────────────────────────
Pinecone vector search   Hybrid formula (0–100)     LLM explains + reorders
topK=20 candidates   →   skill, exp, seniority  →   Best Fit / Good Fit /
threshold + fallback     semantic, location          Stretch classification
```

---

## Current Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Pinecone setup — index, SDK, config, bootstrap | ✅ Done |
| 2 | Vector infrastructure — composer, upsert, query, threshold, fallback | ✅ Done |
| 3 | Pipeline wiring — afterSave hooks, backfill script | ✅ Done |
| 4 | Hybrid scoring layer | 🔲 Next |
| 5 | Matching controller + route | 🔲 Pending |
| 6 | LLM reranker | 🔲 Pending |
| 7 | Cron gap-fill job + ops | 🔲 Pending |

**Pinecone index:** `resume-job-matching`
**Vectors in index:** 3 resumes · 0 jobs (job embedding pipeline not yet triggered for existing postings)
**Free tier usage:** 1 RU · 11 WU of 1M/2M

---

## Architecture

```
Resume/Job created or updated
  │
  ▼
Python FastAPI (all-mpnet-base-v2, preloaded)
  │  generates field-level embeddings
  ▼
MongoDB — ResumeEmbedding / JobEmbedding
  │  meanEmbeddings.skills, workExperience,
  │  certifications, jobTitle, location
  ▼
vectorComposer.ts — buildResumeVector / buildJobVector
  │  weighted blend → single 768-d vector
  ▼
Pinecone (namespace: resumes | jobs)
  │  composite vector + filterable metadata
  ▼
queryJobsForResume() → topK=20 matches
  │
  ├── [Phase 4] hybridScorer.ts → 0–100 score per match
  │
  └── [Phase 6] LLM reranker → explanation + classification
```

---

## File Map

```
src/
├── config/
│   ├── db.js                          MongoDB connection + graceful shutdown
│   └── pinecone.ts                    Pinecone singleton — connectPinecone() + getPineconeIndex()
│
├── infrastructure/
│   └── pinecone/
│       ├── pineconeUpsert.ts          upsertResumeVector / upsertJobVector / delete functions
│       ├── pineconeQuery.ts           queryJobsForResume — topK retrieval with hard filters
│       ├── pineconeThreshold.ts       shouldUsePinecone() — cost gate, 5min TTL cache
│       ├── pineconeFallback.ts        fallbackMongoJobQuery — MongoDB proxy when below threshold
│       └── pineconeAftersave.ts       handleResumeVectorUpsert / handleJobVectorUpsert
│
├── jobs/domains/embedding/
│   ├── vectorComposer.ts              buildResumeVector / buildJobVector — weighted mean
│   └── embeddingRegistryV2.ts        afterSave hooks wired for resume + jobPosting
│
└── scripts/
    └── backfillPinecone.ts            One-time + on-demand backfill, bypasses threshold
```

---

## Vector Composition

### Resume vector weights
```
meanEmbeddings.skills          × 0.40   (strongest signal)
meanEmbeddings.workExperience  × 0.30
embeddings.jobTitle            × 0.15
meanEmbeddings.certifications  × 0.10
embeddings.location            × 0.05
```

### Job vector weights
```
meanEmbeddings.skills          × 0.35
meanEmbeddings.requirements    × 0.25
embeddings.jobTitle            × 0.20
meanEmbeddings.experienceLevel × 0.15
embeddings.location            × 0.05
```

Missing fields are automatically excluded and weights are renormalized.
All vectors are 768-dimensional (all-mpnet-base-v2 output).

---

## Pinecone Metadata

### resumes namespace
| Field | Source | Used for |
|-------|--------|----------|
| `userId` | resume.user | Scoping queries to a user |
| `jobTitle` | resume.jobTitle.name | LLM reranker context |
| `location` | resume.location.name | Reranker context (not hard-filtered) |
| `skills` | resume.skills[].name | Skill overlap scoring |
| `strongSkills` | skills where level = Advanced/Expert | Strong match detection |
| `previousJobTitles` | workExperience[].jobTitle | Career trajectory context |
| `previousCompanies` | workExperience[].company | Industry exposure context |
| `certifications` | certifications[].name | Cert matching |
| `predictedSalary` | resume.predictedSalary | Salary mismatch detection |
| `totalExperienceYears` | resumeEmbedding.metrics | Hard pre-filter |

### jobs namespace
| Field | Source | Used for |
|-------|--------|----------|
| `title` | job.title.name | Display + reranker |
| `location` | job.location.name | Reranker context |
| `skills` | job.skills[].name | Full skill overlap |
| `requiredSkills` | skills where requirementLevel = Required | Critical skill penalty |
| `experienceLevel` | job.experienceLevel | Pre-filter (±1 adjacent level) |
| `jobType` | job.jobType | Hard pre-filter when specified |
| `yearsOfExperience` | requirements.yearsOfExperience | Pre-filter (+1yr buffer) |
| `salaryMin/Max` | job.salary.min/max | Salary mismatch detection |
| `salaryCurrency` | job.salary.currency | Display |
| `salaryFrequency` | job.salary.frequency | Display |
| `requiredCertifications` | requirements.certifications | Cert matching |
| `postedAt` | Date.now() at upsert | Recency signal |

---

## Cost & Threshold Strategy

```
Before every Pinecone query:
  COUNT active JobPostings in MongoDB (cached 5 min)
  │
  ├── count >= 500 → use Pinecone vector search
  └── count < 500  → use MongoDB fallback query

If Pinecone throws at any point:
  → catch silently
  → fall back to MongoDB
  → log error
  → user never sees failure
```

**Backfill script always bypasses threshold** — it calls upsert functions directly.

Free tier limits: 1M RUs · 2M WUs · 2GB storage.
At current scale (3 resumes, 7 jobs): negligible usage.
At 500 jobs × daily re-embedding: ~1,500 WUs/day — well within free tier.

---

## Running the Backfill

Run when:
- First deploy (populate Pinecone from existing MongoDB embeddings)
- After bulk job imports
- After recovering from a Pinecone outage
- Suspecting gap between MongoDB embeddings and Pinecone vectors

```bash
npx tsx --env-file=.env.dev src/scripts/backfillPinecone.ts
```

The script:
1. Connects to MongoDB + Pinecone
2. Fetches ResumeEmbedding documents in batches of 100
3. Fetches source Resume for metadata per document
4. Upserts composite vector to Pinecone `resumes` namespace
5. Repeats for JobEmbedding → `jobs` namespace
6. Logs progress per batch — safe to re-run (upsert is idempotent)

---

## Hybrid Scoring Formula (Phase 4 — not yet implemented)

```
score = (
  skill_match        × 0.40 +
  experience_fit     × 0.25 +
  semantic_sim       × 0.15 +
  seniority_fit      × 0.10 +
  location_fit       × 0.07 +
  cert_bonus         × 0.03
) × penalty_multiplier

Penalties (multiplicative):
  experience gap > 3yr  → × 0.85
  experience gap > 5yr  → × 0.70
  seniority mismatch    → × 0.80
  missing required skill → −15pts flat (applied before multiply)

Score tiers:
  80–100 → Strong Fit
  60–79  → Good Fit
  40–59  → Weak Fit
  0–39   → Poor Fit
```

---

## Known Gaps + Improvements Backlog

| Priority | Item |
|----------|------|
| 🔴 High | Trigger job embedding pipeline for existing 7 job postings so job vectors exist |
| 🔴 High | Implement hybrid scoring layer (Phase 4) |
| 🔴 High | Build matching controller + GET /api/resumes/:id/matches route (Phase 5) |
| 🟡 Medium | BullMQ repeat job for automated gap-fill (runs every 6hrs) |
| 🟡 Medium | Delete sync — remove Pinecone vectors when Resume/JobPosting is deleted |
| 🟡 Medium | LLM reranker layer (Phase 6) |
| 🟢 Low | Lazy vector existence check in matching controller as edge case safety net |
| 🟢 Low | Alert when Pinecone RU usage hits 80% of free tier |
| 🟢 Low | Lower threshold from 500 once matching controller is validated in production |

---

## Key Design Decisions

**Why MongoDB embedding collections are still needed with Pinecone**
Pinecone stores one composite vector per document. MongoDB stores all individual field vectors. The composite is rebuilt from MongoDB — if weights change, you can re-derive all Pinecone vectors without calling Python again.

**Why location is not hard-filtered in Pinecone queries**
String matching causes false misses ("Manila" ≠ "Metro Manila"). The location embedding inside the composite vector handles semantic proximity instead.

**Why `Promise.allSettled` in afterSave**
Score enqueue (Redis) and Pinecone upsert are independent side effects. One failing must not cancel the other. `Promise.allSettled` guarantees both always run.

**Why the threshold exists**
Vector search costs Read Units per query. On small datasets (<500 jobs), a MongoDB filter query is equally accurate and free. The threshold prevents paying for Pinecone when it adds no value.

**Why backfill bypasses the threshold**
The backfill's purpose is to populate Pinecone regardless of current job count. Respecting the threshold would defeat the entire point.