import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            width: '100%',
            padding: '1.5rem',
            textAlign: 'center',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--bg-dark)',
            marginTop: '4rem',
            zIndex: 10,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                fontFamily: 'var(--font-header)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '0.5rem'
            }}>
                SECURE VOICE GATEWAY
            </div>

            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem'
            }}>
                Project built by <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>Nithin V</span>
            </div>

            <div style={{
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
                opacity: 0.6
            }}>
                SYSTEM VERSION 2.2.0 // EST. 2026 // SECURE CONNECTION
            </div>
        </footer>
    );
};

export default Footer;
