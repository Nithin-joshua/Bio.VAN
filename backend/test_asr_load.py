import os
import sys

# Setup paths for local imports
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from core.challenge import verify_challenge, get_asr_model
import numpy as np
import scipy.io.wavfile as wavfile
import librosa

def create_test_wav(filename):
    # Create 3 seconds of 440Hz sine wave (not speech, just to see if it loads)
    # but Vosk requires speech to output something. Let's just create an empty valid wav file
    # or better, just check if the model loads correctly.
    print("Loading ASR model...")
    model = get_asr_model()
    if model is None:
        print("MODEL FAILED TO LOAD.")
    else:
        print("Model loaded successfully.")

if __name__ == "__main__":
    create_test_wav("test_audio.wav")
