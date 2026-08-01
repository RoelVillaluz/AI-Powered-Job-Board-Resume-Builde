# Gemini Domain Package (`gemini/`)

Cohesive package owning the entire Gemini call path for the match-insight
feature: the client call and the two pipeline stages adjacent to it (prompt
construction, output validation). Nothing here touches the database — the
handler receives prepared resume + match data and returns a prose string.

---

## What each file does

| File | Role |
|---|---|
| `gemini_client.py` | Thin wrapper around the `google-genai` SDK. Lazy singleton client; primary model `gemini-2.5-flash` with one fallback retry on `gemini-2.5-flash-lite` for 429 / RESOURCE_EXHAUSTED; returns `response.text or ""`. Forces `thinking_budget=0` so hidden reasoning tokens cannot silently consume the output budget. |
| `match_context_builder.py` | Builds the prompt context from the resume and the single scored match. Every untrusted value passes through `_sanitize()` (strips `\r\n\t`, caps at 48 chars) and `_delimit()` (wrapped in XML-style tags such as `<skill>…</skill>`). Only the resume's skills + experience level reach the prompt — name/contact fields are never part of this payload. |
| `response_validator.py` | Single source of truth for the output heuristics, imported by BOTH the handler and the test suite (never reimplemented in a test). `response_is_properly_structured()` enforces the 4-part shape (X/100 score, verdict, gap, length ≥ 20); `response_leaks_instructions()` flags leaked system-prompt/role text. |

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
producing a bad answer, `response_validator.py` + the handler reject it:
validate → if invalid, retry **once** with a directive prompt → if still
invalid, return a structured data-driven fallback (`_build_structured_fallback`)
carrying the real score, fit tier, and top gap from the match data — never raw
malformed output.

Runtime flow (`handlers/match_insight_handler.py`):

```
build_match_context(resume, matches)
  → generate(prompt, system_instruction)
  → _is_valid(answer)?                # structured && not leaking
      ├─ yes → return { answer, jobId }
      └─ no  → retry once with DIRECTIVE_RETRY_INSTRUCTION
                → _is_valid? → return
                └─ no → return _build_structured_fallback(matches)
```

---

## Public API

```python
from gemini.match_context_builder import build_match_context
from gemini.gemini_client import generate
from gemini.response_validator import (
    response_is_properly_structured,
    response_leaks_instructions,
)
```

`response_validator` is the shared contract: `tests/gemini/conftest.py`
re-exports it for the suite (never redefines), and the handler imports it
directly — change a heuristic here, never in a test.

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
