import React from 'react';

const HolographicHero = ({ className = '' }) => {
    return (
        <div className={className} style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="15" result="blur" /> // Increased blur
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <style>
                        {`
                            @keyframes spinSlow {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                            @keyframes spinReverse {
                                from { transform: rotate(360deg); }
                                to { transform: rotate(0deg); }
                            }
                            @keyframes pulseGlow {
                                0%, 100% { opacity: 0.8; transform: scale(1); }
                                50% { opacity: 1; transform: scale(1.1); }
                            }
                            .holo-globe {
                                transform-origin: center;
                                animation: spinSlow 20s linear infinite;
                            }
                            .holo-ring {
                                transform-origin: center;
                                animation: spinReverse 15s linear infinite;
                            }
                            .holo-core {
                                transform-origin: center;
                                animation: pulseGlow 3s ease-in-out infinite;
                            }
                        `}
                    </style>
                </defs>

                {/* Main Globe Group - Rotating */}
                <g className="holo-globe" stroke="#00f3ff" strokeWidth="4" fill="none" style={{ opacity: 0.9 }}>
                    {/* Reduced stroke width for cleaner look in app */}
                    {/* Longitude lines */}
                    <ellipse cx="200" cy="200" rx="100" ry="200" />
                    <ellipse cx="200" cy="200" rx="100" ry="200" transform="rotate(45 200 200)" />
                    <ellipse cx="200" cy="200" rx="100" ry="200" transform="rotate(90 200 200)" />
                    <ellipse cx="200" cy="200" rx="100" ry="200" transform="rotate(135 200 200)" />

                    {/* Latitude lines */}
                    <ellipse cx="200" cy="200" rx="200" ry="20" style={{ opacity: 0.7 }} />
                    <ellipse cx="200" cy="130" rx="170" ry="15" style={{ opacity: 0.7 }} />
                    <ellipse cx="200" cy="270" rx="170" ry="15" style={{ opacity: 0.7 }} />
                </g>

                {/* Outer Ring - Counter Rotating */}
                <circle className="holo-ring" cx="200" cy="200" r="230" stroke="rgba(0, 243, 255, 0.4)" strokeWidth="3" strokeDasharray="20 40" fill="none" />

                {/* Core Dot - Pulsing */}
                <circle className="holo-core" cx="200" cy="200" r="15" fill="#00f3ff" filter="url(#glow)" />
            </svg>
        </div>
    );
};

export default HolographicHero;
