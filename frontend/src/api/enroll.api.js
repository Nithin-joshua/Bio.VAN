/**
 * API Service for User Enrollment
 * Handles registration of new users by uploading their personal details
 * and voice samples to the backend for voiceprint creation.
 */

const BASE_URL = 'http://127.0.0.1:8000';

/**
 * Registers a new user with their voice biometric data.
 * Sends user information and 3 voice samples to create a unique voiceprint.
 * 
 * @param {Object} enrollmentData - User enrollment information
 * @param {string} enrollmentData.fullName - User's full name
 * @param {string} enrollmentData.email - User's email address
 * @param {string} enrollmentData.role - User's role (personnel, admin, researcher)
 * @param {Object} enrollmentData.recordings - Voice sample blobs keyed by sample ID
 * @returns {Promise<Object>} Server response with user ID and confirmation
 * @throws {Error} If enrollment fails or server returns an error
 */
export const registerUserVoiceprint = async (enrollmentData) => {
    // Using FormData to send multipart data (text + audio files)
    const formData = new FormData();

    // Add user profile information
    formData.append('full_name', enrollmentData.fullName);
    formData.append('email', enrollmentData.email);
    formData.append('role', enrollmentData.role);

    // Attach voice recordings as audio files
    // Expected keys: 'sample_1', 'sample_2', 'sample_3' (from phonetics.js)
    if (enrollmentData.recordings) {
        Object.keys(enrollmentData.recordings).forEach((sampleKey) => {
            const audioBlob = enrollmentData.recordings[sampleKey];
            // Append with a filename for backend processing
            formData.append(sampleKey, audioBlob, `${sampleKey}.webm`);
        });
    }

    try {
        const response = await fetch(`${BASE_URL}/enroll`, {
            method: 'POST',
            body: formData,
            // Note: Don't set Content-Type header manually - browser sets it with boundary
        });

        if (!response.ok) {
            // Try to extract error details from server response
            const serverErrorDetails = await response.json().catch(() => ({}));
            throw new Error(serverErrorDetails.detail || `Server Error: ${response.statusText}`);
        }

        const serverResponse = await response.json();
        return serverResponse;
    } catch (error) {
        console.error('Voice enrollment failed:', error);
        // Re-throw to let the calling component handle user feedback
        throw error;
    }
};
