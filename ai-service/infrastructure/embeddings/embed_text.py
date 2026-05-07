from models.embeddings import embedding_model

def embed_text(text: str) -> list[float]:
    embedding = embedding_model.encode(text)
    return embedding.detach().cpu().tolist()