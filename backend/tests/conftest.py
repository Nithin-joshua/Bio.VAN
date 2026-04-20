"""
Pytest configuration and shared fixtures for Bio.V testing.
"""

import pytest
import os
import sys
import numpy as np
from pathlib import Path
import asyncio

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Note: We use lazy imports in fixtures to avoid loading heavy dependencies
# during test collection phase

@pytest.fixture(autouse=True)
def mock_audio_loading(monkeypatch):
    """Mock audio loading libraries to prevent NoBackendError on Windows/CI."""
    try:
        import torchaudio
        import librosa
        import numpy as np
        import torch

        def mock_load(path, *args, **kwargs):
            # Return a dummy 3-second mono 16kHz signal with low-level noise to pass energy checks
            return np.random.uniform(-0.1, 0.1, 48000).astype(np.float32), 16000

        # Mock torchaudio and librosa
        monkeypatch.setattr("torchaudio.load", lambda path, *args, **kwargs: (torch.randn(1, 48000) * 0.1, 16000))
        monkeypatch.setattr("librosa.load", lambda path, *args, **kwargs: (np.random.uniform(-0.1, 0.1, 48000).astype(np.float32), 16000))
        
    except ImportError:
        pass


# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def test_db_setup():
    """Set up test database schema once per test session."""
    from database.postgres_client import engine, Base
    # Clean up any existing data
    Base.metadata.drop_all(bind=engine)
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Clean up Milvus
    try:
        from database.milvus_client import get_milvus_client
        collection = get_milvus_client()
        collection.drop()
        # Re-init after drop
        from database.milvus_client import init_milvus
        init_milvus()
    except Exception as e:
        print(f"Warning: Milvus cleanup failed: {e}")
        
    yield
    # Cleanup after all tests
    # Note: We don't drop tables to preserve data for inspection
    # Uncomment the line below if you want to clean up after tests
    # Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(test_db_setup):
    """Provide a database session for each test."""
    from database.postgres_client import engine
    from sqlalchemy.orm import Session
    
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    yield session
    
    # Rollback transaction after test
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def milvus_client():
    """Provide Milvus client for testing."""
    from database.milvus_client import get_milvus_client
    try:
        client = get_milvus_client()
    except Exception as e:
        pytest.skip(f"Milvus not available: {e}")
    yield client
    # Cleanup: Remove test vectors if needed
    # Note: Be careful not to delete production data

@pytest.fixture(scope="function")
def clean_milvus():
    """Clean Milvus collection before/after test."""
    try:
        from database.milvus_client import get_milvus_client, init_milvus, reset_milvus_client
        
        # Reset client first to ensure we get fresh connection if needed?
        # No, we need existing client to drop.
        try:
            collection = get_milvus_client()
            collection.drop()
        except:
            pass
            
        # FORCE RESET global variable so init_milvus creates new
        reset_milvus_client()
        init_milvus()
    except Exception as e:
        print(f"Clean Milvus failed: {e}")
    yield
    # Optional: clean after too
    try:
        from database.milvus_client import get_milvus_client, init_milvus, reset_milvus_client
        collection = get_milvus_client()
        collection.drop()
        reset_milvus_client()
        init_milvus()
        import time
        time.sleep(0.5)
    except Exception:
        pass


# ============================================================================
# API Client Fixtures
# ============================================================================

@pytest.fixture
async def api_client():
    """Provide async HTTP client for API testing."""
    from httpx import AsyncClient, ASGITransport
    from api.main import app
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ============================================================================
# Test Audio Fixtures
# ============================================================================

@pytest.fixture
def real_audio_sample():
    """Generate a realistic audio sample (simulated voice)."""
    # 3 seconds at 16kHz
    duration = 3.0
    sample_rate = 16000
    samples = int(duration * sample_rate)
    
    # Simulate voice with multiple harmonics
    t = np.linspace(0, duration, samples)
    # Simulate voice with random fundamental frequency to ensure uniqueness
    fundamental = np.random.randint(100, 300)  # Random pitch between 100Hz and 300Hz
    
    audio = (
        0.3 * np.sin(2 * np.pi * fundamental * t) +
        0.2 * np.sin(2 * np.pi * fundamental * 2 * t) +
        0.1 * np.sin(2 * np.pi * fundamental * 3 * t) +
        0.05 * np.random.normal(0, 0.01, samples)  # Add slight noise
    )
    
    return audio.astype(np.float32), sample_rate


@pytest.fixture
def silence_audio():
    """Generate silent audio."""
    duration = 3.0
    sample_rate = 16000
    samples = int(duration * sample_rate)
    return np.zeros(samples, dtype=np.float32), sample_rate


@pytest.fixture
def noise_audio():
    """Generate white noise audio."""
    duration = 3.0
    sample_rate = 16000
    samples = int(duration * sample_rate)
    noise = np.random.normal(0, 0.1, samples)
    return noise.astype(np.float32), sample_rate


@pytest.fixture
def synthetic_audio():
    """Generate synthetic/robotic audio (for spoofing tests)."""
    duration = 3.0
    sample_rate = 16000
    samples = int(duration * sample_rate)
    
    # Pure sine wave (unnatural, lacks harmonics)
    t = np.linspace(0, duration, samples)
    audio = 0.5 * np.sin(2 * np.pi * 200 * t)
    
    return audio.astype(np.float32), sample_rate


# ============================================================================
# Test User Data Fixtures
# ============================================================================

@pytest.fixture
def test_user_data():
    """Provide test user registration data."""
    return {
        "full_name": "Test User",
        "email": f"test_{np.random.randint(1000, 9999)}@example.com",
        "role": "personnel"
    }


@pytest.fixture
def admin_user_data():
    """Provide admin user data."""
    return {
        "full_name": "Admin User",
        "email": "admin@biovan.test",
        "role": "admin",
        "password": "admin123"  # For JWT testing
    }


# ============================================================================
# Cleanup Utilities
# ============================================================================

@pytest.fixture
def cleanup_test_users(db_session):
    """Clean up test users after test execution."""
    created_emails = []
    
    def register_email(email):
        created_emails.append(email)
    
    yield register_email
    
    # Cleanup
    from database.postgres_client import User
    for email in created_emails:
        user = db_session.query(User).filter(User.email == email).first()
        if user:
            db_session.delete(user)
    db_session.commit()


# ============================================================================
# Performance Testing Fixtures
# ============================================================================

@pytest.fixture
def performance_metrics():
    """Track performance metrics during tests."""
    metrics = {
        "response_times": [],
        "memory_usage": [],
        "start_time": None,
        "end_time": None
    }
    return metrics
