import React from 'react';
import '../../styles/theme.css';

const Card = ({ title, children, status, delay = 0 }) => {
    const style = {
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--backdrop-blur)',
        border: 'var(--glass-border)',
        borderRadius: '12px',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--glass-shadow)',
        transition: 'all 0.3s ease',
        opacity: 0,
        animation: `fadeInUp 0.6s ease forwards ${delay}s`
    };

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
        letterSpacing: '1px'
    };

    return (
        <div className="glass-card" style={style}>
            <div style={headerStyle}>
                <span>{title}</span>
                {status && <span style={{ color: 'var(--neon-green)' }}>{status}</span>}
            </div>
            <div>{children}</div>

            {/* GLOW EFFECT ON HOVER */}
            <style>{`
        .glass-card:hover {
          border-color: var(--neon-blue);
          box-shadow: 0 0 20px var(--neon-blue-dim);
          transform: translateY(-5px);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default Card;
