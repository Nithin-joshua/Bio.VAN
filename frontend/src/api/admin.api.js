const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const getCsrfToken = () => document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('csrf_token='))
    ?.split('=')[1];

const parseError = async (response, fallback) => {
    const body = await response.json().catch(() => ({}));
    return body.detail || fallback;
};

export const fetchRegisteredUsers = async () => {
    const response = await fetch(`${BASE_URL}/users`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(await parseError(response, `Failed to fetch users: ${response.statusText}`));
    }

    return response.json();
};

export const deleteUser = async (userId) => {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRF-Token': getCsrfToken() || '' },
    });

    if (!response.ok) {
        throw new Error(await parseError(response, `Failed to delete user: ${response.statusText}`));
    }

    return response.json();
};

export const logoutAdmin = async () => {
    await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': getCsrfToken() || '' },
    });
};
