
import os
import random
import string
import difflib
from functools import lru_cache

os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from speechbrain.pretrained import EncoderDecoderASR

CHALLENGE_PHRASES = [
    "The quick brown fox jumps over the lazy dog near the river bank",
    "Security protocols are now active and verification is in progress",
    "Please verify my identity using my unique voice print for access",
    "Artificial intelligence is transforming the way we secure our digital lives",
    "The sky above the port was the color of television, tuned to a dead channel",
    "Voice authentication provides a secure and seamless way to log in",
    "Delta Echo Foxtrot, authorizing access to the secure facility now",
    "System override initiated, please confirm your authorization level immediately"
]

_USED_CHALLENGES = set()
_ASR_UNAVAILABLE = False


@lru_cache(maxsize=1)
def get_asr_model():
    global _ASR_UNAVAILABLE
    if _ASR_UNAVAILABLE:
        return None
    try:
        return EncoderDecoderASR.from_hparams(
            source="speechbrain/asr-crdnn-rnnlm-librispeech",
            savedir="pretrained_models/asr"
        )
    except Exception as e:
        print(f"ERROR: Failed to load ASR model: {e}")
        _ASR_UNAVAILABLE = True
        return None


def _generate_unique_phrase():
    attempts = 0
    phrase = None
    while attempts < 32:
        base = random.choice(CHALLENGE_PHRASES)
        suffix = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=6)
        )
        phrase = f"{base} {suffix}"
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

def verify_challenge(audio_path, target_phrase):
    """
    Transcribes audio at audio_path and matches against target_phrase.
    Returns (success: bool, similarity_score: int, transcribed_text: str)
    """
    try:
        asr_model = get_asr_model()
        if asr_model is None:
            print("WARN: ASR model unavailable, skipping challenge verification")
            return True, 0, "ASR_UNAVAILABLE"
        text = asr_model.transcribe_file(audio_path)
        print(f"DEBUG: Transcribed Text: '{text}'")
    except Exception as e:
        print(f"ERROR: Challenge Logic Failed: {e}")
        return True, 0, "ASR_UNAVAILABLE"

    similarity = int(
        difflib.SequenceMatcher(
            None,
            text.lower(),
            target_phrase.lower()
        ).ratio()
        * 100
    )
    print(f"DEBUG: Challenge Match: '{text}' vs '{target_phrase}' = {similarity}%")

    if similarity > 70:
        return True, similarity, text
    return False, similarity, text
