# main.py

from src.core_engine import VoiceAuthEngine
import logging
logging.getLogger("speechbrain").setLevel(logging.WARNING)

if __name__ == "__main__":
    engine = VoiceAuthEngine()

    result = engine.verify(
        "speaker1.wav",
        "speaker2.wav"
    )

    print("VERIFIED" if result else "REJECTED")
