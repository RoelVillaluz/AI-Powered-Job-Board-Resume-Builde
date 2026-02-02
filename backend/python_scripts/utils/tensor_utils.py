"""Utilities for tensor operations."""
import torch
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def safe_mean_embedding(embeddings: Optional[torch.Tensor]) -> Optional[torch.Tensor]:
    """
    Safely compute mean of embeddings tensor.

    Args:
        embeddings: Tensor of embeddings with shape (N, D) or None

    Returns:
        Mean embedding tensor with shape (D,), detached and on CPU, or None

    Examples:
        Success:
            >>> embs = torch.tensor([
            ...     [1.0, 2.0, 3.0],
            ...     [4.0, 5.0, 6.0]
            ... ])
            >>> safe_mean_embedding(embs)
            tensor([2.5000, 3.5000, 4.5000])

        Failure (None input):
            >>> safe_mean_embedding(None)
            None

        Failure (empty tensor):
            >>> safe_mean_embedding(torch.empty(0))
            None
    """
    if embeddings is None:
        return None
    
    try:
        if embeddings.numel() == 0:
            return None
        
        mean_emb = torch.mean(embeddings, dim=0)
        return mean_emb.detach().cpu()
    except Exception as e:
        logger.error(f"Error computing mean embedding: {e}")
        return None
    

def stack_embeddings(embedding_list: list[torch.Tensor]) -> Optional[torch.Tensor]:
    """
    Stack list of embeddings into a single tensor.

    Args:
        embedding_list: List of embedding tensors with the same shape

    Returns:
        Stacked tensor with shape (N, D) or None if list is empty or invalid

    Examples:
        Success:
            >>> e1 = torch.tensor([1.0, 2.0, 3.0])
            >>> e2 = torch.tensor([4.0, 5.0, 6.0])
            >>> stack_embeddings([e1, e2])
            tensor([[1., 2., 3.],
                    [4., 5., 6.]])

        Ignores None values:
            >>> stack_embeddings([e1, None, e2]).shape
            torch.Size([2, 3])

        Failure (empty list):
            >>> stack_embeddings([])
            None

        Failure (all None):
            >>> stack_embeddings([None, None])
            None
    """
    if not embedding_list:
        return None
    
    try:
        valid_embeddings = [emb for emb in embedding_list if emb is not None]

        if not valid_embeddings:
            return None
        
        # ✅ Should validate shapes match
        if not all(emb.shape == valid_embeddings[0].shape for emb in valid_embeddings):
            logger.error("Embedding shapes don't match")
            return None
        
        return torch.stack(valid_embeddings)
    except Exception as e:
        logger.error(f"Error stacking embeddings: {e}")
        return None
    

def tensor_to_list(tensor: Optional[torch.Tensor]) -> Optional[list]:
    """
    Convert tensor to Python list for JSON serialization.

    Args:
        tensor: PyTorch tensor or None

    Returns:
        Python list representation of the tensor or None

    Examples:
        Success (1D tensor):
            >>> t = torch.tensor([1.0, 2.0, 3.0])
            >>> tensor_to_list(t)
            [1.0, 2.0, 3.0]

        Success (2D tensor):
            >>> t = torch.tensor([[1, 2], [3, 4]])
            >>> tensor_to_list(t)
            [[1, 2], [3, 4]]

        Failure (None input):
            >>> tensor_to_list(None)
            None
    """
    if tensor is None:
        return None
    
    try:
        return tensor.detach().cpu().numpy().tolist()
    except Exception as e:
        logger.error(f"Error converting tensor to list: {e}")
        return None
