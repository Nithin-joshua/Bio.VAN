import os
import librosa

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

AUDIO_DIR = os.path.join(PROJECT_ROOT, "audio_samples")

TARGET_SAMPLE_RATE = 16000

def load_audio(filename: str):
    path = os.path.join(AUDIO_DIR, filename)

    if not os.path.exists(path):
        raise FileNotFoundError(f"Audio file not found: {path}")

    # Always load and resample to 16kHz
    signal, sr = librosa.load(
        path,
        sr=TARGET_SAMPLE_RATE,   
        mono=True
    )

    return signal, TARGET_SAMPLE_RATE
