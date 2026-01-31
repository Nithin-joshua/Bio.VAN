import React from 'react';
import '../../styles/animations.css';

const Loader = ({ active }) => {
  if (!active) return null;
  return (
    <div className="scan-loader">
      <div className="scan-line"></div>
    </div>
  );
};

export default Loader;