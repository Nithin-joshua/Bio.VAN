
import sys
import os
import numpy as np
import librosa

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.anti_spoofing import liveness_detector


def test_liveness():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    sample_path = os.path.join(project_root, "engine", "audio_samples", "speaker1.wav")

    if not os.path.exists(sample_path):
        print(f"Sample not found: {sample_path}")
        return

    print(f"Testing liveness on: {sample_path}")
    audio, sr = librosa.load(sample_path, sr=16000, mono=True)

    result = liveness_detector.analyze(audio, sr)
    print("Result:", result)

    print("\nTesting Silence:")
    silence = np.zeros(16000)
    res_silence = liveness_detector.analyze(silence)
    print("Silence Result:", res_silence)

    print("\nTesting White Noise:")
    noise = np.random.normal(0, 0.1, 16000)
    res_noise = liveness_detector.analyze(noise)
    print("Noise Result:", res_noise)


if __name__ == "__main__":
    try:
        test_liveness()
    except Exception as e:
        print(f"Error: {e}")
