# ── Response wrapper ───────────────────────────────────────────────────────────
# All main.py functions return either:
#   { "error": "something went wrong" }   ← on failure
#   { "resume_id": ..., "embeddings": ... } ← on success
#
# This normalizes both into the shape Node expects:
#   { "data": <result>, "error": null }   ← success
#   { "data": null, "error": "message" }  ← failure
#
# Node's aiClient.ts checks for res.data.error and throws if present.
def wrap(result: dict) -> dict:
    if "error" in result:
        return { "data": None, "error": result["error"] }
    return { "data": result, "error": None }