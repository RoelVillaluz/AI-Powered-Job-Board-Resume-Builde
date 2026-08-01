# AGENTS.md — AI Service

## Stack

Python, FastAPI, sentence-transformers (`all-mpnet-base-v2`, 768-d), Google Gemini (`gemini-2.5-flash`), PyTorch, scikit-learn.

## Entry Points

**`app.py`** — FastAPI HTTP server (primary, V2):
- Loads `.env.dev` via dotenv
- Configures stderr-only logging, silences HuggingFace
- Lifespan context manager: logs on startup/shutdown, sets Prometheus gauge
- Includes 6 routers under `/compute/*`, `/health`, `/metrics`

**`main.py`** — Legacy V1 CLI dispatcher (spawned by Node.js as subprocess, superseded by V2)

**`main_v2.py`** — Minimal V16-line file that imports `handlers` to trigger `@register` population of `REGISTRY`

## Directory Layout

```
├── app.py                    FastAPI entry point
├── main.py                   V1 CLI (legacy)
├── main_v2.py                V2 CLI (handler registry)
├── config/                   DatabaseConfig singleton (PyMongo)
├── models/                   EmbeddingModel singleton (SentenceTransformer)
├── handlers/                 V2 compute handlers (@register pattern)
│   ├── base_handler.py       @register decorator, REGISTRY dict, safe_call()
│   ├── resume_handlers.py    generate_resume_embeddings, score_resume
│   ├── job_handlers.py       generate_job_posting_embeddings
│   ├── market_handlers.py    generate_skill/job_title/location_embeddings
│   ├── salary_handler.py     predict_salary
│   ├── matching_handler.py   score_matches
│   └── match_insight_handler.py  generate_match_insight (Gemini)
├── routers/                  FastAPI APIRouter modules
│   ├── shared/               ComputeRequest (Pydantic), wrap() response envelope
│   ├── embeddings.py         POST /compute/generate_*_embeddings
│   ├── scoring.py            POST /compute/score_resume
│   ├── salary.py             POST /compute/predict_salary
│   ├── matching.py           POST /compute/score_matches, /compute/generate_match_insight
│   ├── health.py             GET /health
│   └── metrics.py            GET /metrics (Prometheus)
├── gemini/                   Gemini domain package (client + pipeline stages)
│   ├── gemini_client.py      Thin Gemini API wrapper with retry + fallback model
│   ├── match_context_builder.py  Builds prompt context for Gemini
│   └── response_validator.py     Output-structure + instruction-leak checks
├── services/                 Business logic (no Gemini pipeline stages — see
│   │                         the boundary rule under "Gemini Domain Package")
│   ├── resume_service.py
│   ├── scoring_service.py
│   ├── analytics_service.py
│   └── job_matching_service.py
├── infrastructure/
│   └── embeddings/           Registry-driven parallel embedding pipeline
│       ├── embedding_orchestrator.py  Single entry: extract_embeddings_parallel()
│       ├── pipelines/
│       │   ├── pipeline_registry.py   { entity_type: (build_fn, unpack_fn) }
│       │   ├── base.py               EmbeddingPipeline dataclass + make_pipeline()
│       │   ├── resume_pipeline.py
│       │   └── job_pipeline.py
│       ├── tasks/
│       │   ├── task_registry.py       TaskConfig dataclass, _TASKS dict, run_task()
│       │   └── tasks.py              Named shims (run_skills, run_job_title, etc.)
│       └── embed_text.py             Single-text embed helper
├── metrics/                  Prometheus counters/histograms + PipelineRun
├── observability/            Emitters (embedding_emitters.py)
└── utils/                    embedding_utils, tensor_utils, date_utils
```

## @register Handler Pattern

**File:** `handlers/base_handler.py`

```python
REGISTRY: dict[str, Callable] = {}

def register(name: str):
    def decorator(fn):
        REGISTRY[name] = fn
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            return fn(*args, **kwargs)
        return wrapper
    return decorator
```

Every handler follows:
```python
@register("some_command")
def some_command(args...) -> dict:
    def _run():
        # business logic
        return result
    return safe_call(_run, label="some_command")
```

`safe_call()` catches all exceptions, logs with `exc_info=True`, returns `{"error": str(e)}`.

Side-effect imports in `handlers/__init__.py` trigger all `@register` decorators at import time, populating `REGISTRY`.

## Registered Handlers

| Registry Key | File | Purpose |
|---|---|---|
| `generate_resume_embeddings` | resume_handlers.py | Resume embedding extraction (5 sections, parallel) |
| `score_resume` | resume_handlers.py | Resume scoring + analytics |
| `generate_job_posting_embeddings` | job_handlers.py | Job posting embedding extraction |
| `generate_skill_embeddings` | market_handlers.py | Skill text embedding |
| `generate_job_title_embeddings` | market_handlers.py | Job title text embedding |
| `generate_location_embeddings` | market_handlers.py | Location text embedding |
| `predict_salary` | salary_handler.py | Salary prediction pipeline |
| `score_matches` | matching_handler.py | Job match scoring |
| `generate_match_insight` | match_insight_handler.py | Gemini-powered match explanation |

