import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Select from '../components/core/Select';
import Card from '../components/ui/Card';
import VoiceRecorder from '../components/biometric/VoiceRecorder';
import { PHONETIC_PARAGRAPHS } from '../data/phonetics';
import { enrollUser } from '../api/enroll.api';
import '../styles/components.css'; // Ensure components styles are available

const EnrollPage = () => {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'personnel',
    recordings: {}
  });

  const handleNext = async () => {
    if (step === 3) {
      // Final step: Submit data
      setIsSubmitting(true);
      try {
        await enrollUser(formData);
        showToast('Registration Successful. Identity Encoded.', 'success');
        setStep(prev => prev + 1);
      } catch (error) {
        showToast(error.message || 'Registration failed. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStep(prev => prev + 1);
    }
  };
  const handleBack = () => setStep(prev => prev - 1);

  const handleRecordingComplete = (blob, sampleId) => {
    setFormData(prev => ({
      ...prev,
      recordings: { ...prev.recordings, [sampleId]: blob }
    }));
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Card title="IDENTITY DETAILS" status="STEP 1/4" delay={0.1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px', padding: '1rem' }}>
              <div className="cyber-input-group">
                <label className="cyber-label">FULL NAME</label>
                <input
                  type="text"
                  className="cyber-input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="ENTER FULL NAME"
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">EMAIL ADDRESS</label>
                <input
                  type="email"
                  className="cyber-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">ROLE</label>
                <Select
                  value={formData.role}
                  onChange={(value) => setFormData({ ...formData, role: value })}
                  options={[
                    { value: 'personnel', label: 'PERSONNEL' },
                    { value: 'admin', label: 'ADMINISTRATOR' },
                    { value: 'researcher', label: 'RESEARCHER' }
                  ]}
                  placeholder="SELECT ROLE"
                />
              </div>
              <Button
                onClick={handleNext}
                disabled={!formData.fullName || !formData.email || !formData.email.includes('@')}
                style={{ marginTop: '1rem' }}
              >
                PROCEED TO VOICE CALIBRATION
              </Button>
            </div>
          </Card>
        );
      case 1:
      case 2:
      case 3:
        const sampleIndex = step - 1;
        const sample = PHONETIC_PARAGRAPHS[sampleIndex];
        const isLast = step === 3;

        return (
          <Card title={`VOICE SAMPLE ${step}/3`} status="RECORDING" delay={0.1}>
            <div style={{ padding: '1rem', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Please read the following text clearly:
              </p>
              <div style={{
                padding: '1rem',
                background: 'rgba(0, 243, 255, 0.05)',
                borderLeft: '2px solid var(--primary-color)',
                color: 'white',
                fontSize: '1.1rem',
                fontFamily: 'var(--font-header)',
                letterSpacing: '0.5px'
              }}>
                "{sample.text}"
              </div>

              <VoiceRecorder
                label={sample.label}
                onRecordingComplete={(blob) => handleRecordingComplete(blob, sample.id)}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>BACK</Button>
                {formData.recordings[sample.id] && (
                  <Button onClick={handleNext} disabled={isSubmitting}>
                    {isSubmitting ? "PROCESSING..." : (isLast ? "COMPLETE REGISTRATION" : "NEXT SAMPLE")}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      case 4:
        return (
          <Card title="REGISTRATION COMPLETE" status="SUCCESS" delay={0.1}>
            <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>IDENTITY REGISTERED</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Voice profile has been successfully created for <strong style={{ color: 'white' }}>{formData.fullName}</strong>.
              </p>
              <Link to="/">
                <Button>RETURN TO GATEWAY</Button>
              </Link>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Logo size="medium" style={{ justifyContent: 'center' }} />
        <h2 style={{ fontFamily: 'var(--font-header)', color: 'var(--text-secondary)', letterSpacing: '4px', fontSize: '1rem', marginTop: '1rem' }}>
          NEW USER ENROLLMENT
        </h2>
      </div>
      {renderStepContent()}
      <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        SECURE_CORE // V2.0.4
      </div>
    </div>
  );
};

export default EnrollPage;
