import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VerifyPage from '../pages/VerifyPage';
import { ToastProvider } from '../context/ToastContext';
import { BrowserRouter } from 'react-router-dom';

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock API
vi.mock('../api/verify.api', () => ({
    authenticateVoiceSample: vi.fn(),
    fetchChallengePhrase: vi.fn(() => Promise.resolve("Test Phrase")),
}));

// Mock Recorder Hook
const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn();
vi.mock('../audio/useRecorder', () => ({
    useRecorder: () => ({
        isRecording: false,
        stream: null,
        startRecording: mockStartRecording,
        stopRecording: mockStopRecording,
    }),
}));

// Mock Waveform Analyzer
vi.mock('../audio/useWaveformAnalyzer', () => ({
    useWaveformAnalyzer: () => new Uint8Array(128).fill(0),
}));

describe('VerifyPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders initial state correctly', async () => {
        render(
            <ToastProvider>
                <BrowserRouter>
                    <VerifyPage />
                </BrowserRouter>
            </ToastProvider>
        );

        // Check for challenge phrase (async)
        await waitFor(() => {
            expect(screen.getByText(/"Test Phrase"/i)).toBeInTheDocument();
        });

        // Check for "Invalid Target ID" behavior (initially empty)
        const idInput = screen.getByPlaceholderText(/ENTER ID.../i);
        expect(idInput).toBeInTheDocument();
    });

    it('handles target ID input', () => {
        render(
            <ToastProvider>
                <BrowserRouter>
                    <VerifyPage />
                </BrowserRouter>
            </ToastProvider>
        );

        const idInput = screen.getByPlaceholderText(/ENTER ID.../i);
        fireEvent.change(idInput, { target: { value: '1234567890' } });
        expect(idInput.value).toBe('1234567890');
    });

    it('starts recording when clicked with valid ID', async () => {
        // Update mock to reflect state change if needed, 
        // but for now we just check if startRecording is called.
        // To simulate state change we might need a more complex mock implementation,
        // but basic interaction testing is a good start.

        render(
            <ToastProvider>
                <BrowserRouter>
                    <VerifyPage />
                </BrowserRouter>
            </ToastProvider>
        );

        const idInput = screen.getByPlaceholderText(/ENTER ID.../i);
        fireEvent.change(idInput, { target: { value: '1234567890' } });

        // Click record button (Role is button)
        const recordBtn = screen.getByRole('button', { name: /Start Recording/i });
        fireEvent.click(recordBtn);

        expect(mockStartRecording).toHaveBeenCalled();
    });
});
