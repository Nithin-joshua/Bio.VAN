"""
End-to-end system tests for complete user workflows.
"""

import pytest
import io
import numpy as np
import soundfile as sf
from httpx import AsyncClient
import time


def create_audio_file(audio_data, sample_rate=16000):
    """Create an in-memory audio file from numpy array."""
    buffer = io.BytesIO()
    sf.write(buffer, audio_data, sample_rate, format='WAV')
    buffer.seek(0)
    buffer.name = "test_audio.wav"
    return buffer


# ============================================================================
# End-to-End Workflow Tests
# ============================================================================

@pytest.mark.system
@pytest.mark.asyncio
class TestEnrollmentWorkflow:
    """Test complete enrollment workflow."""
    
    @pytest.fixture(autouse=True)
    def mock_liveness(self):
        """Mock liveness detector to always pass for these tests."""
        from unittest.mock import patch
        with patch("core.anti_spoofing.liveness_detector.analyze") as mock:
            mock.return_value = {"is_live": True, "score": 0.99, "reason": "Mocked Live"}
            yield mock
    
    @pytest.fixture(autouse=True)
    def mock_milvus_interactions(self):
        """Mock Milvus interactions to prevent pollution."""
        from unittest.mock import patch
        with patch("api.main.search_embedding") as mock_search, \
             patch("api.main.insert_embedding") as mock_insert:
            mock_search.return_value = []
            yield mock_search, mock_insert
    
    async def test_complete_enrollment_flow(self, api_client, real_audio_sample):
        """Test the complete enrollment process from start to finish."""
        audio, sr = real_audio_sample
        
        # Step 1: Prepare user data
        user_data = {
            "full_name": "E2E Test User",
            "email": f"e2e_{int(time.time())}@test.com",
            "role": "personnel"
        }
        
        # Step 2: Prepare three audio samples
        files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        # Step 3: Submit enrollment
        response = await api_client.post("/enroll", data=user_data, files=files)
        
        # Step 4: Verify response
        assert response.status_code == 200
        result = response.json()
        assert "user_id" in result
        assert "message" in result
        assert len(result["user_id"]) == 10  # 10-character ID
        
        # Step 5: Verify user can be retrieved (if admin endpoint exists)
        # This would require admin authentication
        
        return result["user_id"]


@pytest.mark.system
@pytest.mark.asyncio
class TestVerificationWorkflow:
    """Test complete verification workflow."""
    
    @pytest.fixture(autouse=True)
    def clean_db(self, clean_milvus):
        """Ensure clean state."""
        pass
    
    @pytest.fixture(autouse=True)
    def mock_liveness(self):
        """Mock liveness detector."""
        from unittest.mock import patch
        with patch("core.anti_spoofing.liveness_detector.analyze") as mock:
            mock.return_value = {"is_live": True, "score": 0.99, "reason": "Mocked Live"}
            yield mock
    
    async def test_complete_verification_flow(self, api_client, real_audio_sample):
        """Test the complete verification process."""
        audio, sr = real_audio_sample
        
        # Step 1: Enroll a user first
        user_data = {
            "full_name": "Verify Test User",
            "email": f"verify_{int(time.time())}@test.com",
            "role": "personnel"
        }
        
        enroll_files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        enroll_response = await api_client.post("/enroll", data=user_data, files=enroll_files)
        assert enroll_response.status_code == 200
        
        # Step 2: Wait a moment for database consistency
        await asyncio.sleep(1)
        
        # Step 3: Verify with the same voice
        verify_files = {
            "file": ("verify.wav", create_audio_file(audio, sr), "audio/wav")
        }
        
        verify_response = await api_client.post("/verify", files=verify_files)
        
        # Step 4: Check verification result
        assert verify_response.status_code == 200
        result = verify_response.json()
        assert "verified" in result
        assert "confidence" in result
        assert result["verified"] == True
        assert result["confidence"] > 0.75


