# AGENTS.md — Backend Job Infrastructure

## ComputeConfigV2 Lifecycle Hooks

Every compute capability is declared as a `ComputeConfigV2` in a domain registry file. The generic pipeline (`executeComputePipelineV2`) calls these hooks in order:

| Hook | Called when | Owns | Signature |
|---|---|---|---|
| `fetcher(id)` | Start | Loading ALL dependencies from DB + building the full payload sent to the AI service. Receives **only the bare entity id** (string or ObjectId) — no second argument for per-request data. | `(id: string \| ObjectId) => Promise<Record<string, any> \| null>` |
| `buildPayload(aiResult, id)` | After AI response | Transforming the AI service's raw JSON output into the shape `persist` expects. Only one of `buildPayload` / `mapper` is used; `buildPayload` takes precedence when both are set. | `(aiOutput, id) => Promise<any>` |
| `persist(id, data)` | After buildPayload | Saving the processed result to MongoDB. Always delegates to a repository function, never calls `Model.*` inline. | `(id, data) => Promise<T>` |
| `afterSave(saved, emitSocket, ctx)` | After persist succeeds | Chaining downstream jobs (e.g. resume embedding → scoring + matching), sending Socket.IO progress events, recording Prometheus metrics, and cleaning up per-request side state on the success path. | `(saved, emitSocket, ctx) => Promise<void>` |
| `onFinalFailure(job)` | After ALL retries exhausted | Cleaning up per-request side state (e.g. a Redis pending entry) that `fetcher()` reads. Only fires on the terminal failure — never on retryable attempts, since the next retry still needs that data. | `(job: Job) => Promise<void>` |

### fetcher(id) — id-only rule

`fetcher` receives exactly one argument: the bare entity id. It must load everything it needs from that id alone.

```typescript
// ✅ Correct — matchingRegistry.ts:23
fetcher: async (id) => {
    const { buildMatchingPayload } = await import(
        "../../../../helpers/matching/buildMatchingPayload.js"
    );
    return buildMatchingPayload(id as string);
},

// ✅ Correct — matchInsightRegistry.ts:22 (loads per-request jobId from side-channel)
fetcher: async (id) => {
    const resumeId = id.toString();
    const pending  = await peekPendingInsight(resumeId);
    if (!pending) throw new Error(`No pending insight request for resume: ${resumeId}`);
    const { buildMatchInsightPayload } = await import(
        "../../../../helpers/matching/buildMatchInsightsPayload.js"
    );
    return buildMatchInsightPayload(resumeId, pending.jobId);
},
```

```typescript
// ❌ Never — fetcher accepts implied extra args
fetcher: async (id, secretSecondArg) => { ... };
```

## Per-Request Data via Redis Pending-Store

When `fetcher()` needs data beyond the entity id (e.g. which `jobId` to generate an insight for), use a **Redis pending-store side-channel**:

1. **Push** before enqueuing the BullMQ job (`pushPendingInsight` / `pushPendingChat`)
2. **Peek** inside `fetcher()` — non-destructive read so BullMQ retries see the same data
3. **Cleanup** happens in two places:
   - `afterSave` — removes the entry on success
   - `onFinalFailure` — removes the entry when all retries are exhausted

**PEEK not POP.** Popping in `fetcher()` would silently starve retry attempts (the entry is already gone by attempt 2). The canonical implementation is `domains/matching/pendingInsightStore.ts`:

```typescript
export const peekPendingInsight = async (resumeId: string) => {
    const key = `${PENDING_KEY_PREFIX}${resumeId}`;
    const raw = await redisClient.lindex(key, 0);  // PEEK — index 0, no pop
    return raw ? JSON.parse(raw) : null;
};
```

`afterSave` calls `removePendingInsight` once the job succeeds. `onFinalFailure` (or, if not configured, the Redis TTL) is the backstop for the failure path.

| Store | Exists? | File |
|---|---|---|
| Pending Insight | Yes | `domains/matching/pendingInsightStore.ts` |
| Pending Chat | Intended pattern | Would live at a similar path, same peek/push/remove API |

Per-request data must NEVER be smuggled into the queue job payload beyond the entity id — BullMQ payloads are not a data channel for request-scoped parameters.

## Concurrency — Two Distinct Cases

### Structurally Required (concurrency: 1)

| Registry | concurrency | Locked? | Reason |
|---|---|---|---|
| `matchInsightRegistry` | `1` (hardcoded, no `isProd` branch) | **Yes — must never increase** | `fetcher()` reads from a Redis FIFO pending-store. Concurrency > 1 would let two workers peek the same head entry, producing duplicate AI calls for the same request. The single-worker guarantee is load-bearing for correctness. |

Raising concurrency above 1 for this registry is a correctness bug, not a performance trade-off.

### Environment-Tuned (safe to adjust)

All other registries use `isProd ? N : M` to scale concurrency between dev and production. These are performance tunables — adjusting them won't break correctness.

| Registry | Dev | Prod | File |
|---|---|---|---|
| `embeddingRegistryV2` (resume) | 2 | 5 | `domains/embedding/embeddingRegistryV2.ts:45` |
| `embeddingRegistryV2` (jobPosting) | 2 | 5 | `domains/embedding/embeddingRegistryV2.ts:116` |
| `embeddingRegistryV2` (skill) | 3 | 5 | `domains/embedding/embeddingRegistryV2.ts:172` |
| `embeddingRegistryV2` (jobTitle) | 3 | 5 | `domains/embedding/embeddingRegistryV2.ts:197` |
| `embeddingRegistryV2` (location) | 2 | 4 | `domains/embedding/embeddingRegistryV2.ts:222` |
| `embeddingRegistryV2` (industry) | 1 | 2 | `domains/embedding/embeddingRegistryV2.ts:247` |
| `scoringRegistryV2` | 2 | 5 | `domains/scoring/scoringRegistryV2.ts:17` |
| `salaryPredictionRegistry` | 2 | 5 | `domains/salary/salaryPredictionRegistry.ts:18` |
| `matchingRegistry` | 1 | 3 | `domains/matching/matchingRegistry.ts:16` |

**Flag:** `matchInsightRegistry` hardcodes `concurrency: 1` with no `isProd` branch. If the pending-store pattern is ever replaced, this should get the same `isProd ? N : 1` conditioning the others use. For now, leave it — changing it risks correctness.

## dlqName — When null Is Intentional

A `dlqName: null` entry means failed jobs are dropped rather than dead-lettered. This is correct for operations where the user can simply retry and no artifact needs inspection:

| Registry | dlqName | Reasoning |
|---|---|---|
| `matchInsightRegistry` | `null` | A failed Gemini explanation is ephemeral — the user refreshes and retries. No one debugs a stale insight in a DLQ. |
| `embeddingRegistryV2` (resume) | `null` | Resume embeddings trigger scoring + matching downstream; a re-embed on next save replaces any stale data. |
| `embeddingRegistryV2` (jobPosting) | `null` | Same reasoning as resume; re-triggered on save. |
| All market entities | Named DLQs | These are admin-triggered one-shot operations. A failure means a bug in the market dataset that deserves human attention. |
| scoring, salary, matching | Named DLQs | Downstream consumers depend on these results; a silent drop would cause hard-to-diagnose missing-data bugs. |
