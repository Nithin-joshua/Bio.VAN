
import os
import random
import string
import difflib
import json
import librosa
import numpy as np
from functools import lru_cache

from vosk import Model, KaldiRecognizer
from config.settings import VOSK_MODEL_PATH

CHALLENGE_PHRASES = [
    "The quick brown fox jumps over the lazy dog near the river bank",
    "Security protocols are now active and verification is in progress",
    "Please verify my identity using my unique voice print for access",
    "Artificial intelligence is transforming the way we secure our digital lives",
    "The sky above the port was the color of television, tuned to a dead channel",
    "Voice authentication provides a secure and seamless way to log in",
    "Delta Echo Foxtrot, authorizing access to the secure facility now",
    "System override initiated, please confirm your authorization level immediately",
    "Gamma Sector seven requires immediate voice confirmation for entry clearance",
    "Neural firewalls are shielding the core as encrypted packets traverse the grid",
    "Quantum relays hum softly while the secure uplink awaits vocal authorization",
    "Midnight protocols engage when the chrono counter reaches zero nine three seven",
    "Echo nine four seven, initiating silent handshake with the central authentication node",
    "Biometric cipher keys rotate every cycle to harden the perimeter against intrusion",
    "Solar flares disrupt the long range sensors across the outer asteroid belt",
    "The crystal structure of the sapphire reveals a hidden sequence of numbers",
    "Beyond the horizon lies a vast expanse of unmapped digital wilderness",
    "Atmospheric pressure remains stable within the primary containment vessel",
    "Subsurface currents carry ancient signals through the subterranean ocean",
    "Frequency modulation filters out the static from the distant pulsar group",
    "Gravitational waves ripple across the fabric of the local space time",
    "Obsidian shadows lengthen across the desolate plains of the frozen moon",
    "Binary stars dance in a synchronized orbit around the galactic center",
    "Magnetic storms brew in the upper atmosphere of the gas giant planet",
    "Kinetic energy transfers through the series of oscillating quartz crystals",
    "Radiant energy beams converge at the focal point of the emerald lens",
    "Synchronized pulses beat in rhythm with the heart of the central core",
    "Luminous trails mark the path of the starship through the nebula cloud",
    "Fractal patterns emerge from the complexity of the organic logic circuit",
    "Infinite loops of data circle the infinity symbol of the master database"
]

_USED_CHALLENGES = set()
_ASR_UNAVAILABLE = False


@lru_cache(maxsize=1)
def get_asr_model():
    global _ASR_UNAVAILABLE
    if _ASR_UNAVAILABLE:
        return None
    try:
        return Model(VOSK_MODEL_PATH)
    except Exception as e:
        print(f"ERROR: Failed to load Vosk model: {e}")
        _ASR_UNAVAILABLE = True
        return None


def _generate_unique_phrase():
    attempts = 0
    phrase = None
    while attempts < 32:
        phrase = random.choice(CHALLENGE_PHRASES)
        if phrase not in _USED_CHALLENGES:
            _USED_CHALLENGES.add(phrase)
            return phrase
        attempts += 1
    return phrase


def generate_challenge(count=1):
    if count > 1:
        phrases = []
        for _ in range(count):
            phrases.append(_generate_unique_phrase())
        return phrases
    return _generate_unique_phrase()

def verify_challenge(audio_path, target_phrase, threshold=50):
    """
    Transcribes audio at audio_path and matches against target_phrase.
    Returns (success: bool, similarity_score: int, transcribed_text: str)
    
    Args:
        audio_path: Path to audio file
        target_phrase: Expected phrase to match
        threshold: Similarity threshold (0-100). Default: 50%
    """
    try:
        model = get_asr_model()
        if model is None:
            print("WARN: ASR model unavailable, skipping challenge verification")
            return True, 0, "ASR_UNAVAILABLE"

        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            # Using the centralized robust `load_audio` function rather than fragile librosa direct calls.
            # This ensures WebM browser recordings are decoded correctly via torchaudio.
            from core.preprocessing import load_audio
            y = load_audio(audio_path)
        
        # Audio is already 16kHz float32 from `load_audio`
        # Safe clip to prevent wraparound distortion from the preprocessing bandpass/pre-emphasis filters
        y = np.clip(y, -1.0, 1.0)
        y_int16 = (y * 32767).astype(np.int16)
        
        recognizer = KaldiRecognizer(model, 16000)
        chunk_size = 4000
        for i in range(0, len(y_int16), chunk_size):
            chunk = y_int16[i:i+chunk_size]
            recognizer.AcceptWaveform(chunk.tobytes())
            
        result = json.loads(recognizer.FinalResult())
        text = result.get("text", "")
        print(f"DEBUG: Transcribed Text: '{text}'")
    except Exception as e:
        print(f"ERROR: Challenge Logic Failed: {e}")
        return False, 0, "ASR_UNAVAILABLE"

    # Strip punctuation to improve matching accuracy since ASR returns text without punctuation
    import string
    translator = str.maketrans('', '', string.punctuation)
    clean_text = text.lower().translate(translator).strip()
    clean_target = target_phrase.lower().translate(translator).strip()

    similarity = int(
        difflib.SequenceMatcher(
            None,
            clean_text,
            clean_target
        ).ratio()
        * 100
    )
    print(f"DEBUG: Challenge Match: '{clean_text}' vs '{clean_target}' = {similarity}% (Threshold: {threshold}%)")

    # Dynamic threshold - configurable via environment variable
    if similarity >= threshold:
        return True, similarity, text
    return False, similarity, text
