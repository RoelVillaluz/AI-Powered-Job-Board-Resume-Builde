# Gemini Domain Package (`gemini/`)

Cohesive package owning the entire Gemini call path for the match-insight
feature: the client call and the pipeline stages adjacent to it (prompt
construction, output validation, and the streaming orchestration). Nothing
here touches the database — the handler receives prepared resume + match data
and returns a prose string, or streams one as NDJSON events.

---

## What each file does

| File | Role |
|---|---|
| `gemini_client.py` | Thin wrapper around the `google-genai` SDK. Lazy singleton client; primary model `gemini-2.5-flash` with one fallback retry on `gemini-2.5-flash-lite` for 429 / RESOURCE_EXHAUSTED; returns `response.text or ""` (`generate`) or streams text chunks (`generate_stream`). Forces `thinking_budget=0` so hidden reasoning tokens cannot silently consume the output budget. |
| `match_context_builder.py` | Builds the prompt context from the resume and the single scored match. Every untrusted value passes through `_sanitize()` (strips `\r\n\t`, caps at 48 chars) and `_delimit()` (wrapped in XML-style tags such as `<skill>…</skill>`). Only the resume's skills + experience level reach the prompt — name/contact fields are never part of this payload. |
| `response_validator.py` | Single source of truth for the output heuristics, imported by BOTH the engine and the test suite (never reimplemented in a test). `response_is_properly_structured()` enforces the 4-part shape (X/100 score, verdict, gap, length ≥ 20); `response_leaks_instructions()` flags leaked system-prompt/role text. |
| `match_insight_engine.py` | Shared orchestration layer between the sync handler and the stream endpoint. Owns `SYSTEM_INSTRUCTION` + `DIRECTIVE_RETRY_INSTRUCTION`, `build_prompt()`, `is_valid_answer()`, `build_structured_fallback()`, and the async `stream_match_insight()` NDJSON generator (delta / restart / fallback / end / error events). Keeps `handlers/match_insight_handler.py` a thin `@register` wrapper. |

---

## Why delimiting and validation exist

The attack this pipeline is engineered against is **prompt injection** —
user- or employer-controlled text (skill names, job titles, salary fields)
that reaches the prompt and tries to hijack the model. Two layers of defense:

**Layer 1 — input (context construction).** `match_context_builder.py` never
interpolates raw untrusted text. Every value is control-character-stripped,
length-capped, and wrapped in XML-style delimiters, and the system instruction
tells the model to treat anything inside a tag as **data, never as an
instruction**. This neutralises RAG-style poisoning at the boundary.

**Layer 2 — output (validation).** Even if the model is manipulated into
producing a bad answer, `response_validator.py` + the engine reject it:
validate → if invalid, retry **once** with a directive prompt → if still
invalid, return a structured data-driven fallback (`build_structured_fallback`)
carrying the real score, fit tier, and top gap from the match data — never raw
malformed output.

Runtime flow — shared core in `gemini/match_insight_engine.py`, consumed by
the sync handler (`handlers/match_insight_handler.py`) and the stream router
(`routers/matching.py`):

```
build_prompt(resume, matches)                 # wraps build_match_context
  → generate(prompt, system_instruction)      # or generate_stream (async)
  → is_valid_answer(answer)?                  # structured && not leaking
      ├─ yes → return { answer, jobId }
      └─ no  → retry once with DIRECTIVE_RETRY_INSTRUCTION
                → is_valid_answer? → return
                └─ no → return build_structured_fallback(matches)
```

---

## Public API

```python
from gemini.match_context_builder import build_match_context
from gemini.gemini_client import generate, generate_stream
from gemini.match_insight_engine import (
    build_prompt,
    build_structured_fallback,
    is_valid_answer,
    stream_match_insight,
)
from gemini.response_validator import (
    response_is_properly_structured,
    response_leaks_instructions,
)
```

`response_validator` is the shared contract: `tests/gemini/conftest.py`
re-exports it for the suite (never redefines), and the engine imports it
directly — change a heuristic here, never in a test.

