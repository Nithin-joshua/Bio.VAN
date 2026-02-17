import React, { useEffect, useState } from 'react';
import Button from '../core/Button';
import "../../styles/cyber-player.css";

const VerificationResultModal = ({ result, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    // Logic to determine Liveliness Status
    let livelinessText = 'PENDING';
    let livelinessColor = 'var(--text-secondary)';

    if (result.liveness_metrics) {
        const isLive = result.liveness_metrics.is_live;
        const status = result.liveness_metrics.status || (isLive ? 'live' : 'spoof');

        if (isLive) {
            livelinessText = 'CONFIRMED';
            livelinessColor = 'var(--neon-green)';
        } else if (status === 'too_far') {
            livelinessText = 'FAILED (MIC TOO FAR)';
            livelinessColor = 'var(--neon-red)';
        } else if (status === 'bad_audio') {
            livelinessText = 'FAILED (AUDIO QUALITY)';
            livelinessColor = 'var(--neon-red)';
        } else {
            livelinessText = 'FAILED (SPOOF)';
            livelinessColor = 'var(--neon-red)';
        }
    } else if (result.verified) {
        // If verified is true, it implicitly passed liveness (legacy support)
        livelinessText = 'CONFIRMED';
        livelinessColor = 'var(--neon-green)';
    } else {
        // Not verified, no liveness metrics -> Check failed before liveness (e.g. Duration)
        livelinessText = 'NOT CHECKED';
        livelinessColor = 'var(--text-secondary)';
    }

    const borderColor = result.verified ? 'var(--neon-green)' : 'var(--neon-red)';
    const shadowColor = result.verified ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';
    const headerText = result.verified
        ? 'ACCESS GRANTED'
        : (result.error_code === 'MIC_TOO_FAR'
            ? 'MIC TOO FAR'
            : (result.error_code === 'AUDIO_QUALITY_LOW'
                ? 'AUDIO ERROR'
                : (result.spoof ? 'SECURITY ALERT' : 'ACCESS DENIED')));

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
                    <div className="grid-value" style={{ fontFamily: 'var(--font-mono)' }}>
                        {result.matched_speaker_id || result.targetId || result.user_id || 'UNKNOWN'}
                    </div>

                    <div className="grid-label">CONFIDENCE:</div>
                    <div className="grid-value" style={{ color: borderColor }}>
                        {(result.similarity_score * 100).toFixed(2)}%
                    </div>

                    <div className="grid-label">LIVELINESS:</div>
                    <div className="grid-value" style={{ color: livelinessColor }}>
                        {livelinessText}
                        {result.liveness_metrics && result.liveness_metrics.method && (
                            <span style={{ fontSize: '0.6em', opacity: 0.7, marginLeft: '5px' }}>
                                [{result.liveness_metrics.method.toUpperCase()}]
                            </span>
                        )}
                    </div>

                    <div className="grid-label">TIMESTAMP:</div>
                    <div className="grid-value">{new Date().toLocaleTimeString()}</div>

                    {/* Show Reason if defined (e.g. "Phrase Mismatch") */}
                    {result.message && !result.verified && (
                        <>
                            <div className="grid-label" style={{ color: 'var(--neon-red)' }}>REASON:</div>
                            <div className="grid-value" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {result.message}
                            </div>
                        </>
                    )}
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
