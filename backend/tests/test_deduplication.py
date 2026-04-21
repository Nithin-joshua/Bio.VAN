import pytest
import io
import numpy as np
import soundfile as sf
from httpx import AsyncClient
from config.settings import BIO_VAN_API_KEY, DEDUPLICATION_THRESHOLD

def create_audio_file(audio_data, sample_rate=16000):
    buffer = io.BytesIO()
    sf.write(buffer, audio_data, sample_rate, format='WAV')
    buffer.seek(0)
    buffer.name = "test_audio.wav"
    return buffer

@pytest.mark.asyncio
@pytest.mark.usefixtures("clean_milvus")
async def test_identity_deduplication(api_client, real_audio_sample):
    """
    Test that the system prevents multiple accounts for the same voice.
    """
    audio, sr = real_audio_sample
    
    # --- PHASE 1: Successful Enrollment of User A ---
    files_a = {
        "sample_1": ("a1.wav", create_audio_file(audio, sr), "audio/wav"),
        "sample_2": ("a2.wav", create_audio_file(audio, sr), "audio/wav"),
        "sample_3": ("a3.wav", create_audio_file(audio, sr), "audio/wav"),
    }
    data_a = {
        "full_name": "Original User",
        "email": "original@biovan.test",
        "role": "personnel"
    }
    
    response_a = await api_client.post("/enroll", data=data_a, files=files_a)
    assert response_a.status_code == 200, f"Setup enrollment failed: {response_a.text}"
    
    # --- PHASE 2: Attempted Duplicate Enrollment by User B (Same Voice) ---
    # We add a tiny bit of noise to simulate a different recording of the same person
    noisy_audio = audio + np.random.normal(0, 0.001, audio.shape)
    
    files_b = {
        "sample_1": ("b1.wav", create_audio_file(noisy_audio, sr), "audio/wav"),
        "sample_2": ("b2.wav", create_audio_file(noisy_audio, sr), "audio/wav"),
        "sample_3": ("b3.wav", create_audio_file(noisy_audio, sr), "audio/wav"),
    }
    data_b = {
        "full_name": "Imposter or Multi-Account User",
        "email": "imposter@biovan.test",
        "role": "personnel"
    }
    
    response_b = await api_client.post("/enroll", data=data_b, files=files_b)
    
    # --- VERIFICATION ---
    # It should REJECT the second enrollment
    assert response_b.status_code == 400
    result = response_b.json()
    assert "Biometric Security Alert" in result["detail"]
    assert "already registered" in result["detail"]
    
    print(f"\nSUCCESS: Identity deduplication correctly blocked duplicate enrollment.")
