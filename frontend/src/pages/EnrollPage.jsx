import React, { useState, Component } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Select from '../components/core/Select';
import Card from '../components/ui/Card';
import SystemStatus from '../components/ui/SystemStatus';
import AlertModal from '../components/ui/AlertModal';
import { PHONETIC_PARAGRAPHS } from '../data/phonetics';
import { registerUserVoiceprint, checkVoiceLiveness, fetchChallengePhrases } from '../api/enroll.api';
import '../styles/components.css';
import '../styles/cyber-player.css';

// Audio Hooks & Components
import { useRecorder } from '../audio/useRecorder';
import { useWaveformAnalyzer } from '../audio/useWaveformAnalyzer';
import Waveform from '../components/signal/Waveform';
import PulseRing from '../components/signal/PulseRing';
import VoiceActivityRing from '../components/signal/VoiceActivityRing';

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

  // Track current step in the enrollment process (0=Profile, 1-3=Samples, 4=Success)
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);
  const [generatedUserId, setGeneratedUserId] = useState(null);

  // Alert Modal State
  const [alertState, setAlertState] = useState({
    show: false,
    title: '',
    message: '',
    type: 'error'
  });

  const closeAlert = () => {
    setAlertState({ ...alertState, show: false });
  };

  // Audio Hooks - Abstraction for Web Audio API
  const { isRecording, stream, startRecording, stopRecording } = useRecorder();
  const audioData = useWaveformAnalyzer(stream); // For visualizer

  // User enrollment data collected across all steps
  const [enrollmentData, setEnrollmentData] = useState({
    fullName: '',
    email: '',
    role: 'personnel',
    recordings: {}  // Will store 3 voice sample blobs keyed by sample_1, sample_2, sample_3
  });

  const [challengePhrases, setChallengePhrases] = useState([]);

  // Fetch Challenges on Mount
  React.useEffect(() => {
    const initChallenges = async () => {
      const phrases = await fetchChallengePhrases(3);
      setChallengePhrases(phrases);
    };
    initChallenges();
  }, []);

  /**
   * Toggles recording state for enrollment.
   * Handles the flow of: Start -> Stop -> Validate -> Save/Reject
   */
  const toggleRecording = async (sampleId) => {
    if (isRecording) {
      // 1. Stop recording and get audio blob
      const audioBlob = await stopRecording();

      if (audioBlob) {
        showToast("Verifying sample integrity...", "info");

        // 2. Real-time Liveness Check (anti-spoofing)
        // Helps ensure user isn't playing back a recording
        try {
          const check = await checkVoiceLiveness(audioBlob);

          if (check.status === "success") {
            saveVoiceSample(audioBlob, sampleId);
            showToast("Sample Verified: Live Human Audio.", "success");
          } else if (check.error_code === "MIC_TOO_FAR") {
            showToast("Mic too far during enrollment. Move closer and re-record this sample.", "warning");
          } else if (check.error_code === "AUDIO_QUALITY_LOW") {
            showToast("Audio quality too low. Check your microphone or environment and try again.", "warning");
          } else {
            showToast(`Sample Rejected: ${check.message}`, "error");
          }
        } catch (error) {
          // Fallback if ML service is offline (Development Mode)
          console.warn("ML Service Error:", error);
          showToast("Verification Unavailable. Proceeding locally.", "warning");
          saveVoiceSample(audioBlob, sampleId);
        }
      }
    } else {
      // Start recording
      startRecording();
    }
  };

  /**
   * Advances to the next step in the enrollment process.
   * Handles final submission when completing the last sample.
   */
  const proceedToNextStep = async () => {
    if (currentStep === 0) {
      // Step 0: Profile Validation
      if (!enrollmentData.fullName || !enrollmentData.email) {
        showToast("Please fill in all fields", "error");
        return;
      }
      setCurrentStep(1);
    } else if (currentStep >= 1 && currentStep <= 3) {
      // Steps 1-3: Recording Validation
      const sampleIndex = currentStep - 1;
      const currentSampleId = PHONETIC_PARAGRAPHS[sampleIndex].id;

      if (!enrollmentData.recordings[currentSampleId]) {
        showToast("Please record the sample before proceeding", "error");
        return;
      }

      if (currentStep < 3) {
        // Just move to next sample
        setCurrentStep(prev => prev + 1);
      } else {
        // Step 3: Final Submission
        setIsSubmittingToServer(true);
        try {
          const payload = { ...enrollmentData, challengePhrases };
          const response = await registerUserVoiceprint(payload);

          if (response && response.user_id) {
            setGeneratedUserId(response.user_id);
            showToast("Identity Securely Encoded.", "success");
            setCurrentStep(4); // Move to Success
          }
        } catch (err) {
          console.error("Enrollment Error:", err);
          setIsSubmittingToServer(false);

          // Check for Security Alert (Duplicate)
          const errorMessage = err.message || "Enrollment Failed";
          const isDuplicate = errorMessage.includes("Biometric Security Alert") || (err.response && err.response.status === 409);

          if (isDuplicate) {
            setAlertState({
              show: true,
              title: "SECURITY ALERT",
              message: "Duplicate Biometric Detected! Voice signature matches an existing registered identity.",
              type: "error"
            });
          } else {
            showToast(errorMessage, "error");
          }
        }
      }
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
          const currentSampleId = PHONETIC_PARAGRAPHS[sampleIndex].id; // Keep IDs consistent (sample_1, etc)
          const currentText = challengePhrases[sampleIndex] || "Establishing Secure Channel...";
          const hasRecording = !!enrollmentData.recordings[currentSampleId];

          return (
            <Card className="cyber-player-card" style={{ padding: '1.5rem', borderRadius: '30px' }}>

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
                    &quot;{currentText}&quot;
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
                    <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>&gt;</span>
                  </button>

                  {/* Record / Stop */}
                  <div
                    className={`player-btn-main ${isRecording ? 'recording' : ''}`}
                    onClick={() => toggleRecording(currentSampleId)}
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
                    <span>&gt;</span>
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                  {isRecording ? "RECORDING IN PROGRESS..." : (hasRecording ? "SAMPLE BUFFERED. PROCEED >>" : "AWAITING INPUT")}
                </div>

                {/* Buffer Status Indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                  {[1, 2, 3].map(step => {
                    const sId = PHONETIC_PARAGRAPHS[step - 1].id;
                    const isBuffered = !!enrollmentData.recordings[sId];
                    return (
                      <div
                        key={sId}
                        title={`Sample ${step} ${isBuffered ? 'Buffered' : 'Eqmpty'}`}
                        style={{
                          width: '8px', height: '8px',
                          borderRadius: '50%',
                          backgroundColor: isBuffered ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                          boxShadow: isBuffered ? '0 0 5px var(--primary-color)' : 'none',
                          transition: 'all 0.3s'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        }
      case 4:
        // Step 5: Success confirmation
        return (
          <Card title="REGISTRATION COMPLETE" status="SUCCESS" delay={0.1}>
            <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>*</div>
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
        {alertState.show && (
          <AlertModal
            title={alertState.title}
            message={alertState.message}
            type={alertState.type}
            onClose={closeAlert}
          />
        )}
        <SystemStatus />
        {/* Page header with logo and title */}
        {currentStep === 0 && (
          <motion.div
            style={{ marginBottom: '2rem', textAlign: 'center' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Logo size="medium" style={{ justifyContent: 'center' }} />
            <motion.h2
              style={{ fontFamily: 'var(--font-header)', color: 'var(--text-secondary)', letterSpacing: '4px', fontSize: '1rem', marginTop: '1rem' }}
              initial={{ opacity: 0, letterSpacing: '0px' }}
              animate={{ opacity: 1, letterSpacing: '4px' }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              NEW USER ENROLLMENT PROTOCOL
            </motion.h2>
          </motion.div>
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
