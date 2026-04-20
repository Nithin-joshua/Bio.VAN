import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import '../../styles/theme.css';

// Particle Class - Moved outside to comply with React Hooks rules
class Particle {
  constructor(canvas) {
    this.reset(canvas);
  }

  reset(canvas) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 4 + 2; // Further increased size: 2px to 6px
    this.speedY = Math.random() * 0.3 + 0.1; 
    this.opacity = Math.random() * 0.5 + 0.3; // Increased min opacity to 0.3
    this.fadeDirection = Math.random() > 0.5 ? 0.005 : -0.005;
  }

  update(canvas) {
    this.y -= this.speedY;
    this.opacity += this.fadeDirection;

    // Pulse opacity
    if (this.opacity <= 0.1 || this.opacity >= 0.8) {
      this.fadeDirection *= -1;
    }

    // Reset if off screen
    if (this.y < 0) {
      this.y = canvas.height;
      this.x = Math.random() * canvas.width;
    }
  }

  draw(ctx) {
    ctx.fillStyle = `rgba(0, 255, 200, ${this.opacity})`; // Refined Teal
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Subtle glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(0, 255, 200, 0.6)";
  }
}

const BackgroundGrid = () => {
  const canvasRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

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
      // Increased density for more visual impact
      const particleCount = 40; 
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas));
      }
    };
    initParticles();

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        if (!shouldReduceMotion) {
          p.update(canvas);
        }
        p.draw(ctx);
      });

      if (!shouldReduceMotion) {
        animationFrameId = window.requestAnimationFrame(animate);
      } else {
        // Draw one frame and stop
        particles.forEach(p => p.draw(ctx));
      }
    };
    
    // Initial draw
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [shouldReduceMotion]);

  return (
    <div className="background-grid-container">
      {/* 1. Base: Flat Schematic Grid */}
      <div className="flat-grid"></div>
      <div className="scanner-line"></div>

      {/* 2. Middle: Aurora Blobs (Lower opacity for focus) */}
      <div className="aurora-blob blob-1"></div>
      <div className="aurora-blob blob-2"></div>

      {/* 3. Top: Bio-Data Particles (Canvas) */}
      <canvas ref={canvasRef} className="particles-canvas" />

      {/* 4. Overlay: Vignette (Enhanced for focus) */}
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
          width: 100%;
          height: 100%;
          background-image: 
          linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          opacity: 0.5;
        }

        .scanner-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--neon-blue), transparent);
          opacity: 0.1;
          box-shadow: 0 0 15px var(--neon-blue);
          animation: ${shouldReduceMotion ? 'none' : 'scan 8s linear infinite'};
          z-index: 10;
        }

        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.03; /* Lowered further per 40-60% requirement */
          animation: ${shouldReduceMotion ? 'none' : 'float 30s ease-in-out infinite'};
        }

        .blob-1 {
          top: 10%;
          left: -10%;
          width: 800px;
          height: 800px;
          background: var(--neon-blue);
        }

        .blob-2 {
          bottom: -10%;
          right: -10%;
          width: 900px;
          height: 900px;
          background: var(--neon-purple);
          animation-delay: -15s;
        }

        .particles-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2; 
        }

        .grid-vignette {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, transparent 20%, rgba(5, 5, 8, 0.8) 100%);
          z-index: 3;
        }

        @keyframes scan {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -50px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default BackgroundGrid;
