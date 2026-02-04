import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../core/Button';
import Logo from '../core/Logo';

// Sub-component for clean masked reveals with Scroll Trigger
const MaskedReveal = ({ children, delay = 0 }) => {
    return (
        <div style={{ overflow: 'hidden', position: 'relative' }}>
            <motion.div
                initial={{ y: "100%" }}
                whileInView={{ y: "0%" }}
                viewport={{ once: false }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: delay }}
            >
                {children}
            </motion.div>
        </div>
    );
};

const HeroSection = () => {
    return (
        <div className="fluid-container" style={{ padding: '8rem 0 4rem 0', overflow: 'hidden' }}>
            {/* BACKGROUND ELEMENTS */}
            <div className="hero-bg-effect" />

            {/* HOLOGRAM LOGO (Top-Left Fixed feel) */}
            <div style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 50, opacity: 1 }}>
                <Logo size="medium" />
            </div>

            {/* MASSIVE TYPE CONTAINER */}
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'left', paddingLeft: '5vw' }}>

                {/* LINE 1 */}
                <MaskedReveal delay={0.1}>
                    <h1 className="text-massive text-gradient-mask">SECURE.</h1>
                </MaskedReveal>

                {/* LINE 2 */}
                <div style={{ marginLeft: '10vw' }}>
                    <MaskedReveal delay={0.2}>
                        <h1 className="text-massive text-gradient-mask">VOICE.</h1>
                    </MaskedReveal>
                </div>

                {/* LINE 3 */}
                <div style={{ marginLeft: '5vw' }}>
                    <MaskedReveal delay={0.3}>
                        <h1 className="text-massive text-gradient-mask">IDENTITY.</h1>
                    </MaskedReveal>
                </div>
            </div>

            {/* DESCRIPTION & ACTIONS */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ delay: 0.5, duration: 1 }}
                style={{
                    marginTop: '4rem',
                    maxWidth: '600px',
                    marginLeft: 'auto',
                    marginRight: '10vw',
                    textAlign: 'right'
                }}
            >
                <p className="hero-description" style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                    Forget passwords. Your voice is the only key you need.
                    <br />
                    <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>Bio.VAN</span> encodes your unique vocal resonance into an unbreakable digital signature.
                </p>

                <div className="home-actions" style={{ justifyContent: 'flex-end', gap: '1rem', display: 'flex' }}>
                    <Link to="/verify">
                        <Button variant="primary">INITIATE VERIFICATION</Button>
                    </Link>
                    <Link to="/enroll">
                        <Button variant="secondary">ENROLL NEW ID</Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default HeroSection;
