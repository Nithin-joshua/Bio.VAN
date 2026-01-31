/**
 * API Service for Voice Verification
 * Handles communication with the biometric backend.
 */

const BASE_URL = 'http://127.0.0.1:8000';
const SPEAKER_ID = '1'; // Hardcoded for this demo

export const verifyAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('file', audioBlob);

  try {
    const response = await fetch(`${BASE_URL}/verify?speaker_id=${SPEAKER_ID}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
};