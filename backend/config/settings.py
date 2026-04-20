# config/settings.py
import os
import sys
import warnings
import secrets
from dotenv import load_dotenv

warnings.filterwarnings("ignore", message=".*speechbrain.pretrained.*")
warnings.filterwarnings("ignore", message=".*torchaudio.*")
warnings.filterwarnings("ignore", message=".*Using SYMLINK strategy.*")

load_dotenv()

# --- MANDATORY CONFIG ---
def get_env_or_critical(key: str, default=None):
    val = os.getenv(key, default)
    if val is None:
        print(f"CRITICAL ERROR: Environment variable {key} is NOT set.")
        sys.exit(1)
    return val

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Database & Infrastructure
POSTGRES_URL = get_env_or_critical("POSTGRES_URL")
MILVUS_HOST = os.getenv("MILVUS_HOST", "localhost")
MILVUS_PORT = os.getenv("MILVUS_PORT", "19530")
MILVUS_COLLECTION = "speaker_embeddings"

# Security
raw_secret = os.getenv("SECRET_KEY")
if not raw_secret:
    if ENVIRONMENT == "production":
        print("CRITICAL ERROR: SECRET_KEY must be set in production.")
        sys.exit(1)
    raw_secret = secrets.token_hex(32)
    print("WARN: SECRET_KEY not set; generated ephemeral key.")

SECRET_KEY = raw_secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# API Key for System-wide Auth
BIO_VAN_API_KEY = get_env_or_critical("BIO_VAN_API_KEY", "dev-key-123")

# ML Config
ECAPA_MODEL = "speechbrain/spkrec-ecapa-voxceleb"
ADAPTIVE_THRESHOLD_MIN = 0.55
ADAPTIVE_THRESHOLD_MAX = 0.75
VOSK_MODEL_PATH = os.getenv("VOSK_MODEL_PATH", "vosk_model")
SAMPLE_RATE = 16000
MIN_AUDIO_DURATION = 3.0
EMBEDDING_DIM = 192

# Voice Verification Thresholds
VOICE_MATCH_THRESHOLD = float(os.getenv("VOICE_MATCH_THRESHOLD", "0.75"))  # Cosine similarity threshold (0.0 to 1.0)
CHALLENGE_MATCH_THRESHOLD = int(os.getenv("CHALLENGE_MATCH_THRESHOLD", "50"))  # Phrase matching threshold (0 to 100%)
RE_ENROLLMENT_PERIOD_DAYS = 180  # 6 Months Voice Expiry Policy
