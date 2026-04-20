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
import StepIndicator from '../components/ui/StepIndicator';
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

          // Check for Security Alert (Duplicate Voice)
          const errorMessage = err.message || "Enrollment Failed";
          const isDuplicate = 
            errorMessage.includes("already present") || 
            errorMessage.includes("Duplicate voice") ||
            errorMessage.includes("already enrolled") ||
            errorMessage.includes("Biometric Security Alert");

          if (isDuplicate) {
            setAlertState({
              show: true,
              title: "VOICE SIGNATURE MATCH DETECTED",
              message: errorMessage,
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
          <div className="text-overlay" style={{ marginTop: '2rem', maxWidth: '500px', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
            <h2 className="text-h2" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              SET UP YOUR VOICE ID
            </h2>
            <p className="text-body" style={{ marginBottom: '2.5rem', fontSize: '0.95rem' }}>
              Takes less than 10 seconds. Your voice will be turned into a secure digital key that only you can use.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="cyber-input-group">
                <label className="cyber-label">YOUR FULL NAME</label>
                <input
                  type="text"
                  className="cyber-input"
                  value={enrollmentData.fullName}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="cyber-input-group">
                <label className="cyber-label">EMAIL ADDRESS</label>
                <input
                  type="email"
                  className="cyber-input"
                  value={enrollmentData.email}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, email: e.target.value })}
                  placeholder="e.g. name@company.com"
                />
              </div>

              <div className="cyber-input-group">
                <label className="cyber-label">ACCESS LEVEL</label>
                <Select
                  value={enrollmentData.role}
                  onChange={(value) => setEnrollmentData({ ...enrollmentData, role: value })}
                  options={[
                    { value: 'personnel', label: 'STANDARD' },
                    { value: 'admin', label: 'ADMINISTRATOR' },
                    { value: 'researcher', label: 'RESEARCHER' }
                  ]}
                  placeholder="Select Level"
                />
              </div>
              <Button
                variant="primary"
                onClick={proceedToNextStep}
                disabled={!enrollmentData.fullName || !enrollmentData.email || !enrollmentData.email.includes('@')}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                START SET UP
              </Button>
            </div>
          </div>
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
            <div style={{ width: '100%', maxWidth: '380px', marginTop: '1rem', marginLeft: 'auto', marginRight: 'auto' }}>
              <Card className="cyber-player-card" style={{ padding: '2rem', borderRadius: '24px' }}>
                {/* Header */}
                <div className="player-header" style={{ marginBottom: '1.5rem' }}>
                  <div className="player-header-text">
                    RECORDING // STEP {currentStep} OF 3
                  </div>
                </div>

                {/* Visualizer */}
                <div className="visualizer-display" style={{ height: '180px', marginBottom: '1.5rem' }}>
                  <div className="visualizer-content">
                    <div style={{ width: '100%', height: '100%', opacity: 0.8 }}>
                      <Waveform audioData={audioData} isActive={isRecording} />
                    </div>
                    <div style={{ position: 'absolute' }}>
                      <PulseRing isActive={isRecording} />
                    </div>
                  </div>
                </div>

                {/* Track Info */}
                <div className="player-track-info" style={{ marginBottom: '1.5rem' }}>
                  <div className="track-title-row">
                    <div style={{ flex: 1 }}>
                      <div className="track-title-label" style={{ color: 'var(--neon-blue)', fontSize: '0.8rem', opacity: 0.8 }}>
                        {enrollmentData.email}
                      </div>
                      <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'var(--font-header)', marginTop: '0.2rem' }}>
                        {enrollmentData.fullName || "IDENTIFYING..."}
                      </div>
                    </div>
                  </div>

                  <div className="player-lyrics" style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', margin: 0, fontWeight: 'bold' }}>SAY THIS ALOUD:</p>
                      <button 
                        onClick={() => {
                          fetchChallengePhrases(3).then(setChallengePhrases);
                          setEnrollmentData(prev => ({ ...prev, recordings: {} }));
                          if (currentStep > 1) setCurrentStep(1);
                          showToast("Security Protocol Rotated. Please restart samples.", "info");
                        }}
                        className="no-btn"
                        style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', fontSize: '0.6rem', cursor: 'pointer', opacity: 0.6, letterSpacing: '1px' }}
                      >
                        REFRESH PROTOCOL
                      </button>
                    </div>
                    <div className="player-lyrics-text" style={{ fontSize: '0.9rem', color: 'white', borderLeft: '2px solid var(--neon-blue)', paddingLeft: '1rem', minHeight: '3em', display: 'flex', alignItems: 'center' }}>
                      &quot;{currentText}&quot;
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="player-controls-area">
                  <div className="player-progress-bar">
                    <div className="player-progress-fill" style={{ width: isRecording ? '100%' : '0%', transitionDuration: '10s' }} />
                  </div>

                  <div className="player-buttons" style={{ gap: '2rem' }}>
                    {/* Previous Step */}
                    <button onClick={returnToPreviousStep} className="player-btn-small" title="Back">
                      <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>&gt;</span>
                    </button>

                    {/* Record / Stop */}
                    <div style={{ position: 'relative' }}>
                      <VoiceActivityRing
                        audioLevel={audioData && audioData.length > 0 ? (audioData.reduce((a, b) => a + b, 0) / audioData.length) : 0}
                        isActive={isRecording}
                        status={isSubmittingToServer ? 'processing' : (isRecording ? 'recording' : (hasRecording ? 'success' : 'idle'))}
                        size={60}
                      />
                      <div
                        className={`player-btn-main ${isRecording ? 'recording' : ''}`}
                        onClick={() => toggleRecording(currentSampleId)}
                      >
                        {isRecording ? <div className="icon-stop" /> : <div className="icon-play" />}
                      </div>
                    </div>

                    {/* Next Step */}
                    <button
                      onClick={proceedToNextStep}
                      className="player-btn-small"
                      disabled={!hasRecording || isSubmittingToServer}
                      style={{ opacity: (!hasRecording || isSubmittingToServer) ? 0.3 : 1 }}
                      title="Proceed"
                    >
                      <span>&gt;</span>
                    </button>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                    {isRecording ? "LISTENING..." : (hasRecording ? "VOICE SAVED" : "AWAITING ACTION")}
                  </div>

                  {/* Step Indicators */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                    {[1, 2, 3].map(step => {
                      const sId = PHONETIC_PARAGRAPHS[step - 1].id;
                      const isBuffered = !!enrollmentData.recordings[sId];
                      return (
                        <div
                          key={sId}
                          style={{
                            width: '40px', height: '3px',
                            background: isBuffered ? 'var(--neon-blue)' : 'rgba(255,255,255,0.1)',
                            boxShadow: isBuffered ? '0 0 10px var(--neon-blue)' : 'none',
                            transition: 'all 0.3s'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          );
        }
      case 4:
        // Step 5: Success confirmation
        return (
          <div className="text-overlay" style={{ textAlign: 'center', maxWidth: '450px', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
            <div style={{ color: 'var(--neon-green)', fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ color: 'var(--neon-green)', marginBottom: '1.5rem', fontFamily: 'var(--font-header)' }}>VOICE ID READY</h3>
            {generatedUserId && (
              <div style={{ margin: '1.5rem 0', padding: '1.5rem', border: '1px solid var(--neon-blue)', background: 'var(--neon-blue-dim)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem', letterSpacing: '2px' }}>YOUR USER ID</p>
                <p style={{ color: 'white', fontSize: '2.2rem', fontFamily: 'var(--font-mono)', letterSpacing: '4px', fontWeight: 'bold' }}>{generatedUserId}</p>
              </div>
            )}
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
              Success! <strong style={{ color: 'white' }}>{enrollmentData.fullName}</strong>, your voice profile is now active and secure.
            </p>
            <Link to="/">
              <Button variant="secondary" className="lg" style={{ width: '100%' }}>BACK TO HOME</Button>
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="page-container" style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        padding: '2rem 0',
        position: 'relative' // Ensure relative positioning for footer anchoring
      }}>
        {alertState.show && (
          <AlertModal
            title={alertState.title}
            message={alertState.message}
            type={alertState.type}
            onClose={closeAlert}
          />
        )}
        <SystemStatus />
        
        {/* Step Progression Header */}
        <div className="section-container" style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100%',
          padding: '1rem',
          marginBottom: '2rem' // Add space before build info
        }}>
          <div style={{ width: '100%', maxWidth: '800px', marginBottom: '1.5rem' }}>
            <StepIndicator currentStep={currentStep === 4 ? 3 : (currentStep === 0 ? 1 : 2)} />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: '580px' }}
          >
            <div className="unified-system-card" style={{ position: 'relative' }}>
              <div className="status-pill" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
                <span className="status-indicator active"></span>
                ENROLLMENT_PROTOCOL
              </div>
              <div className="system-section" style={{ padding: '2.5rem' }}>
                {renderProtocolInterface()}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Build info remains at the bottom of the page container */}
        <div style={{ paddingBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '2px', opacity: 0.5 }}>
          SECURE_GATEWAY // B.V_PROT_V2.5
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default EnrollPage;
