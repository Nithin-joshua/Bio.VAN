import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for real-time audio waveform analysis.
 * Connects to a media stream and continuously extracts time-domain audio data
 * for visualization purposes (like an oscilloscope).
 * 
 * @param {MediaStream|null} stream - Active audio stream from microphone
 * @returns {Uint8Array} Audio amplitude data (0-255 range) for waveform rendering
 */
export const useWaveformAnalyzer = (stream) => {
  const [audioData, setAudioData] = useState(new Uint8Array(0));

  // Refs to persist Web Audio API objects without causing re-renders
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    if (!stream) {
      // Clean up animation loop if stream is stopped or removed
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    // Create audio context (Safari needs webkit prefix)
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();

    // FFT size determines frequency resolution and time domain buffer size
    // 2048 gives us smooth waveforms without too much CPU overhead
    // Higher = more detail but more expensive, Lower = choppier waveform
    analyserRef.current.fftSize = 2048;

    // Connect the microphone stream to the analyzer
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    sourceRef.current.connect(analyserRef.current);

    // Buffer size is half of FFT size (Nyquist theorem)
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    /**
     * Continuously captures audio frames and updates state.
     * Runs at ~60fps via requestAnimationFrame for smooth visualization.
     */
    const captureAudioFrame = () => {
      if (!analyserRef.current) return;

      // Get time domain data (amplitude over time) instead of frequency data
      // This gives us the classic waveform oscilloscope look
      analyserRef.current.getByteTimeDomainData(dataArray);

      // Create a new Uint8Array to trigger React re-render
      // (React won't detect mutations to the same array reference)
      setAudioData(new Uint8Array(dataArray));

      // Schedule next frame
      animationFrameId.current = requestAnimationFrame(captureAudioFrame);
    };

    // Start the animation loop
    captureAudioFrame();

    // Cleanup function runs when stream changes or component unmounts
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  return audioData;
};