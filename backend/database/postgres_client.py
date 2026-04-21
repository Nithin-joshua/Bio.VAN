# database/postgres_client.py

import uuid
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config.settings import POSTGRES_URL

Base = declarative_base()

# Connection pooling with production-ready settings
engine = create_engine(
    POSTGRES_URL,
    pool_size=10,                    # Keep 10 connections open
    max_overflow=20,                 # Allow 20 temporary overflow connections
    pool_recycle=3600,              # Recycle connections after 1 hour
    pool_pre_ping=True,             # Test connections before using (avoid stale connections)
    echo=False,
    connect_args={
        'connect_timeout': 10
    }
)

# Event listener to handle pool checkout errors
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Handle connection initialization"""
    pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(String)
    hashed_password = Column(String, nullable=True)
    voice_profile_status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Security Architecture Updates
    voice_uuid = Column(String, unique=True, nullable=True) # Anonymized ID for Vector DB
    enrolled_at = Column(DateTime, default=datetime.utcnow) # For Voice Expiry Policy
    biometric_synced = Column(Boolean, default=False) # Biometric database health link

class AuthLog(Base):
    __tablename__ = "auth_logs"

    id = Column(Integer, primary_key=True)
    speaker_id = Column(String)
    score = Column(Float)
    decision = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(engine)

def create_user(full_name: str, email: str, role: str, user_id: str, hashed_password: str = None, voice_uuid: str = None, status: str = "pending"):
    session = SessionLocal()
    try:
        # Check if user exists by ID or Email
        existing_user = session.query(User).filter((User.id == user_id) | (User.email == email)).first()
        if existing_user:
            # Update existing user's details if provided
            if hashed_password:
                existing_user.hashed_password = hashed_password
            if full_name:
                existing_user.full_name = full_name
            if email:
                existing_user.email = email
            if role:
                existing_user.role = role
            # Reset voice profile status and enrollment time
            existing_user.voice_profile_status = status
            existing_user.enrolled_at = datetime.utcnow()
            if voice_uuid:
                 existing_user.voice_uuid = voice_uuid
            
            session.commit()
            session.refresh(existing_user)
            return existing_user
        
        new_user = User(
            id=user_id,
            full_name=full_name,
            email=email,
            role=role,
            hashed_password=hashed_password,
            voice_profile_status=status,
            voice_uuid=voice_uuid,
            enrolled_at=datetime.utcnow()
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return new_user
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def update_user_status(user_id: str, status: str, biometric_synced: bool = None):
    session = SessionLocal()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if user:
            user.voice_profile_status = status
            if biometric_synced is not None:
                user.biometric_synced = biometric_synced
            session.commit()
            return True
        return False
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def get_all_users():
    session = SessionLocal()
    try:
        users = session.query(User).all()
        return users
    finally:
        session.close()

def get_user_by_voice_uuid(voice_uuid: str):
    session = SessionLocal()
    try:
        return session.query(User).filter(User.voice_uuid == voice_uuid).first()
    finally:
        session.close()

def log_auth(speaker_id, score, decision):
    session = SessionLocal()
    try:
        log = AuthLog(
            speaker_id=speaker_id,
            score=score,
            decision=decision
        )
        session.add(log)
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def delete_user(user_id: str):
    session = SessionLocal()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        voice_uuid = user.voice_uuid
        session.delete(user)
        session.commit()
        return voice_uuid
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def get_user_by_id(user_id: str):
    session = SessionLocal()
    try:
        return session.query(User).filter(User.id == user_id).first()
    finally:
        session.close()

def get_user_by_email(email: str):
    """Get user by email to check enrollment status"""
    session = SessionLocal()
    try:
        return session.query(User).filter(User.email == email).first()
    finally:
        session.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
