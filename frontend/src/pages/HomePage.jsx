import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Card from '../components/ui/Card';
import SystemStatus from '../components/ui/SystemStatus';
import LoreTerminal from '../components/ui/LoreTerminal';

const HomePage = () => {
  return (
    <div className="page-container home-page">
      <SystemStatus />

      <div className="hero-section">
        <div className="hero-bg-effect" />
        <div className="cyber-grid-overlay" />

        <div className="hero-header">
          <Logo size="large" />
        </div>

        <div className="hero-content">
          <p className="hero-subtitle text-glitch" data-text="IDENTITY IS VOICE">
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

      <LoreTerminal />
    </div>
  );
};

export default HomePage;