import React, { useEffect, useState } from 'react';
import Button from '../core/Button';
import "../../styles/cyber-player.css";

const VerificationResultModal = ({ result, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const borderColor = result.verified ? 'var(--neon-green)' : 'var(--neon-red)';
    const shadowColor = result.verified ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';
    const headerText = result.verified ? 'ACCESS GRANTED' : (result.spoof ? 'SECURITY ALERT' : 'ACCESS DENIED');
    const livelinessText = result.spoof ? 'FAILED (SPOOF)' : 'CONFIRMED';
    const livelinessColor = result.spoof ? 'var(--neon-red)' : 'var(--neon-green)';

    return (
        <div className="modal-overlay">
            <div className={`modal-content ${isVisible ? 'visible' : ''}`} style={{
                borderColor: borderColor,
                boxShadow: `0 0 30px ${shadowColor}`
            }}>
                {/* Decorative Corner Markers */}
                <div className="corner-marker top-left" style={{ borderColor: borderColor }} />
                <div className="corner-marker bottom-right" style={{ borderColor: borderColor }} />

                <h2 className="modal-header" style={{ color: borderColor }}>
                    {headerText}
                </h2>

                <div className="modal-divider" />

                <div className="modal-grid">
                    <div className="grid-label">TARGET ID:</div>
                    <div className="grid-value">{result.targetId || 'UNKNOWN'}</div>

                    <div className="grid-label">CONFIDENCE:</div>
                    <div className="grid-value" style={{ color: borderColor }}>
                        {(result.similarity_score * 100).toFixed(2)}%
                    </div>

                    <div className="grid-label">LIVELINESS:</div>
                    <div className="grid-value" style={{ color: livelinessColor }}>
                        {livelinessText}
                    </div>

                    <div className="grid-label">TIMESTAMP:</div>
                    <div className="grid-value">{new Date().toLocaleTimeString()}</div>
                </div>

                <Button
                    onClick={onClose}
                    className="modal-close-btn"
                    variant={result.verified ? 'primary' : 'danger'}
                >
                    CLOSE REPORT
                </Button>
            </div>
        </div>
    );
};

export default VerificationResultModal;
