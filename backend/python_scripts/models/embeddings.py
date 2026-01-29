"""Embedding model management."""
import torch
from sentence_transformers import SentenceTransformer
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

class EmbeddingModel:
    """Manages sentence embedding model as a singleton."""

    _instance: Optional['EmbeddingModel'] = None  # type hint only
    _model: Optional[SentenceTransformer] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, model_name: str = 'all-mpnet-base-v2'):
        if self._model is None:
            logger.info(f"Loading embedding model: {model_name}")
            self._model = SentenceTransformer(model_name)

    def encode(self, text: str) -> Optional[torch.Tensor]:
        if not text or not isinstance(text, str):
            logger.warning(f"Invalid text input: {text}")
            return None

        try:
            embedding = self._model.encode(text, convert_to_numpy=True)
            return torch.tensor(embedding, dtype=torch.float32)
        except Exception as e:
            logger.error(f"Error generating embedding for text: {e}")
            return None
        
    def encode_batch(self, texts: List[str]) -> Optional[torch.Tensor]:
        if not texts:
            return None
        
        try:
            embeddings = [emb for emb in (self.encode(t) for t in texts) if emb is not None]
            return torch.stack(embeddings) if embeddings else None
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            return None

# Singleton instance
embedding_model = EmbeddingModel()
