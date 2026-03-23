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

# Helper for run_in_threadpool which needs a function
def _load_audio_file(path):
    return load_audio(path)

def _liveness_analyze(audio):
    return liveness_detector.analyze(audio)

def _verify_challenge_wrapper(path, phrase):
    return verify_challenge(path, phrase)

def _model_extract(audio):
    return model.extract_embedding(audio)


from database.postgres_client import init_db, log_auth, create_user, get_user_by_voice_uuid, get_user_by_id
from config.settings import SIMILARITY_THRESHOLD, RE_ENROLLMENT_PERIOD_DAYS
from api.auth import router as auth_router, get_current_active_user, get_current_admin_user
from core.security import get_password_hash
from fastapi import Depends, Query
from schemas import UserResponse
from starlette.concurrency import run_in_threadpool


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
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: {file.filename}") 
        
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
                "message": f"Spoof detected: {liveness['reason']}"
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
    password: Optional[str] = Form(None),
    sample_1: UploadFile = File(...),
    sample_2: UploadFile = File(...),
    sample_3: UploadFile = File(...),
    challenge_phrases: Optional[str] = Form(None) # JSON list of phrases
):
    # Parse Challenge Phrases
    phrases_list = []
    if challenge_phrases:
        try:
            parsed = json.loads(challenge_phrases)
            if isinstance(parsed, list):
                phrases_list = [str(x) for x in parsed]
            print(f"DEBUG: Validating against {len(phrases_list)} challenge phrases.")
        except Exception as e:
            print(f"DEBUG: Failed to parse challenge phrases: {e}")

    # ---------------------------------------------------------
    # 1. PROCESS AUDIO & EXTRACT EMBEDDINGS
    # ---------------------------------------------------------
    # We process 3 distinct samples to build a robust voice profile.
    # Each sample is checked for:
    #   a. File Format (WAV/WEBM/etc)
    #   b. Challenge Phrase Compliance (Anti-Replay)
    #   c. Liveness (Anti-Spoofing via RawNet2)
    samples = [sample_1, sample_2, sample_3]
    embeddings = []

    try:
        for i, file in enumerate(samples):
            if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):
                raise HTTPException(status_code=400, detail=f"Unsupported audio format: {file.filename}") 
            
            # Write to temp
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name
            
            try:
                # Load and Extract
                audio = await run_in_threadpool(_load_audio_file, tmp_path)

                # Challenge Phrase Verification
                if phrases_list and i < len(phrases_list):
                    expected_phrase = phrases_list[i]
                    print(f"DEBUG: Verifying Sample {i+1} against phrase '{expected_phrase}'")
                    is_valid, score, transcribed = await run_in_threadpool(_verify_challenge_wrapper, tmp_path, expected_phrase)
                    print(f"DEBUG: Transcription: '{transcribed}' (Score: {score})")
                    if transcribed == "ASR_UNAVAILABLE":
                        print(f"DEBUG: ASR unavailable. Failing challenge verification for Sample {i+1}.")
                        raise HTTPException(status_code=500, detail="ASR unavailable. Cannot verify challenge phrase.")
                    else:
                        if not is_valid:
                            print(f"DEBUG: Phrase Mismatch for Sample {i+1}. Expected: '{expected_phrase}', Got: '{transcribed}'")
                            raise HTTPException(
                                status_code=400, 
                                detail=f"Verification Failed for Sample {i+1}: Phrase Mismatch. You said: '{transcribed}'"
                            )
                        print(f"Sample {i+1} Verified: Matches '{expected_phrase}'")

                # Liveness Check
                liveness = await run_in_threadpool(_liveness_analyze, audio)
                print(f"DEBUG: Sample {i+1} Liveness: {liveness}")
                if not liveness["is_live"]:
                    print(f"DEBUG: Spoof detected in sample {i+1}: {liveness['reason']}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Spoof detected in {file.filename}: {liveness['reason']}"
                    )

                emb = await run_in_threadpool(_model_extract, audio)
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
        existing_match = await run_in_threadpool(search_embedding, mean_embedding, top_k=1)
        
        if existing_match and len(existing_match) > 0 and existing_match[0].distance > 0.85: # Strict threshold for duplicates
            print(f"Security Alert: Duplicate Biometric Detected. Score: {existing_match[0].distance}")
            raise HTTPException(
                status_code=409,
                detail="Biometric Security Alert: Voice signature already registered under another identity."
            )

        # ---------------------------------------------------------
        # 3. CREATE IDENTITY
        # ---------------------------------------------------------
        # Generate a semi-random Speaker ID (Human Readable)
        # Format: AAA1234567 (3 Letters + 7 Alphanumeric)
        clean_name = re.sub(r'[^a-zA-Z]', '', full_name)
        if not clean_name:
            clean_name = string.ascii_letters 
        
        prefix = ''.join(random.choices(clean_name, k=3))
        suffix_chars = string.ascii_letters + string.digits
        suffix = ''.join(random.choices(suffix_chars, k=7))
        speaker_id = prefix + suffix
        
        # Generate new anonymous UUID for Vector DB (Privacy)
        # The Vector DB only knows this UUID, not the User's Name.
        voice_uuid = str(uuid.uuid4())
        
        hashed_pw = get_password_hash(password) if password else None
        
        # Create User in Relational DB (Postgres)
        # Handles user profile storage and links to the generated IDs
        user_obj = await run_in_threadpool(create_user, full_name, email, role, user_id=speaker_id, hashed_password=hashed_pw, voice_uuid=voice_uuid)
        speaker_id = user_obj.id 

        # ---------------------------------------------------------
        # 4. STORE VECTOR DATA
        # ---------------------------------------------------------
        # Insert the averaged 192-d vector into Milvus
        await run_in_threadpool(insert_embedding, voice_uuid, mean_embedding)
        
        # ---------------------------------------------------------
        # 5. COMMIT AUDIT LOG
        # ---------------------------------------------------------
        await run_in_threadpool(log_auth, speaker_id, 1.0, "ENROLLED")

        return {
            "status": "success",
            "user_id": speaker_id,
            "message": f"User {full_name} enrolled successfully with 3-sample average."
        }

    except HTTPException as he:
        print(f"DEBUG: HTTPException in enroll: {he.detail}")
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
def list_users(current_user: UserResponse = Depends(get_current_admin_user)):
    from database.postgres_client import get_all_users
    users = get_all_users()
    return users


