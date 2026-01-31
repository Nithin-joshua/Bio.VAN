import React from 'react';
import '../../styles/theme.css';

const StatusMessage = ({ status, similarity }) => {
  const getMessage = () => {
    switch (status) {
      case 'idle': return 'SYSTEM READY. AWAITING INPUT.';
      case 'recording': return 'LISTENING... SPEAK PASSPHRASE.';
      case 'processing': return 'ANALYZING VOICE PRINT...';
      case 'verified': return 'IDENTITY CONFIRMED.';
      case 'rejected': return 'ACCESS DENIED. MISMATCH.';
      case 'spoof': return 'SECURITY ALERT: SPOOF DETECTED.';
      default: return 'STANDBY';
    }
  };

  return (
    <div className="status-readout">
      <div className="status-text blink-text">{getMessage()}</div>
      {similarity > 0 && (
        <div className="confidence-level">
          MATCH CONFIDENCE: {(similarity * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default StatusMessage;