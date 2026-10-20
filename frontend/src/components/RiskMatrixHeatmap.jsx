import React, { useState, useMemo, useCallback } from 'react';
import { DEFAULT_THRESHOLDS, PROBABILITY_LABELS, IMPACT_LABELS } from './riskConstants';

export default function RiskMatrixHeatmap({ risksData, onRefresh }) {
  // Primary view mode: 'SCATTER' matches media screenshot, 'GRID' provides 5x5 tabular matrix
  const [viewMode, setViewMode] = useState('SCATTER');

  // Filters & Search
  const [currentFilter, setCurrentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected risk for inspector drawer / modal
  const [selectedRisk, setSelectedRisk] = useState(null);

  // Hovered risk for floating SVG tooltip
  const [hoveredRisk, setHoveredRisk] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 5x5 Heatmap Grid Thresholds
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  // Extract raw detected risks list & forecast data
  const detectedRisks = useMemo(() => {
    if (!risksData) return [];
    if (Array.isArray(risksData)) return risksData;
    if (Array.isArray(risksData.detected_risks)) return risksData.detected_risks;
    if (Array.isArray(risksData.risks)) return risksData.risks;
    return [];
  }, [risksData]);

  const slippageProb = useMemo(() => {
    if (!risksData) return 0.35;
    if (risksData.forecast && typeof risksData.forecast.slippage_probability === 'number') {
      return risksData.forecast.slippage_probability;
    }
    return 0.35;
  }, [risksData]);

  // Enrich detected risks with continuous (0-100) coordinates for scatter plot
  const enrichedRisks = useMemo(() => {
    return detectedRisks.map((r, idx) => {
      const lvl = (r.level?.value || r.level || r.severity || 'MEDIUM').toUpperCase();

      // Check for explicit probability or impact score (0-1 float or 1-100 integer)
      let explicitProb = null;
      if (typeof r.probability === 'number') {
        explicitProb = r.probability <= 1 ? r.probability * 100 : r.probability;
      } else if (typeof r.probability_rating === 'number') {
        explicitProb = (r.probability_rating / 5) * 100;
      }

      let explicitImpact = null;
      if (typeof r.impact_score === 'number') {
        explicitImpact = r.impact_score <= 1 ? r.impact_score * 100 : r.impact_score;
      } else if (typeof r.impact_rating === 'number') {
        explicitImpact = (r.impact_rating / 5) * 100;
      }

      // Consistent pseudo-random hash jitter to prevent overlapping bubbles
      const seedStr = (r.risk_id || '') + (r.title || '') + (r.reason || '') + idx;
      let hash = idx * 37;
      for (let i = 0; i < seedStr.length; i++) {
        hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
        hash |= 0;
      }
      const absHash = Math.abs(hash);
      const jitterX = ((absHash % 19) - 9) * 0.9;
      const jitterY = (((Math.floor(absHash / 19)) % 19) - 9) * 0.9;

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
      } else {
        baseProb = 24;
        baseImpact = 26;
      }

      const prob = explicitProb !== null
        ? Math.round(explicitProb)
        : Math.max(12, Math.min(94, Math.round(baseProb + jitterX)));

      const impact = explicitImpact !== null
        ? Math.round(explicitImpact)
        : Math.max(12, Math.min(94, Math.round(baseImpact + jitterY)));

      // Discrete 1-5 ratings for the 5x5 tabular grid
      const discreteP = r.probability_rating || Math.min(5, Math.max(1, Math.round((prob / 100) * 4) + 1));
      const discreteI = r.impact_rating || Math.min(5, Math.max(1, Math.round((impact / 100) * 4) + 1));

      return {
        ...r,
        cleanLevel: lvl,
        calcProb: prob,
        calcImpact: impact,
        discreteProb: discreteP,
        discreteImpact: discreteI,
        displayId: r.risk_id || `RSK-${String(idx + 1).padStart(3, '0')}`,
        title: r.title || 'Identified Risk Signal',
        reason: r.reason || 'Extracted from project charter or risk logs.',
        suggested_mitigation: r.suggested_mitigation || r.mitigation_strategy || 'Review dependencies and allocate contingency reserve.',
        category: (r.category?.value || r.category || 'General').toUpperCase(),
      };
    });
  }, [detectedRisks, slippageProb]);

  // Counts by severity
  const criticalCount = useMemo(() => enrichedRisks.filter(r => r.cleanLevel === 'CRITICAL').length, [enrichedRisks]);
  const highCount = useMemo(() => enrichedRisks.filter(r => r.cleanLevel === 'HIGH').length, [enrichedRisks]);
  const mediumCount = useMemo(() => enrichedRisks.filter(r => r.cleanLevel === 'MEDIUM').length, [enrichedRisks]);
  const lowCount = useMemo(() => enrichedRisks.filter(r => r.cleanLevel === 'LOW').length, [enrichedRisks]);

  // Filtered risks for display
  const filteredRisks = useMemo(() => {
    let list = enrichedRisks;
    if (currentFilter !== 'ALL') {
      list = list.filter(r => r.cleanLevel === currentFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        r.displayId.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [enrichedRisks, currentFilter, searchQuery]);

  // Severity color helpers
  const getSeverityColor = (lvl) => {
    switch ((lvl || '').toUpperCase()) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#06b6d4';
      case 'LOW': return '#10b981';
      default: return '#6366f1';
    }
  };

  // SVG Scatter layout dimensions (matching exact media proportions)
  const SVG_WIDTH = 640;
  const SVG_HEIGHT = 400;
  const MARGIN_LEFT = 60;
  const MARGIN_RIGHT = 30;
  const MARGIN_TOP = 25;
  const MARGIN_BOTTOM = 45;
  const PLOT_WIDTH = SVG_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const PLOT_HEIGHT = SVG_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  const getSvgX = useCallback((prob) => MARGIN_LEFT + (prob / 100) * PLOT_WIDTH, [PLOT_WIDTH]);
  const getSvgY = useCallback((impact) => MARGIN_TOP + ((100 - impact) / 100) * PLOT_HEIGHT, [PLOT_HEIGHT]);

  // 5x5 Heatmap Grid Matrix generator
  const getSeverityForScore = useCallback((score) => {
    if (score <= thresholds.lowMax) return 'LOW';
    if (score <= thresholds.medMax) return 'MEDIUM';
    if (score <= thresholds.highMax) return 'HIGH';
    return 'CRITICAL';
  }, [thresholds]);

  const matrixGrid = useMemo(() => {
    const grid = [];
    for (let p = 5; p >= 1; p--) {
      const row = { probability: p, cells: [] };
      for (let i = 1; i <= 5; i++) {
        const score = p * i;
        const matchingRisks = enrichedRisks.filter(r => r.discreteProb === p && r.discreteImpact === i);
        row.cells.push({
          probability: p,
          impact: i,
          score,
          severity: getSeverityForScore(score),
          risks: matchingRisks,
        });
      }
      grid.push(row);
    }
    return grid;
  }, [enrichedRisks, getSeverityForScore]);

  return (
    <div className="card-panel matrix-panel" style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header with Title, Count Badge, Subtitle & View Switcher */}
      <div className="matrix-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              🎯 Risk Priority Matrix
            </h3>
            <span className="badge-count" style={{ letterSpacing: '0.02em' }}>
              {filteredRisks.length} Plotted
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            interactive Scatter Bubble Graph: Probability (X-axis) vs. Impact (Y-axis)
          </p>
        </div>

        {/* Action Controls: View Mode Switcher & Severity Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setViewMode('SCATTER')}
              style={{
                background: viewMode === 'SCATTER' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'SCATTER' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🔘 Scatter Graph
            </button>
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              style={{
                background: viewMode === 'GRID' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'GRID' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ▦ 5×5 Grid
            </button>
          </div>

          {/* Severity Filter Buttons (Exact styling from media screenshot) */}
          <div className="matrix-filter-buttons">
            {[
              { id: 'ALL', label: 'All', count: enrichedRisks.length },
              { id: 'CRITICAL', label: 'Critical', count: criticalCount },
              { id: 'HIGH', label: 'High', count: highCount },
              { id: 'MEDIUM', label: 'Medium', count: mediumCount },
              { id: 'LOW', label: 'Low', count: lowCount },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={`matrix-filter-btn filter-btn-${item.id.toLowerCase()} ${currentFilter === item.id ? 'active' : ''}`}
                onClick={() => setCurrentFilter(item.id)}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>

          {onRefresh && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRefresh}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              title="Refresh Risk Matrix"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      {/* 2. Primary View: Interactive Scatter Bubble Graph (Media Screenshot View) */}
      {viewMode === 'SCATTER' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Scatter Canvas Wrapper */}
          <div
            className="matrix-canvas-wrapper"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '100%',
              height: '420px',
              padding: '10px',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="matrix-svg-graph"
              style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
            >
              <defs>
                {/* Quadrant Gradient Backgrounds */}
                <linearGradient id="gradTopRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="gradTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.03" />
                </linearGradient>
                <linearGradient id="gradBottomRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.11" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.03" />
                </linearGradient>
                <linearGradient id="gradBottomLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>

                {/* Glow Filters for Risk Bubbles */}
                <filter id="glowCritical" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glowHigh" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glowMedium" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glowLow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 4 Quadrants Background Areas */}
              <rect x={getSvgX(50)} y={MARGIN_TOP} width={PLOT_WIDTH / 2} height={PLOT_HEIGHT / 2} fill="url(#gradTopRight)" rx="4" />
              <rect x={MARGIN_LEFT} y={MARGIN_TOP} width={PLOT_WIDTH / 2} height={PLOT_HEIGHT / 2} fill="url(#gradTopLeft)" rx="4" />
              <rect x={getSvgX(50)} y={getSvgY(50)} width={PLOT_WIDTH / 2} height={PLOT_HEIGHT / 2} fill="url(#gradBottomRight)" rx="4" />
              <rect x={MARGIN_LEFT} y={getSvgY(50)} width={PLOT_WIDTH / 2} height={PLOT_HEIGHT / 2} fill="url(#gradBottomLeft)" rx="4" />

              {/* Quadrant Watermark Labels (Exact text from media screenshot) */}
              <text x={getSvgX(75)} y={MARGIN_TOP + 18} textAnchor="middle" fill="rgba(244, 63, 94, 0.75)" fontSize="10" fontWeight="700" letterSpacing="0.5">
                CRITICAL ACTION ZONE
              </text>
              <text x={getSvgX(25)} y={MARGIN_TOP + 18} textAnchor="middle" fill="rgba(245, 158, 11, 0.75)" fontSize="10" fontWeight="700" letterSpacing="0.5">
                HIGH IMPACT / CONTINGENCY
              </text>
              <text x={getSvgX(75)} y={MARGIN_TOP + PLOT_HEIGHT - 12} textAnchor="middle" fill="rgba(6, 182, 212, 0.75)" fontSize="10" fontWeight="700" letterSpacing="0.5">
                HIGH PROB / MITIGATE
              </text>
              <text x={getSvgX(25)} y={MARGIN_TOP + PLOT_HEIGHT - 12} textAnchor="middle" fill="rgba(16, 185, 129, 0.75)" fontSize="10" fontWeight="700" letterSpacing="0.5">
                ROUTINE MONITORING
              </text>

              {/* Grid lines for Y (Impact) */}
              {[0, 25, 50, 75, 100].map(tick => {
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
                    <text x={MARGIN_LEFT - 8} y={y + 3.5} textAnchor="end" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {/* Grid lines for X (Probability) */}
              {[0, 25, 50, 75, 100].map(tick => {
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
                    <text x={x} y={MARGIN_TOP + PLOT_HEIGHT + 16} textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {/* Solid Axes */}
              <line x1={MARGIN_LEFT} y1={MARGIN_TOP} x2={MARGIN_LEFT} y2={MARGIN_TOP + PLOT_HEIGHT} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
              <line x1={MARGIN_LEFT} y1={MARGIN_TOP + PLOT_HEIGHT} x2={MARGIN_LEFT + PLOT_WIDTH} y2={MARGIN_TOP + PLOT_HEIGHT} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />

              {/* Axes Titles */}
              <text x={-(MARGIN_TOP + PLOT_HEIGHT / 2)} y="18" transform="rotate(-90)" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="700" letterSpacing="1">
                ▲ IMPACT
              </text>
              <text x={MARGIN_LEFT + PLOT_WIDTH / 2} y={MARGIN_TOP + PLOT_HEIGHT + 34} textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="700" letterSpacing="1">
                PROBABILITY ►
              </text>

              {/* Plotted Risk Nodes */}
              {filteredRisks.map((risk, idx) => {
                const cx = getSvgX(risk.calcProb);
                const cy = getSvgY(risk.calcImpact);
                const color = getSeverityColor(risk.cleanLevel);
                const baseRadius = risk.cleanLevel === 'CRITICAL' ? 12 : (risk.cleanLevel === 'HIGH' ? 10.5 : (risk.cleanLevel === 'MEDIUM' ? 9 : 8));
                const filterId = risk.cleanLevel === 'CRITICAL' ? 'glowCritical' : (risk.cleanLevel === 'HIGH' ? 'glowHigh' : (risk.cleanLevel === 'LOW' ? 'glowLow' : 'glowMedium'));
                const isSelected = selectedRisk && selectedRisk.displayId === risk.displayId;

                return (
                  <g
                    key={risk.displayId || idx}
                    className="risk-svg-node"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedRisk(risk)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredRisk(risk);
                      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                    }}
                    onMouseLeave={() => setHoveredRisk(null)}
                  >
                    {/* Outer Halo ring for High & Critical */}
                    {(risk.cleanLevel === 'CRITICAL' || risk.cleanLevel === 'HIGH' || isSelected) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={baseRadius + (isSelected ? 7 : 5)}
                        fill="none"
                        stroke={color}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        strokeOpacity={isSelected ? 0.8 : 0.4}
                      />
                    )}

                    {/* Main Node Bubble */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={baseRadius}
                      fill={color}
                      filter={`url(#${filterId})`}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2.2 : 1.2}
                      strokeOpacity="0.9"
                    />

                    {/* Monospace Risk Identifier Text (Exact style from screenshot) */}
                    <text
                      x={cx + baseRadius + 5}
                      y={cy + 3.5}
                      fill="#f8fafc"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="600"
                      style={{ pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                    >
                      {risk.displayId}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Popup */}
            {hoveredRisk && (
              <div
                className="matrix-hover-tooltip"
                style={{
                  position: 'fixed',
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y - 12}px`,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 9999,
                  pointerEvents: 'none',
                }}
              >
                <div className="tooltip-header">
                  <span style={{ fontWeight: '800', color: getSeverityColor(hoveredRisk.cleanLevel), fontSize: '0.82rem' }}>
                    {hoveredRisk.displayId}
                  </span>
                  <span
                    style={{
                      background: getSeverityColor(hoveredRisk.cleanLevel),
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {hoveredRisk.cleanLevel}
                  </span>
                </div>
                <div className="tooltip-title">{hoveredRisk.title}</div>
                <div className="tooltip-metrics">
                  <span>Probability: <strong style={{ color: '#ffffff' }}>{hoveredRisk.calcProb}%</strong></span>
                  <span>Impact: <strong style={{ color: '#ffffff' }}>{hoveredRisk.calcImpact}%</strong></span>
                </div>
                <div className="tooltip-cat">Category: {hoveredRisk.category}</div>
              </div>
            )}
          </div>

          {/* Severity Legend Row (Exact layout from screenshot) */}
          <div className="matrix-legend-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: '700', letterSpacing: '0.04em' }}>
              SEVERITY LEGEND:
            </span>
            <div className="legend-item" style={{ cursor: 'pointer' }} onClick={() => setCurrentFilter('CRITICAL')}>
              <span className="legend-dot dot-critical" />
              <span>Critical ({criticalCount})</span>
            </div>
            <div className="legend-item" style={{ cursor: 'pointer' }} onClick={() => setCurrentFilter('HIGH')}>
              <span className="legend-dot dot-high" />
              <span>High ({highCount})</span>
            </div>
            <div className="legend-item" style={{ cursor: 'pointer' }} onClick={() => setCurrentFilter('MEDIUM')}>
              <span className="legend-dot dot-medium" />
              <span>Medium ({mediumCount})</span>
            </div>
            <div className="legend-item" style={{ cursor: 'pointer' }} onClick={() => setCurrentFilter('LOW')}>
              <span className="legend-dot dot-low" />
              <span>Low ({lowCount})</span>
            </div>
          </div>

          {/* Selected Risk Inspector Card (when node is clicked) */}
          {selectedRisk && (
            <div
              className="matrix-selected-inspector"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: `1px solid ${getSeverityColor(selectedRisk.cleanLevel)}`,
                borderRadius: '8px',
                padding: '16px',
                marginTop: '10px',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      background: getSeverityColor(selectedRisk.cleanLevel),
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {selectedRisk.cleanLevel}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.95rem', color: '#93c5fd' }}>
                    {selectedRisk.displayId}
                  </span>
                  <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{selectedRisk.title}</strong>
                </div>
                <button
                  type="button"
                  className="btn-icon-close"
                  onClick={() => setSelectedRisk(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.82rem', marginBottom: '12px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Category:</span> <strong style={{ color: '#e2e8f0' }}>{selectedRisk.category}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Probability:</span> <strong style={{ color: '#38bdf8' }}>{selectedRisk.calcProb}%</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Impact Score:</span> <strong style={{ color: '#f87171' }}>{selectedRisk.calcImpact}%</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>5×5 Matrix Cell:</span> <strong style={{ color: '#fde047' }}>P{selectedRisk.discreteProb} × I{selectedRisk.discreteImpact}</strong></div>
              </div>

              <div style={{ fontSize: '0.84rem', color: '#e2e8f0', marginBottom: '8px' }}>
                <strong style={{ color: '#fda4af' }}>Trigger / Reason: </strong>
                {selectedRisk.reason}
              </div>

              <div style={{ fontSize: '0.84rem', color: '#a7f3d0' }}>
                <strong style={{ color: '#34d399' }}>Recommended Mitigation: </strong>
                {selectedRisk.suggested_mitigation}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 3. Secondary View: 5×5 Matrix Heatmap Grid */
        <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
          {/* Threshold Config Toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowThresholdConfig(!showThresholdConfig)}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              ⚙️ {showThresholdConfig ? 'Hide Threshold Config' : 'Configure Severity Thresholds'}
            </button>
          </div>

          {showThresholdConfig && (
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '10px' }}>
                Adjust 5×5 Score Cutoffs (P × I from 1 to 25):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#86efac', marginBottom: '4px' }}>Low Max Score ({thresholds.lowMax}):</label>
                  <input
                    type="range"
                    min="1"
                    max={thresholds.medMax - 1}
                    value={thresholds.lowMax}
                    onChange={(e) => setThresholds({ ...thresholds, lowMax: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#fde047', marginBottom: '4px' }}>Medium Max Score ({thresholds.medMax}):</label>
                  <input
                    type="range"
                    min={thresholds.lowMax + 1}
                    max={thresholds.highMax - 1}
                    value={thresholds.medMax}
                    onChange={(e) => setThresholds({ ...thresholds, medMax: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#fdba74', marginBottom: '4px' }}>High Max Score ({thresholds.highMax}):</label>
                  <input
                    type="range"
                    min={thresholds.medMax + 1}
                    max="24"
                    value={thresholds.highMax}
                    onChange={(e) => setThresholds({ ...thresholds, highMax: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5x5 Grid Table */}
          <div style={{ minWidth: '700px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '0.88rem', color: '#93c5fd', marginBottom: '8px' }}>
              IMPACT → (1 = Very Low, 2 = Low, 3 = Moderate, 4 = High, 5 = Very High)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '140px repeat(5, 1fr)', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Prob ↓ / Impact →
              </div>

              {[1, 2, 3, 4, 5].map((col) => (
                <div key={col} style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '6px', textAlign: 'center', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '700', color: '#ffffff' }}>{col}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{IMPACT_LABELS[col]}</div>
                </div>
              ))}

              {matrixGrid.map((row) => (
                <React.Fragment key={row.probability}>
                  <div style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '8px', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#ffffff' }}>
                      {row.probability} - {PROBABILITY_LABELS[row.probability]}
                    </div>
                  </div>

                  {row.cells.map((cell) => {
                    const color = getSeverityColor(cell.severity);
                    const isSelected = selectedCell && selectedCell.probability === cell.probability && selectedCell.impact === cell.impact;
                    return (
                      <div
                        key={`${cell.probability}-${cell.impact}`}
                        onClick={() => setSelectedCell(cell)}
                        style={{
                          background: `${color}25`,
                          border: isSelected ? '2px solid #ffffff' : `1px solid ${color}60`,
                          borderRadius: '6px',
                          padding: '8px',
                          minHeight: '65px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                          <span style={{ fontWeight: '700', color }}>{cell.score}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{cell.severity}</span>
                        </div>
                        {cell.risks.length > 0 ? (
                          <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '0.92rem', color: '#ffffff' }}>
                            {cell.risks.length} Risk{cell.risks.length > 1 ? 's' : ''}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>—</div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Selected Cell Modal/Drawer in Grid View */}
          {selectedCell && selectedCell.risks.length > 0 && (
            <div style={{ marginTop: '16px', background: 'rgba(15, 23, 42, 0.9)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                  Risks at Probability {selectedCell.probability} × Impact {selectedCell.impact} (Score: {selectedCell.score})
                </strong>
                <button type="button" onClick={() => setSelectedCell(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCell.risks.map((r, i) => (
                  <div key={i} style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: '700', color: getSeverityColor(r.cleanLevel) }}>[{r.displayId}] {r.title}</div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}>{r.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
