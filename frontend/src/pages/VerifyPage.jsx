import React, { useState, useEffect } from 'react';
import { useRecorder } from '../audio/useRecorder';
import { useWaveformAnalyzer } from '../audio/useWaveformAnalyzer';
import { authenticateVoiceSample } from '../api/verify.api';
import { useToast } from '../context/ToastContext';

// UI Components
import MicControl from '../components/biometric/MicControl';
import StatusMessage from '../components/biometric/StatusMessage';
import VerificationStatus from '../components/biometric/VerificationStatus';
import Waveform from '../components/signal/Waveform';
import PulseRing from '../components/signal/PulseRing';
import Loader from '../components/core/Loader';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Terminal from '../components/ui/Terminal';

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
  const toggleMicrophoneRecording = async () => {
    if (isRecording) {
      // Stop recording and process the audio
      appendTerminalLog('STOPPING STREAM...');
      setVerificationStatus('processing');
      const audioBlob = await stopRecording();

      if (audioBlob) {
        appendTerminalLog(`AUDIO BUFFER CAPTURED [${audioBlob.size} BYTES]`);
        processVoiceAuthentication(audioBlob);
      } else {
        setVerificationStatus('idle');
        appendTerminalLog('ERROR: EMPTY AUDIO BUFFER');
      }
    } else {
      // Start recording
      appendTerminalLog('OPENING SECURE AUDIO CHANNEL...');
      setVerificationStatus('recording');
      startRecording();
    }
  };

  const { showToast } = useToast();

  /**
   * Sends voice sample to backend for authentication.
   * Handles three possible outcomes: verified, rejected, or spoof detected.
   */
  const processVoiceAuthentication = async (audioBlob) => {
    appendTerminalLog('INITIATING SECURE HANDSHAKE...');
    appendTerminalLog('UPLOADING TO CORE...');

    try {
      const authenticationResult = await authenticateVoiceSample(audioBlob);
      setSimilarityScore(authenticationResult.similarity_score);

      if (authenticationResult.spoof) {
        // Spoofing attack detected (replay attack, synthetic voice, etc.)
        appendTerminalLog('!!! SECURITY ALERT: SPOOF DETECTED !!!');
        setVerificationStatus('spoof');
        showToast('Potential spoofing attack detected. Access blocked.', 'error');
      } else if (authenticationResult.verified) {
        // Voice matches stored voiceprint
        appendTerminalLog(`IDENTITY CONFIRMED. MATCH SCORE: ${authenticationResult.similarity_score.toFixed(4)}`);
        setVerificationStatus('verified');
        showToast(`Identity Verified. Welcome, User #${authenticationResult.user_id || 'UNKNOWN'}.`, 'success');
      } else {
        // Voice doesn't match (similarity score too low)
        appendTerminalLog(`ACCESS DENIED. SCORE: ${authenticationResult.similarity_score.toFixed(4)}`);
        setVerificationStatus('rejected');
        showToast('Verification failed. Identity mismatch.', 'warning');
      }
    } catch (error) {
      appendTerminalLog('FATAL: CONNECTION REFUSED');
      console.error(error);
      setVerificationStatus('idle');
      showToast('Connection to Secure Core refused. Server may be offline.', 'error');
    }
  };

  /**
   * Resets the verification system to initial state.
   * Allows user to try authentication again.
   */
  const resetVerificationState = () => {
    appendTerminalLog('RESETTING SYSTEM STATE...');
    setVerificationStatus('idle');
    setSimilarityScore(0);
    setTimeout(() => appendTerminalLog('READY.'), 500);
  };

  return (
    <div className="page-container verify-layout">
      {/* LEFT PANEL: Waveform visualization and controls */}
      <div className="main-panel">
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--text-secondary)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Logo size="small" />
            <span style={{ fontFamily: 'var(--font-header)', color: 'var(--text-secondary)' }}>&gt; EXEC: VERIFY_IDENTITY</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-blue)' }}>ID: #1</span>
        </header>

        {/* Visualization area with overlapping status indicators */}
        <div className="visualization-area" style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', border: 'var(--glass-border)', background: 'var(--glass-bg)', borderRadius: '12px' }}>
          <PulseRing isActive={verificationStatus === 'recording'} />
          <Loader active={verificationStatus === 'processing'} />
          <Waveform audioData={audioData} isActive={verificationStatus === 'recording'} />
          <VerificationStatus status={verificationStatus} />
        </div>

        {/* Control buttons area */}
        <div className="controls-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <StatusMessage status={verificationStatus} similarity={similarityScore} />

          {/* Show reset button after verification completes, otherwise show mic control */}
          {verificationStatus === 'verified' || verificationStatus === 'rejected' || verificationStatus === 'spoof' ? (
            <Button onClick={resetVerificationState}>RESET TERMINAL</Button>
          ) : (
            <MicControl
              isRecording={isRecording}
              onToggle={toggleMicrophoneRecording}
              disabled={verificationStatus === 'processing'}
            />
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Terminal logs for debugging/transparency */}
      <div className="side-panel">
        <Terminal logs={terminalLogs} />
      </div>
    </div>
  );
};

export default VerifyPage;