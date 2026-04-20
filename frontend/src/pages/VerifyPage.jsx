import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import StepIndicator from '../components/ui/StepIndicator';
import '../styles/components.css';
import '../styles/cyber-player.css';

/**
 * Voice Verification Page
 * Handles real-time voice authentication with visual feedback.
 */
const VerifyPage = () => {
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [similarityScore, setSimilarityScore] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultDetails, setResultDetails] = useState(null);
  const [challengePhrase, setChallengePhrase] = useState("Establishing Secure Link...");
  const terminalEndRef = useRef(null);

  const { isRecording, stream, startRecording, stopRecording } = useRecorder();
  const audioData = useWaveformAnalyzer(stream);

  const appendTerminalLog = (logMsg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTerminalLogs(prev =>
      [{ msg: logMsg, time }, ...prev].slice(0, 30)
    );
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  useEffect(() => {
    const initSystem = async () => {
      setTimeout(() => {
        appendTerminalLog('Connecting to Bio-Core...');
      }, 100);

      const phrase = await fetchChallengePhrase();
      setChallengePhrase(phrase);
      appendTerminalLog('Session Authenticated. Waiting for ID.');

      return () => {};
    };
    initSystem();
  }, []);

  useEffect(() => {
    if (!challengePhrase || verificationStatus !== 'idle') {
      return;
    }

    const timer = setTimeout(async () => {
      if (verificationStatus === 'idle') {
        const phrase = await fetchChallengePhrase();
        setChallengePhrase(phrase);
        appendTerminalLog('Security rotation: New phrase issued.');
      }
    }, 45000);

    return () => clearTimeout(timer);
  }, [challengePhrase, verificationStatus]);

  const toggleAudioCapture = async () => {
    if (isRecording) {
      appendTerminalLog('Uplink active. Sending data...');
      setVerificationStatus('processing');
      const audioBlob = await stopRecording();

      if (audioBlob) {
        appendTerminalLog('Authenticating patterns...');
        executeAuthenticationProtocol(audioBlob);
      } else {
        setVerificationStatus('idle');
        appendTerminalLog('FAILURE: No signal detected.');
      }
    } else {
      appendTerminalLog('INITIALIZING VOICE SENSOR...');
      setVerificationStatus('recording');
      startRecording();
    }
  };

  const { showToast } = useToast();

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const executeAuthenticationProtocol = async (audioBlob) => {
    try {
      appendTerminalLog('Securing encryption layer...');
      await delay(600); 

      appendTerminalLog('Analyzing biometric resonance...');
      await delay(600);

      const result = await authenticateVoiceSample(audioBlob, targetUserId, challengePhrase);

      appendTerminalLog('Finalizing verification...');
      await delay(800);

      setSimilarityScore(result.similarity_score);
      setResultDetails(result);

      if (result.spoof) {
        appendTerminalLog('!!! SECURITY ALERT: SPOOF DETECTED !!!');
        setVerificationStatus('spoof');
        showToast('Artificial signature detected.', 'error');
      } else if (result.error_code === 'MIC_TOO_FAR') {
        appendTerminalLog('ERROR: Mic out of optimal range.');
        setVerificationStatus('too_far');
        showToast(result.message || 'Move closer to the microphone.', 'warning');
      } else if (result.error_code === 'AUDIO_QUALITY_LOW') {
        appendTerminalLog('ERROR: Signal to noise ratio too low.');
        setVerificationStatus('bad_audio');
        showToast(result.message || 'Environment too noisy.', 'warning');
      } else if (result.verified) {
        appendTerminalLog('ACCESS GRANTED. Welcome back.');
        setVerificationStatus('verified');
      } else {
        appendTerminalLog('ACCESS DENIED. Signature mismatch.');
        setVerificationStatus('rejected');
      }

      setTimeout(() => setShowResultModal(true), 500);

    } catch (error) {
      appendTerminalLog(`SYSTEM ERROR: ${error.message}`);
      setVerificationStatus('idle');
      showToast('Connection reset by supervisor.', 'error');
    }
  };

  const resetSystemState = () => {
    setShowResultModal(false);
    setResultDetails(null);
    appendTerminalLog('PURGING SESSION CACHE...');
    setVerificationStatus('idle');
    setSimilarityScore(0);

    fetchChallengePhrase().then(phrase => {
      setChallengePhrase(phrase);
      appendTerminalLog(`System re-armed. New phrase: "${phrase}"`);
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
    <div className="page-container" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '2rem 0',
      position: 'relative'
    }}>
      <SystemStatus />
      
      <div className="section-container" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '1rem',
        width: '100%',
        marginBottom: '2rem'
      }}>
        <div style={{ width: '100%', maxWidth: '600px', marginBottom: '1.5rem' }}>
          <StepIndicator currentStep={2} />
        </div>

        <motion.div
          className="unified-system-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            maxWidth: '850px', 
            margin: '0 auto',
            minHeight: '450px',
            position: 'relative',
            width: '100%'
          }}
        >
          {/* INTEGRATED SYSTEM SECTION */}
          <div className="system-section" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
            {/* AUDIO VISUAL WINDOW (Waveform + Integrated Terminal Overlay) */}
            <div className="visualizer-display" style={{ 
              height: '300px', 
              width: '100%', 
              background: 'rgba(0,0,0,0.4)',
              position: 'relative',
              borderBottom: '1px solid rgba(0, 255, 200, 0.1)'
            }}>
              {/* Waveform Background */}
              <div className="visualizer-content" style={{ opacity: 0.6 }}>
                <Waveform audioData={audioData} isActive={verificationStatus === 'recording'} />
                <PulseRing isActive={verificationStatus === 'recording'} />
              </div>

              {/* TERMINAL OVERLAY (Inside Visual Window) */}
              <div className="terminal-overlay">
                <div className="scan-line" />
                <div className="terminal-overlay-header">SYSTEM_UPLINK // B.V_VERIF_NODE</div>
                <div className="terminal-overlay-body">
                  {terminalLogs.slice(0, 3).reverse().map((log, index) => (
                    <div key={index} className={`terminal-line ${
                      log.msg.includes('!!!') ? 'error' : 
                      log.msg.includes('SUCCESS') ? 'success' : 
                      log.msg.includes('INITIALIZING') ? 'info' : ''
                    }`}>
                      <span style={{ opacity: 0.5 }}>[{log.time}]</span>
                      <span>{log.msg}</span>
                    </div>
                  ))}
                  <div className="terminal-line status" style={{ marginTop: 'auto', borderTop: '1px solid rgba(0, 255, 200, 0.1)', paddingTop: '0.4rem' }}>
                    <span className="cursor-blink">█</span>
                    <span>{isRecording ? "LISTENING..." : (verificationStatus === 'processing' ? "ANALYZING..." : "AWAITING_INPUT")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTROLS SECTION */}
            <div style={{ padding: '1.5rem', background: 'rgba(5, 8, 10, 0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem' }}>
                <div className="cyber-input-group" style={{ flex: 1, margin: 0 }}>
                  <label className="cyber-label">ACCESS_ID</label>
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="ENTER 10-DIGIT ID"
                    maxLength={10}
                    className="cyber-input"
                    style={{ fontSize: '1.1rem', letterSpacing: '3px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button onClick={resetSystemState} className="core-btn secondary sm" style={{ minWidth: 'auto', width: '42px', height: '42px', padding: 0 }}>↺</button>
                  
                  <div style={{ position: 'relative' }}>
                    <VoiceActivityRing
                      audioLevel={audioData && audioData.length > 0 ? (audioData.reduce((a, b) => a + b, 0) / audioData.length) : 0}
                      isActive={isRecording}
                      status={verificationStatus}
                      size={54}
                    />
                    <div
                      className={`player-btn-main ${isRecording ? 'recording' : ''} ${targetUserId.length !== 10 ? 'disabled' : ''}`}
                      style={{ width: '54px', height: '54px' }}
                      onClick={() => {
                        if (targetUserId.length !== 10) {
                          showToast("ENTER 10-DIGIT ID", "error");
                        } else if (verificationStatus !== 'processing') {
                          toggleAudioCapture();
                        }
                      }}
                    >
                      {isRecording ? <div className="icon-stop" /> : <div className="icon-play" />}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(0,255,200,0.03)', border: '1px solid rgba(0,255,200,0.1)', borderRadius: '4px' }}>
                <label className="cyber-label" style={{ marginBottom: '0.1rem', opacity: 0.6, fontSize: '0.6rem' }}>CHALLENGE_PHRASE</label>
                <div style={{ fontSize: '0.9rem', color: 'white', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
                  &quot;{challengePhrase}&quot;
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ paddingBottom: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '2px', opacity: 0.5 }}>
        SECURE_GATEWAY // B.V_VERIF_NODE_V3
      </div>

      {showResultModal && resultDetails && (
        <VerificationResultModal
          result={resultDetails}
          onClose={resetSystemState}
        />
      )}
    </div>
  );
};

export default VerifyPage;
