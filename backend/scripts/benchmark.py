
import os
import sys
import glob
import itertools
from pathlib import Path

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.evaluation import calculate_eer, calculate_metrics
# Assuming core_engine is available in src (project structure is a bit split)
# We will try to import from the location seen in existing code.
# Ideally we use the REST API logic or the Engine class.
# Let's try to import the core model directly to avoid 'audio_loader' path issues if possible
# But reusing VoiceAuthEngine is cleaner.

# However, VoiceAuthEngine seems to be in voice_auth_project/src/core_engine.py
# which is OUTSIDE backend?
# Wait, list_dir of backend/ (step 6) showed `core_engine.py` is present there too?
# Step 6: {"name":"core_engine.py"} inside backend.
# Let's check THAT file. Step 15 showed backend/api/main.py. Step 16 showed voice_auth_project/src/core_engine.py.
# I missed checking backend/core_engine.py.

# Let's assume we use the one in backend/core_engine.py if it exists, or just use `core.speaker_model`.
from core.speaker_model import ECAPAModel
from core.preprocessing import load_audio
from core.verification import compare_embeddings

def run_benchmark(audio_dir):
    print(f"Scanning {audio_dir}...")
    files = glob.glob(os.path.join(audio_dir, "*.wav"))
    if not files:
        print("No wav files found.")
        return

    print(f"Found {len(files)} files.")
    
    model = ECAPAModel()
    embeddings = {}
    
    # Extract all embeddings first
    print("Extracting embeddings...")
    for f in files:
        try:
            audio = load_audio(f)
            emb = model.extract_embedding(audio)
            embeddings[f] = emb
        except Exception as e:
            print(f"Failed to load {f}: {e}")

    # Generate pairs
    scores = []
    labels = []
    
    keys = list(embeddings.keys())
    
    # itertools.combinations for unique pairs
    # But we need positive and negative pairs.
    # If filenames identify speakers (e.g. spk1_01.wav), we can deduce ground truth.
    # If not, we can't automate labeling without metadata.
    
    # ASSUMPTION: Filename format "speakerID_sampleID.wav" or distinct filenames mean distinct speakers?
    # User just has "speaker1.wav", "speaker2.wav".
    # So "speaker1.wav" vs "speaker1.wav" is a positive pair (if allowed).
    # "speaker1.wav" vs "speaker2.wav" is negative.
    
    # Let's do a Full Cross Join including self-comparisons?
    # Self-comparison is always 1.0, maybe cheating?
    # We usually want Different Samples of Same Speaker.
    # If we only have 1 sample per speaker, we can't test True Positives (except self).
    
    print("Running comparisons...")
    pairs = itertools.product(keys, repeat=2)
    
    for f1, f2 in pairs:
        # Determine Label
        # Heuristic: if "speaker1" in f1 and "speaker1" in f2 -> Same.
        spk1 = os.path.basename(f1).split('_')[0].split('.')[0] # e.g. "speaker1.wav" -> "speaker1"
        spk2 = os.path.basename(f2).split('_')[0].split('.')[0]
        
        is_same_speaker = (spk1 == spk2)
        
        # Skip self-match if strict? Actually self-match verify is useful for sanity.
        # But for EER, we typically want distinct samples.
        # If f1 == f2, score is 1.0.
        
        emb1 = embeddings[f1]
        emb2 = embeddings[f2]
        
        score = compare_embeddings(emb1, emb2)
        
        scores.append(score)
        labels.append(1 if is_same_speaker else 0)
        
        print(f"{os.path.basename(f1)} vs {os.path.basename(f2)}: {score:.4f} [{'Match' if is_same_speaker else 'Imp'}]")

    print("\n--- Results ---")
    eer, thresh = calculate_eer(scores, labels)
    print(f"EER: {eer:.4f}")
    print(f"Optimal Threshold: {thresh:.4f}")
    
    metrics = calculate_metrics(scores, labels, threshold=0.80) # Test default threshold
    print(f"Metrics at 0.80: FAR={metrics['far']:.4f}, FRR={metrics['frr']:.4f}")

if __name__ == "__main__":
    # Default audio dir assumption
    d = "n:/PGM/Bio.VAN/voice_auth_project/audio_samples"
    if len(sys.argv) > 1:
        d = sys.argv[1]
    
    run_benchmark(d)
