import React from 'react';
import { motion } from 'framer-motion';

/**
 * VoiceActivityRing Component
 * Dynamic ring that responds to audio amplitude
 * Scales and changes color based on voice activity level
 */
const VoiceActivityRing = ({
    audioLevel = 0,
    isActive = false,
    size = 60
}) => {
    // Map audio level (0-100) to scale (0.8 - 1.3)
    const scale = isActive ? 0.8 + (audioLevel / 100) * 0.5 : 0;

    // Map audio level to color
    const getColor = (level) => {
        if (level < 30) return '#00f3ff'; // neon-blue
        if (level < 70) return '#00ffcc'; // cyan
        return '#bc13fe'; // neon-purple
    };

    const color = getColor(audioLevel);

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
            transition={{ duration: 0.3 }}
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
                    transition={{
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
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.1, 0.4]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
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
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 0.3, 0.8]
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity
                    }}
                />
            )}
        </motion.div>
    );
};

export default VoiceActivityRing;
