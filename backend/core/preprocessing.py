import torch
import torchaudio
import numpy as np
from config.settings import SAMPLE_RATE

def load_audio(file_path):
    """
    Loads an audio file, resamples it to SAMPLE_RATE, and returns a mono numpy array.
    Optimized using torchaudio (C++ backend) for speed.
    """
    try:
        # Load audio (tensor: [channels, time])
        waveform, sample_rate = torchaudio.load(file_path)

        # Convert to mono if stereo
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)

        # Resample if necessary
        if sample_rate != SAMPLE_RATE:
            resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=SAMPLE_RATE)
            waveform = resampler(waveform)

        # Flatten to 1D array [time]
        waveform = waveform.squeeze()

        # Convert to numpy
        audio_np = waveform.numpy()
        
        # Apply Noise Reduction
        audio_np = filter_audio(audio_np)
        
        return audio_np

    except Exception as e:
        print(f"Error loading audio with torchaudio: {e}")
        # Fallback (though unlikely needed if torchaudio is installed)
        import librosa
        audio, _ = librosa.load(file_path, sr=SAMPLE_RATE, mono=True)
        return audio

def filter_audio(audio_np):
    """
    Applies a Bandpass Filter (300Hz - 3400Hz) to isolate human speech frequencies
    and remove background noise (low hums, high hisses).
    Also applies Pre-emphasis to boost high frequencies.
    """
    try:
        from scipy.signal import butter, lfilter
        
        # 1. Bandpass Filter (300Hz - 3400Hz)
        # Standard telephony range, effective for removing AC hum (50/60Hz) and high-freq noise
        lowcut = 300.0
        highcut = 3400.0
        nyq = 0.5 * SAMPLE_RATE
        low = lowcut / nyq
        high = highcut / nyq
        
        # 4th order Butterworth filter
        b, a = butter(4, [low, high], btype='band')
        filtered_audio = lfilter(b, a, audio_np)
        
        # 2. Pre-emphasis (High-pass filter at 0.97 coefficient)
        # Boosts high frequencies to balance the spectrum for speech recognition
        pre_emphasis = 0.97
        emphasized_audio = np.append(filtered_audio[0], filtered_audio[1:] - pre_emphasis * filtered_audio[:-1])
        
        return emphasized_audio
        
    except ImportError:
        print("Warning: scipy not installed. Skipping noise reduction.")
        return audio_np
    except Exception as e:
        print(f"Warning: Noise reduction failed: {e}")
        return audio_np
