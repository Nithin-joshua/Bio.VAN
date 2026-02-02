import React, { useState, useEffect } from 'react';
import '../../styles/components.css';

const LORE_TEXT = "Bio.VAN operates as a decentralized voice authentication protocol, leveraging spectral analysis to map unique vocal identifiers to immutable cryptographic ledgers. In an era where synthetic media compromises traditional security, our neural mesh ensures identity verification remains absolute, processing millions of bio-signatures daily with zero-knowledge proof verification.";

const LoreTerminal = () => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [metrics, setMetrics] = useState({
        latency: 12,
        encryption: 'QUANTUM-256',
        node: 'TOKYO-03'
    });

    // Typing effect
    useEffect(() => {
        let index = 0;
        let timeoutId;
        setDisplayedText(''); // Reset
        setIsTyping(true);
        
        const typeChar = () => {
            if (index < LORE_TEXT.length) {
                setDisplayedText(prev => prev + LORE_TEXT.charAt(index));
                index++;
                
                // Random typing speed variation for realism
                const delay = Math.random() * 30 + 20; 
                timeoutId = setTimeout(typeChar, delay);
            } else {
                setIsTyping(false);
            }
        };

        // Start typing after a small delay
        timeoutId = setTimeout(typeChar, 500);
        
        return () => clearTimeout(timeoutId);
    }, []);

    // Random metrics update simulation
    useEffect(() => {
        const interval = setInterval(() => {
            // Randomly fluctuate latency
            const newLatency = Math.floor(Math.random() * 20) + 10; // 10-30ms range
            
            // Occasionally "re-key" encryption
            const encryptionStatus = Math.random() > 0.95 ? 'RE-KEYING...' : 'QUANTUM-256';
            
            // Occasionally switch nodes
            const nodes = ['TOKYO-03', 'LONDON-01', 'NY-NET-05', 'SINGAPORE-09'];
            const currentNode = Math.random() > 0.98 ? nodes[Math.floor(Math.random() * nodes.length)] : metrics.node;

            setMetrics(prev => ({
                latency: newLatency,
                encryption: encryptionStatus,
                node: prev.node === currentNode ? prev.node : currentNode
            }));
        }, 800);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="lore-terminal-container">
            <div className="lore-header">
                <span className="blink-text" style={{ color: 'var(--neon-blue)' }}>&gt; ACCESSING SECURE ARCHIVE_</span>
                <span className="lore-id" style={{ opacity: 0.7 }}>ID: 994-ALPHA</span>
            </div>
            
            <div className="lore-content">
                <span style={{ color: 'var(--text-secondary)' }}>
                    {displayedText}
                </span>
                <span className="cursor-block">█</span>
            </div>

            <div className="lore-footer">
                <div className="lore-stat">
                    NODE: <span className="neon-blue-text glow-text">{metrics.node}</span>
                </div>
                <div className="lore-stat">
                    LATENCY: <span className={metrics.latency > 25 ? "neon-red-text" : "neon-green-text"}>{metrics.latency}ms</span>
                </div>
                <div className="lore-stat">
                    ENCRYPTION: <span className="neon-purple-text">{metrics.encryption}</span>
                </div>
            </div>
            
            {/* Scanline overlay removed */}
        </div>
    );
};

export default LoreTerminal;
