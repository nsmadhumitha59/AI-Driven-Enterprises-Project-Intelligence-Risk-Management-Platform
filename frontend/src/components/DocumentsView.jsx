import React, { useState } from 'react';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import SemanticSearch from './SemanticSearch';

export default function DocumentsView({ documents, onDocumentsUpdated, onUploadSuccess }) {
  const [activeSubTab, setActiveSubTab] = useState('inventory');

  return (
    <div className="documents-view-container">
      {/* Top Controls Bar */}
      <div className="card-panel" style={{ marginBottom: '20px', padding: '18px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em' }}>
              📚 Enterprise Document Knowledge Base
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Multi-format ingestion pipeline supporting PDF, DOCX, CSV, and TXT with dense vector indexing in ChromaDB
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              className={`btn-tab ${activeSubTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('inventory')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                background: activeSubTab === 'inventory' ? 'var(--primary)' : 'transparent',
                color: activeSubTab === 'inventory' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              📑 Repository ({documents.length})
            </button>
            <button
              className={`btn-tab ${activeSubTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('upload')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                background: activeSubTab === 'upload' ? 'var(--primary)' : 'transparent',
                color: activeSubTab === 'upload' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              📥 Ingest Documents
            </button>
            <button
              className={`btn-tab ${activeSubTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('search')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                background: activeSubTab === 'search' ? 'var(--primary)' : 'transparent',
                color: activeSubTab === 'search' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🔍 Semantic RAG Search
            </button>
          </div>
        </div>
      </div>

      {/* Sub-view Content */}
      {activeSubTab === 'inventory' && (
        <DocumentList
          documents={documents}
          onDocumentDeleted={onDocumentsUpdated}
        />
      )}

      {activeSubTab === 'upload' && (
        <DocumentUpload
          onUploadSuccess={() => {
            if (onUploadSuccess) onUploadSuccess();
            setActiveSubTab('inventory');
          }}
        />
      )}

      {activeSubTab === 'search' && (
        <SemanticSearch documents={documents} />
      )}
    </div>
  );
}
