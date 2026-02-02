import React, { useState, useRef, useEffect } from 'react';
import Button from '../core/Button';

/**
 * Cyberpunk-styled audio player
 * Replaces the default HTML5 audio controls with a custom UI
 */
const CyberAudioPlayer = ({ src, onEnded }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnd = () => {
            setIsPlaying(false);
            if (onEnded) onEnded();
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnd);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnd);
        };
    }, [onEnded]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    };

    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="cyber-audio-player" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.8rem',
            background: 'rgba(5, 8, 10, 0.6)',
            border: '1px solid var(--neon-blue)',
            borderRadius: '4px',
            width: '100%',
            maxWidth: '400px',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 0 10px rgba(0, 243, 255, 0.1)'
        }}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                onClick={togglePlay}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--neon-blue)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '5px',
                    transition: 'all 0.2s ease'
                }}
            >
                {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                )}
            </button>

            {/* Progress Bar */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', minWidth: '35px' }}>
                    {formatTime(currentTime)}
                </span>

                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    style={{
                        flex: 1,
                        height: '4px',
                        appearance: 'none',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '2px',
                        outline: 'none',
                        cursor: 'pointer',
                        accentColor: 'var(--neon-blue)'
                    }}
                />

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', minWidth: '35px' }}>
                    {formatTime(duration)}
                </span>
            </div>

            {/* Visual Decoration */}
            <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isPlaying ? 'var(--neon-blue)' : 'var(--text-muted)',
                boxShadow: isPlaying ? '0 0 8px var(--neon-blue)' : 'none',
                animation: isPlaying ? 'pulse 1s infinite' : 'none'
            }} />
        </div>
    );
};

export default CyberAudioPlayer;
