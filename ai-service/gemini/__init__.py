"""Gemini domain package.

Owns the entire Gemini call path: the client call (``gemini_client.py``) and
the pipeline stages adjacent to it — prompt construction
(``match_context_builder.py``) and output validation
(``response_validator.py``). Pipeline stages live here, not in ``services/``
(see the boundary rule in ai-service/AGENTS.md).
"""