---

## Streaming: progressive match insights

### Why this exists

The sync `generate_match_insight` endpoint is a 5–15 s blocking call on the
free-tier flash model: the frontend shows a spinner, then the whole 4-sentence
summary arrives at once. Streaming fixes two things at the same time:

1. **Latency UX** — the first words appear within ~1 s; the client renders
   chunks as they arrive instead of all-or-nothing.
2. **Cancellation** — a blocking HTTP call cannot be interrupted. If the user
   navigates away, the backend has no lever to stop the in-flight Gemini call
   and the worker burns queue time on a result nobody is waiting for. A
   stream, by contrast, is cancellable: closing the connection closes the
   generator, which closes the SSE connection to Google.

This is the **only** AI path a user sits and watches live; everything else
(embeddings, scoring, matching) is fire-and-forget polling. Streaming was
worth adding here and nowhere else.

### The full path, end to end

```
frontend (React)                    backend (Node)                       ai-service (Python)               Google
───────────────                      ───────────────                      ───────────────────              ──────
Socket.IO "matchInsight:chunk"
    ▲                    ┌──────────────────────────────┐    POST /compute/generate_match_insight/stream    SSE stream
    │ socket event       │ BullMQ worker → pipeline      │        (NDJSON response, timeout:0)        ┌──────┐
    │ per streamEvent    │   → runStream (streamCompute   │──────────────────────────────────────────▶ │ Gemini│
    ▼                    │     Runner, core/)            │                                            └──────┘
 useResumeAnalysis       │   → aiClientStream (axios,     │  ┌─────────────────────────────────────────┐   ▲
 applies full text       │     responseType:"stream")     │  │ StreamingResponse                        │   │
                         │   → AbortController +          │  │   → event_stream()                       │   │
                         │     shouldAbort per chunk      │  │     → stream_match_insight()  ◀────────────┘   chunks
                         └──────────────────────────────┘  │     → generate_stream() (async SDK)
                                                           │   one NDJSON line per yielded event
                                                           └─────────────────────────────────────────┘
```

Every hop between ai-service and the backend is one live HTTP connection with
`timeout: 0`; nothing buffers the full answer before forwarding it.

### The wire protocol: NDJSON events

The stream is **newline-delimited JSON**: one JSON object per line, each line
one event. Every event carries `jobId` so the backend can attach the final
answer to the right match — the pipeline only knows the bare `resumeId` and has
no composite key to disambiguate matches.

| `type` | payload | terminal? | meaning |
|---|---|---|---|
| `delta` | `{ delta, full, jobId }` | no | one model text chunk + the running full answer |
| `restart` | `{ jobId }` | no | first attempt failed validation; wipe displayed text, retry coming |
| `fallback` | `{ answer, jobId }` | yes | both attempts failed; structured data-driven answer |
| `end` | `{ answer, jobId }` | yes | final validated answer |
| `error` | `{ message, jobId }` | yes | unexpected failure; stream closes after this |

Concrete lines as they cross the wire:

```json
{"type":"delta","delta":"Your resume shows a strong fit at 85/100 for this role. ","full":"Your resume shows a strong fit at 85/100 for this role. ","jobId":"6722ac1f"}
{"type":"delta","delta":"Your main gap is Docker experience. Next, learn Docker.","full":"Your resume shows a strong fit at 85/100 for this role. Your main gap is Docker experience. Next, learn Docker.","jobId":"6722ac1f"}
{"type":"end","answer":"Your resume shows a strong fit at 85/100 for this role. Your main gap is Docker experience. Next, learn Docker.","jobId":"6722ac1f"}
```

**Why send both `delta` and `full`?** The consumer is not assumed to be a
lossless parser. The backend `streamComputeRunner` simply overwrites its
accumulated string from `full` on every event — idempotent, order-independent,
and safe against a dropped line, because the last event always carries the
complete answer. `full` is the contract; `delta` is the progressive-rendering
hint.

