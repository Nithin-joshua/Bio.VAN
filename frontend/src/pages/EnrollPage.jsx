import React, { useState, Component } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Select from '../components/core/Select';
import Card from '../components/ui/Card';
import SystemStatus from '../components/ui/SystemStatus';
import VoiceRecorder from '../components/biometric/VoiceRecorder';
import { PHONETIC_PARAGRAPHS } from '../data/phonetics';
import { registerUserVoiceprint } from '../api/enroll.api';
import '../styles/components.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          <h3>System Error</h3>
          <p>{this.state.error?.toString()}</p>
          <Button onClick={() => window.location.reload()}>REBOOT SYSTEM</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * User Enrollment Page
 * Multi-step form for registering new users with voice biometrics.
 * 
 * Flow:
 * Step 0: Collect user details (name, email, role)
 * Steps 1-3: Record 3 phonetically balanced voice samples
 * Step 4: Success confirmation
 */
const EnrollPage = () => {
  const { showToast } = useToast();

  // Track current step in the enrollment process (0-4)
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);
  const [generatedUserId, setGeneratedUserId] = useState(null);

  // User enrollment data collected across all steps
  const [enrollmentData, setEnrollmentData] = useState({
    fullName: '',
    email: '',
    // password: '', // Removed
    role: 'personnel',
    recordings: {}  // Will store 3 voice sample blobs keyed by sample_1, sample_2, sample_3
  });

  /**
   * Advances to the next step in the enrollment process.
   * On the final voice sample step (step 3), submits all data to the server.
   */
  const proceedToNextStep = async () => {
    if (currentStep === 3) {
      // Final step: Submit all collected data to backend
      
      // Safety Check: Ensure all required data is present
      // This handles cases where user might have been mid-enrollment during code updates
      if (!enrollmentData.fullName || !enrollmentData.email) {
        showToast("Security Protocol Error: Missing Credentials. Returning to Phase 1.", "error");
        setCurrentStep(0);
        return;
      }

      // Verify all voice samples are recorded
      const missingSamples = PHONETIC_PARAGRAPHS.filter(p => !enrollmentData.recordings[p.id]);
      if (missingSamples.length > 0) {
        showToast(`Voice Calibration Incomplete. Missing: ${missingSamples.map(s => s.label).join(', ')}`, "error");
        // Go back to the first missing sample
        const firstMissingIndex = PHONETIC_PARAGRAPHS.findIndex(p => !enrollmentData.recordings[p.id]);
        if (firstMissingIndex !== -1) {
             // Step 0 is info, Step 1 is Sample 1 (index 0)
             setCurrentStep(firstMissingIndex + 1);
        }
        return;
      }

      setIsSubmittingToServer(true);
      try {
        const response = await registerUserVoiceprint(enrollmentData);
        // Ensure user_id is set before moving to next step
        if (response && response.user_id) {
          setGeneratedUserId(response.user_id);
        }
        showToast('Registration Successful. Identity Encoded.', 'success');
        setCurrentStep(prev => prev + 1);
      } catch (error) {
        showToast(error.message || 'Registration failed. Please try again.', 'error');
      } finally {
        setIsSubmittingToServer(false);
      }
    } else {
      // Move to next step
      setCurrentStep(prev => prev + 1);
    }
  };

  /**
   * Returns to the previous step in the enrollment process.
   * Allows users to correct information or re-record samples.
   */
  const returnToPreviousStep = () => setCurrentStep(prev => prev - 1);

  /**
   * Saves a recorded voice sample to the enrollment data.
   * Called when user completes recording for a specific sample.
   */
  const saveVoiceSample = (audioBlob, sampleId) => {
    setEnrollmentData(previousData => ({
      ...previousData,
      recordings: { ...previousData.recordings, [sampleId]: audioBlob }
    }));
  };

  /**
   * Renders the appropriate UI for the current enrollment step.
   */
  const renderProtocolInterface = () => {
    switch (currentStep) {
      case 0:
        // Step 1: Collect user profile information
        return (
          <Card title="IDENTITY PROTOCOL" status="PHASE 1/4" delay={0.1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px', padding: '1rem' }}>
              <div className="cyber-input-group">
                <label className="cyber-label">DESIGNATION (FULL NAME)</label>
                <input
                  type="text"
                  className="cyber-input"
                  value={enrollmentData.fullName}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, fullName: e.target.value })}
                  placeholder="ENTER DESIGNATION"
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">COMMS CHANNEL (EMAIL)</label>
                <input
                  type="email"
                  className="cyber-input"
                  value={enrollmentData.email}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, email: e.target.value })}
                  placeholder="user@network.com"
                />
              </div>
              
              {/* Password field removed as per directive */}

              <div className="cyber-input-group">
                <label className="cyber-label">CLEARANCE LEVEL</label>
                <Select
                  value={enrollmentData.role}
                  onChange={(value) => setEnrollmentData({ ...enrollmentData, role: value })}
                  options={[
                    { value: 'personnel', label: 'STANDARD PERSONNEL' },
                    { value: 'admin', label: 'SYSTEM ADMINISTRATOR' },
                    { value: 'researcher', label: 'LAB RESEARCHER' }
                  ]}
                  placeholder="SELECT CLEARANCE"
                />
              </div>
              {/* Only enable proceed button if form is valid */}
              <Button
                onClick={proceedToNextStep}
                disabled={!enrollmentData.fullName || !enrollmentData.email || !enrollmentData.email.includes('@')}
                style={{ marginTop: '1rem' }}
              >
                INITIATE VOICE CALIBRATION
              </Button>
            </div>
          </Card>
        );
      case 1:
      case 2:
      case 3:
        // Steps 2-4: Record voice samples
        // Each step records one of three phonetically balanced paragraphs
        const sampleIndex = currentStep - 1;
        const currentSample = PHONETIC_PARAGRAPHS[sampleIndex];
        const isLastSample = currentStep === 3;

        return (
          <Card title={`VOICE SAMPLE ${currentStep}/3`} status="RECORDING" delay={0.1}>
            <div style={{ padding: '1rem', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Verbalize the following data packet clearly:
              </p>
              {/* Display the phonetic paragraph for user to read */}
              <div style={{
                padding: '1rem',
                background: 'rgba(0, 243, 255, 0.05)',
                borderLeft: '2px solid var(--primary-color)',
                color: 'white',
                fontSize: '1.1rem',
                fontFamily: 'var(--font-header)',
                letterSpacing: '0.5px'
              }}>
                "{currentSample.text}"
              </div>

              {/* Voice recorder component handles recording UI */}
              <VoiceRecorder
                key={currentSample.id}
                label={currentSample.label}
                onRecordingComplete={(blob) => saveVoiceSample(blob, currentSample.id)}
              />

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <Button variant="secondary" onClick={returnToPreviousStep} disabled={isSubmittingToServer}>REGRESS</Button>
                <Button 
                  onClick={proceedToNextStep} 
                  disabled={!enrollmentData.recordings[currentSample.id] || isSubmittingToServer}
                >
                  {isSubmittingToServer ? "UPLOADING BIOMETRICS..." : (isLastSample ? "FINALIZE REGISTRATION" : "NEXT SAMPLE")}
                </Button>
              </div>
            </div>
          </Card>
        );
      case 4:
        // Step 5: Success confirmation
        return (
          <Card title="REGISTRATION COMPLETE" status="SUCCESS" delay={0.1}>
            <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>IDENTITY ENCODED</h3>
              {generatedUserId && (
                <div style={{ margin: '1rem 0', padding: '1rem', border: '1px dashed var(--primary-color)', background: 'rgba(0, 243, 255, 0.05)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>ASSIGNED OPERATOR ID</p>
                  <p style={{ color: 'white', fontSize: '2rem', fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>{generatedUserId}</p>
                </div>
              )}
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Voice profile has been successfully integrated for <strong style={{ color: 'white' }}>{enrollmentData.fullName}</strong>.
              </p>
              <Link to="/">
                <Button>RETURN TO MAIN GATEWAY</Button>
              </Link>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <SystemStatus />
        {/* Page header with logo and title */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Logo size="medium" style={{ justifyContent: 'center' }} />
          <h2 style={{ fontFamily: 'var(--font-header)', color: 'var(--text-secondary)', letterSpacing: '4px', fontSize: '1rem', marginTop: '1rem' }}>
            NEW USER ENROLLMENT PROTOCOL
          </h2>
        </div>

        {/* Render current step content (form, voice recorder, or success message) */}
        {renderProtocolInterface()}

        {/* Footer with version info */}
        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          SECURE_CORE // V2.0.4
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default EnrollPage;
