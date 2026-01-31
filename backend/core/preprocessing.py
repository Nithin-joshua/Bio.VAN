import librosa
from config.settings import SAMPLE_RATE

def load_audio(file_path):
    audio, _ = librosa.load(file_path, sr=SAMPLE_RATE, mono=True)
    return audio
