import React, { useState, useEffect, useRef } from 'react';
import { getProjectDashboard, uploadIncrementalDocuments } from '../services/api';

export default function ProjectDashboard({ onDocumentsUpdated, refreshKey, documentCount, onNavigateUpload }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Incremental upload state
  const [incrementalFiles, setIncrementalFiles] = useState([]);
  const [isUploadingInc, setIsUploadingInc] = useState(false);
  const [incUploadMessage, setIncUploadMessage] = useState(null);
  const incFileInputRef = useRef(null);

  // Active risk filter tab
  const [riskFilter, setRiskFilter] = useState('ALL');
  // Selected risk for matrix details popup/inspector
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [hoveredRisk, setHoveredRisk] = useState(null);

  const fetchDashboard = async () => {
    setIsRefreshing(true);
    setErrorMessage('');
    try {
      const data = await getProjectDashboard(null);
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setErrorMessage(err.message || 'Failed to generate project intelligence dashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [refreshKey]);

  const handleIncFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setIncrementalFiles(Array.from(e.target.files));
      setIncUploadMessage(null);
    }
  };

  const handleIncrementalUpload = async () => {
    if (incrementalFiles.length === 0) return;
    setIsUploadingInc(true);
    setIncUploadMessage(null);
    setErrorMessage('');

    try {
      const res = await uploadIncrementalDocuments(incrementalFiles);
      setIncUploadMessage({
        type: 'success',
        text: `✅ Added ${res.new_documents_uploaded} new document(s) with ${res.new_chunks_indexed} new chunks! Total: ${res.total_documents_count} docs (${res.total_chunks_count} chunks).`,
      });
      setIncrementalFiles([]);
      if (incFileInputRef.current) incFileInputRef.current.value = '';
      if (onDocumentsUpdated) onDocumentsUpdated();
      await fetchDashboard();
    } catch (err) {
      setIncUploadMessage({
        type: 'error',
        text: `❌ Upload failed: ${err.message}`,
      });
    } finally {
      setIsUploadingInc(false);
    }
  };

  const getHealthBadgeClass = (score) => {
    if (score >= 80) return 'health-badge-good';
    if (score >= 60) return 'health-badge-warning';
    return 'health-badge-critical';
  };

  const getRiskSeverityClass = (level) => {
    const l = (level || '').toUpperCase();
    if (l === 'CRITICAL') return 'risk-tag-critical';
    if (l === 'HIGH') return 'risk-tag-high';
    if (l === 'MEDIUM') return 'risk-tag-medium';
    return 'risk-tag-low';
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('on track') || s.includes('healthy') || s.includes('completed')) return 'status-healthy';
    if (s.includes('at risk') || s.includes('in progress') || s.includes('pending')) return 'status-warning';
    return 'status-critical';
  };

  // Helper to calculate grounded coordinates (Probability X, Impact Y) for each risk
  const getRiskCoordinates = (risk, index, total, slippageProb = 0.35) => {
    const lvl = (risk.level?.value || risk.level || risk.severity || 'MEDIUM').toUpperCase();

    // Check if numeric probability already provided
    let explicitProb = null;
    if (typeof risk.probability === 'number') {
      explicitProb = risk.probability <= 1 ? risk.probability * 100 : risk.probability;
    } else if (typeof risk.prob === 'number') {
      explicitProb = risk.prob <= 1 ? risk.prob * 100 : risk.prob;
    }

    // Check if numeric impact already provided
    let explicitImpact = null;
    if (typeof risk.impact_score === 'number') {
      explicitImpact = risk.impact_score <= 1 ? risk.impact_score * 100 : risk.impact_score;
    } else if (typeof risk.impact_numeric === 'number') {
      explicitImpact = risk.impact_numeric <= 1 ? risk.impact_numeric * 100 : risk.impact_numeric;
    }

    // Hash based spread for non-overlapping visualization
    const seedStr = (risk.risk_id || '') + (risk.title || '') + (risk.reason || '');
    let hash = index * 37;
    for (let i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const jitterX = ((absHash % 19) - 9) * 0.85; // -7.6% to +7.6%
    const jitterY = (((Math.floor(absHash / 19)) % 19) - 9) * 0.85;

    let baseProb = 50;
    let baseImpact = 50;

    if (lvl === 'CRITICAL') {
      baseProb = 80 + (slippageProb * 12);
      baseImpact = 86;
    } else if (lvl === 'HIGH') {
      baseProb = 65 + (slippageProb * 10);
      baseImpact = 72;
    } else if (lvl === 'MEDIUM') {
      baseProb = 46 + (slippageProb * 6);
      baseImpact = 50;
    } else { // LOW
      baseProb = 24;
      baseImpact = 26;
    }

    const prob = explicitProb !== null ? Math.round(explicitProb) : Math.max(12, Math.min(94, Math.round(baseProb + jitterX)));
    const impact = explicitImpact !== null ? Math.round(explicitImpact) : Math.max(12, Math.min(94, Math.round(baseImpact + jitterY)));

    return {
      prob,
      impact,
      level: lvl,
    };
  };

  const getSeverityColor = (level) => {
    switch ((level || '').toUpperCase()) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#06b6d4';
      case 'LOW': return '#10b981';
      default: return '#6366f1';
    }
  };

  if (isLoading) {
    return (
      <div className="card-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="dashboard-spinner">⚙️</div>
        <h3 style={{ marginTop: '18px', color: '#ffffff' }}>Synthesizing Project Intelligence...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
          Running Scope, Risk & Forecast, Blocker, and Health Scoring engines across RAG knowledge base
        </p>
      </div>
    );
  }

  const health = dashboardData?.health || {};
  const scope = dashboardData?.scope || {};
  const risks = dashboardData?.risks || {};
  const blockersActions = dashboardData?.blockers_actions || {};
  const kb = dashboardData?.knowledge_base || {};
  const recommendations = dashboardData?.key_recommendations || health.recommendations || [];
  const forecast = risks?.forecast || {};

  const detectedRisks = risks?.detected_risks || [];
  const activeBlockers = blockersActions?.active_blockers || blockersActions?.blockers || [];
  const actionItems = blockersActions?.action_items || [];
  const goals = scope?.project_goals || scope?.goals || [];
  const deliverables = scope?.deliverables || [];
  const boundaries = scope?.scope_boundaries || {};

  // Only generate analysis output when documents exist. If no documents, prompt user to upload.
  const hasDocuments = (kb.total_documents > 0 && kb.total_chunks > 0) ||
                       (detectedRisks.length > 0 || deliverables.length > 0 || activeBlockers.length > 0 || goals.length > 0);

  if (!hasDocuments || dashboardData?.health?.health_status === 'No Documents' || dashboardData?.project_title === 'No Documents Uploaded') {
    return (
      <div className="card-panel" style={{ textAlign: 'center', padding: '64px 24px', maxWidth: '820px', margin: '20px auto' }}>
        <div style={{ fontSize: '3.6rem', marginBottom: '16px' }}>📂</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          No Project Documents Uploaded Yet
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '540px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
          Upload your project documents (PDF, DOCX, CSV, or TXT). As soon as you upload, the project intelligence analysis will run automatically and display the output.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <button
            className="btn-primary"
            style={{ padding: '12px 28px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => onNavigateUpload ? onNavigateUpload() : incFileInputRef.current?.click()}
          >
            <span>📥</span> Upload Project Documents
          </button>
        </div>

        {/* Quick file selector to upload directly */}
        <div style={{ padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.45)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
            Or quickly select and ingest document files directly:
          </p>
          <input
            type="file"
            ref={incFileInputRef}
            onChange={handleIncFileChange}
            multiple
            accept=".pdf,.docx,.doc,.csv,.txt"
            style={{ display: 'none' }}
          />
          <button
            className="btn-secondary"
            onClick={() => incFileInputRef.current?.click()}
            disabled={isUploadingInc}
          >
            📁 Select Files
          </button>

          {incrementalFiles.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>
                {incrementalFiles.length} file(s) selected
              </span>
              <button
                className="btn-primary"
                onClick={handleIncrementalUpload}
                disabled={isUploadingInc}
              >
                {isUploadingInc ? '⚙️ Ingesting & Analyzing...' : '⚡ Ingest & Auto-Run Analysis'}
              </button>
            </div>
          )}

          {incUploadMessage && (
            <div style={{ marginTop: '14px', fontSize: '0.85rem', color: incUploadMessage.type === 'error' ? '#f87171' : '#34d399' }}>
              {incUploadMessage.text}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enrich risks with probability and impact values
  const slippageProb = forecast.slippage_probability || 0.35;
  const enrichedRisks = detectedRisks.map((r, idx) => {
    const coords = getRiskCoordinates(r, idx, detectedRisks.length, slippageProb);
    return {
      ...r,
      calcProb: coords.prob,
      calcImpact: coords.impact,
      cleanLevel: coords.level,
      displayId: r.risk_id || `RSK-${idx + 1}`,
    };
  });

  const filteredEnrichedRisks = riskFilter === 'ALL'
    ? enrichedRisks
    : enrichedRisks.filter((r) => r.cleanLevel === riskFilter);

  // Counts for filter pills
  const criticalCount = enrichedRisks.filter((r) => r.cleanLevel === 'CRITICAL').length;
  const highCount = enrichedRisks.filter((r) => r.cleanLevel === 'HIGH').length;
  const mediumCount = enrichedRisks.filter((r) => r.cleanLevel === 'MEDIUM').length;
  const lowCount = enrichedRisks.filter((r) => r.cleanLevel === 'LOW').length;

  // SVG coordinate transformation constants for Risk Priority Matrix
  // SVG ViewBox: 600 x 380
  const SVG_WIDTH = 600;
  const SVG_HEIGHT = 380;
  const MARGIN_LEFT = 60;
  const MARGIN_RIGHT = 30;
  const MARGIN_TOP = 25;
  const MARGIN_BOTTOM = 45;
  const PLOT_WIDTH = SVG_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 510
  const PLOT_HEIGHT = SVG_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 310

  const getSvgX = (prob) => MARGIN_LEFT + (prob / 100) * PLOT_WIDTH;
  const getSvgY = (impact) => MARGIN_TOP + ((100 - impact) / 100) * PLOT_HEIGHT;

  return (
    <div className="dashboard-root">
      {/* 1. TOP SECTION: Project Title + Overall Health Status */}
      <div className="card-panel dashboard-toolbar">
        <div className="toolbar-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>
                AI Project Intelligence &amp; Risk Advisor
              </h2>
              <span className={`status-pill ${getStatusClass(health.health_status)}`} style={{ fontSize: '0.8rem', padding: '5px 14px', fontWeight: '700' }}>
                Overall: {health.health_status || 'Evaluating'}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Enterprise Project Intelligence &amp; Risk Management • Workspace: <strong style={{ color: '#c7d2fe' }}>{dashboardData?.project_title || 'Project Workspace'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => fetchDashboard()}
              disabled={isRefreshing}
            >
              {isRefreshing ? '🔄 Analyzing...' : '⚡ Rerun Analysis'}
            </button>
          </div>
        </div>

        {/* Incremental Document Ingestion Bar */}
        <div className="incremental-upload-box" style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: '600', color: '#e0e7ff' }}>
                ➕ Incremental Document Ingestion
              </h4>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Upload new project artifacts at any time to dynamically re-index and recompute intelligence.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="file"
                ref={incFileInputRef}
                onChange={handleIncFileChange}
                multiple
                accept=".pdf,.docx,.doc,.csv,.txt,.md"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => incFileInputRef.current?.click()}
              >
                📂 Choose Files ({incrementalFiles.length})
              </button>
              {incrementalFiles.length > 0 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleIncrementalUpload}
                  disabled={isUploadingInc}
                >
                  {isUploadingInc ? '⏳ Ingesting...' : '🚀 Ingest & Rerun'}
                </button>
              )}
            </div>
          </div>

          {incrementalFiles.length > 0 && (
            <div className="selected-inc-files">
              {incrementalFiles.map((f, i) => (
                <span key={i} className="inc-file-pill">
                  📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </span>
              ))}
            </div>
          )}

          {incUploadMessage && (
            <div
              className={`inc-message-banner ${
                incUploadMessage.type === 'success' ? 'banner-success' : 'banner-error'
              }`}
            >
              {incUploadMessage.text}
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="card-panel banner-error" style={{ marginBottom: '16px' }}>
          ⚠️ <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {/* 2. SECOND ROW: TOP KPI CARDS (6 CARDS) */}
      <div className="kpi-grid-six">
        {/* KPI 1: Project Health Score */}
        <div className="kpi-card card-panel">
          <div className="kpi-header-row">
            <span className="kpi-icon-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>📊</span>
            <span className={`kpi-tag-status ${getStatusClass(health.health_status)}`}>
              {health.health_status || 'Stable'}
            </span>
          </div>
          <div className="kpi-value-main">
            {Math.round(health.overall_health_score || 0)}<span className="kpi-unit">/100</span>
          </div>
          <div className="kpi-label-text">Project Health Score</div>
          <div className="kpi-subtext-bar">
            <div className="kpi-mini-track">
              <div
                className="kpi-mini-fill"
                style={{
                  width: `${Math.min(100, health.overall_health_score || 0)}%`,
                  background: (health.overall_health_score || 0) >= 80 ? '#10b981' : (health.overall_health_score || 0) >= 60 ? '#f59e0b' : '#ef4444',
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Documents */}
        <div className="kpi-card card-panel">
          <div className="kpi-header-row">
            <span className="kpi-icon-badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>📚</span>
            <span className="kpi-type-badge">Repository</span>
          </div>
          <div className="kpi-value-main">
            {kb.total_documents || 0}
          </div>
          <div className="kpi-label-text">Total Documents</div>
          <div className="kpi-subtext-note">PDF, DOCX, CSV, TXT</div>
        </div>

        {/* KPI 3: Indexed Vector Chunks */}
        <div className="kpi-card card-panel">
          <div className="kpi-header-row">
            <span className="kpi-icon-badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>🧩</span>
            <span className="kpi-type-badge">ChromaDB</span>
          </div>
          <div className="kpi-value-main">
            {kb.total_chunks || 0}
          </div>
          <div className="kpi-label-text">Indexed Vector Chunks</div>
          <div className="kpi-subtext-note">Dense Semantic Vectors</div>
        </div>

        {/* KPI 4: Total Risks */}
        <div className="kpi-card card-panel">
          <div className="kpi-header-row">
            <span className="kpi-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>⚠️</span>
            <span className="kpi-type-badge" style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              {criticalCount} Critical
            </span>
          </div>
          <div className="kpi-value-main" style={{ color: detectedRisks.length > 0 ? '#fbbf24' : '#f3f4f6' }}>
            {risks.total_risks_detected || detectedRisks.length || 0}
          </div>
          <div className="kpi-label-text">Total Risks</div>
          <div className="kpi-subtext-note">Extracted via Risk Agent</div>
        </div>

        {/* KPI 5: Active Blockers */}
        <div className="kpi-card card-panel">
          <div className="kpi-header-row">
            <span className="kpi-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>🛑</span>
            <span className="kpi-type-badge" style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              Impediments
            </span>
          </div>
          <div className="kpi-value-main" style={{ color: activeBlockers.length > 0 ? '#f87171' : '#f3f4f6' }}>
            {activeBlockers.length}
          </div>
          <div className="kpi-label-text">Active Blockers</div>
          <div className="kpi-subtext-note">Delivery Roadblocks</div>
        </div>

        {/* KPI 6: Open Action Items */}
        <div className="kpi-card card-panel">
          <div className="kpi-header-row">
            <span className="kpi-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>✅</span>
            <span className="kpi-type-badge" style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              Assigned
            </span>
          </div>
          <div className="kpi-value-main">
            {actionItems.length}
          </div>
          <div className="kpi-label-text">Open Action Items</div>
          <div className="kpi-subtext-note">Active Delivery Tasks</div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: LEFT = RISK PRIORITY MATRIX, RIGHT = PROJECT HEALTH SUMMARY */}
      <div className="matrix-health-row">
        {/* LEFT COLUMN: INTERACTIVE RISK PRIORITY MATRIX GRAPH */}
        <div className="card-panel matrix-panel">
          <div className="matrix-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
                  🎯 Risk Priority Matrix
                </h3>
                <span className="badge-count">{filteredEnrichedRisks.length} Plotted</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Interactive Scatter Bubble Graph: Probability (X-axis) vs. Impact (Y-axis)
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="matrix-filter-buttons">
              {[
                { id: 'ALL', label: 'All', count: enrichedRisks.length },
                { id: 'CRITICAL', label: 'Critical', count: criticalCount },
                { id: 'HIGH', label: 'High', count: highCount },
                { id: 'MEDIUM', label: 'Medium', count: mediumCount },
                { id: 'LOW', label: 'Low', count: lowCount },
              ].map((filterItem) => (
                <button
                  key={filterItem.id}
                  className={`matrix-filter-btn ${riskFilter === filterItem.id ? 'active' : ''} filter-btn-${filterItem.id.toLowerCase()}`}
                  onClick={() => setRiskFilter(filterItem.id)}
                >
                  {filterItem.label} ({filterItem.count})
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Scatter Plot Container */}
          <div className="matrix-canvas-wrapper" style={{ position: 'relative' }}>
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="matrix-svg-graph"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <defs>
                {/* Quadrant gradient fills */}
                <linearGradient id="gradTopRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="gradTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.03" />
                </linearGradient>
                <linearGradient id="gradBottomRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.09" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.03" />
                </linearGradient>
                <linearGradient id="gradBottomLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>

                {/* Bubble glow filters */}
                <filter id="glowCritical" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glowHigh" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glowMedium" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glowLow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* 4 Quadrants Background Areas */}
              {/* Top-Right: High Prob / High Impact (Critical Action Zone) */}
              <rect
                x={getSvgX(50)}
                y={MARGIN_TOP}
                width={PLOT_WIDTH / 2}
                height={PLOT_HEIGHT / 2}
                fill="url(#gradTopRight)"
                rx="4"
              />
              {/* Top-Left: Low Prob / High Impact (Contingency Zone) */}
              <rect
                x={MARGIN_LEFT}
                y={MARGIN_TOP}
                width={PLOT_WIDTH / 2}
                height={PLOT_HEIGHT / 2}
                fill="url(#gradTopLeft)"
                rx="4"
              />
              {/* Bottom-Right: High Prob / Low Impact (Mitigate Zone) */}
              <rect
                x={getSvgX(50)}
                y={getSvgY(50)}
                width={PLOT_WIDTH / 2}
                height={PLOT_HEIGHT / 2}
                fill="url(#gradBottomRight)"
                rx="4"
              />
              {/* Bottom-Left: Low Prob / Low Impact (Monitor Zone) */}
              <rect
                x={MARGIN_LEFT}
                y={getSvgY(50)}
                width={PLOT_WIDTH / 2}
                height={PLOT_HEIGHT / 2}
                fill="url(#gradBottomLeft)"
                rx="4"
              />

              {/* Quadrant Label Text Overlays */}
              <text x={getSvgX(75)} y={MARGIN_TOP + 18} textAnchor="middle" fill="rgba(244, 63, 94, 0.7)" fontSize="10" fontWeight="700" letterSpacing="0.5">
                CRITICAL ACTION ZONE
              </text>
              <text x={getSvgX(25)} y={MARGIN_TOP + 18} textAnchor="middle" fill="rgba(245, 158, 11, 0.7)" fontSize="10" fontWeight="700" letterSpacing="0.5">
                HIGH IMPACT / CONTINGENCY
              </text>
              <text x={getSvgX(75)} y={MARGIN_TOP + PLOT_HEIGHT - 12} textAnchor="middle" fill="rgba(6, 182, 212, 0.7)" fontSize="10" fontWeight="700" letterSpacing="0.5">
                HIGH PROB / MITIGATE
              </text>
              <text x={getSvgX(25)} y={MARGIN_TOP + PLOT_HEIGHT - 12} textAnchor="middle" fill="rgba(16, 185, 129, 0.7)" fontSize="10" fontWeight="700" letterSpacing="0.5">
                ROUTINE MONITORING
              </text>

              {/* Grid Lines & Ticks */}
              {/* Horizontal Grid Lines for Impact (0%, 25%, 50%, 75%, 100%) */}
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = getSvgY(tick);
                const isMid = tick === 50;
                return (
                  <g key={`y-${tick}`}>
                    <line
                      x1={MARGIN_LEFT}
                      y1={y}
                      x2={MARGIN_LEFT + PLOT_WIDTH}
                      y2={y}
                      stroke={isMid ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)'}
                      strokeDasharray={isMid ? '4,4' : '2,2'}
                      strokeWidth={isMid ? '1.5' : '1'}
                    />
                    <text
                      x={MARGIN_LEFT - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="9.5"
                      fontFamily="var(--font-mono, monospace)"
                    >
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {/* Vertical Grid Lines for Probability (0%, 25%, 50%, 75%, 100%) */}
              {[0, 25, 50, 75, 100].map((tick) => {
                const x = getSvgX(tick);
                const isMid = tick === 50;
                return (
                  <g key={`x-${tick}`}>
                    <line
                      x1={x}
                      y1={MARGIN_TOP}
                      x2={x}
                      y2={MARGIN_TOP + PLOT_HEIGHT}
                      stroke={isMid ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)'}
                      strokeDasharray={isMid ? '4,4' : '2,2'}
                      strokeWidth={isMid ? '1.5' : '1'}
                    />
                    <text
                      x={x}
                      y={MARGIN_TOP + PLOT_HEIGHT + 16}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9.5"
                      fontFamily="var(--font-mono, monospace)"
                    >
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {/* Main Axes Lines */}
              <line
                x1={MARGIN_LEFT}
                y1={MARGIN_TOP}
                x2={MARGIN_LEFT}
                y2={MARGIN_TOP + PLOT_HEIGHT}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1.5"
              />
              <line
                x1={MARGIN_LEFT}
                y1={MARGIN_TOP + PLOT_HEIGHT}
                x2={MARGIN_LEFT + PLOT_WIDTH}
                y2={MARGIN_TOP + PLOT_HEIGHT}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1.5"
              />

              {/* Axis Titles */}
              {/* Y-Axis Label: IMPACT */}
              <text
                x={-(MARGIN_TOP + PLOT_HEIGHT / 2)}
                y="18"
                transform="rotate(-90)"
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="11"
                fontWeight="700"
                letterSpacing="1"
              >
                ▲ IMPACT
              </text>

              {/* X-Axis Label: PROBABILITY */}
              <text
                x={MARGIN_LEFT + PLOT_WIDTH / 2}
                y={MARGIN_TOP + PLOT_HEIGHT + 34}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="11"
                fontWeight="700"
                letterSpacing="1"
              >
                PROBABILITY ►
              </text>

              {/* Plotted Risk Bubbles */}
              {filteredEnrichedRisks.map((risk, idx) => {
                const cx = getSvgX(risk.calcProb);
                const cy = getSvgY(risk.calcImpact);
                const color = getSeverityColor(risk.cleanLevel);
                const isHovered = hoveredRisk?.displayId === risk.displayId;
                const isSelected = selectedRisk?.displayId === risk.displayId;

                const baseRadius = risk.cleanLevel === 'CRITICAL' ? 12 : risk.cleanLevel === 'HIGH' ? 10.5 : risk.cleanLevel === 'MEDIUM' ? 9 : 8;
                const r = isHovered || isSelected ? baseRadius * 1.35 : baseRadius;

                let filterId = 'glowMedium';
                if (risk.cleanLevel === 'CRITICAL') filterId = 'glowCritical';
                else if (risk.cleanLevel === 'HIGH') filterId = 'glowHigh';
                else if (risk.cleanLevel === 'LOW') filterId = 'glowLow';

                return (
                  <g
                    key={idx}
                    className="risk-svg-node"
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseEnter={() => setHoveredRisk(risk)}
                    onMouseLeave={() => setHoveredRisk(null)}
                    onClick={() => setSelectedRisk(risk)}
                  >
                    {/* Outer glow ring for critical/high or when hovered */}
                    {(risk.cleanLevel === 'CRITICAL' || risk.cleanLevel === 'HIGH' || isHovered || isSelected) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 5}
                        fill="none"
                        stroke={color}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        strokeOpacity={isSelected ? 0.9 : 0.4}
                        strokeDasharray={isSelected ? '3,3' : 'none'}
                      />
                    )}

                    {/* Main Circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={color}
                      filter={`url(#${filterId})`}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? '2' : '1.2'}
                      strokeOpacity={0.8}
                    />

                    {/* Short Risk Label beside/on point */}
                    <text
                      x={cx + r + 5}
                      y={cy + 3.5}
                      fill="#f8fafc"
                      fontSize="9.5"
                      fontFamily="var(--font-mono, monospace)"
                      fontWeight="600"
                      style={{ pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                    >
                      {risk.displayId}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Tooltip on Point Hover */}
            {hoveredRisk && (
              <div
                className="matrix-hover-tooltip"
                style={{
                  position: 'absolute',
                  left: `${Math.min(74, Math.max(16, (getSvgX(hoveredRisk.calcProb) / SVG_WIDTH) * 100))}%`,
                  top: `${Math.max(8, ((getSvgY(hoveredRisk.calcImpact) - 95) / SVG_HEIGHT) * 100)}%`,
                  pointerEvents: 'none',
                  zIndex: 20,
                }}
              >
                <div className="tooltip-header">
                  <span className={`risk-tag ${getRiskSeverityClass(hoveredRisk.cleanLevel)}`}>
                    {hoveredRisk.cleanLevel}
                  </span>
                  <strong style={{ color: '#ffffff' }}>{hoveredRisk.displayId}</strong>
                </div>
                <div className="tooltip-title">{hoveredRisk.title}</div>
                <div className="tooltip-metrics">
                  <span>📊 Probability: <strong style={{ color: '#38bdf8' }}>{hoveredRisk.calcProb}%</strong></span>
                  <span>💥 Impact: <strong style={{ color: '#f87171' }}>{hoveredRisk.calcImpact}%</strong></span>
                </div>
                {hoveredRisk.category && (
                  <div className="tooltip-cat">Category: {hoveredRisk.category?.value || hoveredRisk.category}</div>
                )}
              </div>
            )}
          </div>

          {/* Matrix Legend Row */}
          <div className="matrix-legend-row">
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: '700' }}>SEVERITY LEGEND:</span>
            <div className="legend-item" onClick={() => setRiskFilter('CRITICAL')} style={{ cursor: 'pointer' }}>
              <span className="legend-dot dot-critical"></span>
              <span>Critical ({criticalCount})</span>
            </div>
            <div className="legend-item" onClick={() => setRiskFilter('HIGH')} style={{ cursor: 'pointer' }}>
              <span className="legend-dot dot-high"></span>
              <span>High ({highCount})</span>
            </div>
            <div className="legend-item" onClick={() => setRiskFilter('MEDIUM')} style={{ cursor: 'pointer' }}>
              <span className="legend-dot dot-medium"></span>
              <span>Medium ({mediumCount})</span>
            </div>
            <div className="legend-item" onClick={() => setRiskFilter('LOW')} style={{ cursor: 'pointer' }}>
              <span className="legend-dot dot-low"></span>
              <span>Low ({lowCount})</span>
            </div>
          </div>

          {/* Selected Risk Inspector Card */}
          {selectedRisk && (
            <div className="matrix-selected-inspector" style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`risk-tag ${getRiskSeverityClass(selectedRisk.cleanLevel)}`}>
                    {selectedRisk.cleanLevel}
                  </span>
                  <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.92rem' }}>
                    {selectedRisk.displayId}: {selectedRisk.title}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-icon-close"
                  onClick={() => setSelectedRisk(null)}
                  title="Close Inspector"
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                {selectedRisk.reason}
              </p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                <span>🎯 Probability: <strong style={{ color: '#38bdf8' }}>{selectedRisk.calcProb}%</strong></span>
                <span>💥 Impact: <strong style={{ color: '#f87171' }}>{selectedRisk.calcImpact}%</strong></span>
                {selectedRisk.source_document && (
                  <span style={{ color: 'var(--text-dim)' }}>📄 Provenance: {selectedRisk.source_document}</span>
                )}
              </div>
              {selectedRisk.suggested_mitigation && (
                <div className="risk-mitigation-box" style={{ marginTop: '10px' }}>
                  🛡️ <strong>Suggested Mitigation:</strong> {selectedRisk.suggested_mitigation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PROJECT HEALTH SUMMARY */}
        <div className="card-panel health-summary-panel">
          <div className="widget-header">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
              🩺 Project Health Summary
            </h3>
            <span className={`status-pill ${getStatusClass(health.health_status)}`}>
              {health.health_status || 'Evaluating'}
            </span>
          </div>

          {/* Radial Circular Health Gauge Showcase */}
          <div className="health-score-showcase">
            <div className="health-gauge-wrapper">
              <svg width="110" height="110" viewBox="0 0 110 110" className="health-gauge-svg">
                {/* Background Ring Track */}
                <circle
                  cx="55"
                  cy="55"
                  r="45"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                />
                {/* Progress Ring */}
                <circle
                  cx="55"
                  cy="55"
                  r="45"
                  fill="none"
                  stroke={
                    (health.overall_health_score || 0) >= 80 ? '#10b981' : (health.overall_health_score || 0) >= 60 ? '#f59e0b' : '#ef4444'
                  }
                  strokeWidth="8"
                  strokeDasharray="282.74"
                  strokeDashoffset={282.74 * (1 - Math.min(100, health.overall_health_score || 0) / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div className="health-gauge-inner">
                <span className="health-big-score">{Math.round(health.overall_health_score || 0)}</span>
                <span className="health-big-total">/100</span>
              </div>
            </div>

            <div className="health-showcase-details">
              <h4 style={{ fontSize: '1.02rem', color: '#ffffff', fontWeight: '700' }}>
                {health.overall_health_score >= 80 ? 'Optimal Project Health' : health.overall_health_score >= 60 ? 'Moderate Project Health' : 'Critical Health Alert'}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.45' }}>
                Composite index derived across Scope Boundary Completeness, Delivery Timeline Risk, and Blocker Impediments.
              </p>
            </div>
          </div>

          {/* Progress Bars for 3 Diagnostic Health Dimensions */}
          <div className="dimension-bar-list" style={{ marginTop: '18px' }}>
            {/* Dimension 1: Scope Clarity */}
            <div className="dim-row">
              <div className="dim-header-row">
                <span className="dim-name">🎯 Scope Clarity</span>
                <span className="dim-val" style={{ color: '#22d3ee' }}>{Math.round(health.scope_clarity_score || 0)}%</span>
              </div>
              <div className="dim-bar-track">
                <div
                  className="dim-bar-fill fill-cyan"
                  style={{ width: `${Math.min(100, health.scope_clarity_score || 0)}%` }}
                ></div>
              </div>
              <div className="dim-sub-note">100% boundary definition and requirement coverage</div>
            </div>

            {/* Dimension 2: Timeline Risk */}
            <div className="dim-row">
              <div className="dim-header-row">
                <span className="dim-name">⏱️ Timeline Risk</span>
                <span className="dim-val" style={{ color: '#fbbf24' }}>{Math.round(health.timeline_risk_score || 0)}%</span>
              </div>
              <div className="dim-bar-track">
                <div
                  className="dim-bar-fill fill-amber"
                  style={{ width: `${Math.min(100, health.timeline_risk_score || 0)}%` }}
                ></div>
              </div>
              <div className="dim-sub-note">Schedule feasibility: slippage risk at {Math.round(slippageProb * 100)}%</div>
            </div>

            {/* Dimension 3: Blocker Severity */}
            <div className="dim-row">
              <div className="dim-header-row">
                <span className="dim-name">🛑 Blocker Severity</span>
                <span className="dim-val" style={{ color: '#f87171' }}>{Math.round(health.blocker_score || 0)}%</span>
              </div>
              <div className="dim-bar-track">
                <div
                  className="dim-bar-fill fill-rose"
                  style={{ width: `${Math.min(100, health.blocker_score || 0)}%` }}
                ></div>
              </div>
              <div className="dim-sub-note">{activeBlockers.length} active impediments impacting milestones</div>
            </div>
          </div>

          {/* Delivery Timeline Forecast Box */}
          <div className="forecast-summary-box" style={{ marginTop: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#e2e8f0' }}>
                Delivery Forecast
              </span>
              <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '700' }}>
                Slippage Prob: {Math.round(slippageProb * 100)}%
              </span>
            </div>
            {(forecast.key_forecast_factors || forecast.forecast_factors) && (forecast.key_forecast_factors || forecast.forecast_factors).length > 0 ? (
              <ul className="dashboard-bullet-list" style={{ marginTop: '8px' }}>
                {(forecast.key_forecast_factors || forecast.forecast_factors).slice(0, 3).map((factor, i) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Milestone schedules aligned with projected delivery dates.
              </p>
            )}
          </div>

          {/* Executive Summary */}
          {dashboardData?.executive_summary && (
            <div className="exec-mini-summary" style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: '700' }}>
                Executive Synthesis
              </div>
              <p style={{ fontSize: '0.83rem', color: '#cbd5e1', marginTop: '4px', lineHeight: '1.45' }}>
                {dashboardData.executive_summary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. BELOW SECTIONS: TOP RISKS, ACTIVE BLOCKERS, PENDING ACTION ITEMS, PROJECT SCOPE SUMMARY */}
      <div className="dashboard-columns-grid" style={{ marginTop: '20px' }}>
        {/* Left Column: Top Risks & Active Blockers */}
        <div className="dashboard-col">
          {/* Section: Top Risks */}
          <div className="card-panel widget-panel">
            <div className="widget-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3>⚠️ Top Risks</h3>
                <span className="badge-count">{detectedRisks.length} Extracted</span>
              </div>
              <div className="risk-filter-chips">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                  <button
                    key={lvl}
                    className={`filter-chip ${riskFilter === lvl ? 'active' : ''}`}
                    onClick={() => setRiskFilter(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {filteredEnrichedRisks.length > 0 ? (
              <div className="risks-list">
                {filteredEnrichedRisks.map((risk, idx) => (
                  <div key={idx} className="risk-item-card">
                    <div className="risk-item-top">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`risk-tag ${getRiskSeverityClass(risk.cleanLevel)}`}>
                          {risk.cleanLevel}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: '700' }}>
                          {risk.displayId}
                        </span>
                      </div>
                      <span className="risk-cat-label">{risk.category?.value || risk.category || 'Operational'}</span>
                    </div>

                    <h4 className="risk-title">{risk.title}</h4>
                    <p className="risk-reason">{risk.reason}</p>

                    <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>Probability: <strong style={{ color: '#38bdf8' }}>{risk.calcProb}%</strong></span>
                      <span>Impact: <strong style={{ color: '#f87171' }}>{risk.calcImpact}%</strong></span>
                    </div>

                    {risk.suggested_mitigation && (
                      <div className="risk-mitigation-box">
                        🛡️ <strong>Mitigation:</strong> {risk.suggested_mitigation}
                      </div>
                    )}

                    {risk.source_document && (
                      <div className="source-ref">📄 Source: {risk.source_document}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-substate">
                {riskFilter === 'ALL'
                  ? 'No risks detected in current project artifacts.'
                  : `No ${riskFilter} risks found.`}
              </div>
            )}
          </div>

          {/* Section: Active Blockers */}
          <div className="card-panel widget-panel">
            <div className="widget-header">
              <h3 style={{ color: '#fda4af' }}>🛑 Active Blockers</h3>
              <span className="badge-count" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f87171' }}>
                {activeBlockers.length} Active
              </span>
            </div>

            {activeBlockers.length > 0 ? (
              <div className="blocker-list">
                {activeBlockers.map((b, idx) => (
                  <div key={idx} className="blocker-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`risk-tag ${getRiskSeverityClass(b.severity?.value || b.severity)}`}>
                        {b.severity?.value || b.severity || 'HIGH'} SEVERITY
                      </span>
                      {b.category && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.category}</span>}
                    </div>
                    <p className="blocker-desc">{b.description}</p>
                    {b.impact && (
                      <div className="blocker-impact">
                        <strong>Impact:</strong> {b.impact}
                      </div>
                    )}
                    {b.source_document && (
                      <div className="source-ref">📄 Source: {b.source_document}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-substate">
                ✅ No active blockers detected in project knowledge base.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pending Action Items & Project Scope Summary */}
        <div className="dashboard-col">
          {/* Section: Pending Action Items */}
          <div className="card-panel widget-panel">
            <div className="widget-header">
              <h3>✅ Pending Action Items</h3>
              <span className="badge-count">{actionItems.length} Tasks</span>
            </div>

            {actionItems.length > 0 ? (
              <div className="action-items-list">
                {actionItems.map((item, idx) => (
                  <div key={idx} className="action-item-row">
                    <div className="action-checkbox">✓</div>
                    <div className="action-details">
                      <div className="action-desc">{item.task_description}</div>
                      <div className="action-meta">
                        <span>👤 <strong>{item.assignee || 'Unassigned'}</strong></span>
                        {item.due_date && <span>📅 Due: {item.due_date}</span>}
                        {item.priority && (
                          <span className={`priority-tag tag-${(item.priority || '').toLowerCase()}`}>
                            {item.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {blockersActions?.empty_actions_message || 'No pending action items identified in documents.'}
              </p>
            )}
          </div>

          {/* Section: Project Scope Summary */}
          <div className="card-panel widget-panel">
            <div className="widget-header">
              <h3>🎯 Project Scope Summary</h3>
              <span className="badge-count">{deliverables.length} Deliverables</span>
            </div>

            {/* Goals */}
            <div className="widget-subsection">
              <h4 className="widget-subtitle">Project Goals</h4>
              {goals.length > 0 ? (
                <div className="goal-list">
                  {goals.map((g, i) => (
                    <div key={i} className="goal-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="goal-category-tag">{g.category || 'Goal'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{g.goal_id || `#${i + 1}`}</span>
                      </div>
                      <p className="goal-text">{g.statement}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {scope?.empty_goals_message || 'No explicit goals detected in current documents.'}
                </p>
              )}
            </div>

            {/* Deliverables Table */}
            <div className="widget-subsection">
              <h4 className="widget-subtitle">Deliverables &amp; Milestones</h4>
              {deliverables.length > 0 ? (
                <div className="table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Deliverable</th>
                        <th>Owner</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliverables.map((d, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '500' }}>{d.name}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{d.owner || 'Unassigned'}</td>
                          <td>
                            <span className={`status-pill ${getStatusClass(d.status)}`}>
                              {d.status || 'Planned'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No deliverables extracted yet.</p>
              )}
            </div>

            {/* Scope Boundaries */}
            {(boundaries?.in_scope?.length > 0 || boundaries?.out_of_scope?.length > 0) && (
              <div className="widget-subsection">
                <h4 className="widget-subtitle">Scope Boundaries</h4>
                <div className="boundaries-grid">
                  {boundaries?.in_scope?.length > 0 && (
                    <div className="boundary-col in-scope">
                      <span className="boundary-title">✅ In Scope</span>
                      <ul>
                        {boundaries.in_scope.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {boundaries?.out_of_scope?.length > 0 && (
                    <div className="boundary-col out-scope">
                      <span className="boundary-title">🚫 Out of Scope</span>
                      <ul>
                        {boundaries.out_of_scope.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Key Strategic Recommendations */}
          {recommendations.length > 0 && (
            <div className="card-panel widget-panel">
              <div className="widget-header">
                <h3>💡 Key Recommendations</h3>
                <span className="badge-count">{recommendations.length} Actions</span>
              </div>
              <div className="rec-list">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="rec-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`priority-tag tag-${(rec.priority || 'medium').toLowerCase()}`}>
                        {rec.priority || 'Medium'} Priority
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Target: {rec.target_owner || 'Project Team'}
                      </span>
                    </div>
                    <p className="rec-action-text">{rec.action}</p>
                    {rec.category && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        Category: {rec.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
