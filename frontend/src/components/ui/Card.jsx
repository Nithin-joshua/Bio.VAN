import React, { useEffect, useRef } from 'react';
import '../../styles/theme.css';

const Card = ({ title, children, status, className = '', style = {} }) => {
  const cardRef = useRef(null);
  const supportsPointerEffects = useRef(false);

  useEffect(() => {
    supportsPointerEffects.current = window.matchMedia('(pointer: fine)').matches;
  }, []);

  const handlePointerMove = (e) => {
    if (!supportsPointerEffects.current) return;
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
    cardRef.current.style.setProperty('--spotlight-opacity', '1');
  };

  const handlePointerLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--spotlight-opacity', '0');
  };

  const baseStyle = {
    background: 'rgba(10, 15, 20, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    '--spotlight-x': '50%',
    '--spotlight-y': '50%',
    '--spotlight-opacity': 0
  };

  const mergedStyle = { ...baseStyle, ...style };

  const headerStyle = {
    fontFamily: 'var(--font-header)',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* SPOTLIGHT EFFECT - Softened */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 'var(--spotlight-opacity)',
          background: 'radial-gradient(800px circle at var(--spotlight-x) var(--spotlight-y), rgba(0, 243, 255, 0.08), transparent 40%)',
          transition: 'opacity 0.5s ease',
          zIndex: 1
        }}
      />

      {/* BORDER GLOW LAYER - Subtle */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 'calc(var(--spotlight-opacity) * 0.5)',
          background: 'radial-gradient(400px circle at var(--spotlight-x) var(--spotlight-y), rgba(0, 243, 255, 0.3), transparent 60%)',
          zIndex: 3,
          maskImage: 'linear-gradient(#fff, #fff), linear-gradient(#fff, #fff)',
          maskClip: 'content-box, border-box',
          maskComposite: 'exclude',
          padding: '1px',
          borderRadius: '12px',
          inset: 0
        }}
      />

      {/* CONTENT */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {title && (
          <div style={headerStyle}>
            <span>{title}</span>
            {status && <span style={{ 
              color: status === 'LIVE' || status === 'READY' || status === 'ACTIVE' || status === 'VERIFIED' ? 'var(--neon-green)' : 
                     status === 'LOCKED' ? 'var(--neon-red)' : 'var(--neon-blue)',
              textShadow: '0 0 10px currentColor'
            }}>{status}</span>}
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

      <style>{`
        .glass-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(0, 243, 255, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 243, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Card;
