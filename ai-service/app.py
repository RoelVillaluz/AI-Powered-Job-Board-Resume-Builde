import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from transformers import logging as hf_logging
from routers.embeddings import router as embeddings_router
from routers.health import router as health_router
from dotenv import load_dotenv

load_dotenv('.env.dev')  # load before anything else imports config

# ── Logging setup ──────────────────────────────────────────────────────────────
# Same as main.py — stderr so it doesn't pollute HTTP responses
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)],
)
hf_logging.set_verbosity_error()
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────────
# FastAPI equivalent of Node's app.listen() callback.
# Code BEFORE yield runs at startup, code AFTER yield runs at shutdown.
# This is where we solve the cold start problem — model loads once here,
# stays in memory for every request that follows.
#
# Why @asynccontextmanager?
# FastAPI's lifespan expects an async context manager.
# asynccontextmanager turns a generator function into one.
# The yield is the "running" state — FastAPI serves requests between
# startup (above yield) and shutdown (below yield).
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info('[FASTAPI] Starting up - loading embedding model')

    # Importing the module triggers EmbeddingModel() at module level.
    # Since EmbeddingModel is a singleton, this is the one and only load.
    # Every subsequent request uses the already-loaded model from memory.
    from models.embeddings import embedding_model
    logger.info('[FASTAPI] Model loaded and warm - ready to serve')

    yield  # ← server is live and serving requests from here

    logger.info("[FASTAPI] Shutting down")

# ── App instance ───────────────────────────────────────────────────────────────
# FastAPI() is like express() in Node.
# lifespan= wires up our startup/shutdown handler above.
app = FastAPI(
    title="AI Service",
    version="2.0.0",
    lifespan=lifespan,
)

app.include_router(embeddings_router)
app.include_router(health_router)