import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Card from '../components/ui/Card';
import SystemStatus from '../components/ui/SystemStatus';
import LoreTerminal from '../components/ui/LoreTerminal';
import HeroSection from '../components/ui/HeroSection';

// Animation Variants
const HomePage = () => {
  const shouldReduceMotion = useReducedMotion();

  const fadeInUp = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 40 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: shouldReduceMotion ? 0 : 0.6, 
        ease: "easeOut" 
      }
    }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="home-page"
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: '100vh', position: 'relative' }}
    >
      <HeroSection />

      <section className="section-container">
        <div className="text-container">
          <motion.div variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
            <div className="status-pill" style={{ marginBottom: '1.5rem' }}>
              <span className="status-indicator active"></span>
              CORE TECHNOLOGY
            </div>
            <h2 className="text-h2">The Future of Voice Authorization</h2>
            <p className="text-body" style={{ fontSize: '1.1rem' }}>
              Bio.V is the next generation of identity security. No passwords, no hardware tokens, no friction. Just you.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="feature-grid"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            marginTop: '2rem'
          }}
        >
          <motion.div variants={fadeInUp}>
            <Card title="YOUR UNIQUE VOICE" status="LIVE">
              <h3 className="card-title" style={{ color: 'var(--neon-blue)', fontFamily: 'var(--font-header)', fontSize: '1rem', letterSpacing: '1px' }}>ONE-OF-A-KIND ID</h3>
              <p className="card-text">
                Your voice is unique, just like a fingerprint. We use your natural speech patterns to make sure only you can access your account.
              </p>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card title="INSTANT SECURITY" status="READY">
              <h3 className="card-title" style={{ color: 'var(--neon-purple)', fontFamily: 'var(--font-header)', fontSize: '1rem', letterSpacing: '1px' }}>REAL-TIME PROTECTION</h3>
              <p className="card-text">
                Our system makes sure it’s really you speaking, not a recording. Your account stays safe from spoofing and fraud.
              </p>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card title="YOUR PRIVACY" status="LOCKED">
              <h3 className="card-title" style={{ color: 'var(--neon-green)', fontFamily: 'var(--font-header)', fontSize: '1rem', letterSpacing: '1px' }}>SAFE DATA STORAGE</h3>
              <p className="card-text">
                We never store your actual audio. Your voice is turned into a secure digital code that can&apos;t be reversed or stolen.
              </p>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card title="SMART DEFENSE" status="PROTECTED">
              <h3 className="card-title" style={{ color: 'var(--neon-blue)', fontFamily: 'var(--font-header)', fontSize: '1rem', letterSpacing: '1px' }}>AI-POWERED ACCURACY</h3>
              <p className="card-text">
                Advanced technology works in the background to detect even the most realistic fake or cloned voices.
              </p>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card title="ADAPTIVE ACCESS" status="ACTIVE">
              <h3 className="card-title" style={{ color: 'var(--neon-red)', fontFamily: 'var(--font-header)', fontSize: '1rem', letterSpacing: '1px' }}>EASY LOGIN</h3>
              <p className="card-text">
                The system recognizes you instantly in almost any environment, adjusting automatically to background noise.
              </p>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card title="SECURE PROFILES" status="VERIFIED">
              <h3 className="card-title" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-header)', fontSize: '1rem', letterSpacing: '1px' }}>ONE PERSON, ONE ID</h3>
              <p className="card-text">
                Every profile is checked against our secure network to prevent duplicate accounts and keep the system fair.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      <div className="section-container">
        <LoreTerminal />
      </div>
    </motion.div>
  );
};

export default HomePage;