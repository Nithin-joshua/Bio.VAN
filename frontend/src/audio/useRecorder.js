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
      // Request microphone access with specific audio constraints
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,  // Removes echo for clearer voice
          noiseSuppression: true,  // Filters background noise
          autoGainControl: false   // Disabled to preserve natural voice characteristics for biometric matching
        }
      });

      setStream(audioStream);
      audioRecorder.current = new MediaRecorder(audioStream);
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

  /**
   * Stops the current recording and returns the audio as a Blob.
   * Uses a Promise to ensure the blob is fully created before returning.
   * Also cleans up the media stream to turn off the microphone indicator light.
   * 
   * @returns {Promise<Blob|null>} Audio blob in webm format, or null if no recording exists
   */
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!audioRecorder.current) return resolve(null);

      // Set up the stop handler before stopping (ensures we catch the event)
      audioRecorder.current.onstop = () => {
        // Combine all recorded chunks into a single blob
        const audioBlob = new Blob(recordedAudioChunks.current, { type: 'audio/webm' });

        // Important: Stop all tracks to release the microphone
        // This turns off the recording indicator light in the browser/OS
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        setStream(null);
        setIsRecording(false);
        resolve(audioBlob);
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