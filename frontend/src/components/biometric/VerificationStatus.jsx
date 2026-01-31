import React from 'react';
import '../../styles/signals.css';

const VerificationStatus = ({ status }) => {
  if (status === 'idle' || status === 'recording' || status === 'processing') return null;

  const isSuccess = status === 'verified';
  const isSpoof = status === 'spoof';

  return (
    <div className={`result-overlay ${status}`}>
      <div className="result-icon">
        {isSuccess && '✓'}
        {!isSuccess && '✕'}
      </div>
      <div className="result-details">
        {isSuccess && <span>ACCESS GRANTED</span>}
        {!isSuccess && !isSpoof && <span>ACCESS REJECTED</span>}
        {isSpoof && <span>BIOMETRIC THREAT</span>}
      </div>
    </div>
  );
};

export default VerificationStatus;