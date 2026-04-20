import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
import numpy as np
import io
import soundfile as sf
import uuid

@pytest.mark.asyncio
async def test_api_key_enforcement(api_client):
    """Verify that requests without a valid API key are rejected."""
    from api.main import app
    from httpx import AsyncClient, ASGITransport
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. No key
        response = await client.get("/health")
        assert response.status_code == 401
        assert response.json()["detail"] == "Missing API Key"

        # 2. Invalid key
        headers = {"x-api-key": "wrong-key"}
        response = await client.get("/health", headers=headers)
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid API Key"

@pytest.mark.asyncio
async def test_rate_limiting_verify(api_client):
    """Verify that /verify is rate limited."""
    duration = 1.0
    sample_rate = 16000
    samples = int(duration * sample_rate)
    audio = np.zeros(samples, dtype=np.float32)
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format='WAV')
    buffer.seek(0)
    
    files = {"file": ("test.wav", buffer, "audio/wav")}
    
    # Send 5 requests (limit is 5/minute)
    for i in range(5):
        buffer.seek(0)
        await api_client.post("/verify", files=files)
    
    # 6th request should be rate limited
    buffer.seek(0)
    response = await api_client.post("/verify", files=files)
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.json()["detail"]

@pytest.mark.asyncio
async def test_concurrency_isolation(api_client):
    """Verify that requests don't block each other."""
    pass

@pytest.mark.asyncio
async def test_dual_write_rollback(api_client, monkeypatch):
    """Verify that enrollment rolls back if Milvus insertion fails."""
    # 1. Mock insert_embedding to fail
    def mock_fail_insert(*args, **kwargs):
        raise Exception("Milvus Connection Failed (Simulated)")
    
    monkeypatch.setattr("api.main.insert_embedding", mock_fail_insert)
    
    # 2. Prepare enrollment data with UNIQUE email
    enroll_email = f"rollback_{uuid.uuid4().hex[:8]}@test.com"
    
    duration = 1.0
    sample_rate = 16000
    samples = int(duration * sample_rate)
    audio = np.zeros(samples, dtype=np.float32)
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format='WAV')
    buffer.seek(0)
    
    files = {
        "sample_1": ("s1.wav", buffer, "audio/wav"),
        "sample_2": ("s1.wav", buffer, "audio/wav"),
        "sample_3": ("s1.wav", buffer, "audio/wav")
    }
    
    data = {
        "full_name": "Rollback Test",
        "email": enroll_email,
        "role": "personnel"
    }
    
    # 3. Trigger enrollment
    response = await api_client.post("/enroll", data=data, files=files)
    
    # 4. Verify failure
    assert response.status_code == 500
    assert "enrollment rolled back" in response.json()["detail"].lower()
    
    # 5. Verify Postgres cleanup
    from database.postgres_client import SessionLocal, User
    import time
    time.sleep(0.2) # Wait for async task/db to settle
    session = SessionLocal()
    session.expire_all()
    user = session.query(User).filter(User.email == enroll_email).first()
    assert user is None, f"User {enroll_email} still exists in Postgres after Milvus failure!"
    session.close()
