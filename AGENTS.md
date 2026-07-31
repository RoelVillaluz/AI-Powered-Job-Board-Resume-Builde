# AGENTS.md — Project Root

## Project Overview

AI-powered job board and resume builder. Users create resumes, which get embedded and matched against job postings via Pinecone vector search + hybrid scoring. An AI assistant (RAG pattern with Gemini) explains match quality.

## Three-Service Layout

| Service | Path | Stack | Purpose |
|---|---|---|---|
| Backend | `backend/` | Node.js, Express, TypeScript/JS, MongoDB, BullMQ, Redis, Pinecone | API, job queue workers, DB ownership |
| AI Service | `ai-service/` | Python, FastAPI, sentence-transformers, Google Gemini | ML compute — embeddings, scoring, salary, matching |
| Frontend | `frontend/` | React, React Query, Zustand, Socket.IO | Client UI |

The backend owns all database operations and enqueues compute jobs via BullMQ. The AI service is a stateless compute layer — it receives prepared payloads, runs ML inference, and returns results. The frontend communicates with the backend over HTTP REST + Socket.IO for real-time updates.

## Core Domain Model

- **Users** — job seekers and employers (role-based: `jobseeker`, `employer`)
- **Resumes** — built in-app, embedded into 768-d vectors (5 sections: skills, workExperience, certifications, jobTitle, location)
- **Job Postings** — employer-created, same embedding pipeline
- **Matches** — resume-to-job similarity via Pinecone topK=20 retrieval + hybrid weighted scoring (skill 40%, experience 25%, semantic 15%, seniority 10%, location 7%, certs 3%)
- **Match Insights** — Gemini-generated explanations of why a job is a good/bad fit
- **Salary Predictions** — estimated range based on resume + similar job postings
- **Resume Scores** — completeness + relevance analysis
- **Chat** — real-time messaging between candidates and employers via Socket.IO
- **Market Entities** — skills, job titles, locations, industries (each with their own embedding pipeline)

## Pipeline Architecture

All heavy compute is async. The API returns `202 Accepted` with a `jobId`, and the client polls or listens on Socket.IO for completion.

```
Request → Express route → enqueue BullMQ job → Worker picks up →
  executeComputePipelineV2:
    1. fetcher(id) — load from MongoDB
    2. embedding freshness check (skip for scoring/salary/matching)
    3. aiClient(endpoint, payload) — HTTP POST to AI service
    4. buildPayload() or mapper() — transform AI output
    5. persist(id, document) — save to MongoDB
    6. afterSave hook — chain downstream jobs (e.g., resume embedding triggers scoring + matching)
    7. progress events via Socket.IO
```

## Cross-Service Conventions

### Error Handling
- Backend: `catchAsync` wraps every controller; `AppError` hierarchy (400/401/403/404/409); global `errorHandler` middleware
- AI service: `safe_call()` wraps every handler; `wrap()` normalizes responses to `{ data, error }` envelope
- Frontend: per-call try/catch; no global error interceptor

### Response Format
- Backend: `{ success, formattedMessage, data, cached? }`
- AI service: `{ data, error }` (via `wrap()`)
- Backend uses `sendResponse()` with `STATUS_MESSAGES` constants for all responses

### Logging
- Backend: Winston with daily-rotate files; Morgan for HTTP; structured `[WORKER V2 START]` prefixes in workers
- AI service: stderr-only logging; tagged prefixes like `[Gemini]`, `[task_registry]`; HuggingFace logging silenced

### Observability
- Prometheus metrics via `/metrics` endpoints in both backend and AI service
- Grafana dashboards for embedding pipeline, matching pipeline, latency percentiles, cache hit rates

## Key Conventions (Code-Derived)

1. **Mixed JS/TS** — both services are mid-migration to TypeScript. Core infrastructure is `.ts`, older code remains `.js`/`.py`. New code should be TypeScript.
2. **Registry pattern** — both backend (`ComputeConfigV2`) and AI service (`@register`) use registries where new compute capabilities are declared as config objects/decorators, not wired manually.
3. **Factory pattern** — `createEmbeddingControllerFactory` and `createEmbeddingServiceFactory` generate controller/service pairs for market entities from simple config.
4. **Deterministic job IDs** — `{prefix}-{entityId}` in production (dedup), with timestamp in dev (allows re-processing).
5. **Graceful shutdown** — `SIGTERM`/`SIGINT` handlers close BullMQ workers, HTTP server, and cron jobs.
6. **5-minute stale time** for React Query across the board.
7. **Auth tokens passed as parameters** through hooks and API functions (not read from store inside API layer).
8. **Controller split for AI operations** — Every AI-backed endpoint has two controllers: `getXController` (GET, returns cached data or 404) and `generateXController` (POST, enqueues job and returns 202). A single controller must never branch between reading cache and enqueuing.
9. **Three-layer strict architecture** — Controller (parse + respond, no branching) → Service (business logic, freshness checks, calls repo) → Repository (Mongoose queries only). No layer skips the layer below it. Services never import models directly.
10. **Naming by service** — `camelCase` in Node.js/TypeScript/Go (variables, functions, filenames, database fields); `snake_case` only in Python (`ai-service/`).
11. **Testing via factories only** — All test documents created through `Factory('entityName').as('trait').with({ field }).for(Model).create()`. Never use `Model.create()` with inline objects.
