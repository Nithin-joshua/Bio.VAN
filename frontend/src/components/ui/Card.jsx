import React, { useRef, useState } from 'react';
import '../../styles/theme.css';

const Card = ({ title, children, status, className = '', style = {} }) => {
  const cardRef = useRef(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  const baseStyle = {
    background: 'rgba(10, 15, 20, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
  };

  const mergedStyle = { ...baseStyle, ...style };

  const headerStyle = {
    fontFamily: 'var(--font-header)',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    borderBottom: '1px solid var(--text-secondary)',
    paddingBottom: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    position: 'relative',
    zIndex: 2
  };

  return (
    <div
      ref={cardRef}
      className={`glass-card ${className}`}
      style={mergedStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* SPOTLIGHT EFFECT */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: opacity,
          background: `radial-gradient(600px circle at ${cursor.x}px ${cursor.y}px, rgba(0, 243, 255, 0.15), transparent 40%)`,
          transition: 'opacity 0.3s',
          zIndex: 1
        }}
      />

      {/* BORDER GLOW LAYER */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: opacity,
          background: `radial-gradient(600px circle at ${cursor.x}px ${cursor.y}px, rgba(0, 243, 255, 0.4), transparent 40%)`,
          zIndex: 3,
          maskImage: 'linear-gradient(#fff, #fff), linear-gradient(#fff, #fff)',
          maskClip: 'content-box, border-box',
          maskComposite: 'exclude',
          padding: '1px',
          borderRadius: '12px',
          content: '""',
          inset: 0
        }}
      />

      {/* CONTENT */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {title && (
          <div style={headerStyle}>
            <span>{title}</span>
            {status && <span style={{ color: 'var(--neon-green)' }}>{status}</span>}
          </div>
        )}
        <div style={{ height: '100%' }}>{children}</div>
      </div>

      {/* GRAIN TEXTURE (CSS Generated) */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
        opacity: 0.1,
        pointerEvents: 'none',
        zIndex: 0
      }} />
    </div>
  );
};

export default Card;
