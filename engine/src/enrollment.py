import os
import numpy as np
from typing import List

from core.validation import validate_audio
from core.embedding import extract_embedding
from src.utils.audio_loader import load_audio


def enroll_speaker(
    speaker_id: str,
    audio_files: List[str],
    output_dir: str = "models"
):
    """
    Enroll a speaker by averaging embeddings from multiple audio samples.

    - Uses shared ECAPA-TDNN model
    - Enforces validation rules
    - Stores ONLY normalized embeddings (.npy)
    """

    if len(audio_files) == 0:
        raise ValueError("No audio files provided for enrollment")

    embeddings = []

    for audio_path in audio_files:
        signal, sr = load_audio(audio_path)
        validate_audio(signal, sr)

        emb = extract_embedding(signal)
        embeddings.append(emb)

    # Aggregate embeddings (mean pooling)
    speaker_template = np.mean(embeddings, axis=0)

    # Safety normalization (again, on aggregate)
    norm = np.linalg.norm(speaker_template)
    if norm == 0 or np.isnan(norm):
        raise ValueError("Invalid aggregated embedding")

    speaker_template = speaker_template / norm

    # Persist template
    os.makedirs(output_dir, exist_ok=True)
    template_path = os.path.join(output_dir, f"{speaker_id}.npy")
    np.save(template_path, speaker_template)

    return {
        "speaker_id": speaker_id,
        "num_samples": len(audio_files),
        "template_path": template_path
    }
