from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import tempfile
import os
import numpy as np

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
@app.post("/enroll")
async def enroll(
    full_name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    password: str = Form(...),
    sample_1: UploadFile = File(...),
    sample_2: UploadFile = File(...),
    sample_3: UploadFile = File(...),
):
    # 1. Create User in DB
    try:
        hashed_pw = get_password_hash(password)
        user = create_user(full_name, email, role, hashed_password=hashed_pw)
        speaker_id = user.id
    except Exception as e:
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
        raise HTTPException(status_code=500, detail=f"Enrollment Logic Failed: {str(e)}")



# -------------------------
# Admin: List Users
# -------------------------
@app.get("/users")
def list_users(current_user: dict = Depends(get_current_admin_user)):
    from database.postgres_client import get_all_users
    users = get_all_users()
    return users


# -------------------------
# Verify / Identify Speaker
# -------------------------
@app.post("/verify")
async def verify(
    file: UploadFile = File(...),
    speaker_id: Optional[int] = None,
    current_user: dict = Depends(get_current_active_user)
):
    if not file.filename.lower().endswith(".wav"):
        raise HTTPException(
            status_code=400,
            detail="Only WAV files are supported"
        )

    with tempfile.NamedTemporaryFile(
        suffix=".wav",
        delete=False
    ) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        audio = load_audio(tmp_path)
        
        # Liveness Check
        liveness = liveness_detector.analyze(audio)
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

        results = search_embedding(embedding)

        if not results or not results[0]:
            log_auth(
                speaker_id if speaker_id else -1,
                0.0,
                "FAIL"
            )
            return {
                "verified": False,
                "similarity_score": 0.0,
                "matched_speaker_id": None
            }

        hit = results[0][0]
        matched_speaker_id = hit.entity.get("speaker_id")
        similarity_score = float(hit.distance)

        verified = (
            similarity_score >= SIMILARITY_THRESHOLD and
            (
                speaker_id is None or
                matched_speaker_id == speaker_id
            )
        )

        log_auth(
            speaker_id if speaker_id else matched_speaker_id,
            similarity_score,
            "SUCCESS" if verified else "FAIL"
        )

        return {
            "verified": verified,
            "similarity_score": similarity_score,
            "matched_speaker_id": matched_speaker_id
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
