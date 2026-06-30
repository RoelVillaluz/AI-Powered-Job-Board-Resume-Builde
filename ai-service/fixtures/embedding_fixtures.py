import pytest
import torch


@pytest.fixture
def make_embedding():
    """Factory: create a deterministic float tensor of a given size."""

    def _make(seed: int = 0, size: int = 768) -> torch.Tensor:
        torch.manual_seed(seed)
        return torch.rand(size)

    return _make


@pytest.fixture
def skill_docs_with_embeddings(make_embedding):
    """Pre-fetched skill docs — all have embeddings (cache hit path)."""
    skills = [
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "PostgreSQL",
        "Docker",
        "AWS",
        "PyTorch",
    ]
    return [
        {"_id": f"skill_{i}", "name": name, "embedding": make_embedding(i).tolist()}
        for i, name in enumerate(skills)
    ]


@pytest.fixture
def skill_docs_null_embeddings():
    """Pre-fetched skill docs — all have null embeddings (backfill path)."""
    skills = ["JavaScript", "React"]
    return [
        {"_id": f"skill_{i}", "name": name, "embedding": None}
        for i, name in enumerate(skills)
    ]


@pytest.fixture
def job_title_doc_with_embedding(make_embedding):
    return {
        "_id": "jt_001",
        "title": "Full Stack Engineer",
        "embedding": make_embedding(10).tolist(),
    }


@pytest.fixture
def job_title_doc_null_embedding():
    return {"_id": "jt_001", "title": "Full Stack Engineer", "embedding": None}


@pytest.fixture
def location_doc_with_embedding(make_embedding):
    return {
        "_id": "loc_001",
        "name": "San Francisco, CA",
        "embedding": make_embedding(20).tolist(),
    }