@app.delete("/users/{user_id}")
async def delete_user_endpoint(
    user_id: str,
    current_user: UserResponse = Depends(get_current_admin_user)
):
    from database.postgres_client import delete_user
    from database.milvus_client import delete_embedding
    
    print(f"DEBUG: Admin {current_user.id} requested deletion of user {user_id}")
    
    try:
        # Delete from Postgres
        voice_uuid = await run_in_threadpool(delete_user, user_id)
        
        if not voice_uuid:
             raise HTTPException(status_code=404, detail="User not found")

        # Delete from Milvus (Vector DB)
        if voice_uuid:
             await run_in_threadpool(delete_embedding, voice_uuid)

        print(f"User {user_id} and associated vector data deleted.")
        return {"status": "success", "message": f"User {user_id} deleted successfully."}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"ERROR: Failed to delete user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
    speaker_id: Optional[str] = Query(None),
    challenge_phrase: Optional[str] = Form(None) # Client sends the phrase they were asked to say
):
    if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):
         raise HTTPException(status_code=400, detail=f"Unsupported audio format: {file.filename}") 
    
    # Write to temp
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # 1. Load Audio
        audio = await run_in_threadpool(_load_audio_file, tmp_path)

        # 2. Duration Check
        duration = librosa.get_duration(y=audio, sr=16000)
        print(f"DEBUG: Audio Duration: {duration}s")
        from config.settings import MIN_AUDIO_DURATION
        
        if duration < MIN_AUDIO_DURATION:
             return {
                "verified": False,
                "similarity_score": 0.0,
                "matched_speaker_id": None,
                "error_code": "DURATION_TOO_SHORT",
                "message": f"Audio too short ({duration:.2f}s). Please speak for at least {MIN_AUDIO_DURATION} seconds."
            }

        # ---------------------------------------------------------
        # 3. Liveness Check (RawNet2 + Heuristic) - PRIORITIZED
        # ---------------------------------------------------------
        # We check liveness FIRST to detect AI voices immediately.
        liveness = await run_in_threadpool(_liveness_analyze, audio)
        print(f"DEBUG: Liveness Result: {liveness}")
        
        # If liveness fails, classify the failure mode
        if not liveness["is_live"]:
            status = liveness.get("status", "spoof")
            error_code = "SPOOF_DETECTED"
            message = f"Spoof detected: {liveness['reason']}"
            spoof_flag = True
            decision_label = "SPOOF_REJECTED"

            if status in ("too_far", "bad_audio"):
                spoof_flag = False
                if status == "too_far":
                    error_code = "MIC_TOO_FAR"
                    message = "Voice signal too weak or distant. Please move closer to the microphone and try again."
                    decision_label = "MIC_TOO_FAR"
                else:
                    error_code = "AUDIO_QUALITY_LOW"
                    message = "Audio quality too low for verification. Check your microphone and environment."
                    decision_label = "AUDIO_QUALITY_LOW"

            try:
                await run_in_threadpool(
                    log_auth,
                    speaker_id if speaker_id else "-1",
                    0.0,
                    decision_label
                )
            except Exception as e:
                print(f"Warning: Failed to log liveness failure: {e}")

            return {
                "verified": False,
                "similarity_score": 0.0,
                "matched_speaker_id": None,
                "error_code": error_code,
                "message": message,
                "spoof": spoof_flag,
                "liveness_metrics": liveness
            }

        if challenge_phrase:
            print(f"DEBUG: Verifying Challenge Phrase: '{challenge_phrase}'")
            is_valid_phrase, phrase_score, transcribed_text = await run_in_threadpool(_verify_challenge_wrapper, tmp_path, challenge_phrase)
            
            if transcribed_text == "ASR_UNAVAILABLE":
                print("DEBUG: ASR unavailable. Rejecting verification due to missing challenge check.")
                return {
                    "verified": False,
                    "similarity_score": 0.0,
                    "matched_speaker_id": None,
                    "error_code": "ASR_UNAVAILABLE",
                    "message": "Challenge verification system unavailable. Please try again later.",
                    "spoof": False,
                    "liveness_metrics": liveness
                }
            else:
                if not is_valid_phrase:
                    return {
                        "verified": False,
                        "similarity_score": 0.0,
                        "matched_speaker_id": None,
                        "error_code": "CHALLENGE_FAILED",
                        "message": f"Phrase Mismatch. You said: '{transcribed_text}'. Expected: '{challenge_phrase}'",
                        "spoof": False, # Passed liveness, failed phrase
                        "liveness_metrics": liveness
                    }
                print("Challenge Phrase Verified")

        embedding = await run_in_threadpool(_model_extract, audio)

        # If speaker_id is provided, we filter by it
        print(f"DEBUG: Searching with speaker_id={speaker_id}")
        
        milvus_filter_id = None
        if speaker_id:
             # Resolve Public User ID -> Internal Voice UUID
             user_obj = await run_in_threadpool(get_user_by_id, speaker_id)
             if user_obj and user_obj.voice_uuid:
                 milvus_filter_id = user_obj.voice_uuid
                 print(f"DEBUG: Resolved Public ID {speaker_id} -> Voice UUID {milvus_filter_id}")
             else:
                 print(f"DEBUG: Unknown User ID {speaker_id} or no voice profile.")
                 milvus_filter_id = "NON_EXISTENT_UUID" 

        results = await run_in_threadpool(search_embedding, embedding, speaker_id=milvus_filter_id)
        
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
            # FAST ADAPTIVE THRESHOLDING
            # ---------------------------------------------------------
            # We dynamically adjust the required similarity score based on the
            # confidence of the Liveness check.
            #
            # Logic:
            # - High Liveness Confidence -> Standard Threshold (0.75)
            # - Low Liveness Confidence -> High Threshold (0.88) required
            #
            # This balances usability (False Rejection Rate) with security (False Acceptance Rate).
            from config.settings import ADAPTIVE_THRESHOLD_MIN, ADAPTIVE_THRESHOLD_MAX
            
            # Clamp liveness score to valid 0.0-1.0 range
            live_score = max(0.0, min(1.0, liveness["score"]))
            
            # Linear Interpolation Formula:
            # Threshold = Min + (Max - Min) * (1 - Liveness)
            dynamic_threshold = ADAPTIVE_THRESHOLD_MIN + (ADAPTIVE_THRESHOLD_MAX - ADAPTIVE_THRESHOLD_MIN) * (1.0 - live_score)
            
            print(f"DEBUG: Adaptive Thresholding. Liveness={live_score:.2f} -> Thresh={dynamic_threshold:.2f}")

            if similarity_score >= dynamic_threshold:
                # ---------------------------------------------------------
                # PHASE 2: IDENTITY RESOLUTION & POLICY CHECK
                # ---------------------------------------------------------
                # The Vector DB confirmed "Caller sounds like UUID X".
                # Now we must ask Postgres: "Who is UUID X?"
                
                # 1. Resolve Identity from Postgres
                user = await run_in_threadpool(get_user_by_voice_uuid, matched_uuid)
                
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
                                "message": f"Biometric profile expired ({days_since_enrollment} days old). Please re-enroll.",
                                "spoof": False,
                                "liveness_metrics": liveness
                             }

                    verified = True
                else:
                    print(f"Security Alert: Orphaned Vector UUID {matched_uuid} found in Milvus but not in Postgres.")
            else:
                 print(f"DEBUG: Score {similarity_score:.3f} failed to meet threshold {dynamic_threshold:.3f}")

        # Log Result
        try:
            await run_in_threadpool(
                log_auth,
                matched_user_id if matched_user_id else "UNKNOWN",
                similarity_score,
                "VERIFIED" if verified else "REJECTED"
            )
        except Exception as e:
            print(f"Warning: Failed to log auth attempt: {e}")
        
        return {
            "verified": verified,
            "similarity_score": float(similarity_score),
            "matched_speaker_id": matched_user_id,
            "message": "Verification successful" if verified else "Voice mismatch detected",
            "spoof": False,
            "liveness_metrics": liveness
        }

    except Exception as e:
        print(f"ERROR: Verification Logic Failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Verification Logic Failed: {str(e)}")

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