@pytest.mark.system
@pytest.mark.asyncio
class TestDeduplicationWorkflow:
    """Test biometric deduplication detection."""
    
    @pytest.fixture(autouse=True)
    def mock_liveness(self):
        """Mock liveness detector."""
        from unittest.mock import patch
        with patch("core.anti_spoofing.liveness_detector.analyze") as mock:
            mock.return_value = {"is_live": True, "score": 0.99, "reason": "Mocked Live"}
            yield mock
    
    @pytest.fixture(autouse=True)
    def mock_milvus_dedup(self):
        """Mock Milvus search for deduplication test."""
        from unittest.mock import patch, MagicMock
        with patch("api.main.search_embedding") as mock_search, \
             patch("api.main.insert_embedding") as mock_insert:
            
            # Step 1 (Enroll User 1): No match
            # Step 2 (Enroll User 2): Match found
            mock_match = MagicMock()
            mock_match.id = "existing-uuid"
            mock_match.distance = 0.95
            
            mock_search.side_effect = [[], [mock_match]]
            yield mock_search, mock_insert
    
    async def test_duplicate_voiceprint_detection(self, api_client, real_audio_sample):
        """Test that duplicate voiceprints are detected."""
        audio, sr = real_audio_sample
        
        # Step 1: Enroll first user
        user1_data = {
            "full_name": "Original User",
            "email": f"original_{int(time.time())}@test.com",
            "role": "personnel"
        }
        
        files1 = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        response1 = await api_client.post("/enroll", data=user1_data, files=files1)
        assert response1.status_code == 200
        
        # Step 2: Try to enroll with same voice but different email
        user2_data = {
            "full_name": "Duplicate User",
            "email": f"duplicate_{int(time.time())}@test.com",
            "role": "personnel"
        }
        
        files2 = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        response2 = await api_client.post("/enroll", data=user2_data, files=files2)
        
        # Step 3: Should be rejected due to duplicate voiceprint
        assert response2.status_code in [409, 400, 403]
        result = response2.json()
        assert "duplicate" in str(result).lower() or "already" in str(result).lower()


@pytest.mark.system
@pytest.mark.asyncio
class TestSecurityWorkflow:
    """Test security features in workflows."""
    
    async def test_liveness_detection_in_enrollment(self, api_client, silence_audio, clean_milvus):
        """Test that liveness detection prevents spoofed enrollment."""
        audio, sr = silence_audio
        
        user_data = {
            "full_name": "Spoof Test",
            "email": f"spoof_{int(time.time())}@test.com",
            "role": "personnel"
        }
        
        files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        response = await api_client.post("/enroll", data=user_data, files=files)
        
        # Should be rejected
        assert response.status_code in [400, 403]
    
    async def test_liveness_detection_in_verification(self, api_client, synthetic_audio, clean_milvus):
        """Test that liveness detection prevents spoofed verification."""
        audio, sr = synthetic_audio
        
        files = {
            "file": ("verify.wav", create_audio_file(audio, sr), "audio/wav")
        }
        
        response = await api_client.post("/verify", files=files)
        
        # Should either reject or return verified=False
        if response.status_code == 200:
            result = response.json()
            # Synthetic audio should not verify
            assert result["verified"] == False or "liveness" in str(result).lower()


@pytest.mark.system
@pytest.mark.asyncio
class TestChallengeResponseWorkflow:
    """Test challenge-response authentication."""
    
    @pytest.fixture(autouse=True)
    def clean_db(self, clean_milvus):
        """Ensure clean state."""
        pass

    @pytest.fixture(autouse=True)
    def mock_liveness(self):
        """Mock liveness detector."""
        from unittest.mock import patch
        with patch("core.anti_spoofing.liveness_detector.analyze") as mock:
            mock.return_value = {"is_live": True, "score": 0.99, "reason": "Mocked Live"}
            yield mock
    
    async def test_challenge_generation_and_verification(self, api_client, real_audio_sample):
        """Test complete challenge-response flow."""
        # Step 1: Get challenge phrase
        challenge_response = await api_client.get("/challenge")
        
        if challenge_response.status_code == 200:
            challenge_data = challenge_response.json()
            assert "phrase" in challenge_data or "challenge" in challenge_data
            
            # Step 2: User would speak the challenge phrase
            # (In real scenario, ASR would verify the spoken text matches)
            
            # Step 3: Verify with audio
            audio, sr = real_audio_sample
            files = {
                "file": ("verify.wav", create_audio_file(audio, sr), "audio/wav")
            }
            
            verify_response = await api_client.post("/verify", files=files)
            assert verify_response.status_code in [200, 400, 403], f"Verification failed with {verify_response.status_code}: {verify_response.text}"


# Import asyncio for sleep
import asyncio
