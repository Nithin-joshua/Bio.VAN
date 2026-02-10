"""
Integration tests for database operations (PostgreSQL + Milvus).
"""

import pytest
import numpy as np
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from database.postgres_client import User, get_db, engine
from database.milvus_client import get_milvus_client
from sqlalchemy.orm import Session


# ============================================================================
# PostgreSQL Integration Tests
# ============================================================================

@pytest.mark.integration
class TestPostgreSQLIntegration:
    """Test suite for PostgreSQL database operations."""
    
    def test_create_user(self, db_session):
        """Test creating a new user in PostgreSQL."""
        user = User(
            full_name="Integration Test User",
            email="integration_new@test.com",
            role="personnel",
            voice_uuid="test-uuid-12345"
        )
        
        db_session.add(user)
        db_session.flush()
        
        # Verify user was created
        retrieved_user = db_session.query(User).filter(User.email == "integration_new@test.com").first()
        assert retrieved_user is not None
        assert retrieved_user.full_name == "Integration Test User"
        assert retrieved_user.role == "personnel"
    
    def test_update_user(self, db_session):
        """Test updating an existing user."""
        # Create user
        user = User(
            full_name="Update Test",
            email="update@test.com",
            role="personnel",
            voice_uuid="update-uuid"
        )
        db_session.add(user)
        db_session.flush()
        
        # Update user
        user.role = "admin"
        db_session.flush()
        
        # Verify update
        retrieved_user = db_session.query(User).filter(User.email == "update@test.com").first()
        assert retrieved_user.role == "admin"
    
    def test_delete_user(self, db_session):
        """Test deleting a user."""
        # Create user
        user = User(
            full_name="Delete Test",
            email="delete@test.com",
            role="personnel",
            voice_uuid="delete-uuid"
        )
        db_session.add(user)
        db_session.flush()
        
        # Delete user
        db_session.delete(user)
        db_session.flush()
        
        # Verify deletion
        retrieved_user = db_session.query(User).filter(User.email == "delete@test.com").first()
        assert retrieved_user is None
    
    def test_unique_email_constraint(self, db_session):
        """Test that email uniqueness is enforced."""
        user1 = User(
            full_name="User 1",
            email="unique@test.com",
            role="personnel",
            voice_uuid="uuid-1"
        )
        db_session.add(user1)
        db_session.commit()
        
        # Try to create another user with same email
        user2 = User(
            full_name="User 2",
            email="unique@test.com",
            role="admin",
            voice_uuid="uuid-2"
        )
        db_session.add(user2)
        
        # Should raise integrity error
        with pytest.raises(Exception):
            db_session.flush()
    
    def test_query_users_by_role(self, db_session):
        """Test querying users by role."""
        # Create multiple users
        users = [
            User(full_name=f"User {i}", email=f"user{i}@test.com", 
                 role="personnel" if i % 2 == 0 else "admin", 
                 voice_uuid=f"uuid-{i}")
            for i in range(5)
        ]
        
        for user in users:
            db_session.add(user)
        db_session.flush()
        
        # Query personnel
        personnel = db_session.query(User).filter(User.role == "personnel").all()
        assert len(personnel) >= 3  # At least the ones we created


# ============================================================================
# Milvus Integration Tests
# ============================================================================

