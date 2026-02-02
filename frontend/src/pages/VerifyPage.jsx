import React, { useState, useEffect } from 'react';
import { useRecorder } from '../audio/useRecorder';
import { useWaveformAnalyzer } from '../audio/useWaveformAnalyzer';
import { authenticateVoiceSample } from '../api/verify.api';
import { useToast } from '../context/ToastContext';
import { VERIFICATION_PARAGRAPH } from '../data/phonetics';

// UI Components
import StatusMessage from '../components/biometric/StatusMessage';
import Waveform from '../components/signal/Waveform';
import PulseRing from '../components/signal/PulseRing';
import SystemStatus from '../components/ui/SystemStatus';
import VerificationResultModal from '../components/ui/VerificationResultModal';
import '../styles/components.css';
import '../styles/cyber-player.css';

/**
 * Voice Verification Page
 * Handles real-time voice authentication with visual feedback.
 * Shows waveform visualization, terminal logs, and verification status.
 */
const VerifyPage = () => {
  // Verification state machine: idle → recording → processing → verified/rejected/spoof
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [similarityScore, setSimilarityScore] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultDetails, setResultDetails] = useState(null);

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
  useEffect(() => {
    appendTerminalLog('SYSTEM INITIALIZED. STANDBY.');
    appendTerminalLog('WAITING FOR AUDIO INPUT...');
  }, []);

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
   */
  const executeAuthenticationProtocol = async (audioBlob) => {
    try {
      // Cinematic processing sequence
      appendTerminalLog('INITIATING HANDSHAKE...');
      await delay(400); // Simulate network

      appendTerminalLog('ENCRYPTING PACKET LOAD...');
      await delay(400);

      appendTerminalLog('TRANSMITTING TO BIO-CORE...');

      // Actual API Call
      const result = await authenticateVoiceSample(audioBlob, targetUserId);

      // Simulate analysis steps
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

      if (result.spoof) {
        appendTerminalLog('!!! SECURITY VIOLATION: SYNTHETIC SIGNATURE !!!');
        setVerificationStatus('spoof');
        showToast('Artificial signature detected.', 'error');
      } else if (result.verified) {
        appendTerminalLog(`IDENTITY VERIFIED. CONFIDENCE: ${(result.similarity_score * 100).toFixed(2)}%`);
        setVerificationStatus('verified');
      } else {
        appendTerminalLog(`ACCESS DENIED. CONFIDENCE: ${(result.similarity_score * 100).toFixed(2)}%`);
        setVerificationStatus('rejected');
      }

      // Show result modal after a brief moment
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
    setTimeout(() => appendTerminalLog('SYSTEM RE-ARMED. STANDBY.'), 500);
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
    <div className="page-container" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <SystemStatus />

      {/* RESULT MODAL OVERLAY */}
      {showResultModal && resultDetails && (
        <VerificationResultModal
          result={resultDetails}
          onClose={resetSystemState}
        />
      )}

      {/* CENTERED MUSIC PLAYER CARD */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        padding: '1rem',
        zIndex: 1
      }}>
        <div className="cyber-player-card">

          {/* 1. TOP HEADER ("Playlist" Name) */}
          <div className="player-header">
            <div className="player-header-text">
              SECURE CHANNEL_01
            </div>
          </div>

          {/* 2. "ALBUM ART" - VISUALIZER / TERMINAL HYBRID */}
          <div className="visualizer-display">
            {/* STATE A: PROCESSING TERMINAL */}
            {(verificationStatus === 'processing' || verificationStatus === 'verified' || verificationStatus === 'rejected' || verificationStatus === 'spoof') ? (
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
                "{VERIFICATION_PARAGRAPH.text}"
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

            {/* Status Text Below */}
            <div style={{ textAlign: 'center', marginTop: '1rem', minHeight: '20px' }}>
              <StatusMessage status={verificationStatus} similarity={similarityScore} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyPage;