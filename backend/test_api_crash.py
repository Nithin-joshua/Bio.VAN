import requests
import io
import scipy.io.wavfile as wavfile
import numpy as np
import json

def create_valid_wav_blob():
    # 3.5 seconds of 440hz tone
    rate = 16000
    t = np.linspace(0, 3.5, int(rate * 3.5), endpoint=False)
    audio = np.sin(2 * np.pi * 440 * t)
    audio_int16 = np.int16(audio * 32767)
    
    buf = io.BytesIO()
    wavfile.write(buf, rate, audio_int16)
    buf.seek(0)
    return buf.read()

def test_enroll():
    url = "http://127.0.0.1:8000/enroll"
    wav_bytes = create_valid_wav_blob()
    
    files = {
        'sample_1': ('sample_1.wav', wav_bytes, 'audio/wav'),
        'sample_2': ('sample_2.wav', wav_bytes, 'audio/wav'),
        'sample_3': ('sample_3.wav', wav_bytes, 'audio/wav')
    }
    
    data = {
        'full_name': 'Test User',
        'email': 'test@example.com',
        'role': 'personnel',
        'challenge_phrases': json.dumps([
            "The quick brown fox jumps over the lazy dog near the river bank",
            "Security protocols are now active and verification is in progress",
            "Please verify my identity using my unique voice print for access"
        ])
    }
    
    headers = {
        'X-API-KEY': 'dev-key-123'
    }
    
    print("Sending POST request to /enroll...")
    # Also we need to bypass rate limit if we hit it, but limit is 20/min
    res = requests.post(url, data=data, files=files, headers=headers)
    print("Status Code:", res.status_code)
    try:
        print("Response JSON:", res.json())
    except:
        print("Response Text:", res.text)

if __name__ == "__main__":
    test_enroll()
