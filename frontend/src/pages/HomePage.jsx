import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Card from '../components/ui/Card';
import SystemStatus from '../components/ui/SystemStatus';

const HomePage = () => {
  return (
    <div className="page-container home-page">
      <SystemStatus />
      
      <div className="hero-section">
        <div className="hero-bg-effect" />

        <div className="hero-header">
          <Logo size="large" />
        </div>

        <div className="hero-content">
          <p className="hero-subtitle">
            IDENTITY IS VOICE
          </p>

          <p className="hero-description">
            Forget passwords. Your voice is the only key you need.
            Bio.VAN encodes your unique vocal resonance into an unbreakable digital signature.
            <br />
            <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>Secure. Seamless. You.</span>
          </p>
        </div>

        <div className="home-actions">
          <Link to="/verify">
            <Button variant="primary">INITIATE VERIFICATION</Button>
          </Link>
          <Link to="/enroll">
            <Button variant="secondary">ENROLL NEW ID</Button>
          </Link>
        </div>
      </div>

      <div className="features-grid">
        <Card title="VOICE PRINTING" status="ACTIVE" delay={0.2}>
          <h3 className="card-title" style={{ color: 'var(--neon-blue)' }}>UNIQUE SPECTRAL ID</h3>
          <p className="card-text">
            Just like a fingerprint, your voice has a unique signature. We map over 1000 data points to ensure it's really you.
          </p>
        </Card>

        <Card title="LIVENESS CHECK" status="ARMED" delay={0.4}>
          <h3 className="card-title" style={{ color: 'var(--neon-purple)' }}>ANTI-SPOOFING AI</h3>
          <p className="card-text">
            Our system distinguishes between live speech and recordings, preventing replay attacks and synthetic voice fraud.
          </p>
        </Card>

        <Card title="PRIVACY FIRST" status="LOCKED" delay={0.6}>
          <h3 className="card-title" style={{ color: 'var(--neon-green)' }}>ZERO-KNOWLEDGE STORAGE</h3>
          <p className="card-text">
            Your audio is never stored. We convert it to a mathematical hash that cannot be reversed, keeping your data safe.
          </p>
        </Card>
      </div>

      <div className="lore-section" style={{ marginTop: '4rem', maxWidth: '800px', textAlign: 'center', borderTop: '1px solid rgba(0, 243, 255, 0.2)', paddingTop: '2rem' }}>
        <h4 style={{ color: 'var(--text-secondary)', letterSpacing: '2px', marginBottom: '1rem' }}>SYSTEM BACKGROUND</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          Established in 2077, the <span style={{ color: 'var(--neon-blue)' }}>Bio.VAN Protocol</span> was developed to combat the rising tide of synthetic identity theft. 
          Operating on a decentralized neural mesh, our nodes process millions of voiceprints daily, ensuring that in a world of AI mimics, 
          <span style={{ color: 'var(--neon-green)' }}> humanity remains verifiable</span>.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div>NODE: <span style={{ color: 'var(--neon-blue)' }}>TOKYO-03</span></div>
          <div>LATENCY: <span style={{ color: 'var(--neon-green)' }}>12ms</span></div>
          <div>ENCRYPTION: <span style={{ color: 'var(--neon-purple)' }}>QUANTUM-256</span></div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;