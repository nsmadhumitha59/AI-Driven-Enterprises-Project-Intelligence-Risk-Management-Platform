import React, { useState, useEffect } from 'react';
import { runBlockerAgent } from '../services/api';

export default function BlockersActionsView({ initialBlockersData }) {
  const [data, setData] = useState(initialBlockersData || null);
  const [isLoading, setIsLoading] = useState(!initialBlockersData);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSection, setActiveSection] = useState('blockers'); // 'blockers', 'decisions', 'issues', 'actions'
  const [filterQuery, setFilterQuery] = useState('');

  const fetchBlockers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await runBlockerAgent();
      setData(res);
    } catch (err) {
      console.error('Error fetching blocker data:', err);
      setErrorMessage(err.message || 'Failed to extract blockers and actions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialBlockersData) {
      fetchBlockers();
    } else {
      setData(initialBlockersData);
    }
  }, [initialBlockersData]);

  if (isLoading) {
    return (
      <div className="card-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="dashboard-spinner">🛑</div>
        <h3 style={{ marginTop: '18px', color: '#ffffff' }}>Running Blocker &amp; Action Item Identification Agent...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
          Extracting active delivery blockers, pending architectural decisions, open issues, and action items
        </p>
      </div>
    );
  }

  const blockers = data?.active_blockers || data?.blockers || [];
  const decisions = data?.pending_decisions || [];
  const issues = data?.unresolved_issues || data?.issues || [];
  const actionItems = data?.action_items || [];

  const getPriorityBadgeClass = (p) => {
    const val = (p || '').toLowerCase();
    if (val.includes('critical') || val.includes('high')) return 'tag-high';
    if (val.includes('medium')) return 'tag-medium';
    return 'tag-low';
  };

  return (
    <div className="blockers-actions-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Navigation Bar */}
      <div className="card-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em' }}>
                🛑 Blockers, Decisions &amp; Action Items
              </h2>
              <span className="badge-count" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                {blockers.length} Active Blockers
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Distinct classification of critical impediments, pending governance decisions, unresolved issues, and assigned delivery action items
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              onClick={fetchBlockers}
            >
              🔄 Refresh Blockers
            </button>
          </div>
        </div>

        {/* 4 Section Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button
            onClick={() => setActiveSection('blockers')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: '700',
              background: activeSection === 'blockers' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.6)',
              color: activeSection === 'blockers' ? '#fca5a5' : 'var(--text-muted)',
              border: `1px solid ${activeSection === 'blockers' ? '#ef4444' : 'var(--border-color)'}`,
              cursor: 'pointer',
            }}
          >
            🛑 Active Blockers ({blockers.length})
          </button>
          <button
            onClick={() => setActiveSection('decisions')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: '700',
              background: activeSection === 'decisions' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.6)',
              color: activeSection === 'decisions' ? '#fde047' : 'var(--text-muted)',
              border: `1px solid ${activeSection === 'decisions' ? '#f59e0b' : 'var(--border-color)'}`,
              cursor: 'pointer',
            }}
          >
            ⚖️ Pending Decisions ({decisions.length})
          </button>
          <button
            onClick={() => setActiveSection('issues')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: '700',
              background: activeSection === 'issues' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(15, 23, 42, 0.6)',
              color: activeSection === 'issues' ? '#c4b5fd' : 'var(--text-muted)',
              border: `1px solid ${activeSection === 'issues' ? '#8b5cf6' : 'var(--border-color)'}`,
              cursor: 'pointer',
            }}
          >
            🔍 Unresolved Issues ({issues.length})
          </button>
          <button
            onClick={() => setActiveSection('actions')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: '700',
              background: activeSection === 'actions' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.6)',
              color: activeSection === 'actions' ? '#86efac' : 'var(--text-muted)',
              border: `1px solid ${activeSection === 'actions' ? '#10b981' : 'var(--border-color)'}`,
              cursor: 'pointer',
            }}
          >
            ✅ Action Items ({actionItems.length})
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="card-panel banner-error">
          ⚠️ <strong>Blocker Agent Error:</strong> {errorMessage}
        </div>
      )}

      {/* 2. SECTION A: ACTIVE BLOCKERS */}
      {activeSection === 'blockers' && (
        <div className="card-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
                🛑 Active Delivery Blockers
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Direct impediments currently stopping or threatening development velocity and milestone completion
              </p>
            </div>
          </div>

          {blockers.length === 0 ? (
            <div className="empty-substate">
              🎉 No active delivery blockers detected in uploaded documents!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {blockers.map((b, idx) => (
                <div
                  key={b.blocker_id || idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderLeft: '4px solid #ef4444',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#f87171' }}>
                        {b.blocker_id || `BLK-${idx + 1}`}
                      </span>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                        {b.title || b.description || 'Critical Delivery Impediment'}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        }}
                      >
                        {b.severity || 'Critical'}
                      </span>
                      <span
                        style={{
                          background: 'rgba(100, 116, 139, 0.2)',
                          color: '#cbd5e1',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: '600',
                        }}
                      >
                        {b.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                    <strong>Root Cause / Impact:</strong> {b.root_cause || b.impact_area || b.description || 'Awaiting resolution.'}
                  </div>

                  {b.remediation && (
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#86efac' }}>
                      💡 <strong>Required Action:</strong> {b.remediation}
                    </div>
                  )}

                  {b.source_evidence && (
                    <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      Source: <em>{b.source_evidence}</em>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. SECTION B: PENDING DECISIONS */}
      {activeSection === 'decisions' && (
        <div className="card-panel" style={{ padding: '22px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
              ⚖️ Pending Strategic &amp; Architectural Decisions
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Key architectural and business choices awaiting signoff from stakeholders
            </p>
          </div>

          {decisions.length === 0 ? (
            <div className="empty-substate">
              No pending architectural or governance decisions logged.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {decisions.map((d, idx) => (
                <div
                  key={d.decision_id || idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderLeft: '4px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#fbbf24' }}>
                      {d.decision_id || `DEC-${idx + 1}`}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#fde047', fontWeight: '700' }}>
                      {d.status || 'Pending Signoff'}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: '700', color: '#ffffff' }}>
                    {d.decision_topic || d.topic || d.title || 'Architectural Decision'}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '6px', lineHeight: '1.5' }}>
                    {d.impact || d.description || 'Pending consensus on implementation.'}
                  </p>
                  <div style={{ marginTop: '10px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <div>Stakeholders: <strong style={{ color: '#ffffff' }}>{d.stakeholders || 'Architecture Board'}</strong></div>
                    {d.deadline && <div>Decision Deadline: <strong style={{ color: '#fbbf24' }}>{d.deadline}</strong></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. SECTION C: UNRESOLVED ISSUES */}
      {activeSection === 'issues' && (
        <div className="card-panel" style={{ padding: '22px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
              🔍 Unresolved Issues &amp; Defects
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Open bugs, environmental instability, and technical defects tracked across project channels
            </p>
          </div>

          {issues.length === 0 ? (
            <div className="empty-substate">
              No unresolved issues currently recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {issues.map((iss, idx) => (
                <div
                  key={iss.issue_id || idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#c4b5fd' }}>
                        {iss.issue_id || `ISS-${idx + 1}`}
                      </span>
                      <strong style={{ fontSize: '0.92rem', color: '#ffffff' }}>
                        {iss.title || iss.description || 'Open Issue'}
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Owner: {iss.owner || 'Unassigned'} • Area: {iss.component || 'Core'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span
                      style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        color: '#c4b5fd',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                      }}
                    >
                      {iss.severity || 'Moderate'}
                    </span>
                    <span
                      style={{
                        background: 'rgba(100, 116, 139, 0.2)',
                        color: '#cbd5e1',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                      }}
                    >
                      {iss.status || 'Open'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. SECTION D: ASSIGNED ACTION ITEMS */}
      {activeSection === 'actions' && (
        <div className="card-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
                ✅ Assigned Delivery Action Items
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Actionable tasks with designated owners, explicit due dates, and priority tags
              </p>
            </div>

            <input
              type="text"
              className="input-field"
              placeholder="🔍 Search action items..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{ width: '220px', padding: '6px 12px', fontSize: '0.82rem' }}
            />
          </div>

          {actionItems.length === 0 ? (
            <div className="empty-substate">
              No assigned action items extracted.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {actionItems
                .filter((item) => {
                  const q = filterQuery.toLowerCase();
                  return (
                    (item.description || item.action || '').toLowerCase().includes(q) ||
                    (item.assigned_person || item.owner || '').toLowerCase().includes(q)
                  );
                })
                .map((item, idx) => (
                  <div key={item.action_id || idx} className="action-item-row" style={{ alignItems: 'center' }}>
                    <div className="action-checkbox">✓</div>
                    <div style={{ flex: 1 }}>
                      <div className="action-desc">
                        {item.description || item.action || `Action item #${idx + 1}`}
                      </div>
                      <div className="action-meta">
                        <span>👤 Owner: <strong style={{ color: '#ffffff' }}>{item.assigned_person || item.owner || 'Assigned Lead'}</strong></span>
                        <span>📅 Due: <strong style={{ color: '#a5b4fc' }}>{item.due_date || 'Upcoming Milestone'}</strong></span>
                        <span className={`priority-tag ${getPriorityBadgeClass(item.priority)}`}>
                          {item.priority || 'Medium'}
                        </span>
                        <span>Status: <strong style={{ color: '#34d399' }}>{item.status || 'In Progress'}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
