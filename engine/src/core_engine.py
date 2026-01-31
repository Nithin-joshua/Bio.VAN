
from src.utils.audio_loader import load_audio
from core.validation import validate_audio
from core.embedding import extract_embedding
from core.verification import compare_embeddings
from core.decision import decision_from_score
from core.config import SIMILARITY_THRESHOLD


class VoiceAuthEngine:
    def verify(self, file1: str, file2: str) -> dict:
        # Load
        sig1, sr1 = load_audio(file1)
        sig2, sr2 = load_audio(file2)

        # Validate
        validate_audio(sig1, sr1)
        validate_audio(sig2, sr2)

        # Embeddings
        emb1 = extract_embedding(sig1)
        emb2 = extract_embedding(sig2)

        # Compare
        score = compare_embeddings(emb1, emb2)

        # Decide
        decision = decision_from_score(score, SIMILARITY_THRESHOLD)

        return {
            "score": round(float(score), 4),
            "threshold": SIMILARITY_THRESHOLD,
            "verified": decision
        }
