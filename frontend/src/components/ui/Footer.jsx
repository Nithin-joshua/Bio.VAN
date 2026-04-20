import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../core/Button';

const Footer = () => {

    return (
        <footer 
            style={{
                width: '100%',
                padding: '2rem 2rem 1.5rem',
                textAlign: 'center',
                borderTop: '2px solid rgba(0, 255, 200, 0.2)',
                background: 'linear-gradient(180deg, rgba(5, 8, 12, 0.5) 0%, rgba(5, 8, 12, 0.95) 100%)',
                zIndex: 10,
                backdropFilter: 'blur(20px)',
                position: 'relative',
                marginTop: 'auto',
                flexShrink: 0,
                boxShadow: 'inset 0 1px 0 rgba(0, 255, 200, 0.1), 0 -2px 20px rgba(0, 255, 200, 0.05)'
            }}>
            
            {/* Glowing top border accent */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '10%',
                    width: '80%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, rgba(0, 255, 200, 0.6), transparent)',
                    boxShadow: '0 0 15px rgba(0, 255, 200, 0.4)',
                    opacity: 0.7
                }}
            />

            {/* Main Title */}
            <div
                style={{
                    fontFamily: 'var(--font-header)',
                    fontSize: '1.1rem',
                    color: '#FFFFFF',
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                    marginBottom: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}>
                ◆ SECURE VOICE GATEWAY ◆
            </div>

            {/* Credit Section */}
            <div
                style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                <span>Project built by</span>
                <span
                    style={{
                        color: 'var(--neon-teal)',
                        fontWeight: 'bold',
                        paddingBottom: '2px'
                    }}
                >
                    ▸ Nithin V ◂
                </span>
            </div>

            {/* Status Info */}
            <div
                style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    opacity: 0.7,
                    letterSpacing: '1px',
                    marginBottom: '1.5rem',
                    fontFamily: 'var(--font-mono)'
                }}>
                SYSTEM VERSION 2.2.0 // EST. 2026 // SECURE CONNECTION
            </div>

            {/* Footer Links/Stats */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '2rem',
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(0, 255, 200, 0.1)',
                    flexWrap: 'wrap'
                }}>
                <div
                    style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                    <span>●</span>
                    <span>VOICE AUTH ENABLED</span>
                </div>
                <div
                    style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                    <span>●</span>
                    <span>ENCRYPTION ACTIVE</span>
                </div>
                <div
                    style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                    <span>●</span>
                    <span>ZERO TRUST MODE</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
