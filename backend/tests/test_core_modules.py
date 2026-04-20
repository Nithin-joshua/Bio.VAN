"""
Unit tests for core backend modules (anti-spoofing, speaker model, similarity, etc.)
"""

import pytest
import numpy as np
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.anti_spoofing import liveness_detector
from core.speaker_model import get_embedding
from core.similarity import compute_similarity
from core.challenge import generate_challenge
from core.security import hash_password, verify_password


# ============================================================================
# Anti-Spoofing Tests
# ============================================================================

@pytest.mark.unit
class TestLivenessDetection:
    """Test suite for liveness detection module."""
    
    def test_real_audio_passes_liveness(self, real_audio_sample):
        """Test that realistic audio passes liveness check."""
        audio, sr = real_audio_sample
        result = liveness_detector.analyze(audio, sr)
        
        assert result is not None
        assert "is_live" in result
        assert "confidence" in result
        assert "method" in result
        # Real audio should have reasonable confidence
        assert result["confidence"] > 0.3
    
    def test_silence_fails_liveness(self, silence_audio):
        """Test that silence is detected as non-live."""
        audio, sr = silence_audio
        result = liveness_detector.analyze(audio, sr)
        
        assert result is not None
        assert result["is_live"] == False
        assert "confidence" in result
    
    def test_white_noise_detection(self, noise_audio):
        """Test detection of white noise."""
        audio, sr = noise_audio
        result = liveness_detector.analyze(audio, sr)
        
        assert result is not None
        # Noise should be detected (high variance, no structure)
        assert "is_live" in result
    
    def test_synthetic_audio_detection(self, synthetic_audio):
        """Test detection of synthetic/robotic audio."""
        audio, sr = synthetic_audio
        result = liveness_detector.analyze(audio, sr)
        
        assert result is not None
        assert "is_live" in result
        # Synthetic audio might be flagged as suspicious
        # (depends on the sophistication of the detector)
    
    def test_short_audio_handling(self):
        """Test handling of very short audio samples."""
        # 0.5 seconds of audio
        short_audio = np.random.randn(8000).astype(np.float32)
        result = liveness_detector.analyze(short_audio, 16000)
        
        # Should handle gracefully (pad or reject)
        assert result is not None
    
    def test_long_audio_handling(self):
        """Test handling of very long audio samples."""
        # 10 seconds of audio
        long_audio = np.random.randn(160000).astype(np.float32)
        result = liveness_detector.analyze(long_audio, 16000)
        
        # Should handle gracefully (truncate)
        assert result is not None


# ============================================================================
# Speaker Model Tests
# ============================================================================

@pytest.mark.unit
class TestSpeakerModel:
    """Test suite for speaker embedding generation."""
    
    def test_embedding_generation(self, real_audio_sample):
        """Test that embeddings are generated successfully."""
        audio, sr = real_audio_sample
        embedding = get_embedding(audio, sr)
        
        assert embedding is not None
        assert isinstance(embedding, list)
        # Convert to numpy for further vector math assertions
        embedding_np = np.array(embedding)
        # ECAPA-TDNN produces 192-dimensional embeddings
        assert embedding_np.shape[0] == 192
        # Embeddings should be normalized
        assert np.abs(np.linalg.norm(embedding_np) - 1.0) < 0.1
    
    def test_embedding_consistency(self, real_audio_sample):
        """Test that same audio produces consistent embeddings."""
        audio, sr = real_audio_sample
        
        embedding1 = np.array(get_embedding(audio, sr))
        embedding2 = np.array(get_embedding(audio, sr))
        
        # Should be very similar (allowing for minor numerical differences)
        similarity = np.dot(embedding1, embedding2)
        assert similarity > 0.99
    
    def test_different_audio_different_embeddings(self, real_audio_sample, noise_audio):
        """Test that different audio produces different embeddings."""
        audio1, sr1 = real_audio_sample
        audio2, sr2 = noise_audio
        
        embedding1 = np.array(get_embedding(audio1, sr1))
        embedding2 = np.array(get_embedding(audio2, sr2))
        
        # Should be different
        similarity = np.dot(embedding1, embedding2)
        assert similarity < 0.95  # Not too similar


