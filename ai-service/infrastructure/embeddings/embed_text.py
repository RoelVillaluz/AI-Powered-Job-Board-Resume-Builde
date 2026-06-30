from models.embeddings import embedding_model


def embed_text(text: str) -> list[float]:
    embedding = embedding_model.encode(text)
    if embedding is None:
        raise ValueError(f"Failed to generate embedding for text: {text!r}")
    return embedding.detach().cpu().tolist()