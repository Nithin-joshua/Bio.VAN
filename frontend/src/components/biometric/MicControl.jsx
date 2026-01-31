import React from 'react';
import '../../styles/signals.css';

const MicControl = ({ isRecording, onToggle, disabled }) => {
  return (
    <div className="mic-control-container">
      <button 
        className={`mic-button ${isRecording ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={onToggle}
        disabled={disabled}
      >
        <div className="mic-icon">
          {isRecording ? (
            <div className="stop-square" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 2.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </div>
      </button>
      <div className={`mic-label ${isRecording ? 'recording' : ''}`}>
        {isRecording ? 'REC' : 'PUSH TO TALK'}
      </div>
    </div>
  );
};

export default MicControl;