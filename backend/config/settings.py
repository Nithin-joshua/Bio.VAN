# config/settings.py
import os
from dotenv import load_dotenv

load_dotenv()

ECAPA_MODEL = "speechbrain/spkrec-ecapa-voxceleb"
SIMILARITY_THRESHOLD = 0.80 # Base legacy threshold
ADAPTIVE_THRESHOLD_MIN = 0.75 # If liveness is perfect
ADAPTIVE_THRESHOLD_MAX = 0.90 # If liveness is suspicious
SAMPLE_RATE = 16000
MIN_AUDIO_DURATION = 3.0

# PostgreSQL
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://user:pass@localhost:5432/db")

# Milvus
MILVUS_COLLECTION = "speaker_embeddings"
EMBEDDING_DIM = 192

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "insecure-default-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
RE_ENROLLMENT_PERIOD_DAYS = 180  # 6 Months Voice Expiry Policy
