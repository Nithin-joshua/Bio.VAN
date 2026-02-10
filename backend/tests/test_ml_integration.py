"""
Integration tests for Backend ML Engine.
"""

import pytest
import numpy as np
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.speaker_model import get_embedding
from core.anti_spoofing import liveness_detector

@pytest.mark.integration
@pytest.mark.ml
class TestMLIntegration:
    """Test suite for ML engine integration."""

    def test_audio_pipeline_end_to_end(self, real_audio_sample):
        """
        Test the full pipeline:
        Audio -> Liveness Check -> Embedding Generation
        """
        audio, sr = real_audio_sample
        
        # 1. Liveness Check
        liveness_result = liveness_detector.analyze(audio, sr)
        assert liveness_result is not None
        assert "is_live" in liveness_result
        
        # 2. Embedding Generation (only if live, but we force it here for testing)
        embedding = get_embedding(audio, sr)
        
        # Verify Embedding Structure
        assert isinstance(embedding, list)
        assert len(embedding) == 192
        assert all(isinstance(x, float) for x in embedding)
        
        # Verify Normalization (Unit Length)
        # Using numpy for easy calculation
        vec = np.array(embedding)
        norm = np.linalg.norm(vec)
        # Should be close to 1.0
        assert np.abs(norm - 1.0) < 0.1

    def test_embedding_consistency_across_calls(self, real_audio_sample):
        """
        Verify that calling the model multiple times returns consistent results.
        Integration test to ensure model state doesn't degrade.
        """
        audio, sr = real_audio_sample
        
        emb1 = get_embedding(audio, sr)
        emb2 = get_embedding(audio, sr)
        
        # Calculate similarity
        vec1 = np.array(emb1)
        vec2 = np.array(emb2)
        
        similarity = np.dot(vec1, vec2)
        
        # Should be > 0.99 for identical input
        assert similarity > 0.99

    def test_pipeline_performance_sanity(self, real_audio_sample):
        """
        Sanity check for processing time. 
        If it takes > 5 seconds for a 3s clip, something is wrong with the integration.
        """
        import time
        audio, sr = real_audio_sample
        
        start_time = time.time()
        
        liveness_detector.analyze(audio, sr)
        get_embedding(audio, sr)
        
        duration = time.time() - start_time
        
        # Should be reasonably fast (CPU inference might vary, but < 5s is a safe upper bound)
        # If running on GPU, it should be much faster.
        assert duration < 5.0, f"ML Pipeline took too long: {duration:.2f}s"
