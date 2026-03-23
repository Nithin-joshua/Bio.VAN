import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EnrollPage from '../pages/EnrollPage';
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
vi.mock('../api/enroll.api', () => ({
    registerUserVoiceprint: vi.fn(() => Promise.resolve({ user_id: 'TEST-ID-123' })),
    checkVoiceLiveness: vi.fn(() => Promise.resolve({ status: 'success' })),
    fetchChallengePhrases: vi.fn(() => Promise.resolve(["Phrase 1", "Phrase 2", "Phrase 3"])),
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

describe('EnrollPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders step 1 (Identity Protocol) correctly', () => {
        render(
            <ToastProvider>
                <BrowserRouter>
                    <EnrollPage />
                </BrowserRouter>
            </ToastProvider>
        );

        expect(screen.getByText(/IDENTITY PROTOCOL/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ENTER DESIGNATION/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/user@network.com/i)).toBeInTheDocument();
    });

    it('validates form input before proceeding', () => {
        render(
            <ToastProvider>
                <BrowserRouter>
                    <EnrollPage />
                </BrowserRouter>
            </ToastProvider>
        );

        const nextBtn = screen.getByRole('button', { name: /INITIATE VOICE CALIBRATION/i });
        expect(nextBtn).toBeDisabled();

        const nameInput = screen.getByPlaceholderText(/ENTER DESIGNATION/i);
        const emailInput = screen.getByPlaceholderText(/user@network.com/i);

        fireEvent.change(nameInput, { target: { value: 'John Doe' } });
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

        expect(nextBtn).not.toBeDisabled();
    });

    it('proceeds to step 2 upon valid input', async () => {
        render(
            <ToastProvider>
                <BrowserRouter>
                    <EnrollPage />
                </BrowserRouter>
            </ToastProvider>
        );

        const nameInput = screen.getByPlaceholderText(/ENTER DESIGNATION/i);
        const emailInput = screen.getByPlaceholderText(/user@network.com/i);
        fireEvent.change(nameInput, { target: { value: 'John Doe' } });
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

        const nextBtn = screen.getByRole('button', { name: /INITIATE VOICE CALIBRATION/i });
        fireEvent.click(nextBtn);

        // Expect to see "VOICE CALIBRATION // SAMPLE 1/3"
        await waitFor(() => {
            expect(screen.getByText(/VOICE CALIBRATION/i)).toBeInTheDocument();
            expect(screen.getByText(/SAMPLE 1\/3/i)).toBeInTheDocument();
        });
    });
});
