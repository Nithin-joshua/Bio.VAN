
import sys
import os
import numpy as np

# Adjust path to find backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.anti_spoofing import liveness_detector
# We use librosa directly here to match preprocessing.py behavior if we can import it, 
# else we mock it or use wavfile.
import librosa

def test_liveness():
    sample_path = "n:/PGM/Bio.VAN/voice_auth_project/audio_samples/speaker1.wav"
    
    if not os.path.exists(sample_path):
        print(f"Sample not found: {sample_path}")
        # Try to find any wav
        return

    print(f"Testing liveness on: {sample_path}")
    audio, sr = librosa.load(sample_path, sr=16000, mono=True)
    
    result = liveness_detector.analyze(audio, sr)
    print("Result:", result)
    
    # Test silence
    print("\nTesting Silence:")
    silence = np.zeros(16000)
    res_silence = liveness_detector.analyze(silence)
    print("Silence Result:", res_silence)

    # Test White Noise (should be high variance)
    print("\nTesting White Noise:")
    noise = np.random.normal(0, 0.1, 16000)
    res_noise = liveness_detector.analyze(noise)
    print("Noise Result:", res_noise)

if __name__ == "__main__":
    try:
        test_liveness()
    except Exception as e:
        print(f"Error: {e}")
