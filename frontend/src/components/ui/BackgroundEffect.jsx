import React, { useEffect, useRef } from 'react';

const BackgroundEffect = () => {
    const bgRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!bgRef.current) return;
            const x = e.clientX;
            const y = e.clientY;

            // Update CSS variables for the spotlight effect
            bgRef.current.style.setProperty('--mouse-x', `${x}px`);
            bgRef.current.style.setProperty('--mouse-y', `${y}px`);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            ref={bgRef}
            className="interactive-bg"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                background: `radial-gradient(
          800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
          rgba(0, 243, 255, 0.04), 
          transparent 40%
        )`
            }}
        />
    );
};

export default BackgroundEffect;
