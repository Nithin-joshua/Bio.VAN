import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../core/Button';
import Logo from '../core/Logo';

// Typing effect hook for progressive reveal
const useTypingEffect = (text, speed = 100, delay = 0) => {
    const [displayedText, setDisplayedText] = useState('');
    const [started, setStarted] = useState(false);

    useEffect(() => {
        setDisplayedText('');
        setStarted(false);

        const timer = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(timer);
    }, [delay, text]);

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
    hidden: { opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            delay: i * 0.08,
            duration: 1.0,
            ease: [0.16, 1, 0.3, 1]
        }
    }),
    hover: {
        scale: 1.05,
        y: -5,
        textShadow: '0 0 20px var(--neon-teal-glow)',
        transition: { duration: 0.4, ease: "easeOut" }
    }
};

const HeroSection = () => {
    const { scrollY } = useScroll();
    const shouldReduceMotion = useReducedMotion();

    // Mouse movement parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    
    const springConfig = { damping: 25, stiffness: 150 };
    const xSpring = useSpring(mouseX, springConfig);
    const ySpring = useSpring(mouseY, springConfig);
    
    const heroTranslateX = useTransform(xSpring, [-500, 500], [-15, 15]);
    const heroTranslateY = useTransform(ySpring, [-500, 500], [-10, 10]);
    const heroRotateY = useTransform(heroTranslateX, [-15, 15], [-5, 5]);
    const heroRotateX = useTransform(heroTranslateY, [-10, 10], [5, -5]);

    useEffect(() => {
        if (shouldReduceMotion) {
            mouseX.set(0);
            mouseY.set(0);
            return undefined;
        }

        const pointerQuery = window.matchMedia('(pointer: fine)');
        let parallaxEnabled = false;

        const updateParallaxMode = () => {
            parallaxEnabled = pointerQuery.matches && window.innerWidth >= 1024;

            if (!parallaxEnabled) {
                mouseX.set(0);
                mouseY.set(0);
            }
        };

        const handleMouseMove = (e) => {
            if (!parallaxEnabled) {
                return;
            }

            mouseX.set(e.clientX - window.innerWidth / 2);
            mouseY.set(e.clientY - window.innerHeight / 2);
        };

        updateParallaxMode();
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('resize', updateParallaxMode);
        pointerQuery.addEventListener?.('change', updateParallaxMode);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', updateParallaxMode);
            pointerQuery.removeEventListener?.('change', updateParallaxMode);
        };
    }, [mouseX, mouseY, shouldReduceMotion]);
    
    // Parallax/Transform effects based on scroll
    const textYOffset = useTransform(scrollY, [0, 500], [0, shouldReduceMotion ? 0 : 12]);
    const textOpacity = useTransform(scrollY, [0, 500], [1, 0.92]);
    const textScale = useTransform(scrollY, [0, 500], [1, 0.985]);

    const line1 = useTypingEffect("SECURE YOUR IDENTITY", shouldReduceMotion ? 0 : 60, shouldReduceMotion ? 0 : 400);
    const line2 = useTypingEffect("WITH YOUR VOICE", shouldReduceMotion ? 0 : 60, shouldReduceMotion ? 0 : 1800);

    // Split text into words for individual animations
    const line1Words = line1.split(' ');
    const line2Words = line2.split(' ');

    // Button animation variants
    const buttonVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                delay: 2.6 + (i * 0.15),
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1]
            }
        }),
        hover: {
            scale: 1.04,
            y: -5,
            boxShadow: '0 0 30px var(--neon-teal-glow)',
            transition: { duration: 0.3 }
        }
    };

    return (
        <div className="fluid-container" style={{ 
            minHeight: 'clamp(34rem, 88svh, 48rem)',
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem)', 
            position: 'relative',
            textAlign: 'center',
            overflow: 'clip'
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
            <div style={{ position: 'absolute', top: 'clamp(1rem, 4vw, 2.5rem)', left: 'clamp(1rem, 4vw, 2.5rem)', zIndex: 50 }}>
                <Logo size="medium" />
            </div>

            {/* PRIMARY HEADING - Enhanced Animations */}
            <motion.div style={{ 
                position: 'relative', 
                zIndex: 10, 
                maxWidth: '1100px', 
                textAlign: 'center',
                margin: '0 auto',
                y: textYOffset,
                x: shouldReduceMotion ? 0 : heroTranslateX,
                rotateY: shouldReduceMotion ? 0 : heroRotateY,
                rotateX: shouldReduceMotion ? 0 : heroRotateX,
                opacity: textOpacity,
                scale: textScale
            }}>
                {/* Line 1 - SECURE YOUR IDENTITY */}
                <motion.h1 
                    className="text-h1"
                    style={{ 
                        marginBottom: '0.2rem', 
                        lineHeight: '1',
                        fontSize: 'clamp(4rem, 11vw, 8.5rem)',
                        color: '#FFFFFF',
                        textShadow: '2px 2px 0px rgba(0, 204, 153, 0.85), 4px 4px 0px rgba(0, 204, 153, 0.35)',
                        fontFamily: 'var(--font-header)',
                        fontWeight: 'bold',
                        minHeight: '1.25em',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.24em',
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
                        fontSize: 'clamp(2rem, 6vw, 3.8rem)',
                        color: '#00CC99',
                        textShadow: '1px 1px 0px rgba(0, 191, 165, 0.35)',
                        fontWeight: 'bold',
                        minHeight: '1.25em',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.24em',
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
                    maxWidth: '800px', 
                    marginBottom: '2.5rem', 
                    position: 'relative', 
                    zIndex: 10,
                    margin: '0 auto 2.5rem auto',
                    opacity: textOpacity 
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.3, duration: 0.8 }}
            >
                <p className="text-body" style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'var(--text-secondary)', margin: '0 auto', lineHeight: '1.65' }}>
                    Welcome to the next generation of voice authentication. 
                    Simple, secure, and uniquely yours. Experience zero-trust access 
                    powered by advanced neural analysis.
                </p>
            </motion.div>

            {/* ACTION ROW - Enhanced Animations */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 10, width: '100%', maxWidth: '34rem' }}>
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
