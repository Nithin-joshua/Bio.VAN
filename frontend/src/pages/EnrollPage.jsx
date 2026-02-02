import React, { useState, Component } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Select from '../components/core/Select';
import Card from '../components/ui/Card';
import SystemStatus from '../components/ui/SystemStatus';
import { PHONETIC_PARAGRAPHS } from '../data/phonetics';
import { registerUserVoiceprint } from '../api/enroll.api';
import '../styles/components.css';
import '../styles/cyber-player.css';

// Audio Hooks & Components
import { useRecorder } from '../audio/useRecorder';
import { useWaveformAnalyzer } from '../audio/useWaveformAnalyzer';
import Waveform from '../components/signal/Waveform';
import PulseRing from '../components/signal/PulseRing';

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
 */
const EnrollPage = () => {
  const { showToast } = useToast();

  // Track current step in the enrollment process (0-4)
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);
  const [generatedUserId, setGeneratedUserId] = useState(null);

  // Audio Hooks
  const { isRecording, stream, startRecording, stopRecording } = useRecorder();
  const audioData = useWaveformAnalyzer(stream);

  // User enrollment data collected across all steps
  const [enrollmentData, setEnrollmentData] = useState({
    fullName: '',
    email: '',
    role: 'personnel',
    recordings: {}  // Will store 3 voice sample blobs keyed by sample_1, sample_2, sample_3
  });

  /**
   * Toggles recording state for enrollment
   */
  const toggleRecording = async (sampleId) => {
    if (isRecording) {
      // Stop recording
      const audioBlob = await stopRecording();
      if (audioBlob) {
        saveVoiceSample(audioBlob, sampleId);
        showToast("Sample captured. Review or Proceed.", "success");
      }
    } else {
      // Start recording
      startRecording();
    }
  };

  /**
   * Advances to the next step in the enrollment process.
   */
  const proceedToNextStep = async () => {
    if (currentStep === 3) {
      // Final step: Submit all collected data
      if (!enrollmentData.fullName || !enrollmentData.email) {
        showToast("Security Protocol Error: Missing Credentials.", "error");
        setCurrentStep(0);
        return;
      }

      const missingSamples = PHONETIC_PARAGRAPHS.filter(p => !enrollmentData.recordings[p.id]);
      if (missingSamples.length > 0) {
        showToast(`Missing Samples: ${missingSamples.map(s => s.label).join(', ')}`, "error");
        return;
      }

      setIsSubmittingToServer(true);
      try {
        const response = await registerUserVoiceprint(enrollmentData);
        if (response && response.user_id) {
          setGeneratedUserId(response.user_id);
        }
        showToast('Registration Successful. Identity Encoded.', 'success');
        setCurrentStep(prev => prev + 1);
      } catch (error) {
        showToast(error.message || 'Registration failed.', 'error');
      } finally {
        setIsSubmittingToServer(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const returnToPreviousStep = () => setCurrentStep(prev => prev - 1);

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
        // Steps 2-4: Record voice samples using Music Player Layout
        {
          const sampleIndex = currentStep - 1;
          const currentSample = PHONETIC_PARAGRAPHS[sampleIndex];
          const hasRecording = !!enrollmentData.recordings[currentSample.id];

          return (
            <div className="cyber-player-card">
              {/* Header */}
              <div className="player-header">
                <div className="player-header-text">
                  VOICE CALIBRATION // SAMPLE {currentStep}/3
                </div>
              </div>

              {/* Visualizer */}
              <div className="visualizer-display">
                <div className="visualizer-content">
                  <div style={{ width: '100%', height: '100%', opacity: 0.6 }}>
                    <Waveform audioData={audioData} isActive={isRecording} />
                  </div>
                  <div style={{ position: 'absolute' }}>
                    <PulseRing isActive={isRecording} />
                  </div>
                </div>
              </div>

              {/* Track Info */}
              <div className="player-track-info">
                <div className="track-title-row">
                  <div style={{ flex: 1 }}>
                    <div className="track-title-label">
                      Encoding Profile
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                      {enrollmentData.fullName || "UNKNOWN SUBJECT"}
                    </div>
                  </div>
                  <div style={{ paddingBottom: '2px' }}>
                    <div className={`status-dot ${hasRecording ? 'active' : (isRecording ? 'recording' : '')}`} />
                  </div>
                </div>

                <div className="player-lyrics">
                  <div className="player-lyrics-text">
                    "{currentSample.text}"
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="player-controls-area">
                <div className="player-progress-bar">
                  <div className="player-progress-fill" style={{ width: isRecording ? '100%' : '0%', transitionDuration: '10s' }} />
                </div>

                <div className="player-buttons">
                  {/* Previous Step */}
                  <button onClick={returnToPreviousStep} className="player-btn-small" title="Back">
                    <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>➜</span>
                  </button>

                  {/* Record / Stop */}
                  <div
                    className={`player-btn-main ${isRecording ? 'recording' : ''}`}
                    onClick={() => toggleRecording(currentSample.id)}
                  >
                    {isRecording ? <div className="icon-stop" /> : <div className="icon-play" />}
                  </div>

                  {/* Next Step */}
                  <button
                    onClick={proceedToNextStep}
                    className="player-btn-small"
                    disabled={!hasRecording || isSubmittingToServer}
                    style={{ opacity: (!hasRecording || isSubmittingToServer) ? 0.5 : 1, cursor: (!hasRecording || isSubmittingToServer) ? 'not-allowed' : 'pointer' }}
                    title="Next Sample"
                  >
                    <span>➜</span>
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                  {isRecording ? "RECORDING IN PROGRESS..." : (hasRecording ? "SAMPLE BUFFERED. PROCEED >>" : "AWAITING INPUT")}
                </div>
              </div>
            </div>
          );
        }
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
        {currentStep === 0 && (
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <Logo size="medium" style={{ justifyContent: 'center' }} />
            <h2 style={{ fontFamily: 'var(--font-header)', color: 'var(--text-secondary)', letterSpacing: '4px', fontSize: '1rem', marginTop: '1rem' }}>
              NEW USER ENROLLMENT PROTOCOL
            </h2>
          </div>
        )}

        {/* Render current step content */}
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
