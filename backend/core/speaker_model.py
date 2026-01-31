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
        Returns: List[float] of length EMBEDDING_DIM
        """

        # 1️⃣ numpy → torch (shape: [1, T])
        wav = torch.tensor(audio_np, dtype=torch.float32).unsqueeze(0)

        # 2️⃣ SpeechBrain embedding (shape: [1, 1, D] or [1, D])
        with torch.no_grad():
            emb = self.model.encode_batch(wav)

        # 3️⃣ FORCE 1-D vector
        emb = emb.squeeze()          # removes batch dims
        emb = emb.cpu().numpy()      # numpy array (D,)

        # 4️⃣ Convert to pure Python list of floats
        return emb.astype(float).tolist()
