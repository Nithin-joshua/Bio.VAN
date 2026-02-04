from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import tempfile
import os
import random
import string
import uuid
from datetime import datetime
import numpy as np
import librosa
import re

from core.preprocessing import load_audio
from core.speaker_model import ECAPAModel
from core.anti_spoofing import liveness_detector
from core.challenge import verify_challenge
import json
from database.milvus_client import (
    init_milvus,
    search_embedding,
    insert_embedding
)

from database.postgres_client import init_db, log_auth, create_user, get_user_by_voice_uuid, get_user_by_id
from config.settings import SIMILARITY_THRESHOLD, RE_ENROLLMENT_PERIOD_DAYS
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
# Check Liveness (Per Sample)
# -------------------------
@app.post("/check-liveness")
async def check_liveness(file: UploadFile = File(...)):
    """
    Validates a single audio sample for:
    1. Duration (must be > MIN_AUDIO_DURATION)
    2. Liveness (Anti-Spoofing)
    """
    if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):
        pass 
        
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        audio = load_audio(tmp_path)
        
        # Duration Check
        duration = librosa.get_duration(y=audio, sr=16000)
        from config.settings import MIN_AUDIO_DURATION
        
        if duration < MIN_AUDIO_DURATION:
             return {
                "status": "error",
                "message": f"Audio too short ({duration:.2f}s). Please speak for at least {MIN_AUDIO_DURATION} seconds."
            }

        # Liveness Check
        liveness = liveness_detector.analyze(audio)
        if not liveness["is_live"]:
             return {
                "status": "error",
                "message": f"Spoof dectected: {liveness['reason']}"
            }

        return {
            "status": "success",
            "message": "Sample Verified: Live Human Audio Detected."
        }

    except Exception as e:
        print(f"DEBUG: Liveness Check Failed: {e}")
        return {
            "status": "error",
            "message": f"Validation Error: {str(e)}"
        }
    finally:
         if os.path.exists(tmp_path):
            os.remove(tmp_path)


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
    challenge_phrases: Optional[str] = Form(None) # JSON list of phrases
):
    # Parse Challenge Phrases
    phrases_list = []
    if challenge_phrases:
        try:
            phrases_list = json.loads(challenge_phrases)
            print(f"DEBUG: Validating against {len(phrases_list)} challenge phrases.")
        except Exception as e:
            print(f"DEBUG: Failed to parse challenge phrases: {e}")

    # 1. PROCESS AUDIO & EXTRACT EMBEDDINGS (FIRST)
    samples = [sample_1, sample_2, sample_3]
    embeddings = []

    try:
        for i, file in enumerate(samples):
            if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):
                pass 
            
            # Write to temp
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name
            
            try:
                # Load and Extract
                audio = load_audio(tmp_path)

                # Challenge Phrase Verification
                if phrases_list and i < len(phrases_list):
                    expected_phrase = phrases_list[i]
                    is_valid, score, transcribed = verify_challenge(tmp_path, expected_phrase)
                    if not is_valid:
                         raise HTTPException(
                            status_code=400, 
                            detail=f"Verification Failed for Sample {i+1}: Phrase Mismatch. You said: '{transcribed}'"
                        )
                    print(f"✅ Sample {i+1} Verified: Matches '{expected_phrase}'")

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

        # Average Embeddings
        if not embeddings:
            raise HTTPException(status_code=400, detail="No valid audio samples processed")
        
        mean_embedding = np.mean(embeddings, axis=0)
        
        if isinstance(mean_embedding, np.ndarray):
            mean_embedding = mean_embedding.tolist()

        # ---------------------------------------------------------
        # 2. BIOMETRIC DEDUPLICATION (SECURITY CHECK)
        # ---------------------------------------------------------
        # Check if this voiceprint already exists in the system
        existing_match = search_embedding(mean_embedding, top_k=1)
        
        if existing_match and len(existing_match) > 0 and existing_match[0].distance > 0.85: # Strict threshold for duplicates
             print(f"⚠️ Security Alert: Duplicate Biometric Detected! Score: {existing_match[0].distance}")
             raise HTTPException(
                status_code=409,
                detail="Biometric Security Alert: Voice signature already registered under another identity."
             )

        # ---------------------------------------------------------
        # 3. CREATE IDENTITY
        # ---------------------------------------------------------
        
        # Generator User ID Logic
        clean_name = re.sub(r'[^a-zA-Z]', '', full_name)
        if not clean_name:
            clean_name = string.ascii_letters 
        
        prefix = ''.join(random.choices(clean_name, k=3))
        suffix_chars = string.ascii_letters + string.digits
        suffix = ''.join(random.choices(suffix_chars, k=7))
        speaker_id = prefix + suffix
        
        # Generate new anonymous UUID
        voice_uuid = str(uuid.uuid4())
        
        # Create User (Upsert logic handles email conflicts)
        user_obj = create_user(full_name, email, role, user_id=speaker_id, hashed_password=None, voice_uuid=voice_uuid)
        speaker_id = user_obj.id 

        # 4. Store Vector
        insert_embedding(voice_uuid, mean_embedding)
        
        # 5. Log Action
        log_auth(speaker_id, 1.0, "ENROLLED")

        return {
            "status": "success",
            "user_id": speaker_id,
            "message": f"User {full_name} enrolled successfully with 3-sample average."
        }

    except HTTPException as he:
        raise he
    except Exception as e:
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
# -------------------------
# Challenge-Response (Anti-Replay)
# -------------------------
from core.challenge import generate_challenge, verify_challenge
from core.security import create_access_token # Re-using this or similar

