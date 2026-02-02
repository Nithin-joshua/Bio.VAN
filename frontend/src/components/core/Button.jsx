import React from 'react';
import '../../styles/theme.css';

const Button = ({ children, onClick, variant = 'primary', ...props }) => {
  return (
    <button className={`core-btn ${variant}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

export default Button;