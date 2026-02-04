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
 * @param {Array<string>} enrollmentData.challengePhrases - The phrases meant to be spoken for each sample
 * @returns {Promise<Object>} Server response with user ID and confirmation
 * @throws {Error} If enrollment fails or server returns an error
 */
export const registerUserVoiceprint = async (enrollmentData) => {
    // Using FormData to send multipart data (text + audio files)
    const formData = new FormData();

    // Add user profile information
    formData.append('full_name', enrollmentData.fullName);
    formData.append('email', enrollmentData.email);
    // Password removed as per user directive
    formData.append('role', enrollmentData.role);

    // Attach voice recordings as audio files
    // Expected keys: 'sample_1', 'sample_2', 'sample_3' (from phonetics.js)
    if (enrollmentData.recordings) {
        Object.keys(enrollmentData.recordings).forEach((sampleKey) => {
            const audioBlob = enrollmentData.recordings[sampleKey];
            // Append with a filename for backend processing
            formData.append(sampleKey, audioBlob, `${sampleKey}.wav`);
        });
    }

    // Attach challenge phrases for verification
    if (enrollmentData.challengePhrases) {
        formData.append('challenge_phrases', JSON.stringify(enrollmentData.challengePhrases));
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

            let errorMessage = `Server Error: ${response.statusText}`;

            if (serverErrorDetails.detail) {
                if (Array.isArray(serverErrorDetails.detail)) {
                    // Handle FastAPI validation errors (array of objects)
                    errorMessage = serverErrorDetails.detail
                        .map(err => `${err.loc[1]}: ${err.msg}`)
                        .join('\n');
                } else {
                    // Handle standard string errors
                    errorMessage = serverErrorDetails.detail;
                }
            }

            throw new Error(errorMessage);
        }

        const serverResponse = await response.json();
        return serverResponse;
    } catch (error) {
        console.error('Voice enrollment failed:', error);
        // Re-throw to let the calling component handle user feedback
        throw error;
    }
};

/**
 * Checks a single voice sample for liveness and duration.
 * 
 * @param {Blob} audioBlob - The audio recording blob
 * @returns {Promise<Object>} Status and message
 */
export const checkVoiceLiveness = async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'sample_check.wav');

    try {
        const response = await fetch(`${BASE_URL}/check-liveness`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Validation Error");
        }

        // Backend returns { status: "success" | "error", message: "..." }
        return data;
    } catch (error) {
        console.error('Liveness check failed:', error);
        return { status: "error", message: error.message };
    }
};

/**
 * Fetches multiple random challenge phrases from the backend.
 * @param {number} count - Number of phrases to fetch
 * @returns {Promise<Array<string>>} List of phrases
 */
export const fetchChallengePhrases = async (count = 3) => {
    try {
        const response = await fetch(`${BASE_URL}/challenge?count=${count}`);
        if (!response.ok) {
            throw new Error("Failed to fetch security protocol");
        }
        const data = await response.json();
        return data.phrases;
    } catch (error) {
        console.error("Challenge fetch error:", error);
        // Fallback phrases if server offline
        return [
            "Voice authentication active",
            "Security clearance required",
            "System access requested"
        ];
    }
};