@app.get("/challenge")
async def get_challenge(count: int = 1):
    """Returns one or more random phrases."""
    phrases = generate_challenge(count)
    if count > 1:
        return {"phrases": phrases}
    return {"phrase": phrases}


@app.post("/verify")
async def verify(
    file: UploadFile = File(...),
    speaker_id: Optional[str] = None,
    challenge_phrase: Optional[str] = Form(None) # Client sends the phrase they were asked to say
):
    if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):
         # Frontend sends .wav now, but good to be permissive
        pass 
    
    # Write to temp
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # 1. Challenge-Response Check (Anti-Replay)
        # If a challenge phrase was expected, verify it first using ASR
        if challenge_phrase:
            print(f"DEBUG: Verifying Challenge Phrase: '{challenge_phrase}'")
            is_valid_phrase, phrase_score, transcribed_text = verify_challenge(tmp_path, challenge_phrase)
            
            if not is_valid_phrase:
                return {
                    "verified": False,
                    "similarity_score": 0.0,
                    "matched_speaker_id": None,
                    "error_code": "CHALLENGE_FAILED",
                    "message": f"Phrase Mismatch. You said: '{transcribed_text}'. Expected: '{challenge_phrase}'"
                }
            print("✅ Challenge Phrase Verified")

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

        # Liveness Check (RawNet2 + Heuristic)
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
                "error_code": "SPOOF_DETECTED",
                "message": f"Spoof detected: {liveness['reason']}"
            }

        embedding = model.extract_embedding(audio)

        # If speaker_id is provided, we filter by it
        print(f"DEBUG: Searching with speaker_id={speaker_id}")
        
        milvus_filter_id = None
        if speaker_id:
             # Resolve Public User ID -> Internal Voice UUID
             user_obj = get_user_by_id(speaker_id)
             if user_obj and user_obj.voice_uuid:
                 milvus_filter_id = user_obj.voice_uuid
                 print(f"DEBUG: Resolved Public ID {speaker_id} -> Voice UUID {milvus_filter_id}")
             else:
                 print(f"DEBUG: Unknown User ID {speaker_id} or no voice profile.")
                 # If user asks to verify against ID X but ID X doesn't exist, we should probably fail early 
                 # or let it search globally? 
                 # Security-wise: Fail early looks better, but let's stick to existing logic 
                 # which is 'filter if provided'. If not found, filters by None?
                 # Actually if speaker_id is provided but valid UUID not found, we effectively can't verify 
                 # against THAT user.
                 # Let's pass a dummy filter or handle it.
                 # If we pass None, it searches EVERYONE, which might be a bypass if 
                 # attacker knows ID exists but has no UUID? No.
                 # If user doesn't exist, we can't match them.
                 milvus_filter_id = "NON_EXISTENT_UUID" 

        results = search_embedding(embedding, speaker_id=milvus_filter_id)
        
        verified = False
        similarity_score = 0.0
        matched_uuid = None
        matched_user_id = None
        
        if results:
            best_match = results[0]
            matched_uuid = best_match.id # This is the voice_uuid from Milvus
            similarity_score = best_match.distance  
            print(f"DEBUG: Match Found in Vector DB. UUID={matched_uuid}, Score={similarity_score}")
            
            # ---------------------------------------------------------
            # ADAPTIVE SECURITY LOGIC
            # ---------------------------------------------------------
            # Adjust threshold based on Liveness Confidence.
            # Liveness Score range: 0.0 (Spoof) -> 1.0 (Real)
            
            # Linear Interpolation for dynamic threshold:
            # if liveness=1.0 -> thresh=0.75 (easier)
            # if liveness=0.6 -> thresh=0.88 (harder)
            from config.settings import ADAPTIVE_THRESHOLD_MIN, ADAPTIVE_THRESHOLD_MAX
            
            # Clamp liveness score
            live_score = max(0.0, min(1.0, liveness["score"]))
            
            # Invert: Higher score = Lower threshold required
            # Formula: Min + (Max - Min) * (1 - Liveness)
            dynamic_threshold = ADAPTIVE_THRESHOLD_MIN + (ADAPTIVE_THRESHOLD_MAX - ADAPTIVE_THRESHOLD_MIN) * (1.0 - live_score)
            
            print(f"DEBUG: Adaptive Thresholding. Liveness={live_score:.2f} -> Thresh={dynamic_threshold:.2f}")

            if similarity_score >= dynamic_threshold:
                # ---------------------------------------------------------
                # PHASE 2: IDENTITY RESOLUTION & POLICY CHECK
                # ---------------------------------------------------------
                # The Vector DB confirmed "Caller sounds like UUID X".
                # Now we must ask Postgres: "Who is UUID X?"
                
                # 1. Resolve Identity from Postgres
                user = get_user_by_voice_uuid(matched_uuid)
                
                if user:
                    matched_user_id = user.id
                    
                    # 2. Check for Voice Expiry (Re-enrollment Policy)
                    # Biometric data drifts over time (Aging/Health).
                    # We enforce a hard expiry to ensure the model stays accurate.
                    if user.enrolled_at:
                        days_since_enrollment = (datetime.utcnow() - user.enrolled_at).days
                        if days_since_enrollment > RE_ENROLLMENT_PERIOD_DAYS:
                             print(f"Security Alert: Voice expired for {user.id}. Age: {days_since_enrollment} days.")
                             return {
                                "verified": False,
                                "similarity_score": float(similarity_score),
                                "matched_speaker_id": user.id,
                                "error_code": "VOICE_EXPIRED",
                                "message": f"Biometric profile expired ({days_since_enrollment} days old). Please re-enroll."
                             }

                    verified = True
                else:
                    print(f"Security Alert: Orphaned Vector UUID {matched_uuid} found in Milvus but not in Postgres.")
            else:
                 print(f"DEBUG: Score {similarity_score:.3f} failed to meet threshold {dynamic_threshold:.3f}")

        # Log Result
        log_auth(
            matched_user_id if matched_user_id else "UNKNOWN",
            similarity_score,
            "VERIFIED" if verified else "REJECTED"
        )
        
        return {
            "verified": verified,
            "similarity_score": float(similarity_score),
            "matched_speaker_id": matched_user_id,
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
