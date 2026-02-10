"""
Performance and load testing for Bio.V system.
"""

import pytest
import time
import asyncio
import numpy as np
import io
import soundfile as sf
from httpx import AsyncClient
from concurrent.futures import ThreadPoolExecutor, as_completed


def create_audio_file(audio_data, sample_rate=16000):
    """Create an in-memory audio file from numpy array."""
    buffer = io.BytesIO()
    sf.write(buffer, audio_data, sample_rate, format='WAV')
    buffer.seek(0)
    buffer.name = "test_audio.wav"
    return buffer


# ============================================================================
# Response Time Tests
# ============================================================================

@pytest.mark.performance
@pytest.mark.asyncio
class TestResponseTimes:
    """Test API response time performance."""
    
    @pytest.fixture(autouse=True)
    def mock_liveness(self):
        """Mock liveness detector."""
        from unittest.mock import patch
        with patch("core.anti_spoofing.liveness_detector.analyze") as mock:
            mock.return_value = {"is_live": True, "score": 0.99, "reason": "Mocked Live"}
            yield mock
    
    @pytest.fixture(autouse=True)
    def clean_db(self, clean_milvus):
        """Ensure clean state."""
        pass
    
    async def test_enrollment_response_time(self, api_client, real_audio_sample):
        """Measure enrollment endpoint response time."""
        audio, sr = real_audio_sample
        
        user_data = {
            "full_name": "Performance Test",
            "email": f"perf_{int(time.time())}@test.com",
            "role": "personnel"
        }
        
        files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        start_time = time.time()
        response = await api_client.post("/enroll", data=user_data, files=files)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        print(f"\n✓ Enrollment Response Time: {response_time:.2f}s")
        
        # Enrollment should complete within reasonable time
        assert response_time < 30.0  # 30 seconds max
        assert response.status_code == 200
    
    async def test_verification_response_time(self, api_client, real_audio_sample):
        """Measure verification endpoint response time."""
        audio, sr = real_audio_sample
        
        # First enroll a user
        user_data = {
            "full_name": "Verify Perf Test",
            "email": f"verify_perf_{int(time.time())}@test.com",
            "role": "personnel"
        }
        
        enroll_files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        await api_client.post("/enroll", data=user_data, files=enroll_files)
        await asyncio.sleep(1)
        
        # Measure verification time
        verify_files = {
            "file": ("verify.wav", create_audio_file(audio, sr), "audio/wav")
        }
        
        start_time = time.time()
        response = await api_client.post("/verify", files=verify_files)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        print(f"\n✓ Verification Response Time: {response_time:.2f}s")
        
        # Verification should be fast
        assert response_time < 10.0  # 10 seconds max
        assert response.status_code == 200


# ============================================================================
# Concurrent Request Tests
# ============================================================================

@pytest.mark.performance
@pytest.mark.slow
@pytest.mark.asyncio
class TestConcurrentRequests:
    """Test system behavior under concurrent load."""
    
    @pytest.fixture(autouse=True)
    def mock_liveness(self):
        """Mock liveness detector."""
        from unittest.mock import patch
        with patch("core.anti_spoofing.liveness_detector.analyze") as mock:
            mock.return_value = {"is_live": True, "score": 0.99, "reason": "Mocked Live"}
            yield mock
    
    @pytest.fixture(autouse=True)
    def clean_db(self, clean_milvus):
        """Ensure clean state."""
        pass
    
    async def test_concurrent_enrollments(self, api_client, real_audio_sample):
        """Test multiple concurrent enrollment requests."""
        audio, sr = real_audio_sample
        
        async def enroll_user(index):
            user_data = {
                "full_name": f"Concurrent User {index}",
                "email": f"concurrent_{index}_{int(time.time())}@test.com",
                "role": "personnel"
            }
            
            files = {
                "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
                "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
                "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
            }
            
            start = time.time()
            response = await api_client.post("/enroll", data=user_data, files=files)
            duration = time.time() - start
            
            return {
                "index": index,
                "status": response.status_code,
                "duration": duration
            }
        
        # Run 5 concurrent enrollments
        tasks = [enroll_user(i) for i in range(5)]
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        success_count = sum(1 for r in results if r["status"] == 200)
        avg_duration = sum(r["duration"] for r in results) / len(results)
        
        print(f"\n✓ Concurrent Enrollments: {success_count}/5 succeeded")
        print(f"✓ Average Duration: {avg_duration:.2f}s")
        
        assert success_count >= 4  # At least 80% success rate
    
    async def test_concurrent_verifications(self, api_client, real_audio_sample):
        """Test multiple concurrent verification requests."""
        audio, sr = real_audio_sample
        
        # First enroll a user
        user_data = {
            "full_name": "Concurrent Verify Test",
            "email": f"concurrent_verify_{int(time.time())}@test.com",
            "role": "personnel"
        }
        
        enroll_files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        await api_client.post("/enroll", data=user_data, files=enroll_files)
        await asyncio.sleep(2)
        
        async def verify_user(index):
            files = {
                "file": ("verify.wav", create_audio_file(audio, sr), "audio/wav")
            }
            
            start = time.time()
            response = await api_client.post("/verify", files=files)
            duration = time.time() - start
            
            return {
                "index": index,
                "status": response.status_code,
                "duration": duration
            }
        
        # Run 10 concurrent verifications
        tasks = [verify_user(i) for i in range(10)]
        results = await asyncio.gather(*tasks)
        
        success_count = sum(1 for r in results if r["status"] == 200)
        avg_duration = sum(r["duration"] for r in results) / len(results)
        
        print(f"\n✓ Concurrent Verifications: {success_count}/10 succeeded")
        print(f"✓ Average Duration: {avg_duration:.2f}s")
        
        assert success_count >= 8  # At least 80% success rate


