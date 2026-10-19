import React from 'react';

export default function Header({ isHealthy, documentCount, architectureInfo }) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon">🛡️</div>
        <div className="brand-title">
          <h1>AI Project Intelligence & Risk Advisor</h1>
          <p>Enterprise Project Intelligence & Risk Management</p>
        </div>
      </div>
      
      <div className="header-status">
        <div className="status-badge" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
          📚 <strong>{documentCount}</strong> Documents Active
        </div>
        <div className={`status-badge ${isHealthy ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          {isHealthy ? 'System Operational' : 'Connecting...'}
        </div>
      </div>
    </header>
  );
}
