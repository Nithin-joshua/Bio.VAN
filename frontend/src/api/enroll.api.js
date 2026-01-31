/**
 * API Service for User Enrollment
 * Handles uploading of user details and voice samples.
 */

const BASE_URL = 'http://127.0.0.1:8000';

export const enrollUser = async (enrollmentData) => {
    const formData = new FormData();

    // Append text fields
    formData.append('full_name', enrollmentData.fullName);
    formData.append('email', enrollmentData.email);
    formData.append('role', enrollmentData.role);

    // Append audio blobs
    if (enrollmentData.recordings) {
        Object.keys(enrollmentData.recordings).forEach((key) => {
            // key is expecting 'sample_1', 'sample_2', 'sample_3' based on phonetics.js
            const blob = enrollmentData.recordings[key];
            formData.append(key, blob, `${key}.webm`);
        });
    }

    try {
        const response = await fetch(`${BASE_URL}/enroll`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Enrollment failed:', error);
        throw error;
    }
};