# ============================================================================
# Throughput Tests
# ============================================================================

@pytest.mark.performance
@pytest.mark.slow
@pytest.mark.asyncio
class TestThroughput:
    """Test system throughput metrics."""
    
    @pytest.fixture(autouse=True)
    def mock_liveness(self):
        """Mock liveness detector."""
        from unittest.mock import patch
        with patch("core.anti_spoofing.liveness_detector.analyze") as mock:
            mock.return_value = {"is_live": True, "score": 0.99, "reason": "Mocked Live"}
            yield mock
    
    @pytest.fixture(autouse=True)
    def clean_db(self, clean_milvus):
        """Ensure clean state."""
        pass
    
    async def test_verification_throughput(self, api_client, real_audio_sample):
        """Measure verification requests per second."""
        audio, sr = real_audio_sample
        
        # Enroll a user
        user_data = {
            "full_name": "Throughput Test",
            "email": f"throughput_{int(time.time())}@test.com",
            "role": "personnel"
        }
        
        enroll_files = {
            "sample_1": ("sample1.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_2": ("sample2.wav", create_audio_file(audio, sr), "audio/wav"),
            "sample_3": ("sample3.wav", create_audio_file(audio, sr), "audio/wav"),
        }
        
        await api_client.post("/enroll", data=user_data, files=enroll_files)
        await asyncio.sleep(2)
        
        # Perform multiple verifications
        num_requests = 20
        start_time = time.time()
        
        async def verify():
            files = {
                "file": ("verify.wav", create_audio_file(audio, sr), "audio/wav")
            }
            return await api_client.post("/verify", files=files)
        
        tasks = [verify() for _ in range(num_requests)]
        results = await asyncio.gather(*tasks)
        
        end_time = time.time()
        total_time = end_time - start_time
        throughput = num_requests / total_time
        
        print(f"\n✓ Verification Throughput: {throughput:.2f} requests/second")
        print(f"✓ Total Time for {num_requests} requests: {total_time:.2f}s")
        
        # Should handle at least 1 request per second
        assert throughput >= 1.0


# ============================================================================
# Resource Usage Tests
# ============================================================================

@pytest.mark.performance
class TestResourceUsage:
    """Test resource consumption metrics."""
    
    def test_memory_usage_during_enrollment(self, real_audio_sample):
        """Monitor memory usage during enrollment processing."""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        
        # Measure baseline memory
        baseline_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Simulate enrollment processing
        audio, sr = real_audio_sample
        from core.speaker_model import get_embedding
        
        # Generate embeddings (memory-intensive operation)
        embeddings = []
        for _ in range(10):
            embedding = get_embedding(audio, sr)
            embeddings.append(embedding)
        
        # Measure peak memory
        peak_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = peak_memory - baseline_memory
        
        print(f"\n✓ Memory Usage: {memory_increase:.2f} MB increase")
        
        # Should not consume excessive memory
        assert memory_increase < 500  # Less than 500 MB increase
