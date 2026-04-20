import React from 'react';
import { motion } from 'framer-motion';

const StepIndicator = ({ currentStep = 1 }) => {
  const steps = [
    { id: 1, label: 'Sign Up', path: '/enroll' },
    { id: 2, label: 'Sign In', path: '/verify' },
    { id: 3, label: 'Secure Area', path: '/admin' }
  ];

  return (
    <div className="step-indicator-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '2rem',
      margin: '2rem 0',
      padding: '1rem',
      fontFamily: 'var(--font-header)',
      position: 'relative',
      zIndex: 10
    }}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className={`step-item ${currentStep === step.id ? 'active' : ''}`} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: currentStep >= step.id ? 1 : 0.4,
            transition: 'all 0.3s ease'
          }}>
            <div className="step-number" style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              border: `2px solid ${currentStep >= step.id ? 'var(--neon-blue)' : 'var(--text-muted)'}`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: currentStep >= step.id ? 'var(--neon-blue-dim)' : 'transparent',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: currentStep >= step.id ? 'var(--neon-blue)' : 'var(--text-muted)',
              transition: 'all 0.3s ease'
            }}>
              {step.id}
            </div>
            <span className="step-label" style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: currentStep >= step.id ? 'var(--neon-blue)' : 'var(--text-muted)'
            }}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`step-connector ${currentStep > step.id ? 'active' : ''}`} style={{
              width: '80px',
              height: '2px',
              background: 'var(--text-muted)',
              opacity: 0.3,
              transition: 'all 0.5s ease'
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
