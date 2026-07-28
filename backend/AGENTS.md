# AGENTS.md — Backend Service

## Stack

Node.js + Express, mixed JS/TS (mid-migration), MongoDB (Mongoose), BullMQ + Redis for job queues, Pinecone for vector search, Socket.IO for real-time events.

## Entry Point

`src/server.js` boots in this order:
1. Load env vars (`config/env.js`)
2. Create HTTP server wrapping Express app
3. Init Socket.IO (`initSocket`)
4. Connect MongoDB (`connectDB`) + Pinecone (`connectPinecone`)
5. Boot all BullMQ workers (side-effect import of `infrastructure/jobs/processes/generateEmbeddings.ts`)
6. Start reconciliation cron + queue depth poller
7. Listen on PORT (default 5000)
8. Register `SIGTERM`/`SIGINT` for graceful shutdown

Express app (`src/app.js`) applies: Morgan → CORS → JSON parser → static assets → `/metrics` (Prometheus) → all routes → global `errorHandler`.

## Directory Layout

```
src/
├── config/           DB, env, Pinecone, queue Redis, metrics, telemetry
├── controllers/      Route handlers (thin — delegate to services)
├── helpers/          Payload builders per domain (embeddings/, matching/, salary/, scoring/)
├── infrastructure/
│   ├── clients/      aiClientHandler.ts (axios → Python service), pineconeClient.ts
│   ├── jobs/         *** CORE ARCHITECTURE ***
│   │   ├── core/     executeComputePipelineV2, createQueueJobRunner, orchestrateComputeJob, computeRegistryTypesV2
│   │   ├── domains/  Per-entity registries (embedding, scoring, salary, matching, matchInsight)
│   │   ├── factories/  createEmbeddingControllerFactory, createEmbeddingServiceFactory
│   │   ├── processes/   generateEmbeddings.ts (boot trigger)
│   │   └── workers/  createWorkerV2, workerRegistryV2
│   ├── monitoring/   queueDepthPoller.ts
│   ├── pinecone/     upsert, query, threshold, fallback, pagination
│   └── reconciliation/  stale-job cron + runners
├── middleware/        auth, authorization, resourceCheck, errorHandler, validation (Joi), security (rate limiters), requestLogger
├── models/           Mongoose schemas (users, resumes, jobPostings, chat, market/)
├── queues/           All BullMQ Queue + DLQ instances (10 queues, 6 DLQs)
├── repositories/     Data access layer (Mongoose queries)
├── routes/           Express Router definitions, all under /api/
├── services/         Business logic
├── sockets/          Socket.IO handlers, presence
├── types/            TypeScript type definitions
├── utils/            catchAsync, logger (Winston), queueUtils, embedding validation
└── validators/       Joi schemas
```

## ComputeConfigV2 Registry Pattern

The core architecture. Every compute capability is declared as a `ComputeConfigV2` object in a domain registry file. A single generic pipeline + worker consumes all of them.

**Interface** (`infrastructure/jobs/core/computeRegistryTypesV2.ts`):
- `key`, `entity`, `queueName`, `jobName`, `jobIdPrefix`, `concurrency`, `priority`, `dlqName`
- `queue(payload)` — enqueue function (built by `createQueueJobRunner`)
- `fetcher(id)` — load from MongoDB
- `aiEndpoint` — Python AI service endpoint name
- `buildPayload()` (preferred) or `mapper()` (legacy) — transform AI output
- `persist(id, data)` — save to MongoDB
- `afterSave?(saved, emitSocket, ctx)` — post-persist hook (e.g., chain scoring + matching)
- `onFinalFailure?(job)` — cleanup after all retries exhausted
- `skipEmbeddingCheck?` — skip staleness check (scoring, salary, matching)
- `progressEvent?` — Socket.IO event prefix

**Registry files** (each exports `Record<string, ComputeConfigV2>`):
- `domains/embedding/embeddingRegistryV2.ts` — resume, jobPosting, skill, jobTitle, location, industry
- `domains/scoring/scoringRegistryV2.ts` — resumeScore
- `domains/salary/salaryPredictionRegistry.ts` — resumeSalaryPrediction
- `domains/matching/matchingRegistry.ts` — resumeJobMatch
- `domains/matching/matchInsightRegistry.ts` — resumeMatchInsight