### Why NDJSON and not SSE

- **Zero parser ceremony.** NDJSON is newline-delimited JSON; the Node
  consumer splits the stream buffer on `\n` and `JSON.parse`s each line
  (`aiClientHandler.ts::aiClientStream`). Server-Sent Events adds `data: `
  framing and event-id bookkeeping for no benefit here.
- **Same POST + auth.** Streaming reuses the exact request shape of the sync
  endpoint — same `POST /compute/...` body, same `X-Internal-Service-Key`
  header. SSE-as-transport would push toward `EventSource`, which issues GETs
  and **cannot set custom headers** — a hard blocker for internal-service-key
  auth.
- **Response-envelope philosophy.** The service already normalizes every
  response to `{ data, error }` via `wrap()`; one JSON object per line is the
  streaming analog of that discipline.

### How the pieces compose (syntax)

Three layers of `async` generator, each transforming without buffering.

#### 1. `gemini_client.py::generate_stream` — the SDK bridge

An `async def` generator. It calls the async SDK method
`client.aio.models.generate_content_stream(...)` once, then `yield`s each
`chunk.text` as a `str`. Nothing is accumulated here; the caller decides what
to do with each chunk:

```python
async for text in generate_stream(prompt, system_instruction=SYSTEM_INSTRUCTION):
    full += text
    yield {"type": "delta", "delta": text, "full": full, "jobId": job_id}
```

#### 2. `match_insight_engine.py::stream_match_insight` — the flow owner

An `async def` generator. It consumes `generate_stream`, accumulates `full`,
runs the same two-attempt + fallback validation flow as the sync handler, and
yields dict events. This is the layer where the 429 fallback and the
validation gate live.

#### 3. `routers/matching.py::generate_match_insight_stream_endpoint` — the transport

An inner `async def event_stream()` wraps `stream_match_insight`, `json.dumps`
+ `\n`-encodes each event, and hands the whole thing to FastAPI's
`StreamingResponse`:

```python
@router.post("/generate_match_insight/stream")
async def generate_match_insight_stream_endpoint(body: MatchInsightRequest):
    async def event_stream():
        async for event in stream_match_insight(
            resume=body.resume, matches=body.matches, job_id=body.jobId,
        ):
            yield (json.dumps(event) + "\n").encode("utf-8")

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")
```

`StreamingResponse` flushes each yielded line immediately, so one NDJSON line
≈ one network write ≈ one socket event on the client. Note the layers only
transform: `str` chunks in, dict events out, bytes on the wire — nothing ever
waits for the full answer.

### The two-attempt flow, streaming-aware

Same validation gate as the sync path (`is_valid_answer`), but with a
subtlety: **you can only validate the complete answer, and by then the invalid
chunks are already out on the wire.** So the retry dance is:

```
stream 1 (SYSTEM_INSTRUCTION)          → deltas accumulate in `full`
  → stream ends → is_valid_answer(full)?
      ├─ yes → yield {type: "end", answer: full}
      └─ no  → yield {type: "restart"}           # client wipes displayed text
               stream 2 (DIRECTIVE_RETRY_INSTRUCTION) → deltas accumulate again
                 → is_valid_answer(full)?
                     ├─ yes → yield {type: "end", answer: full}
                     └─ no  → yield {type: "fallback", answer: build_structured_fallback(matches)}
```

The `restart` event exists **precisely because the first attempt's text was
already streamed**: the client must clear its rendered text before the retry's
deltas arrive, or the retry would be concatenated onto garbage. This mirrors
the sync handler's single-retry discipline — never more than two model calls —
so streaming does not multiply cost.

### Error model: request-start vs mid-stream

`generate_stream` distinguishes two phases:

- **Request-start phase** (opening the stream): a 429 / RESOURCE_EXHAUSTED
  retries once on the fallback model, exactly like `generate`. Errors here
  raise before any byte is sent, so the backend still sees a clean failure.
