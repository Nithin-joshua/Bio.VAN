import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        livelinessText = 'CONFIRMED';
        livelinessColor = 'var(--neon-green)';
    }

    const themeColor = result.verified ? 'var(--neon-green)' : 'var(--neon-red)';
    const shadowColor = result.verified ? 'rgba(0, 255, 150, 0.2)' : 'rgba(255, 50, 50, 0.2)';
    
    const headerText = result.verified
        ? 'ACCESS GRANTED'
        : (result.error_code === 'MIC_TOO_FAR'
            ? 'MOVE CLOSER'
            : (result.error_code === 'AUDIO_QUALITY_LOW'
                ? 'AUDIO ERROR'
                : (result.spoof ? 'SECURITY ALERT' : 'ACCESS DENIED')));

    return (
        <AnimatePresence>
            <div className="modal-overlay" style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0, 5, 10, 0.85)' }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="modal-content" 
                    style={{
                        background: 'rgba(10, 20, 30, 0.8)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${themeColor}`,
                        boxShadow: `0 0 40px ${shadowColor}, inset 0 0 20px rgba(255,255,255,0.05)`,
                        padding: '2.5rem',
                        maxWidth: '480px',
                        borderRadius: '16px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Background Glow Effect */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        width: '200%',
                        height: '200%',
                        background: `radial-gradient(circle at 50% 50%, ${shadowColor} 0%, transparent 50%)`,
                        pointerEvents: 'none',
                        zIndex: -1,
                        opacity: 0.5
                    }} />

                    {/* Decorative Corner Markers */}
                    <div className="corner-marker top-left" style={{ borderColor: themeColor, width: '30px', height: '30px', borderWidth: '2px' }} />
                    <div className="corner-marker bottom-right" style={{ borderColor: themeColor, width: '30px', height: '30px', borderWidth: '2px' }} />

                    <div style={{ marginBottom: '2.5rem', position: 'relative', zIndex: 10 }}>
                        <div className="status-pill" style={{ marginBottom: '1rem', borderColor: `${themeColor}44` }}>
                            <span className="status-indicator" style={{ background: themeColor, boxShadow: `0 0 8px ${themeColor}` }}></span>
                            VOICE ID REPORT
                        </div>
                        <h2 className="text-h2" style={{ 
                            color: themeColor, 
                            fontSize: '1.8rem', 
                            margin: 0,
                            textShadow: `0 0 15px ${themeColor}44`,
                            textAlign: 'left'
                        }}>
                            {headerText}
                        </h2>
                    </div>

                    <div className="cyber-divider" style={{ margin: '1.5rem 0' }}></div>

                    <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="grid-item">
                            <label className="cyber-label">USER ACCESS ID</label>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', letterSpacing: '2px', color: 'white', marginTop: '0.25rem' }}>
                                {result.matched_speaker_id || result.targetId || result.user_id || '---'}
                            </div>
                        </div>

                        <div className="grid-item">
                            <label className="cyber-label">MATCH QUALITY</label>
                            <div style={{ color: themeColor, fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'var(--font-header)', marginTop: '0.25rem' }}>
                                {(result.similarity_score * 100).toFixed(2)}%
                            </div>
                        </div>

                        <div className="grid-item">
                            <label className="cyber-label">SECURITY SCAN</label>
                            <div style={{ color: livelinessColor, fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                                {livelinessText === 'CONFIRMED' ? 'SECURE' : livelinessText}
                            </div>
                        </div>

                        <div className="grid-item">
                            <label className="cyber-label">TIMESTAMP</label>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                {new Date().toLocaleTimeString()}
                            </div>
                        </div>

                        {result.message && !result.verified && (
                            <div className="grid-item" style={{ gridColumn: 'span 2', marginTop: '0.5rem', padding: '1rem', background: 'rgba(255, 50, 50, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--neon-red)' }}>
                                <label className="cyber-label" style={{ color: 'var(--neon-red)' }}>SYSTEM MESSAGE</label>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'left', lineHeight: '1.4' }}>
                                    {result.message}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '3rem' }}>
                        <Button
                            onClick={onClose}
                            variant={result.verified ? 'primary' : 'secondary'}
                            className="lg"
                            style={{ width: '100%' }}
                        >
                            CLOSE SESSION
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default VerificationResultModal;
