# core/decision.py

def decision_from_score(score: float, threshold: float) -> bool:
    return score >= threshold
