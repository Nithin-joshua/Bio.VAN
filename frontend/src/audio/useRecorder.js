import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for managing audio recording from the user's microphone.
 * Handles microphone permissions, recording state, and audio blob creation.
 * 
 * @returns {Object} Recording controls and state
 * @returns {boolean} isRecording - Whether recording is currently active
 * @returns {MediaStream|null} stream - Active audio stream (for waveform visualization)
 * @returns {Function} startRecording - Initiates microphone capture
 * @returns {Function} stopRecording - Stops recording and returns audio blob
 */
export const useRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);

  // Using refs to persist across renders without causing re-renders
  const audioRecorder = useRef(null);
  const recordedAudioChunks = useRef([]);

  /**
   * Starts recording audio from the user's microphone.
   * Requests permission if not already granted.
   */
  const startRecording = useCallback(async () => {
    try {
      // Request microphone access with default constraints to match enrollment
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      setStream(audioStream);
      
      // Use optimal mime type (same as VoiceRecorder.jsx)
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
      }
      
      audioRecorder.current = new MediaRecorder(audioStream, { mimeType });
      recordedAudioChunks.current = [];

      // Collect audio data chunks as they become available
      audioRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedAudioChunks.current.push(event.data);
        }
      };

      audioRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // Common causes: permission denied, no microphone found, or device in use
    }
  }, []);

  // Helper to convert AudioBuffer to WAV Blob
  const audioBufferToWav = (buffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // write RIFF chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(36 + buffer.length * numOfChan * 2); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // write fmt sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this example)

    // write data sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(buffer.length * numOfChan * 2); // chunk size

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < buffer.length) {
        for (i = 0; i < numOfChan; i++) {
            // clamp
            sample = Math.max(-1, Math.min(1, channels[i][pos]));
            // scale to 16-bit signed int
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(offset, sample, true);
            offset += 2;
        }
        pos++;
    }

    return new Blob([view], { type: "audio/wav" });

    function setUint16(data) {
        view.setUint16(offset, data, true);
        offset += 2;
    }

    function setUint32(data) {
        view.setUint32(offset, data, true);
        offset += 4;
    }
  };

  /**
   * Stops the current recording and returns the audio as a Blob.
   * Uses a Promise to ensure the blob is fully created before returning.
   * Also cleans up the media stream to turn off the microphone indicator light.
   * 
   * @returns {Promise<Blob|null>} Audio blob in wav format, or null if no recording exists
   */
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!audioRecorder.current) return resolve(null);

      // Set up the stop handler before stopping (ensures we catch the event)
      audioRecorder.current.onstop = async () => {
        // Use the same mimeType as creation
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
        }

        // Combine all recorded chunks into a single blob
        const webmBlob = new Blob(recordedAudioChunks.current, { type: mimeType });

        // Convert to WAV
        try {
            const arrayBuffer = await webmBlob.arrayBuffer();
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const wavBlob = audioBufferToWav(audioBuffer);
            
            // Cleanup context
            audioCtx.close();
            
            // Important: Stop all tracks to release the microphone
            // This turns off the recording indicator light in the browser/OS
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }

            setStream(null);
            setIsRecording(false);
            resolve(wavBlob);
        } catch (err) {
            console.error("Error converting to WAV:", err);
            // Fallback to webm if conversion fails, though backend might reject it
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setStream(null);
            setIsRecording(false);
            resolve(webmBlob);
        }
      };

      // Trigger the stop event
      audioRecorder.current.stop();
    });
  }, [stream]);

  return {
    isRecording,
    stream, // Exposed so waveform visualizer can analyze the live audio
    startRecording,
    stopRecording
  };
};