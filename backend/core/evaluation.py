import numpy as np

def calculate_eer(scores, labels):
    """
    Calculate Equal Error Rate (EER) and the optimal threshold.
    
    Args:
        scores (list or np.array): List of similarity scores (higher is better match).
        labels (list or np.array): List of ground truth labels (1 for match, 0 for non-match).
        
    Returns:
        tuple: (eer, threshold)
    """
    scores = np.array(scores)
    labels = np.array(labels)
    
    # Sort scores to iterate through thresholds
    sorted_indices = np.argsort(scores)
    scores_sorted = scores[sorted_indices]
    labels_sorted = labels[sorted_indices]
    
    # Calculate FRR and FAR for all possible thresholds
    # Threshold T:
    #   Predict 1 if score >= T
    #   Predict 0 if score < T
    
    # Efficient calculation using cumsum
    # Total positives (true matches)
    P = np.sum(labels)
    # Total negatives (impostors)
    N = len(labels) - P
    
    if P == 0 or N == 0:
        return 0.0, 0.5 # Edge case
        
    # As threshold increases (moving from left to right in sorted scores):
    # - We reject more (so False Rejections increase)
    # - We accept fewer false ones (so False Acceptances decrease)
    
    # Current False Rejections (Type II)
    # At index i, threshold is scores_sorted[i].
    # Items < index i are rejected.
    # Among rejected, sum(labels[:i]) are True Positives that got rejected.
    frrs = np.cumsum(labels_sorted) / P
    
    # Current False Acceptances (Type I)
    # Items >= index i are accepted.
    # Among accepted, sum(1-labels[i:]) are True Negatives that got accepted.
    # But easier: Total Negatives - Negatives Rejected
    # Negatives Rejected at i = (i) - sum(labels[:i]) -- wait, index i is size of set rejected
    # i is count of rejected items. sum(labels[:i]) is count of positives rejected.
    # So count of negatives rejected = i - sum(labels[:i]).
    # Remaining negatives = N - (i - sum(labels[:i])).
    # FAR = Remaining Neg / N
    
    negatives_rejected = np.arange(len(labels)) - np.cumsum(labels_sorted)
    fars = (N - negatives_rejected) / N
    
    # Find EER where FAR ~= FRR
    diffs = np.abs(fars - frrs)
    min_idx = np.argmin(diffs)
    
    eer = (fars[min_idx] + frrs[min_idx]) / 2
    threshold = scores_sorted[min_idx]
    
    return eer, threshold

def calculate_metrics(scores, labels, threshold=None):
    """
    Calculate FAR and FRR at a specific threshold.
    """
    scores = np.array(scores)
    labels = np.array(labels)
    
    if threshold is None:
        _, threshold = calculate_eer(scores, labels)
        
    predictions = (scores >= threshold).astype(int)
    
    # False Acceptances: Label 0, Pred 1
    fa = np.sum((labels == 0) & (predictions == 1))
    N = np.sum(labels == 0)
    far = fa / N if N > 0 else 0.0
    
    # False Rejections: Label 1, Pred 0
    fr = np.sum((labels == 1) & (predictions == 0))
    P = np.sum(labels == 1)
    frr = fr / P if P > 0 else 0.0
    
    return {
        "far": float(far),
        "frr": float(frr),
        "threshold": float(threshold)
    }
