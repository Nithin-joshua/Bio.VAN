/**
 * API Service for Voice Verification
 * Handles voice authentication by comparing a voice sample
 * against stored voiceprints in the biometric database.
 */

const BASE_URL = 'http://127.0.0.1:8000';

// Hardcoded user ID for demo purposes
// In production, this would come from user login or session
const DEMO_USER_ID = '1';

/**
 * Authenticates a user by comparing their voice sample against their stored voiceprint.
 * Also performs anti-spoofing detection to prevent replay attacks.
 * 
 * @param {Blob} audioBlob - Recorded voice sample in webm format
 * @returns {Promise<Object>} Verification result
 * @returns {boolean} result.verified - Whether voice matches the stored voiceprint
 * @returns {number} result.similarity_score - Confidence score (0-1, higher = better match)
 * @returns {boolean} result.spoof - Whether spoofing was detected
 * @returns {string} result.user_id - ID of the matched user
 * @throws {Error} If verification request fails
 */
export const authenticateVoiceSample = async (audioBlob, userId) => {
  const formData = new FormData();
  formData.append('file', audioBlob);

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
      throw new Error(`Verification failed: ${response.statusText}`);
    }

    const verificationResult = await response.json();
    return verificationResult;
  } catch (error) {
    console.error('Voice authentication failed:', error);
    // Re-throw to let the calling component handle user feedback
    throw error;
  }
};