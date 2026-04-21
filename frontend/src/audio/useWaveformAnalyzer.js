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
  const FRAME_INTERVAL_MS = 1000 / 30;

  // Refs to persist Web Audio API objects without causing re-renders
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameId = useRef(null);
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    if (!stream) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }

      sourceRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
      lastFrameTimeRef.current = 0;
      setAudioData(new Uint8Array(0));
      return;
    }

    // Create audio context (Safari needs webkit prefix)
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();

    // FFT size determines frequency resolution and time domain buffer size
    // 2048 gives us smooth waveforms without too much CPU overhead
    // Higher = more detail but more expensive, Lower = choppier waveform
    analyserRef.current.fftSize = 1024;

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
    const captureAudioFrame = (timestamp = 0) => {
      if (!analyserRef.current) return;

      // Get time domain data (amplitude over time) instead of frequency data
      // This gives us the classic waveform oscilloscope look
      // dataArray values range from 0 to 255 (128 is silence)
      analyserRef.current.getByteTimeDomainData(dataArray);

      if (timestamp - lastFrameTimeRef.current >= FRAME_INTERVAL_MS) {
        lastFrameTimeRef.current = timestamp;
        setAudioData(new Uint8Array(dataArray));
      }

      // Schedule next frame
      animationFrameId.current = requestAnimationFrame(captureAudioFrame);
    };

    animationFrameId.current = requestAnimationFrame(captureAudioFrame);

    // Cleanup function runs when stream changes or component unmounts
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }

      sourceRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
      lastFrameTimeRef.current = 0;
    };
  }, [stream]);

  return audioData;
};
