/**
 * API Service for Voice Verification
 * Handles voice authentication by comparing a voice sample
 * against stored voiceprints in the biometric database.
 */

const BASE_URL = 'http://127.0.0.1:8000';

/**
 * Fetches a random challenge phrase from the backend.
 * This prevents replay attacks by ensuring the user speaks a unique phrase.
 * 
 * @returns {Promise<string>} The challenge phrase to display
 */
export const fetchChallengePhrase = async () => {
  try {
    const response = await fetch(`${BASE_URL}/challenge`);

    if (!response.ok) {
      throw new Error("Failed to fetch security protocol");
    }

    const data = await response.json();
    return data.phrase;

  } catch (error) {
    console.error("Challenge fetch error:", error);
    // Fallback for offline/error mode
    return "Voice Authentication Requested";
  }
};

/**
 * Authenticates a user by comparing their voice sample against their stored voiceprint.
 * Also performs anti-spoofing detection to prevent replay attacks.
 * 
 * @param {Blob} audioBlob - Recorded voice sample in webm format
 * @param {string} userId - Target User ID
 * @param {string} challengePhrase - The phrase the user was asked to speak
 * @returns {Promise<Object>} Verification result
 */
export const authenticateVoiceSample = async (audioBlob, userId, challengePhrase) => {
  const formData = new FormData();
  formData.append('file', audioBlob);

  // Attach the challenge phrase so backend can verify what was spoken
  if (challengePhrase) {
    formData.append('challenge_phrase', challengePhrase);
  }

  try {
    // Send voice sample to backend for comparison
    const url = userId
      ? `${BASE_URL}/verify?speaker_id=${encodeURIComponent(userId)}`
      : `${BASE_URL}/verify`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      // Try to parse error details
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Verification failed: ${response.statusText}`);
    }

    const verificationResult = await response.json();
    return verificationResult;
  } catch (error) {
    console.error('Voice authentication failed:', error);
    // Re-throw to let the calling component handle user feedback
    throw error;
  }
};