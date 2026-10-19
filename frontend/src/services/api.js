const API_BASE = '/api/v1';

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    const fallbackRes = await fetch(`${API_BASE}/system/health`);
    if (!fallbackRes.ok) throw new Error('Backend offline');
    return fallbackRes.json();
  }
  return res.json();
}

export async function getArchitecture() {
  const res = await fetch(`${API_BASE}/system/architecture`);
  if (!res.ok) throw new Error('Failed to fetch architecture info');
  return res.json();
}

export async function uploadDocuments(fileList) {
  const formData = new FormData();
  for (let i = 0; i < fileList.length; i++) {
    formData.append('files', fileList[i]);
  }

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail?.message || errorData.detail || 'Failed to upload documents');
  }

  return res.json();
}

export async function uploadIncrementalDocuments(fileList) {
  const formData = new FormData();
  for (let i = 0; i < fileList.length; i++) {
    formData.append('files', fileList[i]);
  }

  const res = await fetch(`${API_BASE}/m4/incremental-upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail?.message || errorData.detail || 'Failed to incrementally upload documents');
  }

  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to load documents');
  return res.json();
}

export async function getDocumentDetails(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`);
  if (!res.ok) throw new Error(`Failed to get document ${docId}`);
  return res.json();
}

export async function deleteDocument(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete document ${docId}`);
  return res.json();
}

export async function clearAllDocuments() {
  const res = await fetch(`${API_BASE}/documents`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.message || err.detail || 'Failed to clear all documents');
  }
  return res.json();
}

export async function searchRAG(query, topK = 5, docId = null, fileType = null) {
  const res = await fetch(`${API_BASE}/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      top_k: parseInt(topK, 10),
      document_id: docId || undefined,
      file_type: fileType || undefined,
    }),
  });

  if (!res.ok) throw new Error('Semantic search failed');
  return res.json();
}

// ==========================================
// Dashboard & Knowledge Base APIs
// ==========================================

export async function getProjectDashboard(queryContext = null, documentId = null) {
  const payload = {};
  if (queryContext) payload.query_context = queryContext;
  if (documentId) payload.document_id = documentId;

  const res = await fetch(`${API_BASE}/m4/dashboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to generate project dashboard');
  }
  return res.json();
}

export async function getKnowledgeStats() {
  const res = await fetch(`${API_BASE}/m4/stats`);
  if (!res.ok) throw new Error('Failed to fetch knowledge base statistics');
  return res.json();
}

// ==========================================
// Multi-Agent & Documentation APIs
// ==========================================

export async function runScopeAgent(queryContext = null) {
  const res = await fetch(`${API_BASE}/agents/scope`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_context: queryContext || undefined }),
  });
  if (!res.ok) throw new Error('Scope agent failed');
  return res.json();
}

export async function runRiskAgent(queryContext = null) {
  const res = await fetch(`${API_BASE}/agents/risk-forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_context: queryContext || undefined }),
  });
  if (!res.ok) throw new Error('Risk forecast agent failed');
  return res.json();
}

export async function runBlockerAgent(queryContext = null) {
  const res = await fetch(`${API_BASE}/agents/blockers-actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_context: queryContext || undefined }),
  });
  if (!res.ok) throw new Error('Blocker action agent failed');
  return res.json();
}

export async function getHealthScore(queryContext = null) {
  const res = await fetch(`${API_BASE}/m3/health-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_context: queryContext || undefined }),
  });
  if (!res.ok) throw new Error('Health scorer failed');
  return res.json();
}

export async function generateDocArtifact(docType, queryContext = null) {
  const endpoint = docType === 'all' 
    ? `${API_BASE}/m3/docs/all` 
    : docType === 'stories' 
      ? `${API_BASE}/m3/docs/user-stories` 
      : docType === 'risks' 
        ? `${API_BASE}/m3/docs/risk-register` 
        : `${API_BASE}/m3/docs/action-items`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_context: queryContext || undefined }),
  });
  if (!res.ok) throw new Error(`Documentation generation for ${docType} failed`);
  return res.json();
}

export async function sendChatMessage(message, conversationId = null, sessionHistory = []) {
  const res = await fetch(`${API_BASE}/m3/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: conversationId || undefined,
      session_history: sessionHistory,
    }),
  });
  if (!res.ok) throw new Error('Chat assistant request failed');
  return res.json();
}