**Wiring** (`workers/workerRegistryV2.ts`): merges all registries, creates a `Worker` per config. This is the only file that imports all registries. Side-effect imported at boot.

## Generic Pipeline

`executeComputePipelineV2` (`infrastructure/jobs/core/executeComputePipelineV2.ts`):
1. `fetcher(entityId)` — load raw data from MongoDB
2. Embedding freshness check (unless `skipEmbeddingCheck`)
3. `aiClient(endpoint, payload)` — HTTP POST to Python service
4. `buildPayload()` or `mapper()` — transform AI output
5. `persist(id, document)` — save to MongoDB
6. `afterSave` hook — chain downstream jobs
7. Progress events at 10%, 30%, 70%, 85%, 100%

## BullMQ Queues

| Queue | Purpose | DLQ |
|---|---|---|
| `resume-embedding` | Resume embedding generation | — |
| `job-embedding` | Job posting embedding generation | Yes |
| `skill-embedding` | Skill embedding generation | Yes |
| `job-title-embedding` | Job title embedding generation | Yes |
| `location-embedding` | Location embedding generation | Yes |
| `industry-embedding` | Industry embedding generation | Yes |
| `resume-scoring` | Resume scoring/analysis | — |
| `salary-prediction` | Salary prediction | — |
| `resume-job-matching` | Resume-to-job matching | Yes |
| `resume-match-insight` | Match explanation generation | — |

Config: `config/queue.config.ts` — 3 attempts, exponential backoff from 2s, 24h retention on complete, 7d on fail.

## Worker Structure

`createWorkerV2` (`workers/createWorkerV2.ts`) returns a BullMQ `Worker` that:
- Extracts `id` from `job.data`
- Builds socket emit function per user
- Calls `executeComputePipelineV2`
- On final failure: moves to DLQ if configured, calls `onFinalFailure`
- Rate limiting: `max = concurrency * 2` per 1000ms

## Orchestration / Cache-First Pattern

`orchestrateComputeJob` (`core/orchestrateComputeJob.ts`): GET endpoints check cached data first, return `{ cached: true, data }` if fresh. On cache miss, enqueue job via `safeQueueOperation` which falls back to synchronous execution if Redis is down.

## Route Conventions

All routes under `/api/`. Standard middleware chain:
```
validate(schema) → authenticate → requireRole('jobseeker'|'employer') →
  [rateLimiter] → [resourceCheck] → [ownershipCheck] → controller
```

Controller pattern:
- Wrapped in `catchAsync()`
- Extracts params from `req.params`
- Calls service function
- Returns via `sendResponse(res, STATUS_MESSAGES.X.Y, data)`

Response shape: `{ success: boolean, formattedMessage: string, data: T, cached?: boolean }`

## Factory Pattern (Market Entities)

- `createEmbeddingControllerFactory(config)` — generates `getEmbeddingController` + `generateEmbeddingController`
- `createEmbeddingServiceFactory(config)` — generates CRUD + embedding services with staleness checking and embedding invalidation

## Error Handling

- `catchAsync` wraps every controller
- `AppError` hierarchy: `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409)
- Global `errorHandler` middleware differentiates operational vs programming errors

## Key Files

| Concern | Path |
|---|---|
| Entry point | `src/server.js` |
| Express app | `src/app.js` |
| Route registry | `src/routes/index.js` |
| Queue instances | `src/queues/index.js` |
| ComputeConfigV2 type | `src/infrastructure/jobs/core/computeRegistryTypesV2.ts` |
| Generic pipeline | `src/infrastructure/jobs/core/executeComputePipelineV2.ts` |
| Worker factory | `src/infrastructure/jobs/workers/createWorkerV2.ts` |
| Worker registry | `src/infrastructure/jobs/workers/workerRegistryV2.ts` |
| Boot trigger | `src/infrastructure/jobs/processes/generateEmbeddings.ts` |
| Queue runner | `src/infrastructure/jobs/core/createQueueJobRunner.ts` |
| Orchestration | `src/infrastructure/jobs/core/orchestrateComputeJob.ts` |
| AI client | `src/infrastructure/clients/aiClientHandler.ts` |
| Redis health/fallback | `src/utils/queueUtils.ts` |
| Error classes | `src/middleware/errorHandler.js` |
| Constants + sendResponse | `src/constants.js` |
| Logger | `src/utils/logger.js` |
| Prometheus metrics | `src/config/metrics.ts` |
