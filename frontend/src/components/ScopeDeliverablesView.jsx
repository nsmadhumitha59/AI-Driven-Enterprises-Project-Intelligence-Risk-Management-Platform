import React, { useState, useEffect } from 'react';
import { runScopeAgent } from '../services/api';

export default function ScopeDeliverablesView({ initialScopeData }) {
  const [scopeData, setScopeData] = useState(initialScopeData || null);
  const [isLoading, setIsLoading] = useState(!initialScopeData);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  const fetchScope = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await runScopeAgent();
      setScopeData(data);
    } catch (err) {
      console.error('Error fetching scope data:', err);
      setErrorMessage(err.message || 'Failed to extract scope and deliverables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialScopeData) {
      fetchScope();
    } else {
      setScopeData(initialScopeData);
    }
  }, [initialScopeData]);

  if (isLoading) {
    return (
      <div className="card-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="dashboard-spinner">⚙️</div>
        <h3 style={{ marginTop: '18px', color: '#ffffff' }}>Running Scope & Deliverable Extraction Agent...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
          Parsing project goals, deliverables, timeline dates, and boundaries from indexed documents
        </p>
      </div>
    );
  }

  const scope = scopeData || {};
  const objectives = scope.project_objectives || [];
  const goals = scope.project_goals || scope.goals || [];
  const deliverables = scope.deliverables || [];
  const milestones = scope.milestones || [];
  const teamMembers = scope.assigned_team_members || [];
  const dependencies = scope.project_dependencies || [];
  const boundaries = scope.scope_boundaries || {};
  const inScope = boundaries.in_scope || [];
  const outOfScope = boundaries.out_of_scope || [];

  const filteredDeliverables = deliverables.filter((d) => {
    const q = filterQuery.toLowerCase();
    const name = (d.title || d.name || '').toLowerCase();
    const desc = (d.description || '').toLowerCase();
    const owner = (d.owner || '').toLowerCase();
    return name.includes(q) || desc.includes(q) || owner.includes(q);
  });

  return (
    <div className="scope-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Toolbar */}
      <div className="card-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em' }}>
                🎯 Scope, Goals &amp; Deliverables Intelligence
              </h2>
              <span className="badge-count" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                {deliverables.length} Deliverables Extracted
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Grounding AI extraction of project boundaries, commitments, timeline constraints, and team responsibilities
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              onClick={fetchScope}
            >
              🔄 Re-extract Scope
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="card-panel banner-error">
          ⚠️ <strong>Scope Agent Error:</strong> {errorMessage}
        </div>
      )}

      {/* 2. Project Overview & Scope Description Card */}
      <div className="card-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>
              Identified Project
            </span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
              {scope.project_name || 'Project Intelligence Workspace'}
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '16px', background: 'rgba(15, 23, 42, 0.5)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Target Start Date:</span>
              <strong style={{ fontSize: '0.85rem', color: '#86efac' }}>{scope.start_date || 'Q1 / Kickoff'}</strong>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Target End Date:</span>
              <strong style={{ fontSize: '0.85rem', color: '#fca5a5' }}>{scope.end_date || 'Target Completion'}</strong>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px 18px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', display: 'block', marginBottom: '4px' }}>
            Scope Description:
          </span>
          <p style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.6' }}>
            {scope.scope_description || 'Detailed scope extracted from uploaded project charter, PRD, and meeting transcripts.'}
          </p>
        </div>
      </div>

      {/* 3. Objectives & Goals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Objectives */}
        <div className="card-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.2rem' }}>🎯</span>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' }}>Project Objectives</h4>
          </div>
          {objectives.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No explicit objectives listed.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {objectives.map((obj, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>✓</span>
                  <span style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: '1.5' }}>{obj}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Goals */}
        <div className="card-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.2rem' }}>🏆</span>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' }}>Strategic Goals &amp; Metrics</h4>
          </div>
          {goals.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No explicit goals listed.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {goals.map((g, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>★</span>
                  <span style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: '1.5' }}>{g}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 4. In-Scope vs. Out-of-Scope Boundaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <div className="card-panel" style={{ padding: '20px', borderTop: '3px solid #10b981' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#86efac', marginBottom: '12px' }}>
            ✅ Verified In-Scope Boundaries
          </h4>
          {inScope.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No in-scope boundaries specified.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {inScope.map((item, idx) => (
                <li key={idx} style={{ fontSize: '0.84rem', color: '#e2e8f0', paddingLeft: '14px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#10b981' }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-panel" style={{ padding: '20px', borderTop: '3px solid #ef4444' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fca5a5', marginBottom: '12px' }}>
            🚫 Explicit Out-of-Scope Boundaries
          </h4>
          {outOfScope.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No out-of-scope exclusions specified.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {outOfScope.map((item, idx) => (
                <li key={idx} style={{ fontSize: '0.84rem', color: '#e2e8f0', paddingLeft: '14px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#ef4444' }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 5. Key Deliverables Table */}
      <div className="card-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff' }}>
              📦 Extracted Project Deliverables
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Concrete deliverables, responsible owners, milestone alignments, and delivery statuses
            </p>
          </div>

          <input
            type="text"
            className="input-field"
            placeholder="🔍 Filter deliverables..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{ width: '220px', padding: '6px 12px', fontSize: '0.82rem' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Deliverable</th>
                <th style={{ textAlign: 'left' }}>Description</th>
                <th style={{ textAlign: 'left' }}>Owner</th>
                <th style={{ textAlign: 'center' }}>Target Date</th>
                <th style={{ textAlign: 'center' }}>Milestone</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliverables.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No deliverables found matching filter.
                  </td>
                </tr>
              ) : (
                filteredDeliverables.map((d, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', color: '#ffffff' }}>
                      {d.title || d.name || `Deliverable #${idx + 1}`}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#cbd5e1', maxWidth: '300px' }}>
                      {d.description || '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#c7d2fe', whiteSpace: 'nowrap' }}>
                      {d.owner || 'Assigned Lead'}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {d.target_date || d.due_date || 'Target'}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.78rem', color: '#a5b4fc', whiteSpace: 'nowrap' }}>
                      {d.milestone_name || d.milestone || 'Phase 1'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          background: (d.status || '').toLowerCase().includes('complete') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                          color: (d.status || '').toLowerCase().includes('complete') ? '#34d399' : '#a5b4fc',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        }}
                      >
                        {d.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Milestones & Timeline */}
      {milestones.length > 0 && (
        <div className="card-panel" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>
            🚩 Project Milestones &amp; Scheduled Phases
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {milestones.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(15, 23, 42, 0.55)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)' }}>Phase / Checkpoint #{idx + 1}</span>
                  <span style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: '600' }}>{m.target_date || 'Planned'}</span>
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
                  {m.milestone_name || m.name || `Milestone ${idx + 1}`}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {m.description || 'Milestone delivery commitment'}
                </p>
                <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#c7d2fe' }}>
                  Status: <strong>{m.status || 'In Progress'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Assigned Team Members & Responsibilities & Dependencies */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Team Members */}
        <div className="card-panel" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>
            👥 Assigned Team Members &amp; Responsibilities
          </h4>
          {teamMembers.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No explicit team member records extracted.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teamMembers.map((member, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>{member.name || member}</strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Role: {member.role || 'Project Contributor'}
                    </div>
                  </div>
                  {member.deliverables_assigned && (
                    <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px' }}>
                      {member.deliverables_assigned.length} tasks
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Dependencies */}
        <div className="card-panel" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>
            🔗 Cross-Functional Project Dependencies
          </h4>
          {dependencies.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No external or blocking dependencies identified.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dependencies.map((dep, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.86rem', color: '#fbbf24' }}>
                      {dep.dependency_name || dep.name || `Dependency #${idx + 1}`}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dep.type || 'Internal'}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '4px' }}>
                    {dep.description || dep.impact || 'Requires prerequisite deliverable completion.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
