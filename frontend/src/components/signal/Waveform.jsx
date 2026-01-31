import React, { useRef, useEffect } from 'react';

const Waveform = ({ audioData, isActive }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#020b14'; // Theme background
    ctx.fillRect(0, 0, width, height);

    if (!isActive || audioData.length === 0) {
      // Draw static noise line (Idle State)
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#004d61';

      let x = 0;
      ctx.moveTo(0, height / 2);

      // Simulate low-level signal noise
      while (x < width) {
        const noise = (Math.random() - 0.5) * 10;
        ctx.lineTo(x, (height / 2) + noise);
        x += 5;
      }

      ctx.stroke();
      return;
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00e5ff'; // Neon blue
    ctx.beginPath();

    const sliceWidth = width * 1.0 / audioData.length;
    let x = 0;

    for (let i = 0; i < audioData.length; i++) {
      const v = audioData[i] / 128.0; // Normalize 0-255 to 0-2
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

  }, [audioData, isActive]);

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