import React, { useEffect, useState } from 'react';
import Button from '../core/Button';
import "../../styles/cyber-player.css";

const AlertModal = ({ title, message, type = 'error', onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    let borderColor = 'var(--neon-red)';
    let shadowColor = 'rgba(255, 0, 0, 0.2)';
    
    if (type === 'success') {
        borderColor = 'var(--neon-green)';
        shadowColor = 'rgba(0, 255, 0, 0.2)';
    } else if (type === 'warning') {
        borderColor = 'var(--neon-yellow)';
        shadowColor = 'rgba(255, 255, 0, 0.2)';
    }

    return (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0, 5, 10, 0.85)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div className={`modal-content glass-card ${isVisible ? 'visible' : ''}`} style={{
                border: `1px solid ${borderColor}`,
                boxShadow: `0 0 30px ${shadowColor}, inset 0 0 20px rgba(255,255,255,0.05)`,
                maxWidth: '500px',
                width: '90%',
                padding: '2.5rem',
                background: 'rgba(10, 20, 30, 0.9)'
            }}>
                {/* Decorative Corner Markers */}
                <div className="corner-marker top-left" style={{ borderColor: borderColor, width: '25px', height: '25px' }} />
                <div className="corner-marker bottom-right" style={{ borderColor: borderColor, width: '25px', height: '25px' }} />

                <div className="status-pill" style={{ marginBottom: '1.5rem', borderColor: `${borderColor}44` }}>
                    <span className="status-indicator" style={{ background: borderColor, boxShadow: `0 0 8px ${borderColor}` }}></span>
                    SYSTEM NOTIFICATION
                </div>

                <h2 className="text-h2" style={{ color: borderColor, fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'left' }}>
                    {title || 'ALERT'}
                </h2>

                <div className="cyber-divider" style={{ margin: '1.5rem 0' }} />

                <div className="modal-body" style={{ 
                    padding: '10px 0', 
                    textAlign: 'left',
                    fontFamily: 'var(--font-body)',
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6'
                }}>
                    {message}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
                    <Button
                        onClick={onClose}
                        variant={type === 'success' ? 'primary' : 'secondary'}
                        className="lg"
                        style={{ width: '100%' }}
                    >
                        ACKNOWLEDGE
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
