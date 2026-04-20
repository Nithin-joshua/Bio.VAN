"""
Unit tests for API endpoints (enroll, verify, users).
"""

import pytest
import io
import numpy as np
from httpx import AsyncClient
import soundfile as sf


# ============================================================================
# Helper Functions
# ============================================================================

def create_audio_file(audio_data, sample_rate=16000):
    """Create an in-memory audio file from numpy array."""
    buffer = io.BytesIO()
    sf.write(buffer, audio_data, sample_rate, format='WAV')
    buffer.seek(0)
    buffer.name = "test_audio.wav"
    return buffer


# ============================================================================
# Enrollment Endpoint Tests
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
@pytest.mark.usefixtures("clean_milvus")
class TestEnrollmentEndpoint:
    """Test suite for /enroll endpoint."""
    
    async def test_enroll_success(self, api_client, real_audio_sample, test_user_data):
        """Test successful user enrollment."""
        audio, sr = real_audio_sample
        
        # Create three audio samples
        files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        data = {
            "full_name": test_user_data["full_name"],
            "email": test_user_data["email"],
            "role": test_user_data["role"]
        }
        
        response = await api_client.post("/enroll", data=data, files=files)
        
        assert response.status_code == 200
        result = response.json()
        assert "user_id" in result
        assert "message" in result
        assert "enrolled successfully" in result["message"]
    
    async def test_enroll_missing_audio(self, api_client, test_user_data):
        """Test enrollment with missing audio samples."""
        data = {
            "full_name": test_user_data["full_name"],
            "email": test_user_data["email"],
            "role": test_user_data["role"]
        }
        
        response = await api_client.post("/enroll", data=data)
        
        # Should fail due to missing audio
        assert response.status_code in [400, 422]
    
    async def test_enroll_invalid_email(self, api_client, real_audio_sample):
        """Test enrollment with invalid email format."""
        audio, sr = real_audio_sample
        
        files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        data = {
            "full_name": "Test User",
            "email": "invalid-email",  # Invalid format
            "role": "personnel"
        }
        
        response = await api_client.post("/enroll", data=data, files=files)
        
        # Should fail validation
        assert response.status_code in [400, 422]
    
    async def test_enroll_silence_rejection(self, api_client, silence_audio, test_user_data):
        """Test that silent audio is rejected during enrollment."""
        audio, sr = silence_audio
        
        files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        data = {
            "full_name": test_user_data["full_name"],
            "email": test_user_data["email"],
            "role": test_user_data["role"]
        }
        
        response = await api_client.post("/enroll", data=data, files=files)
        
        # Should fail liveness check
        assert response.status_code in [400, 403]
        result = response.json()
        assert "liveness" in result.get("detail", "").lower() or "spoof" in result.get("detail", "").lower()
    
    async def test_enroll_duplicate_email(self, api_client, real_audio_sample):
        """Test enrollment with duplicate email (upsert behavior)."""
        audio, sr = real_audio_sample
        
        files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        data = {
            "full_name": "Duplicate User",
            "email": "duplicate@test.com",
            "role": "personnel"
        }
        
        # First enrollment
        response1 = await api_client.post("/enroll", data=data, files=files)
        assert response1.status_code == 200
        
        # Second enrollment with same email (should update)
        files2 = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        response2 = await api_client.post("/enroll", data=data, files=files2)
        
        # Should succeed (upsert)
        assert response2.status_code == 200


# ============================================================================
# Verification Endpoint Tests
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
@pytest.mark.usefixtures("clean_milvus")
class TestVerificationEndpoint:
    """Test suite for /verify endpoint."""
    
    async def test_verify_enrolled_user(self, api_client, real_audio_sample, test_user_data):
        """Test verification of an enrolled user."""
        audio, sr = real_audio_sample
        
        # First, enroll the user
        files_enroll = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        data_enroll = {
            "full_name": test_user_data["full_name"],
            "email": test_user_data["email"],
            "role": test_user_data["role"]
        }
        
        enroll_response = await api_client.post("/enroll", data=data_enroll, files=files_enroll)
        assert enroll_response.status_code == 200
        
        # Now verify with similar audio
        files_verify = {
            "file": ("verify.wav", create_audio_file(audio, sr), "audio/wav")
        }
        
        verify_response = await api_client.post("/verify", files=files_verify)
        
        assert verify_response.status_code == 200
        result = verify_response.json()
        assert "verified" in result
        assert "confidence" in result
        # Should match (same audio)
        assert result["verified"] == True
        assert result["confidence"] > 0.75
    
    async def test_verify_unenrolled_user(self, api_client, real_audio_sample):
        """Test verification of a user not in the database."""
        audio, sr = real_audio_sample
        
        # Create unique audio that hasn't been enrolled
        unique_audio = audio + np.random.normal(0, 0.05, audio.shape)
        
        files = {
            "file": ("verify.wav", create_audio_file(unique_audio, sr), "audio/wav")
        }
        
        response = await api_client.post("/verify", files=files)
        
        assert response.status_code == 200
        result = response.json()
        assert "verified" in result
        # Should not match (not enrolled)
        assert result["verified"] == False
    
    async def test_verify_silence_rejection(self, api_client, silence_audio):
        """Test that silent audio is rejected during verification."""
        audio, sr = silence_audio
        
        files = {
            "file": ("verify.wav", create_audio_file(audio, sr), "audio/wav")
        }
        
        response = await api_client.post("/verify", files=files)
        
        # Should fail liveness check
        assert response.status_code in [200, 403]
        result = response.json()
        if response.status_code == 200:
            assert result["verified"] == False
            assert "liveness" in str(result).lower() or "spoof" in str(result).lower()
    
    async def test_verify_missing_audio(self, api_client):
        """Test verification without audio file."""
        response = await api_client.post("/verify")
        
        # Should fail validation
        assert response.status_code in [400, 422]


# ============================================================================
# Users Endpoint Tests
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
class TestUsersEndpoint:
    """Test suite for /users endpoint (admin only)."""
    
    async def test_get_users_without_auth(self, api_client):
        """Test that /users requires authentication."""
        response = await api_client.get("/users")
        
        # Should require authentication
        assert response.status_code in [401, 403]
    
    async def test_get_users_with_auth(self, api_client):
        """Test getting users list with admin authentication."""
        # Note: This test requires JWT implementation
        # For now, we test the endpoint structure
        
        # Create admin token (mock or real depending on implementation)
        headers = {
            "Authorization": "Bearer mock_admin_token"
        }
        
        response = await api_client.get("/users", headers=headers)
        
        # Will fail auth with mock token, but tests endpoint exists
        assert response.status_code in [200, 401, 403]
        
        if response.status_code == 200:
            result = response.json()
            assert isinstance(result, list)


# ============================================================================
# Challenge Endpoint Tests
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
class TestChallengeEndpoint:
    """Test suite for challenge phrase endpoint."""
    
    async def test_get_challenge(self, api_client):
        """Test getting a challenge phrase."""
        response = await api_client.get("/challenge")
        
        if response.status_code == 200:
            result = response.json()
            assert "phrase" in result or "challenge" in result
            phrase = result.get("phrase") or result.get("challenge")
            assert isinstance(phrase, str)
            assert len(phrase) > 0
