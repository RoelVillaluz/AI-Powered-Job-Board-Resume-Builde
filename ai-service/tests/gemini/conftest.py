"""
tests/gemini/conftest.py — shared output-validation heuristics for the
Gemini RAG pipeline tests.

These import the REAL production validators from
gemini/response_validator.py. The handler and the tests use the SAME
functions — before changing the expected response structure, update the
heuristics in gemini/response_validator.py, not here.
"""

from gemini.response_validator import (
    response_is_properly_structured,
    response_leaks_instructions,
)
