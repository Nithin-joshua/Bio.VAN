import React from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';

/**
 * VoiceActivityRing Component
 * Dynamic ring that responds to audio amplitude
 * Scales and changes color based on voice activity level
 */
const VoiceActivityRing = ({
    audioLevel = 0,
    isActive = false,
    status = 'idle',
    size = 60
}) => {
    const shouldReduceMotion = useReducedMotion();

    // Map audio level (0-100) to scale (0.8 - 1.5)
    const scale = isActive ? 0.8 + (audioLevel / 100) * 0.7 : 0.8;

    // Map audio level to color using system tokens
    const getColor = (level) => {
        if (level < 30) return 'var(--neon-blue)';
        if (level < 70) return 'var(--neon-cyan)';
        return 'var(--neon-purple)';
    };

    const color = getColor(audioLevel);

    // Dynamic status configuration using system tokens
    const getStatusConfig = () => {
        switch (status) {
            case 'idle':
                return { color: 'var(--neon-blue)', label: 'System Ready', glow: false };
            case 'recording':
                return { color: 'var(--neon-blue)', label: 'Listening...', glow: true };
            case 'processing':
                return { color: 'var(--neon-purple)', label: 'Analyzing ID...', glow: true };
            case 'success':
            case 'verified':
                return { color: 'var(--neon-green)', label: 'Identity Verified', glow: true };
            case 'error':
            case 'rejected':
            case 'spoof':
                return { color: 'var(--neon-red)', label: 'Access Denied', glow: true };
            case 'too_far':
                return { color: 'var(--neon-yellow)', label: 'Signal Weak', glow: false };
            case 'bad_audio':
                return { color: 'var(--neon-yellow)', label: 'Patchy Signal', glow: false };
            default:
                return { color: 'rgba(255, 255, 255, 0.2)', label: 'Standby', glow: false };
        }
    };

    const currentStatus = getStatusConfig();

    return (
        <motion.div
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: size * 2,
                height: size * 2,
                marginLeft: -size,
                marginTop: -size,
                pointerEvents: 'none',
                zIndex: 0
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: isActive ? 1 : 0,
                scale: isActive ? 1 : 0
            }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
        >
            {/* Outer ring - scales with audio */}
            <motion.svg
                width={size * 2}
                height={size * 2}
                viewBox="0 0 120 120"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
            >
                <motion.circle
                    cx="60"
                    cy="60"
                    r="55"
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    style={{
                        filter: `drop-shadow(0 0 ${8 + audioLevel / 10}px ${color})`
                    }}
                    animate={{
                        scale: scale,
                        opacity: 0.6 + (audioLevel / 200)
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : {
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                    }}
                />
            </motion.svg>

            {/* Inner pulse ring */}
            <motion.svg
                width={size * 2}
                height={size * 2}
                viewBox="0 0 120 120"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
            >
                <motion.circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    opacity="0.4"
                    animate={shouldReduceMotion ? { scale: 1, opacity: 0.4 } : {
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.1, 0.4]
                    }}
                    transition={{
                        duration: shouldReduceMotion ? 0 : 2,
                        repeat: shouldReduceMotion ? 0 : Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.svg>

            {/* Amplitude bars (optional decorative element) */}
            {isActive && audioLevel > 20 && (
                <motion.div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: 4,
                        height: 4,
                        marginLeft: -2,
                        marginTop: -2,
                        background: color,
                        borderRadius: '50%',
                        boxShadow: `0 0 ${10 + audioLevel / 5}px ${color}`
                    }}
                    animate={shouldReduceMotion ? { scale: 1, opacity: 0.8 } : {
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 0.3, 0.8]
                    }}
                    transition={{
                        duration: shouldReduceMotion ? 0 : 0.5,
                        repeat: shouldReduceMotion ? 0 : Infinity
                    }}
                />
            )}

            {/* Status Labels - Animated Scramble Effect */}
            <div style={{
                position: 'absolute',
                top: size * 2 + 15,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'max-content',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '2px',
                pointerEvents: 'none',
                textShadow: `0 0 10px ${currentStatus.color}`
            }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={status}
                        initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -5, filter: 'blur(4px)' }}
                        transition={{ duration: 0.2 }}
                        style={{ color: currentStatus.color }}
                    >
                        {/* Scramble-like flicker for cyberpunk feel */}
                        <motion.span
                            animate={{ opacity: [1, 0.5, 1, 0.8, 1] }}
                            transition={{ duration: 0.3, repeat: 1 }}
                        >
                            {currentStatus.label}
                        </motion.span>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default VoiceActivityRing;
