import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminLoginPage from '../pages/AdminLoginPage';
import { BrowserRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock Child Components
vi.mock('../components/ui/SystemStatus', () => ({
    default: () => <div data-testid="system-status">Mocked SystemStatus</div>
}));

vi.mock('../components/core/Logo', () => ({
    default: () => <div data-testid="logo">Mocked Logo</div>
}));

describe('AdminLoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear localStorage
        localStorage.clear();
    });

    it('renders login form correctly', () => {
        render(
            <BrowserRouter>
                <AdminLoginPage />
            </BrowserRouter>
        );

        expect(screen.getByText(/SECURE LOGIN/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/admin@biovan.internal/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ACCESS MAINFRAME/i })).toBeInTheDocument();
    });

    it('updates input fields on user type', () => {
        render(
            <BrowserRouter>
                <AdminLoginPage />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/admin@biovan.internal/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);

        fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('admin@test.com');
        expect(passwordInput.value).toBe('password123');
    });

    it('handles login submission and navigation', async () => {
        render(
            <BrowserRouter>
                <AdminLoginPage />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/admin@biovan.internal/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        const submitButton = screen.getByRole('button', { name: /ACCESS MAINFRAME/i });

        fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        fireEvent.click(submitButton);

        await waitFor(() => {
            // Check if token was set (mocked behavior in component)
            expect(localStorage.getItem('admin_token')).toBe('bypass_token');
            // Check navigation
            expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
        });
    });
});
