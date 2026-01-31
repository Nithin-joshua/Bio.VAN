# core/verification.py

import numpy as np


def compare_embeddings(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """
    Compute cosine similarity between two normalized NumPy embeddings.
    """
    if emb1.shape != emb2.shape:
        raise ValueError("Embedding shape mismatch")

    # Cosine similarity (safe because embeddings are normalized)
    return float(np.dot(emb1, emb2))
