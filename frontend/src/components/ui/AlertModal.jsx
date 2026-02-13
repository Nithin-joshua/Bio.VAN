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
        <div className="modal-overlay">
            <div className={`modal-content ${isVisible ? 'visible' : ''}`} style={{
                borderColor: borderColor,
                boxShadow: `0 0 30px ${shadowColor}`,
                maxWidth: '600px',
                width: '90%'
            }}>
                {/* Decorative Corner Markers */}
                <div className="corner-marker top-left" style={{ borderColor: borderColor }} />
                <div className="corner-marker bottom-right" style={{ borderColor: borderColor }} />

                <h2 className="modal-header" style={{ color: borderColor }}>
                    {title || 'SYSTEM ALERT'}
                </h2>

                <div className="modal-divider" />

                <div className="modal-body" style={{ 
                    padding: '20px 0', 
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.1rem',
                    color: 'var(--text-primary)'
                }}>
                    {message}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <Button
                        onClick={onClose}
                        className="modal-close-btn"
                        variant={type === 'success' ? 'primary' : 'danger'}
                    >
                        ACKNOWLEDGE
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
