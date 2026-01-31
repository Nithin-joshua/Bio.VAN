import numpy as np
import os
try:
    from scipy.signal import welch
except ImportError:
    welch = None

class LivenessDetector:
    def __init__(self):
        self.threshold = 0.5

    def analyze(self, audio_data: np.ndarray, sample_rate: int = 16000) -> dict:
        """
        Analyze audio for liveness.
        Returns a dictionary with 'is_live' (bool) and 'score' (float).
        """
        if len(audio_data) == 0:
             return {"is_live": False, "score": 0.0, "reason": "Empty audio"}

        # 1. Energy Analysis
        energy = np.mean(audio_data ** 2)
        if energy < 1e-5: # Silence check
            return {"is_live": False, "score": 0.0, "reason": "Audio too silent"}

        # 2. Spectral Analysis (Simple Heuristic for now)
        # Real liveness detection needs a trained Deepfake detection model (e.g. RawNet2).
        # Here we implement a placeholder check for 'Spectral Flatness' logic if scipy is available
        # or simple variance check.
        
        score = 1.0
        reason = "Pass"

        # Heuristic: Synthetic speech sometimes has lower variance in energy compared to natural speech
        # (Very simplified assumption)
        variance = np.var(audio_data)
        if variance < 1e-4:
             score -= 0.2
             reason = "Low variance (possible synthesis)"

        # Heuristic: Check significant frequency content
        # (Replay often loses high freq)
        if welch:
            freqs, psd = welch(audio_data, fs=sample_rate)
            # Check energy < 300Hz (Bass) vs > 3000Hz (Treble)
            low_freq_energy = np.sum(psd[(freqs < 300)])
            high_freq_energy = np.sum(psd[(freqs > 3000)])
            
            if high_freq_energy < (low_freq_energy * 0.01): # Arbitrary heuristic
                score -= 0.3
                reason = "Muffled Audio (possible replay)"

        is_live = score > 0.7

        return {
            "is_live": is_live,
            "score": round(score, 3),
            "reason": reason
        }

# Global instance
liveness_detector = LivenessDetector()
