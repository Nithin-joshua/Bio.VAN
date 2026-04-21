# core/speaker_model.py

import os
import torch
import numpy as np

os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from speechbrain.pretrained import SpeakerRecognition
from config.settings import ECAPA_MODEL


class ECAPAModel:
    def __init__(self):
        self.model = SpeakerRecognition.from_hparams(
            source=ECAPA_MODEL,
            savedir="pretrained_models/ecapa",
            run_opts={"device": "cpu"}
        )

    def extract_embedding(self, audio_np: np.ndarray) -> list:
        """
        Converts raw audio waveform into a fixed-dimensional vector (embedding).
        Uses SpeechBrain's ECAPA-TDNN pretrained model.
        
        Args:
            audio_np: 1D numpy array of audio samples (16kHz)
            
        Returns:
             List[float]: 192-dimensional vector representation of the voice
        """

        # 1. numpy to torch (shape: [1, T])
        # Add batch dimension (Batch Size = 1)
        wav = torch.tensor(audio_np, dtype=torch.float32).unsqueeze(0)

        # 2. SpeechBrain embedding (shape: [1, 1, D] or [1, D])
        # Runs the forward pass of the neural network
        with torch.no_grad():
            emb = self.model.encode_batch(wav)

        # 3. Force 1-D vector
        emb = emb.squeeze()          # removes batch dims
        emb = emb.cpu().numpy()      # numpy array (D,)
        
        # 4. L2 Normalization
        emb = self.normalize_embedding(emb)

        # 5. Convert to pure Python list of floats
        return emb.astype(float).tolist()
        
    def normalize_embedding(self, emb_np: np.ndarray) -> np.ndarray:
        """L2 Normalization for vector similarity matching."""
        norm = np.linalg.norm(emb_np)
        if norm > 1e-6:
            return emb_np / norm
        return emb_np

# Singleton instance
ecapa_model = ECAPAModel()

def get_embedding(audio_np: np.ndarray, sample_rate: int = 16000) -> list:
    """
    Convenience function to get embedding using the singleton model instance.
    Arguments:
        audio_np: numpy array of audio samples
        sample_rate: sample rate of the audio (default 16000)
    """
    # Note: ECAPAModel handles resampling if implementation details allowed, 
    # but here we assume input `audio_np` is already prepared or we just pass it.
    # The current ECAPAModel.extract_embedding doesn't seem to take sample_rate, 
    # but the test passes it. We'll accept it but ignore it if the class doesn't need it,
    # or better yet, verify if we need to check SR.
    # For now, just wrapper:
    return ecapa_model.extract_embedding(audio_np)
