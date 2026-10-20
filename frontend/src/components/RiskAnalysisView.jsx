import React, { useState, useEffect } from 'react';
import RiskMatrixHeatmap from './RiskMatrixHeatmap';
import { runRiskAgent, getRiskMatrix } from '../services/api';

export default function RiskAnalysisView({ initialRisksData, onRefreshDashboard }) {
  const [risksData, setRisksData] = useState(initialRisksData || null);
  const [isLoading, setIsLoading] = useState(!initialRisksData);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchRisks = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // First try risk agent
      const data = await runRiskAgent();
      setRisksData(data);
    } catch (err) {
      console.warn('Risk agent fallback to risk matrix API:', err);
      try {
        const matrixData = await getRiskMatrix();
        setRisksData(matrixData);
      } catch (innerErr) {
        setErrorMessage(innerErr.message || 'Failed to analyze project risks');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialRisksData) {
      fetchRisks();
    } else {
      setRisksData(initialRisksData);
    }
  }, [initialRisksData]);

  const handleRefresh = async () => {
    await fetchRisks();
    if (onRefreshDashboard) onRefreshDashboard();
  };

  if (isLoading) {
    return (
      <div className="card-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="dashboard-spinner">⚠️</div>
        <h3 style={{ marginTop: '18px', color: '#ffffff' }}>Running Risk Detection &amp; Delivery Forecast Agent...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
          Evaluating schedule, technical, resource, and dependency risks with discrete 5×5 probability &amp; impact mapping
        </p>
      </div>
    );
  }

  const forecast = risksData?.forecast || {};
  const detectedRisks = risksData?.detected_risks || risksData?.risks || [];
  const scheduleRisks = detectedRisks.filter((r) => (r.category || '').toLowerCase().includes('schedule') || (r.title || '').toLowerCase().includes('schedule'));
  const technicalRisks = detectedRisks.filter((r) => (r.category || '').toLowerCase().includes('tech') || (r.title || '').toLowerCase().includes('tech'));
  const resourceRisks = detectedRisks.filter((r) => (r.category || '').toLowerCase().includes('resource') || (r.category || '').toLowerCase().includes('staff'));
  const dependencyRisks = detectedRisks.filter((r) => (r.category || '').toLowerCase().includes('depend') || (r.title || '').toLowerCase().includes('depend'));

  const slippageProb = typeof forecast.slippage_probability === 'number'
    ? forecast.slippage_probability <= 1 ? Math.round(forecast.slippage_probability * 100) : Math.round(forecast.slippage_probability)
    : 35;

  const forecastStatus = forecast.delivery_status || (slippageProb > 50 ? 'At High Risk' : slippageProb > 25 ? 'Moderate Slippage Risk' : 'On Track');

  return (
    <div className="risk-analysis-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Delivery Forecasting & Risk Summary Banner */}
      <div className="card-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em' }}>
                🛡️ Delivery Forecasting &amp; Risk Intelligence
              </h2>
              <span
                style={{
                  background: slippageProb > 50 ? 'rgba(239, 68, 68, 0.2)' : slippageProb > 25 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: slippageProb > 50 ? '#f87171' : slippageProb > 25 ? '#fbbf24' : '#34d399',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                }}
              >
                {forecastStatus}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Multi-dimensional risk exposure analysis combining schedule, technical, and resource constraints
            </p>
          </div>

          <button
            className="btn-primary"
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            onClick={handleRefresh}
          >
            ⚡ Re-run Risk Assessment
          </button>
        </div>

        {/* 4 Category Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Schedule Risks</span>
            <strong style={{ fontSize: '1.4rem', color: '#fdba74' }}>{scheduleRisks.length}</strong>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>Milestone timelines &amp; delays</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Technical Risks</span>
            <strong style={{ fontSize: '1.4rem', color: '#93c5fd' }}>{technicalRisks.length}</strong>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>Architectural &amp; tool complexity</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Resource Risks</span>
            <strong style={{ fontSize: '1.4rem', color: '#c4b5fd' }}>{resourceRisks.length}</strong>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>Staffing &amp; expertise gaps</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Slippage Probability</span>
            <strong style={{ fontSize: '1.4rem', color: slippageProb > 40 ? '#f87171' : '#34d399' }}>{slippageProb}%</strong>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>Delivery timeline confidence</div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="card-panel banner-error">
          ⚠️ <strong>Risk Agent Error:</strong> {errorMessage}
        </div>
      )}

      {/* 2. Embedded 5x5 Heatmap */}
      <RiskMatrixHeatmap risksData={risksData} onRefresh={handleRefresh} />
    </div>
  );
}
