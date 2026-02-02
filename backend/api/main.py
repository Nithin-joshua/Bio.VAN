from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import tempfile
import os
import random
import string
import numpy as np
import librosa
import re

from core.preprocessing import load_audio
from core.speaker_model import ECAPAModel
from core.anti_spoofing import liveness_detector
from database.milvus_client import (
    init_milvus,
    search_embedding,
    insert_embedding
)
from database.postgres_client import init_db, log_auth, create_user
from config.settings import SIMILARITY_THRESHOLD
from api.auth import router as auth_router, get_current_active_user, get_current_admin_user
from core.security import get_password_hash
from fastapi import Depends
from schemas import UserResponse


# -------------------------
# App Initialization
# -------------------------
app = FastAPI(title="Biometric Voice Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

model = ECAPAModel()


# -------------------------
# Startup Event
# -------------------------
@app.on_event("startup")
def startup_event():
    init_db()
    try:
        init_milvus()
    except Exception as e:
        print(" Milvus not available at startup, will retry on demand")
        print(str(e))


# -------------------------
# Health Check
# -------------------------
@app.get("/health")
def health():
    return {"status": "OK"}


# -------------------------
# Enroll Speaker
# -------------------------


# ...

@app.post("/enroll")
async def enroll(
    full_name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    # password: str = Form(...), # Removed by user request
    sample_1: UploadFile = File(...),
    sample_2: UploadFile = File(...),
    sample_3: UploadFile = File(...),
):
    # 1. Create User in DB
    try:
        # Generate ID from name with special format
        # Rule: First 3 chars of First Name + "$" + First 3 chars of Last Name (or similar)
        # "John Doe" -> "joh$doe"
        # "Alice" -> "ali$ice"
        
        # 1. Clean name (keep only letters)
        clean_name = re.sub(r'[^a-zA-Z]', '', full_name)
        
        # Ensure we have enough letters, else pad with random
        if not clean_name:
            # Fallback if name has no letters
            clean_name = string.ascii_letters 
        
        # First 3 digits: Random letters from user's name (alphabets only)
        # Using choices() handles names shorter than 3 chars by repeating
        prefix = ''.join(random.choices(clean_name, k=3))
        
        # Remaining 7 digits: Random alphanumeric
        suffix_chars = string.ascii_letters + string.digits
        suffix = ''.join(random.choices(suffix_chars, k=7))
        
        speaker_id = prefix + suffix
        
        # hashed_pw = get_password_hash(password)
        create_user(full_name, email, role, user_id=speaker_id, hashed_password=None)
    except Exception as e:
        print(f"DEBUG: Database Error in enroll: {e}")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

    # 2. Process Audio Samples
    samples = [sample_1, sample_2, sample_3]
    embeddings = []

    try:
        for file in samples:
            if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):
                 # Frontend sends .webm blobs
                pass 
            
            # Write to temp
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name
            
            try:
                # Load and Extract
                audio = load_audio(tmp_path)

                # Liveness Check
                liveness = liveness_detector.analyze(audio)
                if not liveness["is_live"]:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Spoof detected in {file.filename}: {liveness['reason']}"
                    )

                emb = model.extract_embedding(audio)
                embeddings.append(emb)
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        # 3. Average Embeddings (Mean Vector)
        if not embeddings:
            raise HTTPException(status_code=400, detail="No valid audio samples processed")
        
        # Stack and average
        # embeddings is list of numpy arrays or lists (depending on model output)
        # assuming extract_embedding returns a list or numpy array
        mean_embedding = np.mean(embeddings, axis=0)
        
        # Ensure it's a list for Milvus
        if isinstance(mean_embedding, np.ndarray):
            mean_embedding = mean_embedding.tolist()

        # 4. Store in Vector DB
        insert_embedding(speaker_id, mean_embedding)
        
        # 5. Log Action
        log_auth(speaker_id, 1.0, "ENROLLED")

        return {
            "status": "success",
            "user_id": speaker_id,
            "message": f"User {full_name} enrolled successfully with 3-sample average."
        }

    except Exception as e:
        # TODO: Rollback user creation if vectors fail?
        print(f"DEBUG: Enrollment Logic Failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Enrollment Logic Failed: {str(e)}")



# -------------------------
# Admin: List Users
# -------------------------
@app.get("/users", response_model=List[UserResponse])
def list_users():
    from database.postgres_client import get_all_users
    users = get_all_users()
    return users


# -------------------------
# Verify / Identify Speaker
# -------------------------
@app.post("/verify")
async def verify(
    file: UploadFile = File(...),
    speaker_id: Optional[str] = None,
    # current_user: dict = Depends(get_current_active_user) # Removed to allow public voice verification
):
    if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):
         # Frontend sends .wav now, but good to be permissive
        pass 
    
    # Write to temp
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        audio = load_audio(tmp_path)
        
        # Duration Check
        duration = librosa.get_duration(y=audio, sr=16000)
        print(f"DEBUG: Audio Duration: {duration}s")
        
        # Import MIN_AUDIO_DURATION if not already available
        from config.settings import MIN_AUDIO_DURATION
        
        if duration < MIN_AUDIO_DURATION:
            return {
                "verified": False,
                "similarity_score": 0.0,
                "matched_speaker_id": None,
                "message": f"Audio too short ({duration:.2f}s). Please speak for at least {MIN_AUDIO_DURATION} seconds."
            }

        # Liveness Check
        liveness = liveness_detector.analyze(audio)
        print(f"DEBUG: Liveness Result: {liveness}")
        if not liveness["is_live"]:
            log_auth(
                speaker_id if speaker_id else -1,
                0.0,
                "SPOOF_REJECTED"
            )
            return {
                "verified": False,
                "similarity_score": 0.0,
                "matched_speaker_id": None,
                "message": f"Spoof detected: {liveness['reason']}"
            }

        embedding = model.extract_embedding(audio)

        # If speaker_id is provided, we filter by it
        print(f"DEBUG: Searching with speaker_id={speaker_id}")
        results = search_embedding(embedding, speaker_id=speaker_id)
        
        verified = False
        similarity_score = 0.0
        matched_id = None
        
        if results:
            best_match = results[0]
            matched_id = best_match.id
            # Milvus returns Cosine Similarity in the 'distance' field for COSINE metric
            similarity_score = best_match.distance  
            print(f"DEBUG: Match Found. ID={matched_id}, Score={similarity_score}")
            
            # If specific speaker_id was requested, we only care if that one matched
            if speaker_id is not None:
                if matched_id == speaker_id and similarity_score >= SIMILARITY_THRESHOLD:
                    verified = True
                else:
                    print(f"DEBUG: Verification Failed. Target={speaker_id}, Matched={matched_id}, Score={similarity_score} < {SIMILARITY_THRESHOLD}")
            else:
                # If no ID provided, verify against best match (1:N)
                if similarity_score >= SIMILARITY_THRESHOLD:
                    verified = True
                else:
                    print(f"DEBUG: Verification Failed. Best Match={matched_id}, Score={similarity_score} < {SIMILARITY_THRESHOLD}")
        else:
            print("DEBUG: No results found in Milvus.")

        # Log Result
        log_auth(
            speaker_id if speaker_id else (matched_id if matched_id else -1),
            similarity_score,
            "VERIFIED" if verified else "REJECTED"
        )
        
        return {
            "verified": verified,
            "similarity_score": float(similarity_score),
            "matched_speaker_id": matched_id,
            "message": "Verification successful" if verified else "Voice mismatch detected"
        }

    except Exception as e:
        print(f"ERROR: Verification Logic Failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Verification Logic Failed: {str(e)}")

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
