# core/similarity.py

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def compute_similarity(emb1, emb2):
    return float(cosine_similarity([emb1], [emb2])[0][0])
