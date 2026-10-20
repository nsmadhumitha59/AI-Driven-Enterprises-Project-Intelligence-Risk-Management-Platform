import React, { useState } from 'react';
import { deleteDocument, clearAllDocuments } from '../services/api';

export default function DocumentList({ documents, onDocumentDeleted }) {
  const [filterText, setFilterText] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}" and purge all its vector chunks?`)) return;

    setDeletingId(docId);
    try {
      await deleteDocument(docId);
      if (onDocumentDeleted) onDocumentDeleted();
    } catch (err) {
      alert(`Error deleting document: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("⚠️ Are you sure you want to remove ALL documents and purge the ChromaDB vector store?\n\nThis will remove all cached analysis and ensure only newly uploaded documents are processed.")) {
      return;
    }

    setIsClearingAll(true);
    try {
      const res = await clearAllDocuments();
      alert(res.message || "All documents and vector embeddings have been cleared successfully.");
      if (onDocumentDeleted) onDocumentDeleted();
    } catch (err) {
      alert(`Error clearing documents: ${err.message}`);
    } finally {
      setIsClearingAll(false);
    }
  };

  const getDocName = (doc) => doc.filename || doc.original_name || 'Untitled';
  const getDocId = (doc) => doc.doc_id || doc.document_id || '';
  const getDocHash = (doc) => doc.checksum_sha256 || doc.file_hash || '';

  const filteredDocs = (documents || []).filter((doc) => {
    const name = getDocName(doc).toLowerCase();
    const type = (doc.file_type || '').toLowerCase();
    const id = getDocId(doc).toLowerCase();
    const q = filterText.toLowerCase();
    return name.includes(q) || type.includes(q) || id.includes(q);
  });

  const getFormatBadge = (type) => {
    const ext = (type || '').toLowerCase();
    return <span className={`format-badge ${ext}`}>{ext || 'FILE'}</span>;
  };

  return (
    <div className="card-panel">
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>📚 Indexed Document Repository</h2>
          <p>Browse metadata records for all extracted, normalized, and vector-indexed project files.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {documents && documents.length > 0 && (
            <button
              className="btn-danger"
              onClick={handleClearAll}
              disabled={isClearingAll}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 14px' }}
            >
              {isClearingAll ? 'Clearing...' : '🗑️ Clear All Documents'}
            </button>
          )}

          <input
            type="text"
            className="input-field"
            placeholder="🔍 Filter documents..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ maxWidth: '240px' }}
          />
        </div>
      </div>

      {!documents || documents.length === 0 ? (
        <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
          <p style={{ fontSize: '1.05rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
            No documents uploaded yet
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Upload PDF, DOCX, CSV, or TXT documents to populate the vector knowledge base.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Format</th>
                <th>Filename</th>
                <th>Upload Date</th>
                <th>Doc ID</th>
                <th>Size</th>
                <th>Chunks</th>
                <th>Word Count</th>
                <th>SHA-256</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => {
                const docId = getDocId(doc);
                const docName = getDocName(doc);
                const docHash = getDocHash(doc);
                const uploadDate = doc.created_at || doc.uploaded_at 
                  ? new Date(doc.created_at || doc.uploaded_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Recent';
                return (
                  <tr key={docId}>
                    <td>{getFormatBadge(doc.file_type)}</td>
                    <td>
                      <strong style={{ color: '#ffffff' }}>{docName}</strong>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#c7d2fe', whiteSpace: 'nowrap' }}>
                      {uploadDate}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
                        {docId.substring(0, 12)}...
                      </code>
                    </td>
                    <td>{doc.file_size_bytes ? (doc.file_size_bytes / 1024).toFixed(1) + ' KB' : '—'}</td>
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{doc.chunk_count ?? 0}</span>
                    </td>
                    <td>{doc.word_count ? doc.word_count.toLocaleString() : '—'}</td>
                    <td>
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {docHash ? docHash.substring(0, 10) + '...' : '—'}
                      </code>
                    </td>
                    <td>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(docId, docName)}
                        disabled={deletingId === docId}
                        style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                      >
                        {deletingId === docId ? 'Deleting...' : '🗑️ Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
