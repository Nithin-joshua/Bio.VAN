import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Small delay to trigger animation
        const timer = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const getColors = () => {
        switch (type) {
            case 'success': return { border: 'var(--neon-green)', bg: 'rgba(0, 255, 0, 0.1)', icon: '✔' };
            case 'error': return { border: 'var(--neon-red)', bg: 'rgba(255, 0, 0, 0.1)', icon: '✖' };
            case 'warning': return { border: 'var(--neon-purple)', bg: 'rgba(255, 0, 255, 0.1)', icon: '⚠' };
            default: return { border: 'var(--neon-blue)', bg: 'rgba(0, 243, 255, 0.1)', icon: 'ℹ' };
        }
    };

    const colors = getColors();

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            minWidth: '300px',
            padding: '1rem',
            background: '#050505',
            borderLeft: `4px solid ${colors.border}`,
            border: `1px solid ${colors.border}`,
            boxShadow: `0 0 15px ${colors.bg}`,
            color: 'white',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transform: visible ? 'translateX(0)' : 'translateX(100vh)',
            opacity: visible ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            zIndex: 9999
        }}>
            <div style={{
                color: colors.border,
                fontSize: '1.2rem',
                textShadow: `0 0 10px ${colors.border}`
            }}>
                {colors.icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: colors.border, marginBottom: '4px' }}>
                    SYSTEM_MESSAGE
                </div>
                <div>{message}</div>
            </div>
            <button
                onClick={() => {
                    setVisible(false);
                    setTimeout(onClose, 400);
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '1.2rem'
                }}
            >
                ×
            </button>
        </div>
    );
};

export default Toast;
