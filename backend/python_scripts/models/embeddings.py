"""Embedding model management."""
import torch
from sentence_transformers import SentenceTransformer
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmbeddingModel:
    """Manages sentence embedding model."""

    _instance = Optional['EmbeddingModel'] = None
    _model = Optional[SentenceTransformer] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, model_name: str = 'all-mpnet-base-v2'):
        if self._model is None:
            logger.info(f"Loading embedding model: {model_name}")
            self._model = SentenceTransformer(model_name)

    def encode(self, text: str) -> Optional[torch.Tensor]:
        """
            Generate embedding for text

            Args:
                text: Input text string

            Returns:
                Pytorch tensor of the embedding or None if encoding fails

            Examples:
                Success:
                    >>> model = EmbeddingModel()
                    >>> embedding = model.encode("Python")
                    >>> embedding.shape
                    torch.Size([768])
                    >>> embedding.dtype
                    torch.float32

                Failure (invalid input):
                    >>> model.encode("")
                    None

                    >>> model.encode(None)
                    None
        """
        if not text or not isinstance(text, str):
            logger.warning(f"Invalid text input: {text}")

        try:
            embedding = self._model.encode(text, convert_to_numpy=True)
            return torch.tensor(embedding, dtype=torch.float32)
        except Exception as e:
            logger.error(f"Error generating embedding for text: {e}")
            return None
        
    def encode_batch(self, texts: list[str]) -> Optional[torch.Tensor]:
        """
            Generate embeddings for multiple texts

            Args:
                texts: List of text strings

            Returns:
                Stacked tensor of embeddings or None if encoding fails

            Examples:
                Success:
                    >>> model = EmbeddingModel()
                    >>> texts = ["Python", "Javascript, "SQL"]
                    >>> embeddings = model.encode_batch(texts)
                    >>> embeddings.shape
                    torch.Size([3, 768])

                Failure (empty list):
                    >>> model.encode_batch([])
                    None

                Failure (invalid input):
                    >>> model.encode_batch(None)
                    None
        """
        if not texts:
            return None
        
        try:
            embeddings = []
            for text in texts:
                emb = self.encode(text)
                if emb is not None:
                    embeddings.append(emb)

            return torch.stack(embeddings) if embeddings else None
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            return None
        
# Singleton instance
embedding_model = EmbeddingModel()