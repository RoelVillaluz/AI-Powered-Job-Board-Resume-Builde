# AI-Powered Resume + Job Matching — Vector DB Layer

## What This Is

A 3-stage intelligent matching system built on top of the existing embedding pipeline.
Replaces binary keyword overlap with semantic vector search and structured hybrid
scoring. An LLM **reranking** stage was evaluated and explicitly deferred (see Key
Design Decisions); the Gemini layer in `ai-service/gemini/` is a separate
**explanation** system that describes an already-final ranking — it does not reorder.

```
Stage 1 — Retrieval      Stage 2 — Scoring         Stage 3 — Reranking
─────────────────────    ──────────────────────     ────────────────────────
Pinecone vector search   Hybrid formula (0–100)     Evaluated, deferred —
topK=20 candidates   →   skill, exp, seniority  →   see Key Design Decisions.
threshold + fallback     semantic, location          NOT built; not currently planned
```

---

## Current Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Pinecone setup — index, SDK, config, bootstrap | ✅ Done |
| 2 | Vector infrastructure — composer, upsert, query, threshold, fallback | ✅ Done |
| 3 | Pipeline wiring — afterSave hooks, backfill script | ✅ Done |
| 4 | Hybrid scoring layer | ✅ Done |
| 5 | Matching controller + route | ✅ Done |
| 6 | LLM reranker | 🟡 Evaluated, deferred |
| 7 | Cron gap-fill job + ops (reconciliation) | ✅ Done |

**Pinecone index:** `resume-job-matching`
**Vectors in index:** 20 total — 13 resumes · 7 jobs (from `describeIndexStats`, checked Aug 2026; 13 vs. 10 resumes in MongoDB means 3 stale vectors are awaiting the delete-sync backlog item below)
**Free tier usage:** negligible at this scale — exact RU/WU read from the Pinecone console (the "1 RU · 11 WU" figure in earlier revisions was a stale snapshot)

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
  ├── [Phase 4, done] ai-service/services/job_matching_service.py
  │   → 0–100 score per match (weighted components + penalties)
  │
  └── [done] match insight — ai-service/gemini/
      → prose explanation of the ALREADY-FINAL ranking
      → explains only — it never reorders the ranking
      · LLM reranking (Phase 6) evaluated, deferred — see Key Design Decisions
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
| `jobTitle` | resume.jobTitle.name | Display / retrieval context |
| `location` | resume.location.name | Not hard-filtered — semantic proximity handled by composite vector |
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
| `title` | job.title.name | Display / retrieval context |
| `location` | job.location.name | Not hard-filtered — semantic proximity handled by composite vector |
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
At current scale (10 resumes, 7 jobs; 20 vectors in Pinecone): negligible usage.
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

## Hybrid Scoring Formula (Phase 4 — implemented)

Implemented in `ai-service/services/job_matching_service.py` (called via `/compute/score_matches`
after Pinecone retrieval or MongoDB fallback).

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
  experience gap > 3yr        → × 0.85
  experience gap > 5yr        → × 0.70
  seniority gap ≥ 2 levels    → × 0.80
  domain mismatch             → × 0.35   (near-zero skill overlap on a role that lists skills)
  missing required skill      → −15pts flat (applied before multiply)

Score tiers:
  80–100 → Best Fit
  60–79  → Good Fit
  40–59  → Stretch
  0–39   → Poor Fit
```

---

## Match Insights (Gemini) — Explanation, Not Reranking

Built and live in `ai-service/gemini/`. Given the **already-final** ranked match list, it
generates a prose explanation of fit (verdict, strengths, gaps, suggested next step) for one
resume-job pair.

- It consumes the ranking produced by the hybrid scorer — it never reorders it.
- It must not be conflated with a reranker: it adds explanation, not ordering decisions.
- Generation is enqueued via the `resume-match-insight` BullMQ queue and its payload is built
  from MongoDB (resume skills + experience level + the single match), not from Pinecone metadata.
- Full pipeline documentation, prompt-injection defense, and the **OWASP LLM Top 10 (2025)
  coverage table** live in [`ai-service/gemini/README.md`](../../../../ai-service/gemini/README.md).

---

## Known Gaps + Improvements Backlog

| Priority | Item |
|----------|------|
| 🔴 High | Delete sync — remove Pinecone vectors when Resume/JobPosting is deleted (3 stale resume vectors observed Aug 2026: 13 in Pinecone vs. 10 in MongoDB) |
| 🟡 Medium | Automated gap-fill reconciliation — now running via `src/infrastructure/reconciliation/cron/reconciliationCron.ts` (batch size 500, schedule in `.env.dev`); keep an eye on repair counts |
| 🟢 Low | Lazy vector existence check in matching controller as edge case safety net |
| 🟢 Low | Alert when Pinecone RU usage hits 80% of free tier |
| 🟢 Low | Revisit LLM reranking (Phase 6) once dataset scales and an eval set exists — see Key Design Decisions |

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

**Why we deferred LLM reranking (Phase 6)**
An LLM reranking stage was evaluated and explicitly deferred. The cost is real — every rerank
burns Gemini tokens per candidate, and the match-insight feature already consumes one generation
per explained match. The value at current dataset scale (10 resumes, 7 jobs — 20 vectors) is low:
with so few candidates, formula-based top-K ordering is rarely ambiguous, so a model re-order
almost never changes the outcome the user sees. Honest caveat: revisiting this requires an eval
set that can measure whether reranking improves precision/recall, and that set does not exist yet.
The deferral is a measured cost trade-off — not a claim that reranking would never help. It must
also stay separate from the Gemini explanation layer (see Match Insights above): one explains, the
other would reorder, and conflating them would hide ranking decisions inside prose.