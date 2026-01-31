# Secure Biometric Voice Authentication – 
Sprint 1 - Day -01

## Overview
This module performs speaker verification using:
- ECAPA-TDNN (SpeechBrain)
- Cosine similarity scoring
- Strict input validation

Raw audio is never stored.

## Requirements
- Python 3.9+
- 16kHz mono WAV files
- Minimum 3 seconds per sample

## Setup
```bash
pip install -r requirements.txt



Sprint 1 – Day 2 & Day 3 Documentation

This project implements a secure biometric voice authentication system using SpeechBrain (ECAPA-TDNN).  
Sprint 1 focuses on core speaker verification and enrollment functionality.

--------------------------------------------------
SPRINT 1 – DAY 2: SPEAKER VERIFICATION (AUDIO ↔ AUDIO)
--------------------------------------------------

Objective:
Implement a speaker verification engine that compares two audio files and determines whether they belong to the same speaker.

What Was Implemented:
- Pretrained ECAPA-TDNN model using SpeechBrain
- Audio loading and preprocessing
- Sample rate enforcement at 16kHz
- Minimum audio duration enforcement (3 seconds)
- Speaker embedding extraction
- Cosine similarity–based comparison
- Threshold-based decision logic (≥ 0.80 = MATCH)

Files Involved:
src/core_engine.py  
src/utils/audio_loader.py  

Errors Faced and Solutions:
- Windows symlink permission error (WinError 1314)
  Cause: SpeechBrain attempted to create symbolic links on Windows
  Solution: Enforced LocalStrategy.COPY for model fetching

- Audio duration too short
  Cause: ECAPA requires sufficient temporal context
  Solution: Enforced minimum duration of 3 seconds

- Incorrect sample rate
  Cause: Input audio not in 16kHz
  Solution: Forced 16kHz resampling during audio loading

Outcome:
- Audio-to-audio verification working correctly
- Stable similarity scores
- Windows-safe execution

--------------------------------------------------
SPRINT 1 – DAY 3: SPEAKER ENROLLMENT (AUDIO → IDENTITY)
--------------------------------------------------

Objective:
Implement a speaker enrollment mechanism that creates a reusable speaker identity template.

What Was Implemented:
- Multi-audio enrollment for the same speaker
- Mean aggregation of speaker embeddings
- L2 normalization of speaker templates
- Secure storage of templates as .npy files
- Template-based verification (audio vs enrolled identity)
- Privacy-by-design (no raw audio storage)

Files Involved:
src/enrollment.py  
src/core_engine.py  
src/main.py  
models/speaker_001.npy  

Errors Faced and Solutions:
- Windows symlink error during enrollment
  Cause: Default SpeechBrain symlink behavior
  Solution: Enforced LocalStrategy.COPY in enrollment module

- Audio file not found error
  Cause: Duplicate "audio_samples/audio_samples" path resolution
  Solution: Centralized path handling inside audio_loader.py

- Incorrect enrollment audio paths
  Cause: Placeholder sample filenames used
  Solution: Replaced with actual audio files in audio_samples/

Outcome:
- Speaker templates generated successfully
- Enrollment and verification pipeline functional
- Identity-based authentication enabled
- System ready for backend integration

--------------------------------------------------
HOW TO RUN (SPRINT 1 DEMO)
--------------------------------------------------

From the project root directory:

python src/main.py

--------------------------------------------------
KEY ENGINEERING LEARNINGS
--------------------------------------------------

- Windows requires explicit handling of symbolic links in ML pipelines
- Enrollment must use multiple audio samples from the same speaker
- Path resolution should be handled in a single utility layer
- Template-based verification is essential for real-world biometric systems
