import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecorder } from '../audio/useRecorder';
import { useWaveformAnalyzer } from '../audio/useWaveformAnalyzer';
import { authenticateVoiceSample, fetchChallengePhrase } from '../api/verify.api';
import { useToast } from '../context/ToastContext';

// UI Components
import StatusMessage from '../components/biometric/StatusMessage';
import Waveform from '../components/signal/Waveform';
import PulseRing from '../components/signal/PulseRing';
import VoiceActivityRing from '../components/signal/VoiceActivityRing';
import SystemStatus from '../components/ui/SystemStatus';
import VerificationResultModal from '../components/ui/VerificationResultModal';
import Card from '../components/ui/Card';
import '../styles/components.css';
import '../styles/cyber-player.css';

/**
 * Voice Verification Page
 * Handles real-time voice authentication with visual feedback.
 * Shows waveform visualization, terminal logs, and verification status.
 */
const VerifyPage = () => {
  const navigate = useNavigate();
  // Verification state machine: idle → recording → processing → verified/rejected/spoof/expired
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [similarityScore, setSimilarityScore] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultDetails, setResultDetails] = useState(null);
  const [challengePhrase, setChallengePhrase] = useState("Establishing Secure Link...");

  const { isRecording, stream, startRecording, stopRecording } = useRecorder();
  const audioData = useWaveformAnalyzer(stream);

  /**
   * Adds a new log entry to the terminal display.
   * Keeps only the most recent 20 logs to prevent memory bloat.
   */
  const appendTerminalLog = (logMessage) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(previousLogs =>
      [{ message: logMessage, timestamp }, ...previousLogs].slice(0, 20)
    );
  };

  // Initialize system on component mount
  // Simulates a secure boot sequence and fetches the challenge phrase
  useEffect(() => {
    const initSystem = async () => {
      // Simulate terminal initialization
      const timer = setTimeout(() => {
        appendTerminalLog('SYSTEM INITIALIZED. STANDBY.');
        appendTerminalLog('OBTAINING SECURITY CHALLENGE...');
      }, 100);

      // Fetch dynamic Challenge Phrase from backend
      // This prevents replay attacks by ensuring the user says a fresh phrase
      const phrase = await fetchChallengePhrase();
      setChallengePhrase(phrase);
      appendTerminalLog(`PROTOCOL: "${phrase}"`);

      return () => clearTimeout(timer);
    };
    initSystem();
  }, []);

  // Auto-expire challenge if user does not start recording within 10 seconds
  useEffect(() => {
    if (!challengePhrase || verificationStatus !== 'idle') {
      return;
    }

    const timer = setTimeout(async () => {
      if (verificationStatus === 'idle') {
        const phrase = await fetchChallengePhrase();
        setChallengePhrase(phrase);
        appendTerminalLog('CHALLENGE EXPIRED. ISSUING NEW PROTOCOL.');
        appendTerminalLog(`PROTOCOL: "${phrase}"`);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [challengePhrase, verificationStatus]);

  /**
   * Toggles microphone recording on/off.
   * When stopping, automatically triggers voice authentication.
   */
  const toggleAudioCapture = async () => {
    if (isRecording) {
      // Stop recording and process the audio
      appendTerminalLog('TERMINATING DATA STREAM...');
      setVerificationStatus('processing');
      const audioBlob = await stopRecording();

      if (audioBlob) {
        appendTerminalLog(`BUFFER LOCKED [${audioBlob.size} BYTES]`);
        executeAuthenticationProtocol(audioBlob);
      } else {
        setVerificationStatus('idle');
        appendTerminalLog('ERROR: NULL SIGNAL RECEIVED');
      }
    } else {
      // Start recording
      appendTerminalLog('INITIALIZING SECURE CHANNEL...');
      setVerificationStatus('recording');
      startRecording();
    }
  };

  const { showToast } = useToast();

  /**
   * Helper delay function for cinematic effect
   */
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Sends voice sample to backend for authentication.
   * Handles three possible outcomes: verified, rejected, or spoof detected.
   * 
   * Flow:
   * 1. UI Simulation (Encrypting/Transmitting logs)
   * 2. API Call (authenticateVoiceSample)
   * 3. Result Handling based on backend response metrics
   */
  const executeAuthenticationProtocol = async (audioBlob) => {
    try {
      // Cinematic processing sequence - adds tension and immersion
      appendTerminalLog('INITIATING HANDSHAKE...');
      await delay(400); // Simulate network latency

      appendTerminalLog('ENCRYPTING PACKET LOAD...');
      await delay(400);

      appendTerminalLog('TRANSMITTING TO BIO-CORE...');

      // Actual API Call - Transmits the blob to the /verify endpoint
      const result = await authenticateVoiceSample(audioBlob, targetUserId, challengePhrase);

      // Simulate analysis steps (Feature extraction logs)
      appendTerminalLog('DATA RECEIVED. DECRYPTING...');
      await delay(400);

      appendTerminalLog('EXTRACTING MFCC FEATURES...');
      await delay(500);

      appendTerminalLog('ANALYZING SPECTRAL FLUX...');
      await delay(400);

      appendTerminalLog('COMPARING AGAINST NEURAL VECTORS...');
      await delay(600);

      setSimilarityScore(result.similarity_score);
      setResultDetails(result);

      // --- LOGIC BRANCHING BASED ON RESULT ---

      if (result.spoof) {
        // CASE: Liveness Check Failed (RawNet2 detected generated audio)
        appendTerminalLog('!!! SECURITY VIOLATION: SYNTHETIC SIGNATURE !!!');
        setVerificationStatus('spoof');
        showToast('Artificial signature detected.', 'error');

      } else if (result.error_code === 'MIC_TOO_FAR') {
        // CASE: User is too far from the microphone / signal too weak
        appendTerminalLog('ERROR: MIC DISTANCE OUT OF RANGE. MOVE CLOSER AND RETRY.');
        setVerificationStatus('too_far');
        showToast(result.message || 'Voice signal too weak or distant. Move closer to the microphone.', 'warning');

      } else if (result.error_code === 'AUDIO_QUALITY_LOW') {
        // CASE: Audio quality is too poor for a reliable decision
        appendTerminalLog('ERROR: AUDIO QUALITY BELOW SECURITY THRESHOLD.');
        setVerificationStatus('bad_audio');
        showToast(result.message || 'Audio quality too low. Check your microphone and environment.', 'warning');

      } else if (result.error_code === 'VOICE_EXPIRED') {
        // CASE: Voice profile is too old (> 90 days)
        appendTerminalLog('ERROR 403: BIOMETRIC PROFILE EXPIRED');
        setVerificationStatus('expired');
        showToast(result.message, 'warning');

        // Auto-redirect to enrollment after delay
        setTimeout(() => {
          navigate('/enroll');
        }, 4000);

      } else if (result.error_code === 'DURATION_TOO_SHORT') {
        appendTerminalLog('ERROR: AUDIO DURATION BELOW MINIMUM THRESHOLD.');
        setVerificationStatus('too_short');
        showToast(result.message || 'Audio too short. Please speak for a bit longer.', 'warning');

      } else if (result.error_code === 'CHALLENGE_FAILED') {
        appendTerminalLog('ERROR: SECURITY PHRASE MISMATCH DETECTED.');
        setVerificationStatus('challenge_failed');
        showToast(result.message || 'Phrase mismatch. Please repeat the displayed protocol.', 'warning');

      } else if (result.verified) {
        // CASE: Success (High Similarity > Threshold)
        appendTerminalLog(`IDENTITY VERIFIED. CONFIDENCE: ${(result.similarity_score * 100).toFixed(2)}%`);
        setVerificationStatus('verified');

      } else {
        // CASE: Failure (Low Similarity - Wrong Person)
        appendTerminalLog(`ACCESS DENIED. CONFIDENCE: ${(result.similarity_score * 100).toFixed(2)}%`);
        setVerificationStatus('rejected');
      }

      // Show detailed result modal after a brief moment
      setTimeout(() => setShowResultModal(true), 500);

    } catch (error) {
      appendTerminalLog(`FATAL ERROR: ${error.message}`);
      setVerificationStatus('rejected');
      showToast('System malfunction. Connection reset.', 'error');
    }
  };

  /**
   * Resets the verification system to initial state.
   * Allows user to try authentication again.
   */
  const resetSystemState = () => {
    setShowResultModal(false);
    setResultDetails(null);
    appendTerminalLog('PURGING CACHE...');
    setVerificationStatus('idle');
    setSimilarityScore(0);

    // Refresh Challenge on Reset
    fetchChallengePhrase().then(phrase => {
      setChallengePhrase(phrase);
      appendTerminalLog(`NEW PROTOCOL: "${phrase}"`);
      appendTerminalLog('SYSTEM RE-ARMED. STANDBY.');
    });
  };

  const handlePlayKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (targetUserId.length !== 10) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
      } else if (verificationStatus !== 'processing') {
        toggleAudioCapture();
      }
    }
  };

  return (
    <div className="page-container" style={{ position: 'relative', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
      <SystemStatus />

      {/* RESULT MODAL OVERLAY */}
      {showResultModal && resultDetails && (
        <VerificationResultModal
          result={resultDetails}
          onClose={resetSystemState}
        />
      )}

      {/* CENTERED MUSIC PLAYER CARD */}
      <div className="verify-content-wrapper" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 60px)',
        width: '100%',
        padding: '1.5rem',
        zIndex: 1
      }}>
        <Card className="cyber-player-card" style={{ padding: '1.5rem', borderRadius: '30px' }}>


          {/* 1. TOP HEADER ("Playlist" Name) */}
          <div className="player-header">
            <div className="player-header-text">
              SECURE CHANNEL_01
            </div>
          </div>

          {/* 2. "ALBUM ART" - VISUALIZER / TERMINAL HYBRID */}
          <div className="visualizer-display">
            {/* STATE A: PROCESSING TERMINAL */}
            {(verificationStatus === 'processing'
              || verificationStatus === 'verified'
              || verificationStatus === 'rejected'
              || verificationStatus === 'spoof'
              || verificationStatus === 'expired'
              || verificationStatus === 'too_far'
              || verificationStatus === 'bad_audio') ? (
              <div className="player-terminal">
                <div className="player-terminal-header">
                  &gt;_ SYSTEM_LOG
                </div>
                {terminalLogs.map((log, index) => (
                  <div key={index} className="player-terminal-log">
                    <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>[{log.timestamp.split(' ')[0]}]</span>
                    {log.message}
                  </div>
                ))}
                {/* Blink cursor at the end */}
                <div style={{ animation: 'blink-opacity 1s infinite', color: 'var(--neon-blue)', marginTop: '0.5rem' }}>_</div>
              </div>
            ) : (
              /* STATE B: VISUALIZER (Idle/Recording) */
              <div className="visualizer-content">
                {/* Visualizers */}
                <div style={{ width: '100%', height: '100%', opacity: 0.6 }}>
                  <Waveform audioData={audioData} isActive={verificationStatus === 'recording'} />
                </div>
                <div style={{ position: 'absolute' }}>
                  <PulseRing isActive={verificationStatus === 'recording'} />
                  {showWarning && (
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      color: 'var(--neon-red)', fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap',
                      background: 'rgba(0,0,0,0.95)', padding: '8px 16px', border: '1px solid var(--neon-red)', borderRadius: '4px',
                      zIndex: 20, boxShadow: '0 0 20px rgba(255,0,0,0.3)'
                    }}> INVALID TARGET ID </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. TRACK INFO - ID Input & Protocol Header */}
          <div className="player-track-info">
            <div className="track-title-row">
              {/* Title / ID Input Area */}
              <div style={{ flex: 1 }}>
                <div className="track-title-label">
                  Target Identification
                </div>
                <div className="track-input-wrapper">
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="ENTER ID..."
                    maxLength={10}
                    className="track-input"
                  />
                  {targetUserId.length === 10 && <span style={{ color: 'var(--neon-green)', marginLeft: '0.5rem' }}>✓</span>}
                </div>
              </div>

              {/* Status Dot */}
              <div style={{ paddingBottom: '2px' }}>
                <div className={`status-dot ${verificationStatus === 'verified' ? 'active' : (verificationStatus === 'recording' ? 'recording' : '')}`} />
              </div>
            </div>

            {/* Protocol Text */}
            <div className="player-lyrics">
              <div className="player-lyrics-text">
                "{challengePhrase}"
              </div>
            </div>

          </div>

          {/* 4. CONTROLS (Play Bar & Buttons) */}
          <div className="player-controls-area">
            {/* Fake Progress Bar */}
            <div className="player-progress-bar">
              <div className="player-progress-fill" style={{ width: verificationStatus === 'recording' ? '100%' : '0%', transitionDuration: '10s' }} />
            </div>

            {/* Main Controls */}
            <div className="player-buttons">

              {/* RESET BUTTON */}
              <button
                onClick={resetSystemState}
                className="player-btn-small"
                title="Reset System"
              >
                <span>↺</span>
              </button>

              {/* BIG PLAY BUTTON (Mic) */}
              <div style={{ position: 'relative' }}>
                <VoiceActivityRing
                  audioLevel={audioData && audioData.length > 0 ? (audioData.reduce((a, b) => a + b, 0) / audioData.length) : 0}
                  isActive={isRecording}
                  size={60}
                />
                <div
                  className={`player-btn-main ${isRecording ? 'recording' : ''} ${targetUserId.length !== 10 ? 'disabled' : ''}`}
                  onClick={() => {
                    if (targetUserId.length !== 10) {
                      setShowWarning(true);
                      setTimeout(() => setShowWarning(false), 2000);
                    } else if (verificationStatus !== 'processing') {
                      toggleAudioCapture();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={handlePlayKey}
                  aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  {/* Icon */}
                  {isRecording ? (
                    <div className="icon-stop" />
                  ) : (
                    <div className="icon-play" />
                  )}
                </div>
              </div>
            </div>

            {/* Status Text Below */}
            <div style={{ textAlign: 'center', marginTop: '1rem', minHeight: '20px' }}>
              <StatusMessage status={verificationStatus} similarity={similarityScore} />
            </div>
          </div>

        </Card>
      </div>
    </div>
  );
};

export default VerifyPage;
