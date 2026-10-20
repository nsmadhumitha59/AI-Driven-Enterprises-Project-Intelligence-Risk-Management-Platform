import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProjectDashboard from './components/ProjectDashboard';
import DocumentsView from './components/DocumentsView';
import ScopeDeliverablesView from './components/ScopeDeliverablesView';
import RiskAnalysisView from './components/RiskAnalysisView';
import BlockersActionsView from './components/BlockersActionsView';
import GeneratedDocsView from './components/GeneratedDocsView';
import ChatAssistantView from './components/ChatAssistantView';
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
      console.warn('Backend connection check:', err);
      setIsHealthy(false);
    }
  };

  const handleUploadSuccess = async () => {
    await fetchBackendData();
    setDashboardRefreshKey((prev) => prev + 1);
    setActiveTab('dashboard');
  };

  const handleDocumentsUpdated = async () => {
    await fetchBackendData();
    setDashboardRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <Header
        isHealthy={isHealthy}
        documentCount={documents.length}
        architectureInfo={architectureInfo}
      />

      {/* Top Navigation Bar adhering to Requirement 13 */}
      <nav className="nav-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="tab-icon">📊</span> Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <span className="tab-icon">📚</span> Documents ({documents.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'scope' ? 'active' : ''}`}
          onClick={() => setActiveTab('scope')}
        >
          <span className="tab-icon">🎯</span> Scope &amp; Deliverables
        </button>
        <button
          className={`tab-btn ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          <span className="tab-icon">🛡️</span> Risk Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === 'blockers' ? 'active' : ''}`}
          onClick={() => setActiveTab('blockers')}
        >
          <span className="tab-icon">🛑</span> Blockers &amp; Actions
        </button>
        <button
          className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <span className="tab-icon">📄</span> Generated Documentation
        </button>
        <button
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span className="tab-icon">🤖</span> AI Assistant
        </button>
      </nav>

      {/* Active Tab View */}
      <main>
        {activeTab === 'dashboard' && (
          <ProjectDashboard
            onDocumentsUpdated={handleDocumentsUpdated}
            refreshKey={dashboardRefreshKey}
            documentCount={documents.length}
            onNavigateTab={setActiveTab}
            onNavigateUpload={() => setActiveTab('documents')}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            onDocumentsUpdated={handleDocumentsUpdated}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
        {activeTab === 'scope' && (
          <ScopeDeliverablesView />
        )}
        {activeTab === 'risk' && (
          <RiskAnalysisView
            onRefreshDashboard={handleDocumentsUpdated}
          />
        )}
        {activeTab === 'blockers' && (
          <BlockersActionsView />
        )}
        {activeTab === 'docs' && (
          <GeneratedDocsView />
        )}
        {activeTab === 'chat' && (
          <ChatAssistantView />
        )}
      </main>
    </div>
  );
}
