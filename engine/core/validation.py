# core/validation.py

import numpy as np
from core.config import SAMPLE_RATE, MIN_DURATION_SEC


def validate_audio(signal: np.ndarray, sr: int):
    if sr != SAMPLE_RATE:
        raise ValueError("Sample rate must be 16kHz")

    if signal.ndim != 1:
        raise ValueError("Audio must be mono")

    if np.isnan(signal).any():
        raise ValueError("Audio contains NaN values")

    duration = len(signal) / sr
    if duration < MIN_DURATION_SEC:
        raise ValueError(
            f"Audio too short ({duration:.2f}s < {MIN_DURATION_SEC}s)"
        )
