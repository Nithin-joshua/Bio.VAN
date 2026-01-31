import React, { useState, useRef, useEffect } from 'react';

const Select = ({ value, onChange, options, placeholder = "Select option" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                fontFamily: 'monospace'
            }}
        >
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--primary-color)',
                    color: selectedOption ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 243, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
            >
                {selectedOption ? selectedOption.label : placeholder}
                <span style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    color: 'var(--primary-color)'
                }}>
                    ▼
                </span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    left: 0,
                    width: '100%',
                    background: '#050505',
                    border: '1px solid var(--primary-color)',
                    zIndex: 100,
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '0.8rem',
                                color: value === option.value ? 'var(--primary-color)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(0, 243, 255, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 243, 255, 0.1)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = value === option.value ? 'var(--primary-color)' : 'var(--text-secondary)';
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Select;
