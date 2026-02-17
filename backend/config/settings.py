# config/settings.py
import os
import warnings
import secrets
from dotenv import load_dotenv

warnings.filterwarnings("ignore", message=".*speechbrain.pretrained.*")
warnings.filterwarnings("ignore", message=".*torchaudio.*")
warnings.filterwarnings("ignore", message=".*Using SYMLINK strategy.*")

load_dotenv()

ECAPA_MODEL = "speechbrain/spkrec-ecapa-voxceleb"
SIMILARITY_THRESHOLD = 0.80
ADAPTIVE_THRESHOLD_MIN = 0.55
ADAPTIVE_THRESHOLD_MAX = 0.75
VOSK_MODEL_PATH = os.getenv("VOSK_MODEL_PATH", "vosk_model")
SAMPLE_RATE = 16000
MIN_AUDIO_DURATION = 3.0

# PostgreSQL
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://user:pass@localhost:5432/db")

# Milvus
MILVUS_COLLECTION = "speaker_embeddings"
EMBEDDING_DIM = 192

raw_secret = os.getenv("SECRET_KEY")
if not raw_secret:
    raw_secret = secrets.token_hex(32)
    print("WARN: SECRET_KEY not set; generated ephemeral key for this session. Set SECRET_KEY for production.")
SECRET_KEY = raw_secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
RE_ENROLLMENT_PERIOD_DAYS = 180  # 6 Months Voice Expiry Policy