- **Mid-stream phase** (iterating chunks): errors propagate as exceptions.
  There is **no 429 fallback mid-stream** — once bytes are flowing, restarting
  on a different model would splice a chopped hybrid into the client's buffer.

`stream_match_insight` then adds its own top-level `try/except` that converts
any escape exception into a final `error` event instead of re-raising. This is
deliberate: **once the first byte of an HTTP stream is flushed, you can no
longer change the status code.** A raised exception after a `200` started
becomes a truncated body with no signal; an `error` event is a normal,
parseable, terminal line the consumer can surface as a message.

```python
except Exception as e:
    logger.error(f"[Gemini] Stream failed: {e}", exc_info=True)
    yield {"type": "error", "message": str(e), "jobId": job_id}
```

### Cancellation: why it works, and the honest gap

The chain that makes cancellation work:

1. Backend aborts the axios request (`signal.aborted`) or the client's socket
   dies → Node destroys the TCP connection.
2. FastAPI/uvicorn sees the connection close → the response generator is torn
   down → Python raises inside `generate_stream`'s `async for`.
3. Unwinding closes the `httpx` stream the async SDK opened to Google's SSE
   endpoint → Google stops producing.

The decision that made this possible was **using the native async SDK**
(`client.aio.models.generate_content_stream`), not a threadpool around the
sync `generate_content`. A blocking read inside a worker thread cannot be
interrupted — the thread simply finishes reading its current chunk. The async
generator, by contrast, cooperates with cancellation: when the consumer stops
asking, the generator stops, and closing the generator closes the socket. This
was verified empirically in a throwaway spike before committing to the design:

- **Async SDK path:** abort stopped server-side chunk production within
  ~20 ms; both generator `finally`s ran.