@pytest.mark.integration
class TestMilvusIntegration:
    """Test suite for Milvus vector database operations."""
    
    def test_insert_vector(self, milvus_client):
        """Test inserting a vector into Milvus."""
        # Create a random 192-d vector
        vector = np.random.randn(192).astype(np.float32)
        vector = vector / np.linalg.norm(vector)  # Normalize
        
        # Insert vector
        vector_id = "test-vector-001"
        result = milvus_client.insert(
            collection_name="voiceprints",
            data=[{
                "id": vector_id,
                "embedding": vector.tolist()
            }]
        )
        
        assert result is not None
    
    def test_search_vector(self, milvus_client):
        """Test searching for similar vectors."""
        # Insert a vector
        vector = np.random.randn(192).astype(np.float32)
        vector = vector / np.linalg.norm(vector)
        
        vector_id = "test-search-001"
        milvus_client.insert(
            collection_name="voiceprints",
            data=[{
                "id": vector_id,
                "embedding": vector.tolist()
            }]
        )
        
        # Search for the same vector
        results = milvus_client.search(
            collection_name="voiceprints",
            data=[vector.tolist()],
            limit=5
        )
        
        assert results is not None
        assert len(results) > 0
        # Should find the exact match
        assert results[0][0]["id"] == vector_id
        assert results[0][0]["distance"] > 0.99  # Very high similarity
    
    def test_search_similar_vectors(self, milvus_client):
        """Test finding similar but not identical vectors."""
        # Insert original vector
        vector1 = np.random.randn(192).astype(np.float32)
        vector1 = vector1 / np.linalg.norm(vector1)
        
        milvus_client.insert(
            collection_name="voiceprints",
            data=[{
                "id": "similar-001",
                "embedding": vector1.tolist()
            }]
        )
        
        # Create slightly modified vector
        vector2 = vector1 + np.random.normal(0, 0.1, 192).astype(np.float32)
        vector2 = vector2 / np.linalg.norm(vector2)
        
        # Search
        results = milvus_client.search(
            collection_name="voiceprints",
            data=[vector2.tolist()],
            limit=5
        )
        
        assert results is not None
        assert len(results) > 0
        # Should find similar vector with good but not perfect similarity
        assert results[0][0]["distance"] > 0.7


# ============================================================================
# Database Integration Tests
# ============================================================================

@pytest.mark.integration
class TestDatabaseIntegration:
    """Test integration between PostgreSQL and Milvus."""
    
    def test_user_voiceprint_linkage(self, db_session, milvus_client):
        """Test linking user metadata in PostgreSQL with voiceprint in Milvus."""
        # Create user in PostgreSQL
        voice_uuid = "integration-link-001"
        user = User(
            full_name="Link Test User",
            email="link@test.com",
            role="personnel",
            voice_uuid=voice_uuid
        )
        db_session.add(user)
        db_session.flush()
        
        # Create voiceprint in Milvus
        vector = np.random.randn(192).astype(np.float32)
        vector = vector / np.linalg.norm(vector)
        
        milvus_client.insert(
            collection_name="voiceprints",
            data=[{
                "id": voice_uuid,
                "embedding": vector.tolist()
            }]
        )
        
        # Verify linkage
        # 1. Get user from PostgreSQL
        retrieved_user = db_session.query(User).filter(User.email == "link@test.com").first()
        assert retrieved_user is not None
        assert retrieved_user.voice_uuid == voice_uuid
        
        # 2. Search Milvus using the voice_uuid
        results = milvus_client.search(
            collection_name="voiceprints",
            data=[vector.tolist()],
            limit=1
        )
        
        assert results is not None
        assert len(results) > 0
        assert results[0][0]["id"] == voice_uuid
    
    def test_concurrent_database_access(self, db_session, milvus_client):
        """Test concurrent access to both databases."""
        import concurrent.futures
        
        from database.postgres_client import SessionLocal

        def create_user_and_vector(index):
            # Create fresh session for thread
            session = SessionLocal()
            try:
                # Create user
                user = User(
                    full_name=f"Concurrent User {index}",
                    email=f"concurrent{index}@test.com",
                    role="personnel",
                    voice_uuid=f"concurrent-uuid-{index}"
                )
                session.add(user)
                session.commit()
            finally:
                session.close()
            
            # Create vector
            vector = np.random.randn(192).astype(np.float32)
            vector = vector / np.linalg.norm(vector)
            
            milvus_client.insert(
                collection_name="voiceprints",
                data=[{
                    "id": f"concurrent-uuid-{index}",
                    "embedding": vector.tolist()
                }]
            )
            
            return True
        
        # Create multiple users concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(create_user_and_vector, i) for i in range(3)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        assert all(results)