## Router Conventions

- Compute routers: `APIRouter(prefix="/compute")` — flat endpoints under `/compute/...`
- Infra routers: `APIRouter()` (health, metrics)
- All compute endpoints accept `ComputeRequest` (Pydantic `BaseModel` with `extra="allow"`)
- Body extracted via `body.model_dump()`, fields passed by key to handler
- All responses normalized through `wrap()` → `{ "data": ..., "error": ... }`

## Gemini Domain Package (`gemini/`)

**Boundary rule** — `services/` contains ONLY modules that call the model
directly. Pipeline stages adjacent to a model call (prompt construction,
output validation, anything running before/after the actual API call) belong
in a domain-scoped package (e.g. `gemini/`) alongside that domain's client
module, not in `services/`.

Concrete example: `gemini_client.py`, `match_context_builder.py`, and
`response_validator.py` were moved from `services/` into `gemini/` — the
client call plus the two stages adjacent to it now live together.
`response_validator.py` stays production code (imported by
`handlers/match_insight_handler.py` at runtime) even though the test suite
also imports it.

Package docs — what each file does, the two-layer prompt-injection defense,
and the OWASP LLM Top 10 (2025) coverage table: `gemini/README.md`.

**Client wrapper** — `gemini/gemini_client.py`:

```python
from gemini.gemini_client import generate
answer = generate(
    prompt,
    system_instruction=SYSTEM_INSTRUCTION,
    temperature=0.55,
    max_output_tokens=1500,
    thinking_budget=0,       # disables chain-of-thought tokens
)
```

- Lazy singleton `genai.Client`, cached in module-level `_client`
- Primary model: `gemini-2.5-flash` (env `GEMINI_MODEL`), fallback: `gemini-2.5-flash-lite` (`GEMINI_MODEL_FALLBACK`)
- On 429/RESOURCE_EXHAUSTED: retries once with fallback model
- Returns `response.text or ""`
- Only used by `handlers/match_insight_handler.py`

## Embedding Pipeline (4 Layers)

1. **Orchestrator** (`embedding_orchestrator.py`) — single entry: `extract_embeddings_parallel(entity_type, entity_id, **kwargs)`
2. **Pipeline Registry** (`pipeline_registry.py`) — maps entity_type → (build_fn, unpack_fn). Two registered: `"resume"` and `"job_posting"`
3. **Pipeline Definitions** (`resume_pipeline.py`, `job_pipeline.py`) — declare which tasks run + result key shapes
4. **Task Registry** (`task_registry.py`) — `TaskConfig` dataclass, generic `run_task()` runner, 7 tasks: skills, workExperience, certifications, jobTitle, location, requirements, experienceLevel

All tasks run concurrently via `ThreadPoolExecutor` (PyTorch releases GIL). Total time = slowest task, not sum.

## Singleton Patterns

- `EmbeddingModel` (`models/embeddings.py`) — `__new__`-based, lazy SentenceTransformer load
- `DatabaseConfig` (`config/database.py`) — `__new__`-based, PyMongo client

## Error Handling

- `safe_call()` wraps every handler — catches all, returns `{"error": str(e)}`
- `wrap()` in `routers/shared/response.py` — normalizes to `{ "data": ..., "error": ... }`
- Observability code (metrics, persist_run) silently swallows errors — must never break a handler

## Logging

- All logging to stderr (keeps stdout clean)
- HuggingFace/sentence_transformers silenced to WARNING/ERROR
- Tagged prefixes: `[Gemini]`, `[FASTAPI]`, `[task_registry]`, `[embedding_metrics]`
- `logger.error(...)` with `exc_info=True` is the standard pattern

## Key Files

| Concern | Path |
|---|---|
| FastAPI entry point | `app.py` |
| Handler base + @register | `handlers/base_handler.py` |
| Handler registration | `handlers/__init__.py` |
| Gemini domain package | `gemini/` (client + prompt builder + validator) |
| Embedding model singleton | `models/embeddings.py` |
| Database singleton | `config/database.py` |
| Embedding orchestrator | `infrastructure/embeddings/embedding_orchestrator.py` |
| Pipeline registry | `infrastructure/embeddings/pipelines/pipeline_registry.py` |
| Task registry | `infrastructure/embeddings/tasks/task_registry.py` |
| Shared request/response | `routers/shared/request.py`, `routers/shared/response.py` |
| Prometheus metrics | `metrics/prometheus_metrics.py` |
| Embedding metrics | `metrics/embedding_metrics.py` |
