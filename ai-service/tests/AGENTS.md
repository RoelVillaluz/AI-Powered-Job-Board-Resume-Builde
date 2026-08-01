# AGENTS.md — ai-service/tests

Cross-cutting rules for the ai-service test suite. Search before duplicating a
helper — the suite is deliberately shared, not copy-pasted.

## Layout

Tests are grouped by domain into subdirectories:

| Path | Covers |
|---|---|
| `scoring/` | `services/scoring_service.py` suites (one file per concern) |
| `salary/` | salary prediction (`salary_intelligence/`) |
| `gemini/` | Gemini RAG pipeline (`handlers/match_insight_handler.py`) |
| `test_service_auth.py` | HTTP auth on `/compute` endpoints (cross-cutting, stays at root) |
| `conftest.py` | `pytest_plugins` registration only |

Before writing ANY test: find the existing suite covering the same module and
reuse its fixtures/helpers. Never duplicate a validation heuristic or fixture
definition that already exists.

## Fixtures

Shared fixtures live in `ai-service/fixtures/` and are registered via
`pytest_plugins` in `conftest.py`:

- `fixtures.resume_fixtures` — `resume_full`, `resume_sparse`, `resume_no_skills`
- `fixtures.job_title_fixtures` — `full_stack_title`, `devops_title`, `ml_engineer_title`, `cloud_engineer_title`
- `fixtures.skill_fixtures` — `skill_market_data`
- `fixtures.scoring_payload_fixtures` — `scoring_payload_full_stack`

Never define a fixture inside a test file when a shared one exists — add it to
the `fixtures/` package instead. Per-domain `conftest.py` files hold shared
plain functions. Import helpers with the explicit package path
(`from tests.<domain>.conftest import ...`) — bare `from conftest import ...`
collides when multiple test directories are collected in one run, since each
`conftest.py` resolves to the same top-level module name (`pytest.ini` uses
`importmode = importlib`).

## Running

From `ai-service/`:

```
python -m pytest                          # full suite
python -m pytest tests/scoring/           # one domain
python -m pytest -v -s --log-cli-level=INFO tests/scoring/   # scoring logs
```

## Known failing tests (do NOT "fix" by deleting)

Baseline (July 2026): **22 passed / 11 failed**. The 11 failures were
intentional vulnerability-demonstration tests — they encoded the DESIRED fixed
behavior and failed against the then-unpatched code:

- 9 vulnerability-demonstration tests in `tests/gemini/` (prompt injection
  passes through, no output validation, leaked instructions).
- 1 auth-gap test in `test_service_auth.py` (no auth on `/compute`).
- 1 salary API-drift test in `tests/salary/` (`predict()` now requires
  `resume_score`).

Current (Aug 2026): **33 passed / 0 failed**. The pipeline fixes landed:

- `tests/gemini/` — output validation lives in
  `gemini/response_validator.py`; the handler validates, retries once with a
  directive prompt, then returns a structured data-driven fallback. Prompt
  injection is hardened via XML-style delimiters + truncation in
  `gemini/match_context_builder.py`.
- `test_service_auth.py` — every `/compute` router requires
  `X-Internal-Service-Key` (env `AI_SERVICE_SHARED_SECRET`); `/health` and
  `/metrics` stay public.
- `tests/salary/` — the smoke test now passes `resume_score` into `predict()`.

Treat these as regression tests: if they fail again, the pipeline regressed —
fix the pipeline, not the assertions. A reorg that changes these counts has
broken something.

---

## Domain: scoring (`tests/scoring/`)

Tests for `services/scoring_service.py`. One file per concern, split along the
original test-class boundaries:

| File | Concern |
|---|---|
| `test_completeness.py` | `calculate_completeness_score` (8-section fill, 0–100) |
| `test_experience.py` | `calculate_experience_score` (linear to target, capped at 100) |
| `test_skills.py` | `calculate_skills_score` (vs `currentTitle.topSkills`, weighted) |
| `test_career_progression.py` | `calculate_career_progression_score` (bonus, salary-delta weighted, capped) |
| `test_resume_score.py` | `calculate_resume_score` integration + grade |
| `test_industry_coherence.py` | adversarial unrelated-industry scoring |

