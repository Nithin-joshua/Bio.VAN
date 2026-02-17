import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from core.challenge import get_asr_model


def main():
    model = get_asr_model()
    if model is None:
        print("Vosk ASR model is NOT available (get_asr_model() returned None).")
    else:
        print("Vosk ASR model loaded successfully.")


if __name__ == "__main__":
    main()

