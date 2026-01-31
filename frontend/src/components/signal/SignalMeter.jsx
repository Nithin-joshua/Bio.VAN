import React from 'react';
import '../../styles/signals.css';

const SignalMeter = ({ level }) => {
  // Level is expected to be 0 to 100 roughly
  const bars = Array.from({ length: 20 });

  return (
    <div className="signal-meter">
      {bars.map((_, index) => {
        const isActive = index < (level / 5);
        return (
          <div 
            key={index} 
            className={`meter-bar ${isActive ? 'active' : ''}`}
          />
        );
      })}
    </div>
  );
};

export default SignalMeter;