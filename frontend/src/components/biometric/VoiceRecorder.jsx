import React, { useState, useRef, useEffect } from 'react';
import Button from '../core/Button';
import Card from '../ui/Card';
import CyberAudioPlayer from '../ui/CyberAudioPlayer';

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

    // Helper to convert AudioBuffer to WAV Blob
    const audioBufferToWav = (buffer) => {
        const numOfChan = buffer.numberOfChannels;
        const length = buffer.length * numOfChan * 2 + 44;
        const bufferArr = new ArrayBuffer(length);
        const view = new DataView(bufferArr);
        const channels = [];
        let i;
        let sample;
        let offset = 0;
        let pos = 0;

        // write RIFF chunk descriptor
        setUint32(0x46464952); // "RIFF"
        setUint32(36 + buffer.length * numOfChan * 2); // file length - 8
        setUint32(0x45564157); // "WAVE"

        // write fmt sub-chunk
        setUint32(0x20746d66); // "fmt "
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit (hardcoded in this example)

        // write data sub-chunk
        setUint32(0x61746164); // "data"
        setUint32(buffer.length * numOfChan * 2); // chunk size

        // write interleaved data
        for (i = 0; i < buffer.numberOfChannels; i++)
            channels.push(buffer.getChannelData(i));

        while (pos < buffer.length) {
            for (i = 0; i < numOfChan; i++) {
                // clamp
                sample = Math.max(-1, Math.min(1, channels[i][pos]));
                // scale to 16-bit signed int
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(offset, sample, true);
                offset += 2;
            }
            pos++;
        }

        return new Blob([view], { type: "audio/wav" });

        function setUint16(data) {
            view.setUint16(offset, data, true);
            offset += 2;
        }

        function setUint32(data) {
            view.setUint32(offset, data, true);
            offset += 4;
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Use optimal mime type
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            }
            
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

            startVisualizer(stream);

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const webmBlob = new Blob(chunksRef.current, { type: mimeType });
                chunksRef.current = [];

                if (webmBlob.size === 0) {
                    setError("Recording was empty. Please try again.");
                    // Stop tracks just in case
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                // Convert to WAV
                try {
                    const arrayBuffer = await webmBlob.arrayBuffer();
                    
                    if (!audioContextRef.current) {
                        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                    }
                    
                    // Ensure context is running
                    if (audioContextRef.current.state === 'suspended') {
                        await audioContextRef.current.resume();
                    }

                    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                    const wavBlob = audioBufferToWav(audioBuffer);
                    
                    const url = URL.createObjectURL(wavBlob);
                    setAudioURL(url);
                    if (onRecordingComplete) onRecordingComplete(wavBlob);
                } catch (err) {
                    console.error("Error converting audio to WAV:", err);
                    setError(`Processing failed: ${err.message || "Unknown error"}. Please retake.`);
                }

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
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%', justifyContent: 'center', flexDirection: 'column' }}>
                            <CyberAudioPlayer src={audioURL} />
                            <Button onClick={() => setAudioURL(null)} variant="secondary" style={{ width: '100%', maxWidth: '200px' }}>
                                RE-CALIBRATE (RETAKE)
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default VoiceRecorder;
