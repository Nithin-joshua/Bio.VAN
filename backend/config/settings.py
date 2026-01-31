# config/settings.py

ECAPA_MODEL = "speechbrain/spkrec-ecapa-voxceleb"
SIMILARITY_THRESHOLD = 0.80
SAMPLE_RATE = 16000
MIN_AUDIO_DURATION = 3.0

# PostgreSQL
POSTGRES_URL = "postgresql://postgres:postgres123@localhost:5432/voice_auth01"


# Milvus
MILVUS_COLLECTION = "speaker_embeddings"
EMBEDDING_DIM = 192

# Security
SECRET_KEY = "super-secret-key-please-change-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
