"""Gemini domain package.

Owns the entire Gemini call path: the client call (``gemini_client.py``) and
the pipeline stages adjacent to it — prompt construction
(``match_context_builder.py``), output validation (``response_validator.py``),
and the shared match-insight orchestration (``match_insight_engine.py``:
system prompts, prompt builder, fallback builder, and the async
``stream_match_insight`` NDJSON generator). Pipeline stages live here, not in
``services/`` or ``handlers/`` (see the boundary rules in ai-service/AGENTS.md).
"""