**Shared helpers** — logging helpers (`log_header`, `log_score`, `log_compare`,
`log_assert`) are defined ONCE in `tests/scoring/conftest.py`; import them,
never redefine: `from tests.scoring.conftest import log_header, log_score`.
Fixtures come from the shared `fixtures/` package — never redefine them here.

**Fixture set:**

| Fixture | Source | Used by |
|---|---|---|
| `resume_full` | fixtures/resume_fixtures.py | completeness, skills, progression, resume_score |
| `resume_sparse` | fixtures/resume_fixtures.py | completeness |
| `resume_no_skills` | fixtures/resume_fixtures.py | skills |
| `full_stack_title` | fixtures/job_title_fixtures.py | progression, resume_score |
| `ml_engineer_title` | fixtures/job_title_fixtures.py | resume_score |
| `cloud_engineer_title` | fixtures/job_title_fixtures.py | resume_score |
| `devops_title` | fixtures/job_title_fixtures.py | defined but currently unused by scoring |
| `skill_market_data` | fixtures/skill_fixtures.py | skills, progression, resume_score |
| `scoring_payload_full_stack` | fixtures/scoring_payload_fixtures.py | skills, progression, resume_score, industry_coherence |

**Conventions** — logged-first style: each case opens with `log_header(...)`,
logs each score via `log_score(...)`, closes with `log_assert(...)`; read the
tests with `-s --log-cli-level=INFO`. `scoring_payload_full_stack` is the
canonical Full Stack payload (current title $132k; higher-paying titles ML
Engineer $182k + Cloud Engineer $152k; full skill market data). Keep one
concern per file — a new scoring concern gets its own `test_<concern>.py`.

## Domain: salary (`tests/salary/`)

Salary prediction smoke test for
`salary_intelligence.pipeline.salary_prediction_orchestrator`. Single file
`test_salary_prediction.py`, one test function `test_salary_predictions_smoke()`
iterating three scenarios (Senior Full-Stack, Entry IT, No Skills) against
Legazpi City, Albay (PH).

All scenario data is inline module constants (`EXCHANGE_RATES`, `SKILLS_FULLSTACK`,
`JOB_TITLE_DEV`, `INDUSTRY_TECH_PH`, `LOCATION_LEGAZPI`) — this domain
deliberately does NOT use the shared `fixtures/` package. The test prints the
yearly/monthly/range/confidence breakdown per scenario; pytest only
sanity-checks `predicted_yearly > 0` and `predicted_monthly > 0`.

**`resume_score` note** — `predict()` requires a `resume_score` argument (the
pipeline uses it as the primary talent signal in `TalentDeviation.apply()`).
The smoke test passes one per scenario (85 / 55 / 30). This was a stale-test
fix (commit `8bf28c36` made the signature change intentionally); keep the
argument in the call.

## Domain: gemini (`tests/gemini/`)

Tests for the Gemini RAG pipeline (`handlers/match_insight_handler.py`,
`services/match_context_builder.py`).

| File | Concern |
|---|---|
| `test_prompt_injection.py` | injection payloads never appear verbatim in context; leaked / off-structure outputs are rejected |
| `test_output_validation.py` | malformed model outputs (empty, JSON, refusal, single word, gibberish) trigger retry + structured fallback |

`tests/gemini/conftest.py` holds the ONLY copies of the shared
output-validation heuristics:

- `response_is_properly_structured(text)` — requires a `X/100` score, a
  verdict/fit mention, and a gap/improvement mention (plus non-trivial length).
  This is the unified check for the 4-part structure (verdict, strength, gap,
  next-step) the pipeline should enforce.
- `response_leaks_instructions(text)` — flags leaked system-prompt / role text.

Import them — never redefine:
`from conftest import response_is_properly_structured`. Before changing the
expected response shape, update the heuristics in `conftest.py`.

Tests mock the handler's local reference via
`patch("handlers.match_insight_handler.generate")` and invoke the handler
through `import handlers.match_insight_handler as mih_module` (module import,
not function import — the handler binds `generate` at import time).

---

If a domain grows enough that its section becomes unwieldy inside this shared
file, split it back out into its own `tests/<domain>/AGENTS.md` at that point —
not before.
