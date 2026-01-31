import { useEffect, useRef, useState } from 'react';

export const useWaveformAnalyzer = (stream) => {
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    if (!stream) {
      // Cleanup if stream stops
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    // Initialize Audio Context
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    
    // Config for oscilloscope look
    analyserRef.current.fftSize = 2048;
    
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    sourceRef.current.connect(analyserRef.current);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!analyserRef.current) return;
      
      // Get time domain data for waveform (not frequency)
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      // Clone to trigger re-render
      setAudioData(new Uint8Array(dataArray));
      
      rafIdRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream]);

  return audioData;
};