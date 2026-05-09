# Embedding Infrastructure

Registry-driven pipeline architecture for parallel embedding extraction
across resume and job posting documents.

---

## Folder Structure

```
infrastructure/
├── jobs/
│   ├── backfill/                   existing backfill logic
│   └── parallelization/
│       └── parallel_utils.py       generic run_pipeline executor
│
└── embeddings/
    ├── orchestrator.py             single public entry point
    ├── pipeline_registry.py        stores (build_fn, unpack_fn) by entity type
    ├── cache_outcome.py            CacheOutcome StrEnum
    ├── tasks/
    │   ├── __init__.py             re-exports run_* and run_task
    │   ├── task_registry.py        TaskConfig dataclass + _TASKS dict + run_task()
    │   └── tasks.py                thin run_* shims over run_task()
    └── pipelines/
        ├── __init__.py             triggers self-registration on import
        ├── base.py                 EmbeddingPipeline dataclass + make_pipeline()
        ├── resume_pipeline.py      resume task factory + result keys + register
        └── job_pipeline.py         job task factory + result keys + register
```

---

## Mental Model

There are four layers. Each one knows nothing about the layers above it.

```
orchestrator
    └── pipeline_registry       looks up (build_fn, unpack_fn) by entity type
            └── pipelines/      defines what tasks run + how to unpack results
                    └── tasks/  wraps embedding_utils with metrics + cache outcomes
```

**Adding a new pipeline (e.g. scoring) touches exactly two things:**
1. Create `pipelines/scoring_pipeline.py` with a `_task_factory`, `_PIPELINE`, and `register()` call
2. Add one import line to `pipelines/__init__.py`

Nothing else changes.

---

## Data Flow

```
extract_embeddings_parallel(entity_type, entity_id, **kwargs)
    │
    ├── pipeline_registry.get(entity_type)
    │       → (build_fn, unpack_fn)
    │
    ├── build_fn(**kwargs, run=run)
    │       → { section_key: callable, ... }
    │
    ├── run_pipeline(tasks, entity_type, entity_id)
    │       → ThreadPoolExecutor runs all tasks concurrently
    │       → { section_key: raw_result, ... }
    │
    └── unpack_fn(raw)
            → typed embeddings dict returned to caller
```

---

## Task Config

Each embedding section is declared as a `TaskConfig` entry in `tasks/task_registry.py`:

```python
"jobTitle": TaskConfig(
    doc_key      = "jobTitle",
    extract_fn   = extract_job_title_embedding,
    return_shape = "single",       # (Tensor, Optional[str])
    outcome_fn   = _single_outcome,
    extra_keys   = ["job_title_doc"],
),
```

`run_task()` handles the full execution pattern for every section:
- read doc value → skip if empty → call extract_fn → record CacheOutcome → return result

**Adding a new section** = one new `TaskConfig` entry. No new function needed.

---

## Cache Outcomes

Defined in `cache_outcome.py` as a `StrEnum`:

| Outcome | Meaning |
|---|---|
| `hit` | Embedding loaded from pre-fetched doc, no model call |
| `miss` | Entity absent from pre-fetched docs, model called |
| `null_backfill` | Doc exists but embedding was null, model called — caller writes vector back to DB |
| `skipped` | Section absent from document, nothing to compute |

---

## Return Shapes

Tasks return one of three shapes declared in `TaskConfig.return_shape`:

| Shape | Type | Used by |
|---|---|---|
| `plain` | `Optional[Tensor]` | certifications, requirements, experienceLevel, workExperience |
| `skills` | `(Tensor, list[str], list[Tensor])` | skills |
| `single` | `(Tensor, Optional[str])` | jobTitle, location |

The `single` and `skills` shapes carry backfill metadata so Node can write new vectors back to the DB.

---

## Public API

```python
from infrastructure.embeddings.orchestrator import extract_embeddings_parallel

# Resume
result = extract_embeddings_parallel(
    entity_type                = "resume",
    entity_id                  = resume_id,
    resume                     = resume,
    skill_docs                 = skill_docs,
    job_title_doc              = job_title_doc,
    location_doc               = location_doc,
    work_experience_title_docs = work_experience_title_docs,
)

# Job
result = extract_embeddings_parallel(
    entity_type   = "job",
    entity_id     = job_id,
    job           = job,
    skill_docs    = skill_docs,
    job_title_doc = job_title_doc,
    location_doc  = location_doc,
)
```