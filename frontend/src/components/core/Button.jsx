import React from 'react';
import '../../styles/theme.css';

const Button = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button className={`core-btn ${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;