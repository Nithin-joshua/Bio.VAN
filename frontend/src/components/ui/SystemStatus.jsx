import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../../styles/components.css';

const SystemStatus = () => {
  const [metrics, setMetrics] = useState({
    cpu: 42,
    memory: 68,
    net: 12,
    threat: 'LOW'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.min(99, Math.max(10, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.min(99, Math.max(20, prev.memory + (Math.random() * 5 - 2.5))),
        net: Math.min(99, Math.max(5, prev.net + (Math.random() * 15 - 7))),
        threat: Math.random() > 0.95 ? 'MODERATE' : 'LOW'
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="system-status-bar glass-card"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        borderRadius: '0 0 16px 16px',
        borderTop: 'none',
        padding: '0.5rem 2rem',
        background: 'rgba(5, 10, 15, 0.4)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        fontSize: '0.65rem',
        fontFamily: 'var(--font-mono)'
      }}
    >
      <div className="status-item">
        <span className="status-label" style={{ color: 'var(--neon-blue)', opacity: 0.8 }}>CORE.THR:</span>
        <span className="status-value" style={{ fontWeight: 'bold' }}>{metrics.cpu.toFixed(0)}%</span>
      </div>
      <div className="status-item">
        <span className="status-label" style={{ color: 'var(--neon-blue)', opacity: 0.8 }}>MEM_SYNC:</span>
        <span className="status-value" style={{ fontWeight: 'bold' }}>{metrics.memory.toFixed(0)}%</span>
      </div>
      <div className="status-item mobile-hide">
        <span className="status-label" style={{ color: 'var(--neon-blue)', opacity: 0.8 }}>DATA_LINK:</span>
        <span className="status-value" style={{ fontWeight: 'bold' }}>{metrics.net.toFixed(1)} GB/s</span>
      </div>
      <div className="status-item">
        <div className="status-pill" style={{ padding: '2px 8px', borderColor: metrics.threat === 'LOW' ? 'rgba(0, 255, 150, 0.2)' : 'rgba(255, 50, 50, 0.2)' }}>
          <span className={`status-indicator ${metrics.threat === 'LOW' ? 'active' : 'locked'}`}></span>
          {metrics.threat} PREVIEW
        </div>
      </div>
      <div className="status-item mobile-hide" style={{ marginLeft: 'auto' }}>
        <span className="status-label" style={{ opacity: 0.5 }}>IDENT_GATEWAY // NODE_8A</span>
      </div>
    </motion.div>
  );
};

export default SystemStatus;
