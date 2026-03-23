import React, { useEffect, useRef } from 'react';
import '../../styles/theme.css';

// Particle Class - Moved outside to comply with React Hooks rules
class Particle {
  constructor(canvas) {
    this.reset(canvas);
  }

  reset(canvas) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 3 + 2; // Larger: 2px to 5px
    this.speedY = Math.random() * 0.5 + 0.2; // Faster
    this.opacity = Math.random() * 0.5 + 0.2; // Min opacity 0.2
    this.fadeDirection = Math.random() > 0.5 ? 0.01 : -0.01;
  }

  update(canvas) {
    this.y -= this.speedY;
    this.opacity += this.fadeDirection;

    // Pulse opacity
    if (this.opacity <= 0.1 || this.opacity >= 1) {
      this.fadeDirection *= -1;
    }

    // Reset if off screen
    if (this.y < 0) {
      this.y = canvas.height;
      this.x = Math.random() * canvas.width;
    }
  }

  draw(ctx) {
    ctx.fillStyle = `rgba(0, 243, 255, ${this.opacity})`; // Neon Blue
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Add glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0, 243, 255, 0.8)";
  }
}

const BackgroundGrid = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Init Particles
    const initParticles = () => {
      particles = [];
      const particleCount = Math.min(window.innerWidth / 10, 100); // Responsive count
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas));
      }
    };
    initParticles();

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update(canvas);
        p.draw(ctx);
      });
      animationFrameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="background-grid-container">
      {/* 1. Base: Flat Schematic Grid */}
      <div className="flat-grid"></div>

      {/* 2. Middle: Aurora Blobs */}
      <div className="aurora-blob blob-1"></div>
      <div className="aurora-blob blob-2"></div>

      {/* 3. Top: Bio-Data Particles (Canvas) */}
      <canvas ref={canvasRef} className="particles-canvas" />

      {/* 4. Overlay: Vignette */}
      <div className="grid-vignette"></div>

      <style>{`
        .background-grid-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
          overflow: hidden;
          background: var(--bg-dark);
          pointer-events: none;
        }

        .flat-grid {
          position: absolute;
          width: 200vw;
          height: 200vh;
          left: 0;
          top: 0;
          background-image: 
            linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          opacity: 0.5;
        }

        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float 20s ease-in-out infinite;
        }

        .blob-1 {
          top: 20%;
          left: 10%;
          width: 500px;
          height: 500px;
          background: var(--neon-blue);
          animation-delay: 0s;
        }

        .blob-2 {
          bottom: 20%;
          right: 10%;
          width: 600px;
          height: 600px;
          background: var(--neon-purple);
          animation-delay: -10s;
        }

        .particles-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1; /* Above blobs, below vignette */
        }

        .grid-vignette {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, transparent 20%, var(--bg-dark) 100%);
          z-index: 2;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
      `}</style>
    </div>
  );
};

export default BackgroundGrid;
