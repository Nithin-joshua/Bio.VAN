
import random
import speech_recognition as sr
from fuzzywuzzy import fuzz

# Pre-defined Challenge Phrases (NATO alphabet style or short sentences)
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

def generate_challenge(count=1):
    """
    Returns a random challenge phrase or a list of phrases.
    Args:
        count (int): Number of phrases to return.
    """
    if count > 1:
        # Ensure we don't pick duplicates if possible
        available = list(CHALLENGE_PHRASES)
        # If requested more than available, allow duplicates (unlikely with sufficient corpus)
        if count > len(available):
            return random.choices(available, k=count)
        return random.sample(available, k=count)
    
    return random.choice(CHALLENGE_PHRASES)

def verify_challenge(audio_path, target_phrase):
    """
    Transcribes audio at audio_path and matches against target_phrase.
    Returns (success: bool, similarity_score: int, transcribed_text: str)
    """
    recognizer = sr.Recognizer()
    
    try:
        with sr.AudioFile(audio_path) as source:
            # Record the audio data
            audio_data = recognizer.record(source)
            
            # Use Google Web Speech API (Free, online)
            # For offline, we would need PocketSphinx or Whisper
            try:
                text = recognizer.recognize_google(audio_data)
                print(f"DEBUG: Transcribed Text: '{text}'")
            except sr.UnknownValueError:
                print("DEBUG: Speech Recognition could not understand audio")
                return False, 0, ""
            except sr.RequestError as e:
                print(f"DEBUG: Could not request results; {e}")
                return False, 0, "API_ERROR"

            # Fuzzy Match
            # We use partial_ratio/token_sort_ratio to be lenient
            similarity = fuzz.ratio(text.lower(), target_phrase.lower())
            print(f"DEBUG: Challenge Match: '{text}' vs '{target_phrase}' = {similarity}%")
            
            # Threshold: > 70% match
            if similarity > 70:
                return True, similarity, text
            else:
                return False, similarity, text
                
    except Exception as e:
        print(f"ERROR: Challenge Logic Failed: {e}")
        return False, 0, "ERROR"
