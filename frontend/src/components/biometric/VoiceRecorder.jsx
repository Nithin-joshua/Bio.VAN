import React, { useState, useRef, useEffect } from 'react';
import Button from '../core/Button';
import Card from '../ui/Card';

const VoiceRecorder = ({ onRecordingComplete, label = "Voice Sample" }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const [error, setError] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);

    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    // Corrected visualize implementation to avoid undefined refs inside the function definition
    // Re-defining to ensure scope is correct.
    const startVisualizer = (stream) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const audioCtx = audioContextRef.current;
        analyserRef.current = audioCtx.createAnalyser();
        sourceRef.current = audioCtx.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.fftSize = 2048;

        // Trigger the loop
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext("2d");
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!canvas) return;
            animationRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgba(10, 10, 20, 0.2)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = '#00f3ff';
            canvasCtx.beginPath();

            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };
        draw();
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            startVisualizer(stream);

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioURL(url);
                if (onRecordingComplete) onRecordingComplete(blob);
                chunksRef.current = [];

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setError(null);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please ensure permissions are granted.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <Card title={label} status={isRecording ? "RECORDING" : "READY"}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
                <canvas
                    ref={canvasRef}
                    width={300}
                    height={100}
                    style={{
                        width: '100%',
                        height: '100px',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: '4px',
                        marginBottom: '1rem'
                    }}
                />

                {error && <div style={{ color: 'var(--neon-red)', fontSize: '0.8rem' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isRecording && !audioURL && (
                        <Button onClick={startRecording}>
                            START RECORDING
                        </Button>
                    )}

                    {isRecording && (
                        <Button onClick={stopRecording} variant="danger">
                            STOP
                        </Button>
                    )}

                    {!isRecording && audioURL && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <audio src={audioURL} controls style={{ height: '30px' }} />
                            <Button onClick={() => setAudioURL(null)} variant="secondary">
                                RETAKE
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default VoiceRecorder;
