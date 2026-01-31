import React, { useState, useEffect } from 'react';
import { useRecorder } from '../audio/useRecorder';
import { useWaveformAnalyzer } from '../audio/useWaveformAnalyzer';
import { verifyAudio } from '../api/verify.api';
import { useToast } from '../context/ToastContext';

// Components
import MicControl from '../components/biometric/MicControl';
import StatusMessage from '../components/biometric/StatusMessage';
import VerificationStatus from '../components/biometric/VerificationStatus';
import Waveform from '../components/signal/Waveform';
import PulseRing from '../components/signal/PulseRing';
import Loader from '../components/core/Loader';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Terminal from '../components/ui/Terminal';

const VerifyPage = () => {
  const [status, setStatus] = useState('idle');
  const [similarity, setSimilarity] = useState(0);
  const [logs, setLogs] = useState([]);

  const { isRecording, stream, startRecording, stopRecording } = useRecorder();
  const audioData = useWaveformAnalyzer(stream);

  const addLog = (msg) => {
    // Keep last 20 logs for the terminal
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ message: msg, timestamp }, ...prev].slice(0, 20));
  };

  useEffect(() => {
    addLog('SYSTEM INITIALIZED. STANDBY.');
    addLog('WAITING FOR AUDIO INPUT...');
  }, []);

  const handleMicToggle = async () => {
    if (isRecording) {
      addLog('STOPPING STREAM...');
      setStatus('processing');
      const blob = await stopRecording();

      if (blob) {
        addLog(`AUDIO BUFFER CAPTURED [${blob.size} BYTES]`);
        handleVerification(blob);
      } else {
        setStatus('idle');
        addLog('ERROR: EMPTY AUDIO BUFFER');
      }
    } else {
      addLog('OPENING SECURE AUDIO CHANNEL...');
      setStatus('recording');
      startRecording();
    }
  };

  const { showToast } = useToast();

  const handleVerification = async (blob) => {
    addLog('INITIATING SECURE HANDSHAKE...');
    addLog('UPLOADING TO CORE...');
    try {
      const result = await verifyAudio(blob);
      setSimilarity(result.similarity_score);

      if (result.spoof) {
        addLog('!!! SECURITY ALERT: SPOOF DETECTED !!!');
        setStatus('spoof');
        showToast('Potential spoofing attack detected. Access blocked.', 'error');
      } else if (result.verified) {
        addLog(`IDENTITY CONFIRMED. MATCH SCORE: ${result.similarity_score.toFixed(4)}`);
        setStatus('verified');
        showToast(`Identity Verified. Welcome, User #${result.user_id || 'UNKNOWN'}.`, 'success');
      } else {
        addLog(`ACCESS DENIED. SCORE: ${result.similarity_score.toFixed(4)}`);
        setStatus('rejected');
        showToast('Verification failed. Identity mismatch.', 'warning');
      }
    } catch (error) {
      addLog('FATAL: CONNECTION REFUSED');
      console.error(error);
      setStatus('idle');
      showToast('Connection to Secure Core refused. Server may be offline.', 'error');
    }
  };

  const resetSystem = () => {
    addLog('RESETTING SYSTEM STATE...');
    setStatus('idle');
    setSimilarity(0);
    setTimeout(() => addLog('READY.'), 500);
  };

  return (
    <div className="page-container verify-layout">
      {/* LEFT COLUMN: VISUALIZATION */}
      <div className="main-panel">
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--text-secondary)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Logo size="small" />
            <span style={{ fontFamily: 'var(--font-header)', color: 'var(--text-secondary)' }}>&gt; EXEC: VERIFY_IDENTITY</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-blue)' }}>ID: #1</span>
        </header>

        <div className="visualization-area" style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', border: 'var(--glass-border)', background: 'var(--glass-bg)', borderRadius: '12px' }}>
          <PulseRing isActive={status === 'recording'} />
          <Loader active={status === 'processing'} />
          <Waveform audioData={audioData} isActive={status === 'recording'} />
          <VerificationStatus status={status} />
        </div>

        <div className="controls-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <StatusMessage status={status} similarity={similarity} />

          {status === 'verified' || status === 'rejected' || status === 'spoof' ? (
            <Button onClick={resetSystem}>RESET TERMINAL</Button>
          ) : (
            <MicControl
              isRecording={isRecording}
              onToggle={handleMicToggle}
              disabled={status === 'processing'}
            />
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: LOGS */}
      <div className="side-panel">
        <Terminal logs={logs} />
      </div>
    </div>
  );
};

export default VerifyPage;