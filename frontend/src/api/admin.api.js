/**
 * API Service for Admin Dashboard
 * Handles fetching of user data.
 */

const BASE_URL = 'http://127.0.0.1:8000';

export const getAllUsers = async (token) => {
    try {
        const response = await fetch(`${BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error;
    }
};
