import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProjectDashboard from './components/ProjectDashboard';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import SemanticSearch from './components/SemanticSearch';
import SystemArchitecture from './components/SystemArchitecture';
import { getHealth, listDocuments, getArchitecture } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isHealthy, setIsHealthy] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [architectureInfo, setArchitectureInfo] = useState(null);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  const fetchBackendData = async () => {
    try {
      const health = await getHealth();
      setIsHealthy(health.status === 'healthy');

      const docs = await listDocuments();
      const docList = docs.documents || docs || [];
      const newDocs = Array.isArray(docList) ? docList : [];
      setDocuments(newDocs);

      const arch = await getArchitecture();
      setArchitectureInfo(arch);
    } catch (err) {
      console.warn('Backend connection failed:', err);
      setIsHealthy(false);
    }
  };

  const handleUploadSuccess = async () => {
    await fetchBackendData();
    // Auto-trigger dashboard refresh and switch to dashboard so output appears automatically
    setDashboardRefreshKey((prev) => prev + 1);
    setActiveTab('dashboard');
  };

  const handleDocumentsUpdated = async () => {
    await fetchBackendData();
    setDashboardRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <Header
        isHealthy={isHealthy}
        documentCount={documents.length}
        architectureInfo={architectureInfo}
      />

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="tab-icon">📊</span> Executive Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <span className="tab-icon">📥</span> Ingestion & Upload
        </button>
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <span className="tab-icon">📚</span> Document Repository ({documents.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <span className="tab-icon">🔍</span> Semantic Search
        </button>
        <button
          className={`tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          <span className="tab-icon">⚙️</span> System Architecture
        </button>
      </nav>

      {/* Active Tab View */}
      <main>
        {activeTab === 'dashboard' && (
          <ProjectDashboard
            onDocumentsUpdated={handleDocumentsUpdated}
            refreshKey={dashboardRefreshKey}
            documentCount={documents.length}
            onNavigateUpload={() => setActiveTab('upload')}
          />
        )}
        {activeTab === 'upload' && (
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
        )}
        {activeTab === 'list' && (
          <DocumentList
            documents={documents}
            onDocumentDeleted={handleDocumentsUpdated}
          />
        )}
        {activeTab === 'search' && (
          <SemanticSearch documents={documents} />
        )}
        {activeTab === 'architecture' && (
          <SystemArchitecture architectureInfo={architectureInfo} />
        )}
      </main>
    </div>
  );
}
