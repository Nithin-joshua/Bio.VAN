import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Card from '../components/ui/Card';
import SystemStatus from '../components/ui/SystemStatus';
import LoreTerminal from '../components/ui/LoreTerminal';
import HeroSection from '../components/ui/HeroSection';

// Animation Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};


const HomePage = () => {
  return (
    <div className="page-container home-page">
      <SystemStatus />

      <HeroSection />

      <motion.div
        className="features-grid"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.1 }}
      >
        <motion.div variants={fadeInUp}>
          <Card title="VOICE PRINTING" status="ACTIVE">
            <h3 className="card-title" style={{ color: 'var(--neon-blue)' }}>UNIQUE SPECTRAL ID</h3>
            <p className="card-text">
              Just like a fingerprint, your voice has a unique signature. We map over 1000 data points to ensure it's really you.
            </p>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card title="LIVENESS CHECK" status="ARMED">
            <h3 className="card-title" style={{ color: 'var(--neon-purple)' }}>ANTI-SPOOFING AI</h3>
            <p className="card-text">
              Our system distinguishes between live speech and recordings, preventing replay attacks and synthetic voice fraud.
            </p>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card title="PRIVACY FIRST" status="LOCKED">
            <h3 className="card-title" style={{ color: 'var(--neon-green)' }}>ZERO-KNOWLEDGE STORAGE</h3>
            <p className="card-text">
              Your audio is never stored. We convert it to a mathematical hash that cannot be reversed, keeping your data safe.
            </p>
          </Card>
        </motion.div>

        {/* EXTRA CARDS FOR SCROLL EFFECT */}
        <motion.div variants={fadeInUp}>
          <Card title="NEURAL DEFENSE" status="PROTECTED">
            <h3 className="card-title" style={{ color: 'var(--neon-blue)' }}>RAWNET2 ANTI-SPOOFING</h3>
            <p className="card-text">
              Features a deep neural network trained on ASVspoof data to detect sub-audible artifacts in AI-cloned voices.
            </p>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card title="ADAPTIVE SECURITY" status="DYNAMIC">
            <h3 className="card-title" style={{ color: 'var(--neon-red)' }}>SMART THRESHOLDING</h3>
            <p className="card-text">
              Verification difficulty automatically adjusts based on liveness confidence. High confidence lowers friction; low confidence locks it down.
            </p>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card title="IDENTITY INTEGRITY" status="VERIFIED">
            <h3 className="card-title" style={{ color: 'var(--text-primary)' }}>1:N DEDUPLICATION</h3>
            <p className="card-text">
              Prevents duplicate profiles by scanning the entire voice database before enrollment. One voice, one identity.
            </p>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false }}
      >
        <LoreTerminal />
      </motion.div>
    </div>
  );
};

export default HomePage;