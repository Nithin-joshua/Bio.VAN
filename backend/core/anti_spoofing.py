import numpy as np
import os
import torch
import torch.nn.functional as F
try:
    from scipy.signal import welch
except ImportError:
    welch = None

from core.rawnet_model import RawNet2
# Default RawNet2 Config (matches ASVspoof baseline)
# Architecture parameters for the anti-spoofing model
RAWNET_CONFIG = {
    'nb_fil': 20,
    'first_conv': 128,
    'sample_rate': 16000,
    'min_low_hz': 50,
    'min_band_hz': 50,
    'gru_node': 1024,
    'nb_gru_layer': 3,
    'nb_fc_node': 1024,
    'nb_classes': 2  # 0: Spoof, 1: Bonafide (or vice versa depending on training)
}

class LivenessDetector:
    def __init__(self):
        self.threshold = 0.5
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.using_model = False
        
        # Load Model if weights exist
        weight_path = os.path.join("pretrained_models", "rawnet2.pth")
        abs_path = os.path.abspath(weight_path)
        print(f"DEBUG: Current CWD: {os.getcwd()}")
        print(f"DEBUG: Looking for RawNet2 weights at: {abs_path}")
        
        if os.path.exists(weight_path):
            try:
                print(f"Loading RawNet2 from {weight_path}...")
                self.model = RawNet2(RAWNET_CONFIG).to(self.device)
                
                # Load weights (handling potential key mismatches if strict=False)
                state_dict = torch.load(weight_path, map_location=self.device)
                self.model.load_state_dict(state_dict, strict=False)
                self.model.eval()
                self.using_model = True
                print("✅ RawNet2 Loaded Successfully.")
            except Exception as e:
                print(f"⚠️ Failed to load RawNet2 weights: {e}")
                print("Using heuristic fallback.")
        else:
            print(f"ℹ️ RawNet2 weights not found at {weight_path}")
            print("Using heuristic fallback.")

    def analyze(self, audio_data: np.ndarray, sample_rate: int = 16000) -> dict:
        """
        Analyze audio for liveness.
        Returns a dictionary with 'is_live' (bool) and 'score' (float).
        """
        import time
        start_time = time.time()
        if len(audio_data) == 0:
             print("DEBUG: Liveness Check Failed - Empty Audio")
             return {"is_live": False, "score": 0.0, "reason": "Empty audio"}
        
        # -------------------------
        # 1. Heuristic Pre-Checks
        # -------------------------
        # Fast, rule-based checks to catch obvious errors or low-quality attacks
        # before running the expensive deep learning model.
        
        # Energy Analysis: Catch silent or near-silent audio
        energy = np.mean(audio_data ** 2)
        print(f"DEBUG: Audio Energy: {energy}")
        if energy < 1e-6: # Lowered silence check (was 1e-5)
            print("DEBUG: Audio too silent")
            return {"is_live": False, "score": 0.0, "reason": "Audio too silent"}

        heuristic_score = 1.0
        heuristic_reason = "Pass"

        # Variance Check: Synthetic speech sometimes has unnaturally low variance
        variance = np.var(audio_data)
        print(f"DEBUG: Audio Variance: {variance}")
        if variance < 1e-5: # Lowered variance threshold (was 1e-4)
             heuristic_score -= 0.1 # Reduced penalty (was 0.2)
             heuristic_reason = "Low variance (possible synthesis)"
             print(f"DEBUG: Low Variance Detected: {variance}")

        # Frequency Check (Bass vs Treble)
        # Replayed audio often lacks high/low frequency details due to speaker limitations
        if welch:
            freqs, psd = welch(audio_data, fs=sample_rate)
            low_freq_energy = np.sum(psd[(freqs < 300)])
            high_freq_energy = np.sum(psd[(freqs > 3000)])
            
            # Prevent division by zero
            if low_freq_energy == 0:
                ratio = 0
            else:
                ratio = high_freq_energy / low_freq_energy
                
            print(f"DEBUG: Freq Analysis - Low: {low_freq_energy:.6f}, High: {high_freq_energy:.6f}, Ratio: {ratio:.6f}")
            
            if ratio < 0.001: # Lowered high freq requirement (was 0.01)
                heuristic_score -= 0.2 # Reduced penalty (was 0.3)
                heuristic_reason = "Muffled Audio (possible replay)"
                print("DEBUG: Muffled Audio Detected")

        # -------------------------
        # 2. RawNet2 Analysis
        # -------------------------
        model_score = 0.0
        model_confidence = 0.0
        
        if self.using_model:
            try:
                # Prepare Tensor [Batch=1, Seq_Len]
                # RawNet2 expects fixed length input (usually ~4s = 64000 samples)
                # If too short, pad; if too long, truncate.
                max_len = 64000
                if len(audio_data) < max_len:
                    # Pad with zeros (silence)
                    pad_width = max_len - len(audio_data)
                    audio_data = np.pad(audio_data, (0, pad_width), mode='wrap')
                else:
                    # Truncate to first 4 seconds
                    audio_data = audio_data[:max_len]
                
                tensor_wav = torch.tensor(audio_data, dtype=torch.float32).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    # Output: [1, 2] -> logits
                    out = self.model(tensor_wav)
                    probs = F.softmax(out, dim=1)
                    
                    # Assuming Index 1 is Bonafide (Real), Index 0 is Spoof
                    # This depends on specific training label mapping. 
                    # Standard ASVspoof: 0=spoof, 1=bonafide usually.
                    bonafide_prob = probs[0][1].item()
                    
                    model_score = bonafide_prob
                    model_confidence = 1.0 # High confidence we have a model result
                    print(f"DEBUG: RawNet2 Bonafide Probability: {bonafide_prob:.4f}")
            except Exception as e:
                print(f"Error running RawNet2 inference: {e}")
                self.using_model = False # Fallback to heuristic for this call
        
        # -------------------------
        # 3. Ensemble Scoring
        # -------------------------
        
        final_score = 0.0
        final_reason = ""
        
        if self.using_model:
            # Weighted Ensemble: 80% Model, 20% Heuristics
            # The Deep Learning model is the primary authority, but heuristics act as a sanity check.
            final_score = (model_score * 0.8) + (heuristic_score * 0.2)
            
            # Critical Failure Overrides
            # If model says definitely fake (< 0.1), fail immediately regardless of heuristics
            if model_score < 0.1:
                final_score = model_score
                final_reason = "AI Clone Detected (RawNet2)"
            elif heuristic_score < 0.5: # Lowered (was 0.6)
                final_reason = f"Signal Artifacts Detected ({heuristic_reason})"
            else:
                final_reason = "Human Live"
        else:
            final_score = heuristic_score
            final_reason = heuristic_reason + " (Heuristic Only)"

        # Lowered passing threshold (was 0.60)
        is_live = final_score > 0.55
        
        end_time = time.time()
        print(f"DEBUG: Final Liveness Score: {final_score:.4f} (Threshold: 0.55) -> {is_live}. Time: {end_time - start_time:.4f}s")

        return {
            "is_live": is_live,
            "score": round(final_score, 3),
            "reason": final_reason,
            "method": "RawNet2+Heuristic" if self.using_model else "Heuristic"
        }

# Global instance
liveness_detector = LivenessDetector()
