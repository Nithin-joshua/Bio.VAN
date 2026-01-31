# core/embedding.py

import numpy as np
import torch
from core.model import get_verifier


def extract_embedding(signal: np.ndarray) -> np.ndarray:
    verifier = get_verifier()

    with torch.no_grad():
        tensor = torch.from_numpy(signal).float().unsqueeze(0)
        embedding = verifier.encode_batch(tensor)
        embedding = embedding.squeeze().cpu().numpy()

    norm = np.linalg.norm(embedding)
    if norm == 0 or np.isnan(norm):
        raise ValueError("Invalid embedding norm detected")

    return embedding / norm
