import React, { useState, useEffect } from 'react';
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
    <div className="system-status-bar">
      <div className="status-item">
        <span className="status-label">SYS.CPU:</span>
        <span className="status-value">{metrics.cpu.toFixed(1)}%</span>
        <div className="status-graph">
          <div className="status-bar-fill" style={{ width: `${metrics.cpu}%` }}></div>
        </div>
      </div>
      <div className="status-item">
        <span className="status-label">MEM.ALLOC:</span>
        <span className="status-value">{metrics.memory.toFixed(1)}%</span>
        <div className="status-graph">
          <div className="status-bar-fill" style={{ width: `${metrics.memory}%`, backgroundColor: metrics.memory > 80 ? 'var(--neon-pink)' : 'var(--neon-blue)' }}></div>
        </div>
      </div>
      <div className="status-item mobile-hide">
        <span className="status-label">NET.TRAFFIC:</span>
        <span className="status-value">{metrics.net.toFixed(1)} TB/s</span>
      </div>
      <div className="status-item">
        <span className="status-label">THREAT.LVL:</span>
        <span className="status-value" style={{ color: metrics.threat === 'LOW' ? 'var(--neon-green)' : 'var(--neon-pink)' }}>
          {metrics.threat}
        </span>
      </div>
      <div className="status-item mobile-hide">
        <span className="status-label">UPTIME:</span>
        <span className="status-value">8764h 21m</span>
      </div>
    </div>
  );
};

export default SystemStatus;