- **Threadpool path:** one extra chunk slipped through (the blocking call
  can't be interrupted mid-read) and the control request ended in ECONNRESET.

Honest gap: Google's `streamGenerateContent` SSE has **no explicit cancel
API** — the only lever is closing the live connection. So "cancel" is
connection teardown, not a Google-side job kill. In practice free-tier flash
streams are short, so this is acceptable; it just means a cancelled generation
isn't guaranteed to free Google-side compute instantly.

On the backend, an abort surfaces as `UnrecoverableError`
(`aiClientHandler.ts` + `streamComputeRunner.ts`), which BullMQ treats as
terminal from attempt 1: no retry of a cancelled job, and `onFinalFailure`
cleanup runs immediately. The cancelling client is gone, so no error event is
emitted on that path — the socket simply stops getting chunks.

### Cost & memory notes

- **Bounded accumulation.** `full` is capped by `max_output_tokens=1500`
  (≈ a few KB of prose) — holding the running answer for the validation gate
  costs nothing.
- **Bounded retries.** Two model calls maximum, identical to the sync path.
- **Instrumentation parity.** `generate_stream` records per-chunk
  `usage_metadata` and a final duration + outcome, mirroring `generate`'s
  Prometheus counters — streaming is not a metrics blind spot.

### Testing the stream

`tests/gemini/test_match_insight_stream.py` patches
`gemini.match_insight_engine.generate_stream` with fake async generators and
asserts the emitted event sequence:

| Scenario | Expected events |
|---|---|
| valid chunks | `delta, delta, end` |
| garbage then valid | `delta, restart, delta, end` |
| double garbage | `delta, restart, delta, fallback` |
| mid-stream exception | `delta, error` |

The mock targets the module-global binding (`generate_stream` imported into
`match_insight_engine` at import time), not the client module — the same
pattern as the sync tests patching `handlers.match_insight_handler.generate`.

---

## OWASP LLM Top 10 (2025) Coverage

Assessed against the [OWASP Top 10 for LLM Applications — 2025 edition](https://genai.owasp.org/llm-top-10/)
(LLM01:2025–LLM10:2025). A category is only marked **Addressed** where a real
file and a passing test back the claim; **Partially Addressed** rows name the
exact gap that keeps them short of that bar.

| # | Category | Status | What exists / gap | Verified by |
|---|---|---|---|---|
| LLM01 | Prompt Injection | **Addressed** | Input: `match_context_builder.py` — `_sanitize()` (control chars stripped, 48-char cap) + `_delimit()` XML tags; system instruction treats tag content as untrusted data. Output: `response_validator.py` leak/structure checks; handler validates → retries once → fallback. | `tests/gemini/test_prompt_injection.py` — payload never appears verbatim in context; leaked and off-structure outputs are rejected. |
| LLM02 | Sensitive Information Disclosure | **Partially Addressed** | Minimization by construction: only skills + experience level reach the prompt; name/contact fields are never in this payload. Gap: no automated PII redaction layer — `gemini_client.py`'s docstring documents the free-tier prompt-retention risk and recommends stripping name/contact before sending, but that recommendation is not enforced in code. | — (no PII-redaction test) |
| LLM03 | Supply Chain | **Partially Addressed** | `requirements.txt` fully pins every dependency (`==`), so builds are reproducible. Gap: no automated vulnerability scanning (e.g. pip-audit / dependabot) gating ai-service dependency updates in CI. | — |
| LLM04 | Data and Model Poisoning | **Not Applicable** | This system does not train or fine-tune any model. Gemini is consumed off-the-shelf via API and the embedding model is a fixed pretrained artifact — there is no training-data pipeline to poison. | — |
| LLM05 | Improper Output Handling | **Addressed** | `response_validator.py` structural check; handler rejects → retries once with directive prompt → returns structured data-driven fallback. Malformed output is never propagated verbatim. | `tests/gemini/test_output_validation.py` — empty string, raw JSON, refusal, single word, and 5000-char gibberish all rejected / fallback. |
| LLM06 | Excessive Agency | **Not Applicable** | The model has zero tool use, function calling, or plugin access — it emits a prose string; the handler owns all I/O, retries, and fallbacks. Nothing the model can autonomously act on. | — |
| LLM07 | System Prompt Leakage | **Addressed** | `response_validator.py::response_leaks_instructions()` flags system-prompt/role phrasing; the handler rejects leaking output. Honest caveat: it is a heuristic keyword list, not an exhaustive guarantee — a heavily paraphrased leak could slip through. | `tests/gemini/test_prompt_injection.py` — `"Here is my system prompt: 'You are a warm, encouraging career coach…'"` is rejected. |
| LLM08 | Vector and Embedding Weaknesses | **Partially Addressed** | Retrieval lives in the backend (Pinecone topK=20); this package has no retrieval path. Injected match content is neutralized at the context-builder boundary before reaching the LLM. Gap: embedding hygiene (PII in vectors, deletion semantics) lives in the backend and is not explicitly controlled or tested here. | `tests/gemini/test_prompt_injection.py` — injected match/skill content never reaches the prompt. |
| LLM09 | Misinformation | **Partially Addressed** | Grounding is enforced at the prompt level: "Only reference jobs, scores, and skills that appear in the provided data. Never invent…", and the fallback is data-driven (real score, fit tier, top gap). Gap: nothing verifies factual accuracy of the generated prose against the source data — no automated grounding check. | — (no fact-checking test) |
| LLM10 | Unbounded Consumption | **Partially Addressed** | Per-call bounding: `max_output_tokens=1500`, `thinking_budget=0`, max one 429 fallback retry, max one validation retry (no loop). Backend caps match-insight generation at 5 requests/60s per user/IP (`backend/src/middleware/security.js` — `insightLimiter`). Gap: no token-budget accounting or concurrency cap inside the ai-service itself. | — |

**Summary: 3 Addressed, 5 Partially Addressed, 2 Not Applicable, 0 Not Yet
Addressed.** There are no "Not Yet Addressed" rows because everything
reachable from this package is either covered, partially covered (with the
gap named), or not applicable by design — LLM04/LLM06 cannot apply to a
system that neither trains models nor grants the model any tools.
