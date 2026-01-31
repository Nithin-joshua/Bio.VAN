# database/postgres_client.py

from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config.settings import POSTGRES_URL

Base = declarative_base()
engine = create_engine(POSTGRES_URL)
SessionLocal = sessionmaker(bind=engine)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(String)
    hashed_password = Column(String, nullable=True)
    voice_profile_status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

class AuthLog(Base):
    __tablename__ = "auth_logs"

    id = Column(Integer, primary_key=True)
    speaker_id = Column(Integer)
    score = Column(Float)
    decision = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(engine)

def create_user(full_name: str, email: str, role: str, hashed_password: str = None):
    session = SessionLocal()
    try:
        # Check if user exists
        existing_user = session.query(User).filter(User.email == email).first()
        if existing_user:
            return existing_user
        
        new_user = User(
            full_name=full_name,
            email=email,
            role=role,
            hashed_password=hashed_password,
            voice_profile_status="active"
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

def get_all_users():
    session = SessionLocal()
    try:
        users = session.query(User).all()
        return users
    finally:
        session.close()

def log_auth(speaker_id, score, decision):
    session = SessionLocal()
    log = AuthLog(
        speaker_id=speaker_id,
        score=score,
        decision=decision
    )
    session.add(log)
    session.commit()
    session.close()
