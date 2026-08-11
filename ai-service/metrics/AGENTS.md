# AGENTS.md — AI Service Metrics (prometheus_client)

Metric objects are defined in `prometheus_metrics.py` — **definitions only**, no instrumentation logic, no imports from other app modules. Recorders live in `embedding_metrics.py` and `gemini_metrics.py` as defensive `record_*` helpers (observability must never break a handler). `__init__.py` re-exports every object; import them as `from metrics import matching_score_tiers_total`.

## Naming

- snake_case throughout — variable, label, and Prometheus name.
- `aiservice_` prefix + pipeline noun + type suffix:
  - Counters end `_total`: `aiservice_matching_requests_total`, `aiservice_matching_score_tiers_total`, `aiservice_gemini_tokens_total`
  - Histograms end `_seconds` (duration) or describe the distribution: `aiservice_gemini_request_duration_seconds`, `aiservice_matching_candidates_scored`
  - Gauges describe state: `aiservice_model_loaded`
- The suffix shape (`_total` / `_seconds` / distribution noun) must match the type — Prometheus relies on it.

## Type Selection (as used here)

| Type | Use when | Real examples |
|---|---|---|
| **Counter** | Events that only ever increase; query with `rate()`/`sum()` | `embedding_requests_total`, `embedding_cache_hits_total`, `matching_requests_total`, `matching_score_tiers_total`, `gemini_requests_total`, `gemini_tokens_total`, `gemini_model_fallback_total`, `salary_prediction_requests_total`, `handler_requests_total` |
| **Histogram** | Distributions — latency or sizes | `embedding_duration_seconds`, `embedding_section_duration_seconds`, `matching_duration_seconds`, `matching_candidates_scored`, `gemini_request_duration_seconds`, `handler_duration_seconds` |
| **Gauge** | A value that goes up AND down | `model_loaded` (1 when the model is warm, 0 otherwise) |

Rule of thumb: "how many times did X happen?" → Counter. "how long / what spread?" → Histogram. "what's it at right now?" → Gauge.

## Labeling

- Outcome: `status: 'success' | 'error' | 'validation_failed'` (`gemini_requests_total`); bare `status` on `scoring_requests_total`, `matching_requests_total`, `salary_prediction_requests_total`.
- Tier verdict: `tier: 'Best Fit' | 'Good Fit' | 'Stretch' | 'Poor Fit'` (`matching_score_tiers_total`) — mirrors the backend's `recommendation_type` label.
- Entity / section: `entity: 'resume' | 'job'`, `section: 'skills' | 'workExperience' | ...` (embedding metrics).
- Token accounting: `token_type: 'prompt' | 'completion'` (`gemini_tokens_total`).
- Model: the literal model string (`gemini-2.5-flash` / `gemini-2.5-flash-lite`).
- **Low cardinality only.** Never include resume/job/user ids.

## Adding a Metric

1. Grep `prometheus_metrics.py` and `__init__.py` first — something similar may already exist (e.g. `handler_requests_total` already counts requests per handler generically; don't shadow it with a per-feature request counter unless it needs different labels).
2. Define the object in `prometheus_metrics.py`, grouped under its pipeline section (Embedding / Scoring / Matching / Gemini / Salary / Model health / Handler).
3. Re-export it from `__init__.py` — this is the public import surface.
4. Record through a `record_*` helper in the matching recorder module (`embedding_metrics.py` for embeddings, `gemini_metrics.py` for Gemini) — defensively, swallowing any error.
5. Label names in the recorder MUST match `labelnames` exactly — prometheus_client raises on unknown or missing labels.

## Instrumentation Points

- `gemini/gemini_client.py` — `generate()` records duration, tokens, request outcome, and fallback (`record_model_fallback` on 429).
- `handlers/match_insight_handler.py` — `record_generate_request(GEMINI_MODEL, "validation_failed")` on rejected output.
