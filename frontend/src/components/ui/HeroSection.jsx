import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../core/Button';
import Logo from '../core/Logo';

// Typing effect hook - resets on scroll
const useTypingEffect = (text, speed = 100, delay = 0, triggerReset = false) => {
    const [displayedText, setDisplayedText] = useState('');
    const [started, setStarted] = useState(false);

    useEffect(() => {
        // Reset on scroll trigger
        setDisplayedText('');
        setStarted(false);
        
        const timer = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(timer);
    }, [delay, triggerReset]);

    useEffect(() => {
        if (!started) return;
        if (displayedText.length < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(text.slice(0, displayedText.length + 1));
            }, speed);
            return () => clearTimeout(timeout);
        }
    }, [displayedText, text, speed, started]);

    return displayedText;
};

// Word animation variants
const wordVariants = {
    hidden: { opacity: 0, y: 20, rotateZ: -10 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        rotateZ: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.8,
            ease: "easeOut"
        }
    }),
    hover: {
        scale: 1.1,
        y: -5,
        textShadow: '4px 4px 0px #00CC99',
        transition: { duration: 0.2 }
    }
};

// Glowing text animation
const glowVariants = {
    initial: { opacity: 0.5 },
    animate: {
        opacity: [0.5, 1, 0.5],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

const HeroSection = () => {
    const { scrollY } = useScroll();
    const [scrollTrigger, setScrollTrigger] = useState(0);
    
    // Reset typing effect on scroll
    useEffect(() => {
        const handleScroll = () => {
            setScrollTrigger(prev => prev + 1);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    // Parallax/Transform effects based on scroll
    const textY = useTransform(scrollY, [0, 500], [0, 150]);
    const textOpacity = useTransform(scrollY, [0, 300], [1, 0]);
    const textScale = useTransform(scrollY, [0, 500], [1, 0.9]);

    const line1 = useTypingEffect("SECURE YOUR IDENTITY", 70, 500, scrollTrigger);
    const line2 = useTypingEffect("WITH YOUR VOICE", 70, 2000, scrollTrigger);

    // Split text into words for individual animations
    const line1Words = line1.split(' ');
    const line2Words = line2.split(' ');

    // Button animation variants
    const buttonVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: 2.8 + (i * 0.2),
                duration: 0.6,
                ease: "easeOut"
            }
        }),
        hover: {
            scale: 1.05,
            y: -3,
            textShadow: '2px 2px 0px rgba(0, 204, 153, 0.6)',
            transition: { duration: 0.2 }
        }
    };

    return (
        <div className="fluid-container" style={{ 
            minHeight: '70vh', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '2rem 2rem', 
            position: 'relative',
            textAlign: 'center',
            overflow: 'hidden'
        }}>
            
            {/* BACKGROUND GLOW & OVERLAY */}
            <div className="hero-bg-effect" style={{ top: '50%', opacity: 0.4 }} />
            <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'radial-gradient(circle at center, transparent 0%, var(--bg-dark) 100%)', 
                opacity: 0.8,
                zIndex: 1
            }} />

            {/* LOGO POSITIONED LEFT */}
            <div style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 50 }}>
                <Logo size="medium" />
            </div>

            {/* PRIMARY HEADING - Enhanced Animations */}
            <motion.div style={{ 
                position: 'relative', 
                zIndex: 10, 
                maxWidth: '1000px', 
                textAlign: 'center',
                y: textY,
                opacity: textOpacity,
                scale: textScale
            }}>
                {/* Line 1 - SECURE YOUR IDENTITY */}
                <motion.h1 
                    className="text-h1"
                    style={{ 
                        marginBottom: '0.2rem', 
                        lineHeight: '1',
                        fontSize: 'clamp(4rem, 14vw, 9.5rem)',
                        color: '#FFFFFF',
                        textShadow: '3px 3px 0px #00CC99, 6px 6px 0px rgba(0, 204, 153, 0.5)',
                        fontFamily: 'var(--font-header)',
                        fontWeight: 'bold',
                        minHeight: '1.2em',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.3em',
                        flexWrap: 'wrap',
                        letterSpacing: '0.02em'
                    }}
                    initial="hidden"
                    animate="visible"
                >
                    {line1Words.map((word, i) => (
                        <motion.span
                            key={i}
                            custom={i}
                            variants={wordVariants}
                            whileHover="hover"
                            style={{
                                display: 'inline-block',
                                cursor: 'pointer'
                            }}
                        >
                            {word}
                        </motion.span>
                    ))}
                    <motion.span 
                        className="cursor-blink"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                    >
                        |
                    </motion.span>
                </motion.h1>

                {/* Line 2 - WITH YOUR VOICE */}
                <motion.h2 
                    className="text-h2"
                    style={{ 
                        marginBottom: '1rem', 
                        lineHeight: '1.1',
                        fontSize: 'clamp(2rem, 7vw, 4rem)',
                        color: '#00CC99',
                        textShadow: '2px 2px 0px rgba(0, 191, 165, 0.4)',
                        fontWeight: 'bold',
                        minHeight: '1.2em',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.3em',
                        flexWrap: 'wrap',
                        letterSpacing: '0.02em'
                    }}
                    initial="hidden"
                    animate="visible"
                >
                    {line2Words.map((word, i) => (
                        <motion.span
                            key={i}
                            custom={i + 3}
                            variants={wordVariants}
                            whileHover="hover"
                            style={{
                                display: 'inline-block',
                                cursor: 'pointer'
                            }}
                        >
                            {word}
                        </motion.span>
                    ))}
                </motion.h2>
            </motion.div>

            {/* DESCRIPTION BLOCK - With fade-in animation */}
            <motion.div 
                style={{ 
                    maxWidth: '650px', 
                    marginBottom: '1.5rem', 
                    position: 'relative', 
                    zIndex: 10,
                    opacity: textOpacity 
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.3, duration: 0.8 }}
            >
                <p className="text-body" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', margin: '0 auto', lineHeight: '1.6' }}>
                    Welcome to the next generation of voice authentication. 
                    Simple, secure, and uniquely yours. Experience zero-trust access 
                    powered by advanced neural analysis.
                </p>
            </motion.div>

            {/* ACTION ROW - Enhanced Animations */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
                <motion.div
                    custom={0}
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                >
                    <Link to="/enroll">
                        <Button variant="secondary" style={{ width: '240px', height: '54px', fontSize: '1rem' }}>CREATE VOICE ID</Button>
                    </Link>
                </motion.div>
                <motion.div
                    custom={1}
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                >
                    <Link to="/verify">
                        <Button variant="primary" style={{ width: '240px', height: '54px', fontSize: '1rem' }}>START SESSION</Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroSection;
