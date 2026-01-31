/**
 * API Service for Admin Dashboard
 * Handles administrative operations like fetching user lists
 * and managing voiceprint database.
 */

const BASE_URL = 'http://127.0.0.1:8000';

/**
 * Fetches all registered users from the database.
 * Requires admin authentication token.
 * 
 * @param {string} authToken - JWT authentication token from admin login
 * @returns {Promise<Array>} List of registered users with their details
 * @throws {Error} If request fails or token is invalid
 */
export const fetchRegisteredUsers = async (authToken) => {
    try {
        const response = await fetch(`${BASE_URL}/users`, {
            method: 'GET',
            headers: {
                // JWT Bearer token for admin authentication
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        const userList = await response.json();
        return userList;
    } catch (error) {
        console.error('Admin: Failed to retrieve user list:', error);
        // Re-throw to let the calling component handle user feedback
        throw error;
    }
};
