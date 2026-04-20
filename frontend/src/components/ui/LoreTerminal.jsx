import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import '../../styles/components.css';

// Narrative text displayed in the terminal to build immersion
const LORE_TEXT = "Bio.V is a secure way to sign in using nothing but your voice. We use advanced technology to create a unique voice profile for every user, ensuring privacy and safety without the need for traditional passwords. Your data is encrypted and stays private, giving you instant access with total peace of mind.";

/**
 * Atmospheric Terminal Component
 * Displays a typing-effect text block and random system metrics.
 * Purely cosmetic - adds to the "Cyberpunk" aesthetic.
 */
const LoreTerminal = () => {
    const [displayedText, setDisplayedText] = useState('');
    const shouldReduceMotion = useReducedMotion();
    const [metrics, setMetrics] = useState({
        latency: 12,
        encryption: 'QUANTUM-256',
        node: 'TOKYO-03'
    });

    // EFFECT: Typewriter Animation
    // Recursively adds characters to the display state with random delays
    useEffect(() => {
        if (shouldReduceMotion) {
            setDisplayedText(LORE_TEXT);
            return;
        }

        let index = 0;
        let timeoutId;
        setDisplayedText(''); // Reset on mount

        const typeChar = () => {
            if (index < LORE_TEXT.length) {
                setDisplayedText(prev => prev + LORE_TEXT.charAt(index));
                index++;

                // Random typing speed variation for realism (20ms - 50ms)
                const delay = Math.random() * 30 + 20;
                timeoutId = setTimeout(typeChar, delay);
            }
        };

        // Start typing after a small initial delay
        timeoutId = setTimeout(typeChar, 500);

        return () => clearTimeout(timeoutId);
    }, []);

    // EFFECT: Random Metric Simulation
    // periodically updates the footer stats (Latency, Encryption, Node) to make the UI feel "live"
    useEffect(() => {
        const interval = setInterval(() => {
            // Randomly fluctuate latency
            const newLatency = Math.floor(Math.random() * 20) + 10; // 10-30ms range

            // Occasionally "re-key" encryption (visual flair)
            const encryptionStatus = Math.random() > 0.95 ? 'RE-KEYING...' : 'QUANTUM-256';

            // Occasionally switch server nodes
            const nodes = ['TOKYO-03', 'LONDON-01', 'NY-NET-05', 'SINGAPORE-09'];
            const currentNode = Math.random() > 0.98 ? nodes[Math.floor(Math.random() * nodes.length)] : metrics.node;

            setMetrics(prev => ({
                latency: newLatency,
                encryption: encryptionStatus,
                node: prev.node === currentNode ? prev.node : currentNode
            }));
        }, 800);

        return () => clearInterval(interval);
    }, [metrics.node]);

    return (
        <div className="lore-terminal-container">
            <div className="lore-header">
                <span className="blink-text" style={{ color: 'var(--neon-blue)' }}>&gt; ACCESSING SECURE ARCHIVE_</span>
                <span className="lore-id" style={{ opacity: 0.7 }}>ID: 994-ALPHA</span>
            </div>

            <div className="lore-content text-overlay" style={{ background: 'rgba(5, 8, 10, 0.4)', margin: '1rem', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                    {displayedText}
                </span>
                <span className="cursor-block">█</span>
            </div>

            <div className="lore-footer">
                <div className="lore-stat">
                    NODE: <span className="neon-blue-text glow-text" style={{ color: 'var(--neon-blue)' }}>{metrics.node}</span>
                </div>
                <div className="lore-stat">
                    LATENCY: <span className={metrics.latency > 25 ? "neon-red-text" : "neon-green-text"} style={{ color: metrics.latency > 25 ? 'var(--neon-red)' : 'var(--neon-green)' }}>{metrics.latency}ms</span>
                </div>
                <div className="lore-stat">
                    ENCRYPTION: <span className="neon-purple-text" style={{ color: 'var(--neon-purple)' }}>{metrics.encryption}</span>
                </div>
            </div>

            {/* Scanline overlay removed */}
        </div>
    );
};

export default LoreTerminal;
