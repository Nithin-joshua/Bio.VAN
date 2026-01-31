import React from 'react';
import '../../styles/animations.css';

const PulseRing = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="pulse-container">
      <div className="pulse-ring ring-1"></div>
      <div className="pulse-ring ring-2"></div>
      <div className="pulse-ring ring-3"></div>
    </div>
  );
};

export default PulseRing;