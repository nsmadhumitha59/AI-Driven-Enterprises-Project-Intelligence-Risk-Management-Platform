import React, { useState, useEffect } from 'react';
import { generateDocArtifact } from '../services/api';

export default function GeneratedDocsView() {
  const [docType, setDocType] = useState('all'); // 'all', 'stories', 'risks', 'actions'
  const [docsData, setDocsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [exportNotice, setExportNotice] = useState('');

  const fetchDocs = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setExportNotice('');
    try {
      const data = await generateDocArtifact('all');
      setDocsData(data);
    } catch (err) {
      console.error('Error generating documentation:', err);
      setErrorMessage(err.message || 'Failed to generate documentation artifacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const stories = docsData?.user_stories || [];
  const riskRegister = docsData?.risk_register || [];
  const actionItems = docsData?.action_items || [];

  // Export functions
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportNotice(`Exported ${filename} successfully!`);
    setTimeout(() => setExportNotice(''), 3500);
  };

  const exportAsJSON = () => {
    const dataToExport = {
      user_stories: stories,
      risk_register: riskRegister,
      action_items: actionItems,
      exported_at: new Date().toISOString(),
    };
    downloadFile(JSON.stringify(dataToExport, null, 2), 'project_intelligence_docs.json', 'application/json');
  };

  const exportAsMarkdown = () => {
    let md = `# AI-Driven Enterprise Project Intelligence Documentation\n\n`;
    md += `*Generated: ${new Date().toLocaleString()}*\n\n`;

    md += `## 1. User Stories\n\n`;
    stories.forEach((s) => {
      md += `### [${s.story_id}] As a ${s.user_role}\n`;
      md += `**Description:** ${s.user_story_description || s.description}\n\n`;
      md += `**Priority:** ${s.priority} | **Status:** ${s.status || 'Ready'}\n\n`;
      md += `**Acceptance Criteria:**\n`;
      (s.acceptance_criteria || []).forEach((ac) => {
        md += `- [ ] ${ac}\n`;
      });
      md += `\n---\n\n`;
    });

    md += `## 2. Risk Register\n\n`;
    md += `| Risk ID | Description | Category | Probability | Impact | Score | Severity | Mitigation | Owner | Status |\n`;
    md += `|---|---|---|---|---|---|---|---|---|---|\n`;
    riskRegister.forEach((r) => {
      const p = r.probability_rating || r.probability || 3;
      const i = r.impact_rating || r.impact || 3;
      const score = r.risk_score || (p * i);
      md += `| ${r.risk_id} | ${r.risk_description || r.description} | ${r.category} | ${p} | ${i} | ${score} | ${r.severity} | ${r.mitigation} | ${r.risk_owner || r.owner} | ${r.status || 'Open'} |\n`;
    });
    md += `\n\n`;

    md += `## 3. Action Item List\n\n`;
    md += `| Action ID | Description | Assigned Person | Due Date | Priority | Status |\n`;
    md += `|---|---|---|---|---|---|\n`;
    actionItems.forEach((a) => {
      md += `| ${a.action_id} | ${a.description} | ${a.assigned_person} | ${a.due_date} | ${a.priority} | ${a.status} |\n`;
    });

    downloadFile(md, 'project_intelligence_docs.md', 'text/markdown');
  };

  const exportAsCSV = () => {
    let csv = `Category,ID,Title_Description,Details_Owner,Priority_Severity,Status\n`;

    stories.forEach((s) => {
      const desc = `"${(s.user_story_description || s.description || '').replace(/"/g, '""')}"`;
      csv += `UserStory,${s.story_id},${desc},${s.user_role},${s.priority},${s.status || 'Ready'}\n`;
    });

    riskRegister.forEach((r) => {
      const desc = `"${(r.risk_description || r.description || '').replace(/"/g, '""')}"`;
      csv += `Risk,${r.risk_id},${desc},${r.risk_owner || r.owner},${r.severity},${r.status || 'Open'}\n`;
    });

    actionItems.forEach((a) => {
      const desc = `"${(a.description || '').replace(/"/g, '""')}"`;
      csv += `ActionItem,${a.action_id},${desc},${a.assigned_person},${a.priority},${a.status}\n`;
    });

    downloadFile(csv, 'project_intelligence_docs.csv', 'text/csv');
  };

  if (isLoading) {
    return (
      <div className="card-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="dashboard-spinner">📝</div>
        <h3 style={{ marginTop: '18px', color: '#ffffff' }}>Generating Project Documentation Artifacts...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
          Document Generation Agent synthesizing User Stories, Enterprise Risk Register, and Action Items
        </p>
      </div>
    );
  }

  return (
    <div className="generated-docs-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Toolbar */}
      <div className="card-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em' }}>
                📄 Automated Documentation Studio
              </h2>
              <span className="badge-count" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                {stories.length} Stories • {riskRegister.length} Risks • {actionItems.length} Actions
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Auto-generate structured User Stories with Acceptance Criteria, Risk Register with severity metrics, and Action Items
            </p>
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-secondary"
              onClick={exportAsMarkdown}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              📥 Markdown (.md)
            </button>
            <button
              className="btn-secondary"
              onClick={exportAsJSON}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              📥 JSON
            </button>
            <button
              className="btn-secondary"
              onClick={exportAsCSV}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              📥 CSV
            </button>
            <button
              className="btn-primary"
              onClick={fetchDocs}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              ⚡ Re-generate Docs
            </button>
          </div>
        </div>

        {exportNotice && (
          <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#34d399', fontWeight: '600' }}>
            ✅ {exportNotice}
          </div>
        )}

        {/* Sub Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          {[
            { id: 'all', label: `All Artifacts (${stories.length + riskRegister.length + actionItems.length})` },
            { id: 'stories', label: `Agile User Stories (${stories.length})` },
            { id: 'risks', label: `Enterprise Risk Register (${riskRegister.length})` },
            { id: 'actions', label: `Action Item List (${actionItems.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDocType(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                background: docType === tab.id ? 'var(--primary)' : 'rgba(15, 23, 42, 0.6)',
                color: docType === tab.id ? '#ffffff' : 'var(--text-muted)',
                border: `1px solid ${docType === tab.id ? 'var(--primary)' : 'var(--border-color)'}`,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="card-panel banner-error">
          ⚠️ <strong>Documentation Generation Error:</strong> {errorMessage}
        </div>
      )}

      {/* 2. SECTION A: USER STORIES */}
      {(docType === 'all' || docType === 'stories') && (
        <div className="card-panel" style={{ padding: '22px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
              👤 Agile User Stories &amp; Acceptance Criteria
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Standard story format with role, target outcome, priority ranking, and testable acceptance criteria
            </p>
          </div>

          {stories.length === 0 ? (
            <div className="empty-substate">No user stories generated.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
              {stories.map((story) => (
                <div
                  key={story.story_id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)' }}>
                        {story.story_id}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontWeight: '700' }}>
                          {story.priority || 'Medium'}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: '600' }}>
                          {story.status || 'Ready'}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: '600', marginBottom: '6px' }}>
                      As a <em>{story.user_role}</em>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: '#ffffff', lineHeight: '1.5', marginBottom: '12px' }}>
                      {story.user_story_description || story.description}
                    </p>

                    {/* Acceptance Criteria */}
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px 12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.74rem', color: '#86efac', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        Acceptance Criteria:
                      </span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.78rem', color: '#cbd5e1' }}>
                        {(story.acceptance_criteria || []).map((ac, acIdx) => (
                          <li key={acIdx} style={{ paddingLeft: '12px', position: 'relative', marginBottom: '4px' }}>
                            <span style={{ position: 'absolute', left: 0, color: '#10b981' }}>✓</span>
                            {ac}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. SECTION B: RISK REGISTER */}
      {(docType === 'all' || docType === 'risks') && (
        <div className="card-panel" style={{ padding: '22px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
              🛡️ Enterprise Risk Register Artifact
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Standard project management risk log with quantitative probability, impact ratings, mitigation action, and owners
            </p>
          </div>

          {riskRegister.length === 0 ? (
            <div className="empty-substate">No risk register entries generated.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Risk ID</th>
                    <th>Risk Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>P</th>
                    <th style={{ textAlign: 'center' }}>I</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th style={{ textAlign: 'center' }}>Severity</th>
                    <th>Mitigation</th>
                    <th>Owner</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riskRegister.map((r) => {
                    const p = r.probability_rating || r.probability || 3;
                    const i = r.impact_rating || r.impact || 3;
                    const score = r.risk_score || (p * i);
                    return (
                      <tr key={r.risk_id}>
                        <td style={{ fontWeight: '700', color: '#a5b4fc', whiteSpace: 'nowrap' }}>{r.risk_id}</td>
                        <td style={{ fontSize: '0.84rem', color: '#ffffff', maxWidth: '280px' }}>
                          {r.risk_description || r.description}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{r.category}</td>
                        <td style={{ textAlign: 'center', fontWeight: '700' }}>{p}</td>
                        <td style={{ textAlign: 'center', fontWeight: '700' }}>{i}</td>
                        <td style={{ textAlign: 'center', fontWeight: '800', color: '#ffffff' }}>{score}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              background: r.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.25)' : r.severity === 'HIGH' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(234, 179, 8, 0.25)',
                              color: r.severity === 'CRITICAL' ? '#fca5a5' : r.severity === 'HIGH' ? '#fdba74' : '#fde047',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                            }}
                          >
                            {r.severity}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#86efac', maxWidth: '220px' }}>{r.mitigation}</td>
                        <td style={{ fontSize: '0.8rem', color: '#c7d2fe', whiteSpace: 'nowrap' }}>{r.risk_owner || r.owner}</td>
                        <td style={{ textAlign: 'center', fontSize: '0.75rem', color: '#34d399' }}>{r.status || 'Open'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. SECTION C: ACTION ITEM LIST */}
      {(docType === 'all' || docType === 'actions') && (
        <div className="card-panel" style={{ padding: '22px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
              📋 Project Delivery Action Item List
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Operational action items mapped to responsible team members and due dates
            </p>
          </div>

          {actionItems.length === 0 ? (
            <div className="empty-substate">No action item records generated.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Action ID</th>
                    <th>Description</th>
                    <th>Assigned Person</th>
                    <th style={{ textAlign: 'center' }}>Due Date</th>
                    <th style={{ textAlign: 'center' }}>Priority</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {actionItems.map((a) => (
                    <tr key={a.action_id}>
                      <td style={{ fontWeight: '700', color: '#a5b4fc', whiteSpace: 'nowrap' }}>{a.action_id}</td>
                      <td style={{ fontSize: '0.86rem', color: '#ffffff' }}>{a.description}</td>
                      <td style={{ fontSize: '0.82rem', color: '#c7d2fe', whiteSpace: 'nowrap' }}>{a.assigned_person}</td>
                      <td style={{ textAlign: 'center', fontSize: '0.82rem', color: '#fde047', whiteSpace: 'nowrap' }}>{a.due_date}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
                          {a.priority}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.75rem', color: '#34d399', fontWeight: '600' }}>{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
