import asyncio
import sys
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header, Request, Query, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import tempfile
import os
import random
import string
import uuid
import time
from datetime import datetime
import numpy as np
import librosa
import re
import json
from loguru import logger

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from core.preprocessing import load_audio
from core.speaker_model import ECAPAModel
from core.anti_spoofing import liveness_detector
from core.challenge import verify_challenge
from database.milvus_client import (
    init_milvus,
    search_embedding,
    insert_embedding
)
from database.postgres_client import init_db, log_auth, create_user, get_user_by_voice_uuid, get_user_by_id, get_user_by_email, get_all_users, update_user_status, delete_user
from config.settings import RE_ENROLLMENT_PERIOD_DAYS, BIO_VAN_API_KEY, VOICE_MATCH_THRESHOLD, CHALLENGE_MATCH_THRESHOLD
from api.auth import router as auth_router, get_current_active_user, get_current_admin_user
from core.security import get_password_hash
from schemas import UserResponse
from config.settings import ENVIRONMENT

# -------------------------
# Setup Logging & Rate Limiting
# -------------------------
logger.remove()

# Filter to ensure request_id always exists in extra context
def add_default_request_id(record):
    if "request_id" not in record["extra"]:
        record["extra"]["request_id"] = "startup"
    return True

logger.add(sys.stdout, format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{extra[request_id]}</cyan> - <level>{message}</level>", filter=add_default_request_id)

limiter = Limiter(key_func=get_remote_address)

# -------------------------
# Security Dependencies
# -------------------------
async def verify_api_key(x_api_key: Optional[str] = Header(None)):
    # In development mode, API key is optional for easier testing
    if ENVIRONMENT == "development":
        if x_api_key:
            logger.info(f"API Key provided in dev mode: {x_api_key[:10]}...")
        else:
            logger.info("No API Key provided in dev mode - allowed")
        return x_api_key or "dev-mode"
    
    # In production, API key is mandatory
    if not x_api_key:
        logger.warning(f"Missing API Key. Expected: {BIO_VAN_API_KEY}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key"
        )
    if x_api_key != BIO_VAN_API_KEY:
        logger.warning(f"Invalid API Key attempt. Received: '{x_api_key}' | Expected: '{BIO_VAN_API_KEY}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    logger.info(f"API Key verified successfully")
    return x_api_key

# -------------------------
# App Initialization
# -------------------------
app = FastAPI(title="Biometric Voice Auth API", dependencies=[Depends(verify_api_key)])
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for Request ID and Logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    with logger.contextualize(request_id=request_id):
        start_time = time.time()
        logger.info(f"Request started: {request.method} {request.url.path}")
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(f"Request finished: {request.method} {request.url.path} | Status: {response.status_code} | Latency: {process_time:.2f}ms")
        response.headers["X-Process-Time"] = str(process_time)
        return response

app.include_router(auth_router)
model = ECAPAModel()

# -------------------------
# Utilities for run_in_executor
# -------------------------
async def run_cpu_bound(func, *args):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, func, *args)

# Helper for run_in_threadpool which needs a function
def _load_audio_file(path):
    return load_audio(path)

def _liveness_analyze(audio):
    return liveness_detector.analyze(audio)

def _verify_challenge_wrapper(path, phrase):
    return verify_challenge(path, phrase)

def _model_extract(audio):
    return model.extract_embedding(audio)

# -------------------------
# Startup Event
# -------------------------
@app.on_event("startup")
def startup_event():
    init_db()
    try:
        init_milvus()
        logger.info("Database and Milvus initialized.")
    except Exception as e:
        logger.error(f"Milvus not available at startup: {e}")

# -------------------------
# Health Check
# -------------------------
@app.get("/health")
def health():
    return {"status": "OK"}


# -------------------------
# Check Liveness (Per Sample)
# -------------------------
@app.post("/check-liveness")
@limiter.limit("20/minute")
async def check_liveness(request: Request, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):
        raise HTTPException(status_code=400, detail=f"Unsupported format: {file.filename}") 
        
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # Load audio (CPU Bound)
        audio = await run_cpu_bound(load_audio, tmp_path)
        
        # Duration Check
        duration = librosa.get_duration(y=audio, sr=16000)
        from config.settings import MIN_AUDIO_DURATION
        
        if duration < MIN_AUDIO_DURATION:
             return {"status": "error", "message": f"Audio too short ({duration:.2f}s)."}

        # Liveness Check (CPU Bound)
        start_inf = time.time()
        liveness = await run_cpu_bound(liveness_detector.analyze, audio)
        logger.info(f"Liveness inference took {(time.time() - start_inf)*1000:.2f}ms")

        if not liveness["is_live"]:
             return {"status": "error", "message": f"Spoof detected: {liveness['reason']}"}

        return {"status": "success", "message": "Live Human Audio Detected."}

    except Exception as e:
        logger.exception("Liveness Check Failed")
        return {"status": "error", "message": f"Validation Error: {str(e)}"}
    finally:
         if os.path.exists(tmp_path):
            os.remove(tmp_path)

# -------------------------
# Enroll Speaker - Helper for Parallel Processing
# -------------------------
async def process_enrollment_sample(file: UploadFile, sample_index: int, challenge_phrase: Optional[str] = None):
    """Process a single enrollment sample (audio verification)"""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    
    try:
        # 1. Load Audio
        audio = await run_cpu_bound(load_audio, tmp_path)
        
        # 2. Challenge Verification (if provided)
        if challenge_phrase:
            is_valid, score, transcribed = await run_cpu_bound(verify_challenge, tmp_path, challenge_phrase, CHALLENGE_MATCH_THRESHOLD)
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Phrase Mismatch in sample {sample_index+1}")
        
        # 3. Liveness Detection
        liveness = await run_cpu_bound(liveness_detector.analyze, audio)
        if not liveness["is_live"]:
            raise HTTPException(status_code=400, detail=f"Spoof detected in sample {sample_index+1}: {liveness['reason']}")
        
        # 4. Embedding Extraction
        emb = await run_cpu_bound(model.extract_embedding, audio)
        return emb
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

# -------------------------
# Enroll Speaker
# -------------------------
@app.post("/enroll")
async def enroll(
    full_name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    password: Optional[str] = Form(None),
    sample_1: UploadFile = File(...),
    sample_2: UploadFile = File(...),
    sample_3: UploadFile = File(...),
    challenge_phrases: Optional[str] = Form(None)
):
    phrases_list = json.loads(challenge_phrases) if challenge_phrases else []
    samples = [sample_1, sample_2, sample_3]
    speaker_id = None
    voice_uuid = str(uuid.uuid4())

    try:
        # CHECK FOR EXISTING ENROLLMENT
        existing_user = await run_cpu_bound(get_user_by_email, email)
        if existing_user:
            if existing_user.voice_profile_status == "active":
                logger.warning(f"Re-enrollment attempt for already active user: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User already enrolled. Speaker ID: {existing_user.id}"
                )
            elif existing_user.voice_profile_status == "pending":
                logger.warning(f"Re-enrollment attempt for pending enrollment: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Previous enrollment still pending. Please try again later."
                )
        
        # PARALLEL PROCESSING: Process all 3 samples concurrently
        logger.info(f"Starting parallel enrollment processing for 3 samples")
        tasks = [
            process_enrollment_sample(samples[i], i, phrases_list[i] if i < len(phrases_list) else None)
            for i in range(len(samples))
        ]
        embeddings = await asyncio.gather(*tasks)

        mean_embedding = np.mean(embeddings, axis=0).tolist()

        # VOICE VERIFICATION: Check if this voice already exists in Milvus
        logger.info(f"Verifying voice against existing embeddings")
        results = await run_cpu_bound(search_embedding, mean_embedding, 1, None)
        
        if results and results[0].distance > VOICE_MATCH_THRESHOLD:
            matched_uuid = results[0].id
            existing_speaker = await run_cpu_bound(get_user_by_voice_uuid, matched_uuid)
            if existing_speaker:
                logger.warning(f"Voice match detected during enrollment. Matches existing speaker: {existing_speaker.id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Voice already present in the system. Similarity score: {results[0].distance:.4f}"
                )

        # ---------------------------------------------------------
        # IDENTITY INITIALIZATION (Dual Write)
        # ---------------------------------------------------------
        # 1. Create in Postgres as PENDING
        clean_name = re.sub(r'[^a-zA-Z]', '', full_name) or "USER"
        speaker_id = clean_name[:3].upper() + "".join(random.choices(string.ascii_uppercase + string.digits, k=7))
        hashed_pw = get_password_hash(password) if password else None
        
        user_obj = await run_cpu_bound(create_user, full_name, email, role, speaker_id, hashed_pw, voice_uuid, "pending")
        
        try:
            # 2. Insert into Milvus
            await run_cpu_bound(insert_embedding, voice_uuid, mean_embedding)
            
            # 3. Mark as ACTIVE
            await run_cpu_bound(update_user_status, speaker_id, "active")
            await run_cpu_bound(log_auth, speaker_id, 1.0, "ENROLLED")
            
            logger.info(f"Enrollment successful for {speaker_id}")
            return {"status": "success", "user_id": speaker_id}
            
        except Exception as milvus_err:
            actual_id = user_obj.id if 'user_obj' in locals() and user_obj else speaker_id
            logger.error(f"Milvus insert failed, rolling back Postgres record for {actual_id}: {milvus_err}")
            await run_cpu_bound(delete_user, actual_id)
            raise HTTPException(status_code=500, detail="Persistence error; enrollment rolled back.")

    except HTTPException: raise
    except Exception as e:
        logger.exception("Enrollment failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/verify")
@limiter.limit("5/minute")
async def verify(
    request: Request,
    file: UploadFile = File(...),
    speaker_id: Optional[str] = Query(None),
    challenge_phrase: Optional[str] = Form(None)
):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # Load & Check duration
        audio = await run_cpu_bound(load_audio, tmp_path)
        duration = librosa.get_duration(y=audio, sr=16000)
        
        if duration < 3.0:
             return {"verified": False, "error_code": "DURATION_TOO_SHORT"}

        # Liveness (CPU Bound)
        liveness = await run_cpu_bound(liveness_detector.analyze, audio)
        if not liveness["is_live"]:
            await run_cpu_bound(log_auth, speaker_id or "UNKNOWN", 0.0, "SPOOF_REJECTED")
            return {"verified": False, "error_code": "SPOOF_DETECTED", "liveness_metrics": liveness}

        # Challenge (CPU Bound)
        if challenge_phrase:
            is_valid, _, _ = await run_cpu_bound(verify_challenge, tmp_path, challenge_phrase, CHALLENGE_MATCH_THRESHOLD)
            if not is_valid:
                return {"verified": False, "error_code": "CHALLENGE_FAILED"}

        # Inference (CPU Bound)
        embedding = await run_cpu_bound(model.extract_embedding, audio)
        
        # Search
        milvus_filter_id = None
        if speaker_id:
            user = await run_cpu_bound(get_user_by_id, speaker_id)
            milvus_filter_id = user.voice_uuid if user else "NON_EXISTENT"

        results = await run_cpu_bound(search_embedding, embedding, 1, milvus_filter_id)
        
        if results and results[0].distance > VOICE_MATCH_THRESHOLD:
            matched_uuid = results[0].id
            user = await run_cpu_bound(get_user_by_voice_uuid, matched_uuid)
            if user:
                await run_cpu_bound(log_auth, user.id, results[0].distance, "VERIFIED")
                logger.info(f"Voice verified for user {user.id} with score {results[0].distance:.4f}")
                return {"verified": True, "similarity_score": float(results[0].distance), "matched_speaker_id": user.id}

        await run_cpu_bound(log_auth, speaker_id or "UNKNOWN", 0.0, "REJECTED")
        logger.warning(f"Voice verification failed - threshold not met")
        return {"verified": False, "message": "Voice mismatch detected"}

    except Exception as e:
        logger.exception("Verification failed")
        raise HTTPException(status_code=500, detail="Internal processing error")
    finally:
        if os.path.exists(tmp_path): os.remove(tmp_path)


# Admin routes
@app.get("/users", response_model=List[UserResponse])
async def list_users(current_user: UserResponse = Depends(get_current_admin_user)):
    return await run_cpu_bound(get_all_users)

@app.delete("/users/{user_id}")
async def delete_user_endpoint(user_id: str, current_user: UserResponse = Depends(get_current_admin_user)):
    try:
        voice_uuid = await run_cpu_bound(delete_user, user_id)
        if voice_uuid:
            from database.milvus_client import delete_embedding
            await run_cpu_bound(delete_embedding, voice_uuid)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Deletion failed: {e}")
        raise HTTPException(status_code=500, detail="Deletion failed")

@app.get("/challenge")
async def get_challenge(count: int = 1):
    """Returns one or more random phrases."""
    from core.challenge import generate_challenge
    phrases = generate_challenge(count)
    if count > 1:
        return {"phrases": phrases}
    return {"phrase": phrases}
