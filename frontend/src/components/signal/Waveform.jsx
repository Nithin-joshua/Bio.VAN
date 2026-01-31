import React, { useRef, useEffect } from 'react';

/**
 * Waveform Visualization Component
 * Renders a real-time oscilloscope-style waveform of audio input.
 * Shows a subtle noise pattern when idle, and active waveform when recording.
 */
const Waveform = ({ audioData, isActive }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear the canvas with dark background (matches cyberpunk theme)
    canvasContext.fillStyle = '#020b14';
    canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);

    if (!isActive || audioData.length === 0) {
      // IDLE STATE: Draw subtle noise to show system is "listening"
      // This creates a "standby" effect like old CRT monitors
      canvasContext.beginPath();
      canvasContext.lineWidth = 1;
      canvasContext.strokeStyle = '#004d61'; // Dim cyan for idle state

      let xPosition = 0;
      canvasContext.moveTo(0, canvasHeight / 2);

      // Generate random noise around the center line
      // Small amplitude (±5 pixels) creates subtle "static" effect
      while (xPosition < canvasWidth) {
        const randomNoise = (Math.random() - 0.5) * 10;
        canvasContext.lineTo(xPosition, (canvasHeight / 2) + randomNoise);
        xPosition += 5; // Step size determines noise density
      }

      canvasContext.stroke();
      return;
    }

    // ACTIVE STATE: Draw real-time waveform from audio data
    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = '#00e5ff'; // Bright neon blue for active recording
    canvasContext.beginPath();

    // Calculate how many pixels each audio sample should occupy
    const pixelsPerSample = canvasWidth * 1.0 / audioData.length;
    let xPosition = 0;

    // Draw the waveform by connecting audio amplitude points
    for (let sampleIndex = 0; sampleIndex < audioData.length; sampleIndex++) {
      // Normalize audio data from 0-255 range to 0-2 range
      // (128 = center, 0 = bottom, 255 = top)
      const normalizedValue = audioData[sampleIndex] / 128.0;

      // Convert normalized value to canvas Y coordinate
      // Multiply by half height to fit waveform in canvas
      const yPosition = (normalizedValue * canvasHeight) / 2;

      if (sampleIndex === 0) {
        canvasContext.moveTo(xPosition, yPosition);
      } else {
        canvasContext.lineTo(xPosition, yPosition);
      }

      xPosition += pixelsPerSample;
    }

    // Complete the waveform by connecting to center-right
    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();

  }, [audioData, isActive]); // Re-render when audio data or active state changes

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={150}
      className="waveform-canvas"
    />
  );
};

export default Waveform;