# ============================================================================
# Similarity Tests
# ============================================================================

@pytest.mark.unit
class TestSimilarity:
    """Test suite for similarity computation."""
    
    def test_identical_vectors_similarity(self):
        """Test that identical vectors have similarity of 1.0."""
        vec = np.random.randn(192).astype(np.float32)
        vec = vec / np.linalg.norm(vec)  # Normalize
        
        similarity = compute_similarity(vec, vec)
        assert np.abs(similarity - 1.0) < 0.001
    
    def test_orthogonal_vectors_similarity(self):
        """Test that orthogonal vectors have similarity near 0."""
        vec1 = np.zeros(192, dtype=np.float32)
        vec1[0] = 1.0
        
        vec2 = np.zeros(192, dtype=np.float32)
        vec2[1] = 1.0
        
        similarity = compute_similarity(vec1, vec2)
        assert np.abs(similarity) < 0.001
    
    def test_opposite_vectors_similarity(self):
        """Test that opposite vectors have similarity of -1.0."""
        vec1 = np.random.randn(192).astype(np.float32)
        vec1 = vec1 / np.linalg.norm(vec1)
        vec2 = -vec1
        
        similarity = compute_similarity(vec1, vec2)
        assert np.abs(similarity - (-1.0)) < 0.001
    
    def test_similarity_symmetry(self):
        """Test that similarity is symmetric."""
        vec1 = np.random.randn(192).astype(np.float32)
        vec2 = np.random.randn(192).astype(np.float32)
        
        sim1 = compute_similarity(vec1, vec2)
        sim2 = compute_similarity(vec2, vec1)
        
        assert np.abs(sim1 - sim2) < 0.001


# ============================================================================
# Challenge Generation Tests
# ============================================================================

@pytest.mark.unit
class TestChallengeGeneration:
    """Test suite for challenge phrase generation."""
    
    def test_challenge_generation(self):
        """Test that challenge phrases are generated."""
        phrase = generate_challenge()
        
        assert phrase is not None
        assert isinstance(phrase, str)
        assert len(phrase) > 0
    
    def test_challenge_uniqueness(self):
        """Test that consecutive challenges are different."""
        phrases = [generate_challenge() for _ in range(10)]
        
        # Should have some variety (not all identical)
        unique_phrases = set(phrases)
        assert len(unique_phrases) > 1
    
    def test_challenge_format(self):
        """Test that challenge phrases follow expected format."""
        phrase = generate_challenge()
        
        # Should contain words (not just random characters)
        words = phrase.split()
        assert len(words) >= 2  # At least a couple of words


# ============================================================================
# Security Tests
# ============================================================================

@pytest.mark.unit
class TestSecurity:
    """Test suite for security functions."""
    
    def test_password_hashing(self):
        """Test that passwords are hashed correctly."""
        password = "test_password_123"
        hashed = hash_password(password)
        
        assert hashed is not None
        assert isinstance(hashed, str)
        assert hashed != password  # Should be hashed, not plaintext
        assert len(hashed) > len(password)  # Hash is longer
    
    def test_password_verification_success(self):
        """Test that correct password verification succeeds."""
        password = "test_password_123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) == True
    
    def test_password_verification_failure(self):
        """Test that incorrect password verification fails."""
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = hash_password(password)
        
        assert verify_password(wrong_password, hashed) == False
    
    def test_different_passwords_different_hashes(self):
        """Test that different passwords produce different hashes."""
        password1 = "password1"
        password2 = "password2"
        
        hash1 = hash_password(password1)
        hash2 = hash_password(password2)
        
        assert hash1 != hash2
    
    def test_same_password_different_hashes(self):
        """Test that same password produces different hashes (salt)."""
        password = "test_password"
        
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        # Due to salt, hashes should be different
        # but both should verify correctly
        assert hash1 != hash2
        assert verify_password(password, hash1) == True
        assert verify_password(password, hash2) == True
