import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../components/ui/Footer';
import { describe, it, expect } from 'vitest';

describe('Footer', () => {
    it('renders Secure Voice Gateway text', () => {
        render(<Footer />);
        expect(screen.getByText(/SECURE VOICE GATEWAY/i)).toBeInTheDocument();
        expect(screen.getByText(/SYSTEM VERSION/i)).toBeInTheDocument();
    });
});
