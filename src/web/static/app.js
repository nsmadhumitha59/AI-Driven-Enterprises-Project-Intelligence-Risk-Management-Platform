/**
 * Frontend logic for AI Project Intelligence & Risk Advisor (Milestones 1, 2, and 3)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Navigation Tabs
  const tabMilestone4 = document.getElementById("tabMilestone4");
  const tabIngestion = document.getElementById("tabIngestion");
  const tabAgents = document.getElementById("tabAgents");
  const tabMilestone3 = document.getElementById("tabMilestone3");
  const sectionMilestone4 = document.getElementById("sectionMilestone4");
  const sectionIngestion = document.getElementById("sectionIngestion");
  const sectionAgents = document.getElementById("sectionAgents");
  const sectionMilestone3 = document.getElementById("sectionMilestone3");

  function switchTab(activeTab, activeSection) {
    [tabMilestone4, tabIngestion, tabAgents, tabMilestone3].forEach(t => t && t.classList.remove("active"));
    [sectionMilestone4, sectionIngestion, sectionAgents, sectionMilestone3].forEach(s => s && s.classList.remove("active"));
    if (activeTab) activeTab.classList.add("active");
    if (activeSection) activeSection.classList.add("active");
    if (activeTab === tabMilestone4) {
      loadM4Dashboard();
    }
  }

  if (tabMilestone4) tabMilestone4.addEventListener("click", () => switchTab(tabMilestone4, sectionMilestone4));
  if (tabIngestion) tabIngestion.addEventListener("click", () => switchTab(tabIngestion, sectionIngestion));
  if (tabAgents) tabAgents.addEventListener("click", () => switchTab(tabAgents, sectionAgents));
  if (tabMilestone3) tabMilestone3.addEventListener("click", () => switchTab(tabMilestone3, sectionMilestone3));

  // Milestone 1 Elements
  const systemStatus = document.getElementById("systemStatus");
  const statusText = document.getElementById("statusText");
  const metricDocsCount = document.getElementById("metricDocsCount");
  const metricChunksCount = document.getElementById("metricChunksCount");
  const metricHealthScore = document.getElementById("metricHealthScore");
  const metricHealthStatus = document.getElementById("metricHealthStatus");

  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const uploadProgress = document.getElementById("uploadProgressContainer");
  const progressFill = document.getElementById("progressFill");
  const progressLabel = document.getElementById("progressLabel");

  const docList = document.getElementById("docList");
  const btnRefreshDocs = document.getElementById("btnRefreshDocs");
  const filterDocSelect = document.getElementById("filterDocSelect");
  const filterTypeSelect = document.getElementById("filterTypeSelect");

  const searchForm = document.getElementById("searchForm");
  const queryInput = document.getElementById("queryInput");
  const topKSelect = document.getElementById("topKSelect");
  const btnSearch = document.getElementById("btnSearch");
  const resultsHeader = document.getElementById("resultsHeader");
  const resultsCount = document.getElementById("resultsCount");
  const queryTime = document.getElementById("queryTime");
  const resultsList = document.getElementById("resultsList");

  const docModal = document.getElementById("docModal");
  const modalDocTitle = document.getElementById("modalDocTitle");
  const modalDocBody = document.getElementById("modalDocBody");
  const btnModalClose = document.getElementById("btnModalClose");

  // Milestone 2 Elements
  const btnRunScopeAgent = document.getElementById("btnRunScopeAgent");
  const btnRunRiskAgent = document.getElementById("btnRunRiskAgent");
  const btnRunBlockerAgent = document.getElementById("btnRunBlockerAgent");
  const btnRunAllAgents = document.getElementById("btnRunAllAgents");
  const agentFocusInput = document.getElementById("agentFocusInput");
  const agentReportTitle = document.getElementById("agentReportTitle");
  const agentExecTime = document.getElementById("agentExecTime");
  const agentOutputContainer = document.getElementById("agentOutputContainer");

  // Milestone 3 Elements
  const btnSubtabHealth = document.getElementById("btnSubtabHealth");
  const btnSubtabDocs = document.getElementById("btnSubtabDocs");
  const btnSubtabChat = document.getElementById("btnSubtabChat");
  const viewHealth = document.getElementById("viewHealth");
  const viewDocs = document.getElementById("viewDocs");
  const viewChat = document.getElementById("viewChat");

  const btnCalculateHealth = document.getElementById("btnCalculateHealth");
  const healthResultsContainer = document.getElementById("healthResultsContainer");

  const btnGenStories = document.getElementById("btnGenStories");
  const btnGenRisks = document.getElementById("btnGenRisks");
  const btnGenActions = document.getElementById("btnGenActions");
  const btnGenAllDocs = document.getElementById("btnGenAllDocs");
  const docGenFocusInput = document.getElementById("docGenFocusInput");
  const docGenReportTitle = document.getElementById("docGenReportTitle");
  const docGenExecTime = document.getElementById("docGenExecTime");
  const docGenOutputContainer = document.getElementById("docGenOutputContainer");

  const chatMessagesContainer = document.getElementById("chatMessagesContainer");
  const chatInputForm = document.getElementById("chatInputForm");
  const chatInput = document.getElementById("chatInput");
  const btnSendChat = document.getElementById("btnSendChat");
  const quickPromptChips = document.querySelectorAll(".chip-btn");

  // M3 Subtab Switching
  function switchM3View(activeBtn, activeView) {
    [btnSubtabHealth, btnSubtabDocs, btnSubtabChat].forEach(b => b && b.classList.remove("active"));
    [viewHealth, viewDocs, viewChat].forEach(v => v && v.classList.remove("active"));
    activeBtn.classList.add("active");
    activeView.classList.add("active");
  }

  if (btnSubtabHealth) btnSubtabHealth.addEventListener("click", () => switchM3View(btnSubtabHealth, viewHealth));
  if (btnSubtabDocs) btnSubtabDocs.addEventListener("click", () => switchM3View(btnSubtabDocs, viewDocs));
  if (btnSubtabChat) btnSubtabChat.addEventListener("click", () => switchM3View(btnSubtabChat, viewChat));

  // Initial Load
  fetchHealth();
  fetchDocuments();

  // Refresh
  btnRefreshDocs.addEventListener("click", () => {
    fetchHealth();
    fetchDocuments();
  });

  // Modal
  btnModalClose.addEventListener("click", () => docModal.classList.add("hidden"));
  docModal.addEventListener("click", (e) => {
    if (e.target === docModal) docModal.classList.add("hidden");
  });

  // Drag & Drop
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(e.target.files);
      fileInput.value = "";
    }
  });

  // Search
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();
    if (!query) return;
    await executeSearch(query);
  });

  // Milestone 2 Agent Event Handlers
  btnRunScopeAgent.addEventListener("click", () => executeAgent("scope"));
  btnRunRiskAgent.addEventListener("click", () => executeAgent("risk-forecast"));
  btnRunBlockerAgent.addEventListener("click", () => executeAgent("blockers-actions"));
  btnRunAllAgents.addEventListener("click", () => executeAgent("analyze-all"));

  /**
   * Health Check & Metrics
   */
  async function fetchHealth() {
    try {
      const res = await fetch("/api/v1/health");
      if (res.ok) {
        const data = await res.json();
        systemStatus.querySelector(".status-indicator").classList.add("online");
        statusText.textContent = `Online (${data.vector_store})`;
        metricDocsCount.textContent = data.total_documents;
        metricChunksCount.textContent = data.total_chunks;
      } else {
        throw new Error("API returned non-200");
      }
    } catch (err) {
      systemStatus.querySelector(".status-indicator").classList.remove("online");
      statusText.textContent = "Offline / Connecting...";
    }
  }

  /**
   * Upload Files
   */
  async function handleFilesUpload(files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    uploadProgress.classList.remove("hidden");
    progressFill.style.width = "40%";
    progressLabel.textContent = `Uploading & processing ${files.length} document(s)...`;

    try {
      progressFill.style.width = "75%";
      const res = await fetch("/api/v1/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      progressFill.style.width = "100%";

      if (res.ok && data.success) {
        progressLabel.textContent = `Successfully indexed ${data.successful_count} document(s)!`;
        setTimeout(() => uploadProgress.classList.add("hidden"), 2500);
      } else {
        const errorMsg = data.detail ? JSON.stringify(data.detail) : "Upload failed";
        progressLabel.textContent = `Warning/Error: ${errorMsg}`;
      }

      await fetchHealth();
      await fetchDocuments();
    } catch (err) {
      console.error(err);
      progressLabel.textContent = `Upload error: ${err.message}`;
    }
  }

  /**
   * Fetch Documents
   */
  async function fetchDocuments() {
    try {
      const res = await fetch("/api/v1/documents");
      if (!res.ok) return;
      const data = await res.json();
      renderDocumentList(data.documents);
      updateDocSelectFilter(data.documents);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }

  function renderDocumentList(docs) {
    if (!docs || docs.length === 0) {
      docList.innerHTML = `<div class="empty-state">No documents ingested yet. Upload files above to begin.</div>`;
      return;
    }

    docList.innerHTML = docs
      .map((doc) => {
        const typeClass = `type-${doc.file_type}`;
        const sizeKb = (doc.file_size_bytes / 1024).toFixed(1);
        const pagesOrRows = doc.page_count
          ? `${doc.page_count} pgs`
          : doc.row_count
          ? `${doc.row_count} rows`
          : `${doc.char_count} chars`;

        return `
          <div class="doc-card" data-id="${doc.document_id}">
            <div class="doc-info">
              <span class="type-tag ${typeClass}">${doc.file_type}</span>
              <div>
                <div class="doc-name" title="${escapeHtml(doc.original_name)}">${escapeHtml(doc.original_name)}</div>
                <div class="doc-meta">${sizeKb} KB • ${pagesOrRows} • ${doc.chunk_count} chunks</div>
              </div>
            </div>
            <div class="doc-actions">
              <button class="btn btn-sm btn-icon btn-view" onclick="window.viewDoc('${doc.document_id}')">👁 View</button>
              <button class="btn btn-sm btn-danger btn-delete" onclick="window.deleteDoc('${doc.document_id}', '${escapeHtml(doc.original_name)}')">🗑</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function updateDocSelectFilter(docs) {
    const currentVal = filterDocSelect.value;
    filterDocSelect.innerHTML = `<option value="">All Documents</option>` +
      docs.map(d => `<option value="${d.document_id}">${escapeHtml(d.original_name)}</option>`).join("");
    filterDocSelect.value = currentVal;
  }

  window.viewDoc = async function (docId) {
    try {
      const res = await fetch(`/api/v1/documents/${docId}`);
      if (!res.ok) throw new Error("Document not found");
      const data = await res.json();

      modalDocTitle.textContent = data.metadata.original_name;
      modalDocBody.innerHTML = `
        <div class="modal-meta-grid">
          <div class="meta-field"><strong>Type:</strong> ${data.metadata.file_type.toUpperCase()}</div>
          <div class="meta-field"><strong>Size:</strong> ${(data.metadata.file_size_bytes / 1024).toFixed(1)} KB</div>
          <div class="meta-field"><strong>Total Chunks:</strong> ${data.metadata.chunk_count}</div>
          <div class="meta-field"><strong>Sections:</strong> ${data.total_sections}</div>
          <div class="meta-field"><strong>Uploaded:</strong> ${new Date(data.metadata.upload_timestamp).toLocaleString()}</div>
          <div class="meta-field"><strong>Document ID:</strong> ${data.metadata.document_id.slice(0, 8)}...</div>
        </div>
        <h4>Content Preview (First 1,000 Characters):</h4>
        <div class="preview-box">${escapeHtml(data.preview_text || "No preview text available.")}</div>
      `;
      docModal.classList.remove("hidden");
    } catch (err) {
      alert("Error loading document: " + err.message);
    }
  };

  window.deleteDoc = async function (docId, docName) {
    if (!confirm(`Are you sure you want to delete '${docName}' and remove its vector embeddings?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchHealth();
        await fetchDocuments();
      } else {
        alert("Failed to delete document.");
      }
    } catch (err) {
      alert("Error deleting document: " + err.message);
    }
  };

  /**
   * Semantic Search
   */
  async function executeSearch(query) {
    btnSearch.disabled = true;
    btnSearch.innerHTML = "<span>Searching...</span>";
    resultsList.innerHTML = `<div class="empty-state">Computing query embeddings &amp; querying vector database...</div>`;

    const topK = parseInt(topKSelect.value, 10) || 5;
    const docIdFilter = filterDocSelect.value || null;
    const fileTypeFilter = filterTypeSelect.value || null;

    try {
      const res = await fetch("/api/v1/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          top_k: topK,
          document_id: docIdFilter,
          file_type: fileTypeFilter,
          min_score: 0.0,
        }),
      });

      if (!res.ok) throw new Error("Query failed");
      const data = await res.json();
      renderSearchResults(data);
    } catch (err) {
      resultsList.innerHTML = `<div class="empty-state" style="color: var(--danger);">Search error: ${escapeHtml(err.message)}</div>`;
    } finally {
      btnSearch.disabled = false;
      btnSearch.innerHTML = "<span>Query Vector Index</span>";
    }
  }

  function renderSearchResults(data) {
    resultsHeader.style.display = "flex";
    resultsCount.textContent = data.total_results;
    queryTime.textContent = `${data.execution_time_ms}ms`;

    if (data.results.length === 0) {
      resultsList.innerHTML = `<div class="empty-state">No matching vector chunks found.</div>`;
      return;
    }

    resultsList.innerHTML = data.results
      .map((item) => {
        const scorePercent = (item.score * 100).toFixed(1);
        const sourceLoc = item.page_number
          ? `Page ${item.page_number}`
          : item.row_number
          ? `Row ${item.row_number}`
          : `Chunk #${item.chunk_index + 1}`;

        return `
          <div class="chunk-card">
            <div class="chunk-header">
              <div class="chunk-source">
                <span class="type-tag type-${item.file_type}">${item.file_type}</span>
                <strong>${escapeHtml(item.filename)}</strong>
                <span>• ${sourceLoc}</span>
                ${item.section_title ? `<span>(${escapeHtml(item.section_title)})</span>` : ""}
              </div>
              <span class="score-badge">Score: ${scorePercent}%</span>
            </div>
            <div class="chunk-body">${escapeHtml(item.content)}</div>
            <div class="chunk-footer">
              <span>Token Estimate: ~${item.token_estimate}</span>
              <span>Chunk ID: ${item.chunk_id.slice(0, 8)}...</span>
            </div>
          </div>
        `;
      })
      .join("");
  }

  /**
   * Milestone 2 Agent Execution
   */
  async function executeAgent(endpoint) {
    const focusVal = agentFocusInput.value.trim() || null;
    agentOutputContainer.innerHTML = `<div class="empty-state">🤖 Running ${endpoint.toUpperCase()} agent analysis over RAG knowledge base...</div>`;
    agentExecTime.textContent = "Executing...";

    try {
      const res = await fetch(`/api/v1/agents/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query_context: focusVal }),
      });

      if (!res.ok) throw new Error(`Agent endpoint returned error: ${res.statusText}`);
      const data = await res.json();

      if (endpoint === "scope") {
        renderScopeResult(data);
      } else if (endpoint === "risk-forecast") {
        renderRiskResult(data);
      } else if (endpoint === "blockers-actions") {
        renderBlockerResult(data);
      } else if (endpoint === "analyze-all") {
        renderFullAnalysisReport(data);
      }
    } catch (err) {
      agentOutputContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Agent Execution Failed: ${escapeHtml(err.message)}</div>`;
      agentExecTime.textContent = "Error";
    }
  }

  function renderScopeResult(data) {
    agentReportTitle.textContent = `🎯 Scope & Deliverables Report: ${data.project_title || "Project Workspace"}`;
    agentExecTime.textContent = `${data.execution_time_ms}ms (${data.retrieved_chunks_count} chunks analyzed)`;

    const goalsList = data.project_goals || data.goals || [];
    const deliverablesList = data.deliverables || [];
    const milestonesList = data.milestones || [];
    const timelinesList = data.timelines || [];
    const ownersList = data.responsible_owners || data.responsibilities || [];

    let html = `
      <div class="executive-summary-box">
        <strong>Executive Summary:</strong> ${escapeHtml(data.summary)}
      </div>

      <!-- 1. Project Goals -->
      <div class="insight-block">
        <div class="insight-block-header">
          <h4>🎯 Project Goals &amp; Objectives (${goalsList.length})</h4>
        </div>
        <div class="item-list-grid">
          ${goalsList.length > 0 ? goalsList.map(g => `
            <div class="insight-card">
              <div class="insight-card-title">
                <strong>Goal ${escapeHtml(g.goal_id || '')}</strong>
                <span class="status-pill pill-medium">${escapeHtml(g.category || 'strategic')}</span>
              </div>
              <div class="insight-card-desc" style="font-size: 1.05em; font-weight: 500; margin-bottom: 4px;">${escapeHtml(g.statement)}</div>
              ${g.supporting_context ? `<div class="insight-card-desc" style="color: #94a3b8; font-size: 0.85em;"><em>Context:</em> "${escapeHtml(g.supporting_context)}"</div>` : ''}
              ${g.source_document ? `<div class="grounding-tag">📄 Source: ${escapeHtml(g.source_document)}</div>` : g.source_reference ? `<div class="grounding-tag">📄 Source: ${escapeHtml(g.source_reference.filename)}</div>` : ''}
            </div>
          `).join("") : `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 16px; background: rgba(30, 41, 59, 0.4); border-radius: 8px;">
              <p style="margin-bottom: 6px; font-weight: 500;">No explicit project goals found in the uploaded documents.</p>
              <div style="font-size: 0.85em; color: #94a3b8;">
                Retrieved ${data.retrieved_chunks_count} context chunks analyzed across: ${[...new Set(data.grounding_references?.map(r => r.filename) || [])].join(", ") || "knowledge base"}.
              </div>
            </div>
          `}
        </div>
      </div>

      <!-- 2. Deliverables -->
      <div class="insight-block">
        <div class="insight-block-header">
          <h4>📦 Deliverables (${deliverablesList.length})</h4>
        </div>
        <div class="item-list-grid">
          ${deliverablesList.length > 0 ? deliverablesList.map(d => `
            <div class="insight-card">
              <div class="insight-card-title">
                <strong>${escapeHtml(d.name)}</strong>
                <span class="status-pill ${d.status === 'completed' ? 'pill-on-track' : 'pill-medium'}">${escapeHtml(d.status)}</span>
              </div>
              <div class="insight-card-desc"><strong>Owner:</strong> ${escapeHtml(d.owner)} ${d.target_date ? `| <strong>Due:</strong> ${escapeHtml(d.target_date)}` : ''}</div>
              <div class="insight-card-desc" style="margin-top:4px;">${escapeHtml(d.description)}</div>
              ${d.source_reference ? `<div class="grounding-tag">📄 ${escapeHtml(d.source_reference.filename)} (${(d.source_reference.similarity_score * 100).toFixed(0)}% match)</div>` : ''}
            </div>
          `).join("") : "<div class='empty-state' style='grid-column: 1 / -1;'>No deliverables found.</div>"}
        </div>
      </div>

      <!-- 3. Milestones -->
      <div class="insight-block">
        <div class="insight-block-header">
          <h4>🚩 Milestones (${milestonesList.length})</h4>
        </div>
        <div class="item-list-grid">
          ${milestonesList.length > 0 ? milestonesList.map(m => `
            <div class="insight-card">
              <div class="insight-card-title">
                <strong>${escapeHtml(m.title)}</strong>
                <span class="status-pill pill-on-track">${escapeHtml(m.target_timeline || 'Planned')}</span>
              </div>
              <div class="insight-card-desc"><strong>Owner:</strong> ${escapeHtml(m.owner)}</div>
              ${m.source_document ? `<div class="grounding-tag">📄 Source: ${escapeHtml(m.source_document)}</div>` : ''}
            </div>
          `).join("") : "<div class='empty-state' style='grid-column: 1 / -1;'>No explicit milestones found.</div>"}
        </div>
      </div>

      <!-- 4. Timelines & Deadlines -->
      <div class="insight-block">
        <div class="insight-block-header">
          <h4>⏱️ Timelines &amp; Deadlines (${timelinesList.length})</h4>
        </div>
        <div class="item-list-grid">
          ${timelinesList.length > 0 ? timelinesList.map(t => `
            <div class="insight-card">
              <div class="insight-card-title">
                <strong>${escapeHtml(t.milestone_or_task)}</strong>
                <span class="status-pill pill-high">Deadline: ${escapeHtml(t.target_deadline)}</span>
              </div>
              <div class="insight-card-desc"><strong>Status:</strong> ${escapeHtml(t.status)}</div>
              ${t.source_document ? `<div class="grounding-tag">📄 Source: ${escapeHtml(t.source_document)}</div>` : ''}
            </div>
          `).join("") : "<div class='empty-state' style='grid-column: 1 / -1;'>No explicit deadlines extracted.</div>"}
        </div>
      </div>

      <!-- 5. Responsible Owners -->
      <div class="insight-block">
        <div class="insight-block-header">
          <h4>👤 Responsible Owners &amp; Roles (${ownersList.length})</h4>
        </div>
        <div class="item-list-grid">
          ${ownersList.length > 0 ? ownersList.map(r => `
            <div class="insight-card">
              <div class="insight-card-title">
                <strong>👤 ${escapeHtml(r.role_or_person)}</strong>
              </div>
              <div class="insight-card-desc"><strong>Area:</strong> ${escapeHtml(r.responsibility_area)}</div>
              <div class="insight-card-desc" style="margin-top: 4px;"><strong>Deliverables:</strong> ${escapeHtml(r.associated_deliverables.join(", "))}</div>
              ${r.source_document ? `<div class="grounding-tag">📄 Document: ${escapeHtml(r.source_document)}</div>` : ''}
            </div>
          `).join("") : "<div class='empty-state' style='grid-column: 1 / -1;'>No explicit owner assignments extracted.</div>"}
        </div>
      </div>
    `;

    agentOutputContainer.innerHTML = html;
  }

  function renderRiskResult(data) {
    agentReportTitle.textContent = `⚠️ Risk Detection & Delivery Forecast`;
    agentExecTime.textContent = `${data.execution_time_ms}ms (${data.retrieved_chunks_count} chunks analyzed)`;

    const overallStatus = data.forecast.overall_status;
    const statusClass = overallStatus === "On Track" ? "pill-on-track" : overallStatus === "At Risk" ? "pill-at-risk" : "pill-critical";

    let html = `
      <div class="executive-summary-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
          <strong>Forecast Status: <span class="status-pill ${statusClass}">${escapeHtml(overallStatus)}</span></strong>
          <span>Slippage Probability: <strong>${(data.forecast.slippage_probability * 100).toFixed(1)}%</strong></span>
        </div>
        <div>${escapeHtml(data.executive_risk_statement)}</div>
      </div>

      <div class="insight-block">
        <div class="insight-block-header">
          <h4>🛡️ Detected Risk Register (${data.total_risks_detected})</h4>
        </div>
        <div class="item-list-grid">
          ${data.detected_risks.map(r => {
            const rClass = r.level === "Critical" ? "pill-critical" : r.level === "High" ? "pill-high" : r.level === "Medium" ? "pill-medium" : "pill-low";
            return `
              <div class="insight-card">
                <div class="insight-card-title">
                  <strong>${escapeHtml(r.title)}</strong>
                  <span class="status-pill ${rClass}">${escapeHtml(r.level)}</span>
                </div>
                <div class="insight-card-desc"><strong>Category:</strong> ${escapeHtml(r.category)}</div>
                <div class="insight-card-desc" style="margin-top:4px;"><strong>Reason:</strong> ${escapeHtml(r.reason)}</div>
                <div class="insight-card-desc" style="margin-top:4px; color: #a7f3d0;"><strong>Mitigation:</strong> ${escapeHtml(r.suggested_mitigation)}</div>
                ${r.source_reference ? `<div class="grounding-tag">📄 Source: ${escapeHtml(r.source_reference.filename)}</div>` : ""}
              </div>
            `;
          }).join("") || "<div class='empty-state' style='grid-column: 1 / -1;'>No risks identified.</div>"}
        </div>
      </div>
    `;

    agentOutputContainer.innerHTML = html;
  }

  function renderBlockerResult(data) {
    agentReportTitle.textContent = `🚧 Blockers & Action Items Report`;
    agentExecTime.textContent = `${data.execution_time_ms}ms (${data.retrieved_chunks_count} chunks analyzed)`;

    const blockersList = data.active_blockers || data.blockers || [];
    const actionsList = data.action_items || [];
    const decisionsList = data.pending_decisions || [];

    let html = `
      <div class="executive-summary-box">
        <strong>Summary:</strong> ${escapeHtml(data.executive_summary)}
      </div>

      <!-- 1. Active Blockers -->
      <div class="insight-block">
        <div class="insight-block-header">
          <h4>🛑 Active Blockers (${blockersList.length})</h4>
        </div>
        <div class="item-list-grid">
          ${blockersList.length > 0 ? blockersList.map(b => `
            <div class="insight-card" style="border-left: 3px solid var(--danger);">
              <div class="insight-card-title">
                <strong>${escapeHtml(b.blocker_id || 'Blocker')}: ${escapeHtml(b.description)}</strong>
                <span class="status-pill pill-critical">${escapeHtml(b.severity)}</span>
              </div>
              <div class="insight-card-desc"><strong>Category:</strong> ${escapeHtml(b.category || 'Dependency')} | <strong>Status:</strong> ${escapeHtml(b.status || 'active')}</div>
              ${b.owner && b.owner !== 'Unassigned' ? `<div class="insight-card-desc"><strong>Owner:</strong> ${escapeHtml(b.owner)}</div>` : ''}
              ${b.related_dependency ? `<div class="insight-card-desc" style="color: #fca5a5;"><strong>Dependency:</strong> ${escapeHtml(b.related_dependency)}</div>` : ''}
              ${b.supporting_context ? `<div class="insight-card-desc" style="margin-top: 4px; color: #94a3b8; font-size: 0.85em;"><em>Context:</em> "${escapeHtml(b.supporting_context)}"</div>` : ''}
              ${b.source_document ? `<div class="grounding-tag">📄 Source: ${escapeHtml(b.source_document)}</div>` : b.source_reference ? `<div class="grounding-tag">📄 Source: ${escapeHtml(b.source_reference.filename)}</div>` : ''}
            </div>
          `).join("") : `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 16px; background: rgba(30, 41, 59, 0.4); border-radius: 8px;">
              <p style="font-weight: 600; color: #38bdf8; margin-bottom: 4px;">No active blockers identified from the uploaded documents.</p>
              <p style="color: #94a3b8; font-size: 0.9em;"><strong>${actionsList.length} action items</strong> and <strong>${decisionsList.length} pending decisions</strong> were dynamically identified and are tracked below.</p>
            </div>
          `}
        </div>
      </div>

      <!-- 2. Action Items -->
      <div class="insight-block">
        <div class="insight-block-header">
          <h4>✅ Action Items &amp; Next Steps (${actionsList.length})</h4>
        </div>
        <div class="item-list-grid">
          ${actionsList.length > 0 ? actionsList.map(a => `
            <div class="insight-card">
              <div class="insight-card-title">
                <strong>${escapeHtml(a.task_description)}</strong>
                <span class="status-pill pill-medium">${escapeHtml(a.priority)}</span>
              </div>
              <div class="insight-card-desc"><strong>Assignee:</strong> ${escapeHtml(a.assignee)} ${a.due_date ? `| <strong>Due:</strong> ${escapeHtml(a.due_date)}` : ''}</div>
              <div class="insight-card-desc"><strong>Status:</strong> ${escapeHtml(a.status)}</div>
              ${a.source_document ? `<div class="grounding-tag">📄 Source: ${escapeHtml(a.source_document)}</div>` : a.source_reference ? `<div class="grounding-tag">📄 Source: ${escapeHtml(a.source_reference.filename)}</div>` : ''}
            </div>
          `).join("") : "<div class='empty-state' style='grid-column: 1 / -1;'>No action items found.</div>"}
        </div>
      </div>

      <!-- 3. Pending Decisions -->
      <div class="insight-block">
        <div class="insight-block-header">
          <h4>⚖️ Pending Architectural &amp; Product Decisions (${decisionsList.length})</h4>
        </div>
        <div class="item-list-grid">
          ${decisionsList.length > 0 ? decisionsList.map(d => `
            <div class="insight-card">
              <div class="insight-card-title">
                <strong>${escapeHtml(d.decision_needed)}</strong>
                <span class="status-pill pill-high">Urgency: ${escapeHtml(d.urgency)}</span>
              </div>
              <div class="insight-card-desc"><strong>Context:</strong> ${escapeHtml(d.context)}</div>
              <div class="insight-card-desc"><strong>Decision Maker:</strong> ${escapeHtml(d.decision_maker)}</div>
              ${d.source_document ? `<div class="grounding-tag">📄 Source: ${escapeHtml(d.source_document)}</div>` : d.source_reference ? `<div class="grounding-tag">📄 Source: ${escapeHtml(d.source_reference.filename)}</div>` : ''}
            </div>
          `).join("") : "<div class='empty-state' style='grid-column: 1 / -1;'>No pending decisions found.</div>"}
        </div>
      </div>
    `;

    agentOutputContainer.innerHTML = html;
  }

  function renderFullAnalysisReport(data) {
    agentReportTitle.textContent = `🌟 Full Multi-Agent Intelligence Report`;
    agentExecTime.textContent = `${data.total_execution_time_ms}ms (Multi-Agent Pipeline)`;

    // Render individual components to string
    const scopeData = data.scope_analysis;
    const riskData = data.risk_and_forecast;
    const blockerData = data.blockers_and_actions;

    renderScopeResult(scopeData);
    const scopeHtml = agentOutputContainer.innerHTML;

    renderRiskResult(riskData);
    const riskHtml = agentOutputContainer.innerHTML;

    renderBlockerResult(blockerData);
    const blockerHtml = agentOutputContainer.innerHTML;

    let execHtml = `
      <div class="executive-summary-box">
        <strong>Consolidated Executive Synthesis:</strong>
        <div style="margin-top: 6px; white-space: pre-wrap;">${escapeHtml(data.overall_executive_summary)}</div>
      </div>
    `;

    agentOutputContainer.innerHTML = execHtml + scopeHtml + riskHtml + blockerHtml;
    agentReportTitle.textContent = `🌟 Full Multi-Agent Intelligence Report`;
    agentExecTime.textContent = `${data.total_execution_time_ms}ms (Multi-Agent Pipeline)`;
  }

  // =========================================================================
  // Milestone 3: Health Scoring Event Handlers & Rendering
  // =========================================================================
  if (btnCalculateHealth) {
    btnCalculateHealth.addEventListener("click", async () => {
      healthResultsContainer.innerHTML = `<div class="empty-state">🚦 Calculating multi-dimensional project health from RAG knowledge base...</div>`;
      try {
        const res = await fetch("/api/v1/m3/health-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query_context: null })
        });
        if (!res.ok) throw new Error(`Health score API returned ${res.statusText}`);
        const data = await res.json();
        renderHealthResults(data);
      } catch (err) {
        healthResultsContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Health calculation failed: ${escapeHtml(err.message)}</div>`;
      }
    });
  }

  function renderHealthResults(data) {
    // Update top metric card
    if (metricHealthScore) metricHealthScore.textContent = `${data.overall_health_score} / 100`;
    if (metricHealthStatus) {
      metricHealthStatus.textContent = data.health_status;
      metricHealthStatus.style.color = data.status_color;
    }

    const badgeClass = data.health_status === "Healthy" ? "pill-on-track" : data.health_status === "At Risk" ? "pill-medium" : "pill-critical";

    let html = `
      <div class="health-overview-card">
        <div class="health-gauge-box" style="border-color: ${data.status_color};">
          <span class="health-gauge-number">${data.overall_health_score}</span>
          <span class="health-gauge-label">Score / 100</span>
        </div>
        <div style="flex:1;">
          <div class="health-status-badge ${badgeClass}">${escapeHtml(data.health_status)} Project Status</div>
          <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 0.8rem;">
            ${escapeHtml(data.executive_summary)}
          </p>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            Diagnostic synthesis analyzed across ${data.retrieved_chunks_count} knowledge base chunks.
          </div>
        </div>
      </div>

      <!-- Dimensions Grid -->
      <h3 style="margin-bottom: 0.8rem; font-size: 1.1rem;">📊 Diagnostic Health Dimensions</h3>
      <div class="health-dimensions-grid">
        ${data.dimensions.map(d => {
          const dimBadge = d.status === "Healthy" ? "pill-on-track" : d.status === "At Risk" ? "pill-medium" : "pill-critical";
          const fillColor = d.status === "Healthy" ? "var(--success)" : d.status === "At Risk" ? "var(--warning)" : "var(--danger)";
          return `
            <div class="dimension-card">
              <div class="dimension-header">
                <strong>${escapeHtml(d.dimension_name)}</strong>
                <span class="status-pill ${dimBadge}">${d.score}/100</span>
              </div>
              <div class="dimension-bar-track">
                <div class="dimension-bar-fill" style="width: ${d.score}%; background: ${fillColor};"></div>
              </div>
              <div style="font-size: 0.84rem; color: var(--text-secondary);">${escapeHtml(d.summary)}</div>
              <ul class="dimension-factors-list">
                ${d.key_factors.map(f => `<li>${escapeHtml(f)}</li>`).join("")}
              </ul>
            </div>
          `;
        }).join("")}
      </div>

      <!-- Key Drivers & Recommendations -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.2rem; margin-top: 1.5rem;">
        <div class="panel" style="padding: 1.2rem; background: var(--bg-card);">
          <h4 style="margin-bottom: 0.8rem; color: #38bdf8;">⚡ Key Diagnostic Drivers</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.88rem;">
            ${data.key_drivers.map(k => `<li style="padding-left: 1rem; border-left: 2px solid var(--primary);">${escapeHtml(k)}</li>`).join("")}
          </ul>
        </div>

        <div class="panel" style="padding: 1.2rem; background: var(--bg-card);">
          <h4 style="margin-bottom: 0.8rem; color: #34d399;">💡 Grounded Health Recommendations</h4>
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${data.recommendations.map(r => `
              <div style="background: rgba(15, 23, 42, 0.6); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border-left: 3px solid ${r.priority === 'High' ? 'var(--danger)' : 'var(--primary)'};">
                <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                  <strong style="font-size: 0.88rem;">${escapeHtml(r.action)}</strong>
                  <span class="status-pill ${r.priority === 'High' ? 'pill-high' : 'pill-medium'}">${escapeHtml(r.priority)}</span>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Owner: ${escapeHtml(r.target_owner)} ${r.grounded_context ? `• Source: ${escapeHtml(r.grounded_context)}` : ''}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    healthResultsContainer.innerHTML = html;
  }

  // =========================================================================
  // Milestone 3: Documentation Generation Event Handlers & Rendering
  // =========================================================================
  if (btnGenStories) btnGenStories.addEventListener("click", () => executeDocGen("user-stories", "User Stories"));
  if (btnGenRisks) btnGenRisks.addEventListener("click", () => executeDocGen("risk-register", "Risk Register"));
  if (btnGenActions) btnGenActions.addEventListener("click", () => executeDocGen("action-items", "Action Items"));
  if (btnGenAllDocs) btnGenAllDocs.addEventListener("click", () => executeDocGen("all", "Full Documentation Package"));

  async function executeDocGen(endpoint, title) {
    const focusVal = docGenFocusInput ? (docGenFocusInput.value.trim() || null) : null;
    docGenOutputContainer.innerHTML = `<div class="empty-state">📋 Generating grounded ${escapeHtml(title)} from RAG knowledge base...</div>`;
    docGenReportTitle.textContent = `Generating ${title}...`;
    docGenExecTime.textContent = "Executing...";

    try {
      const res = await fetch(`/api/v1/m3/docs/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query_context: focusVal })
      });

      if (!res.ok) throw new Error(`Doc Gen API returned ${res.statusText}`);
      const data = await res.json();

      if (endpoint === "user-stories") {
        renderUserStories(data);
      } else if (endpoint === "risk-register") {
        renderRiskRegister(data);
      } else if (endpoint === "action-items") {
        renderActionItems(data);
      } else if (endpoint === "all") {
        renderAllDocs(data);
      }
    } catch (err) {
      docGenOutputContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Documentation generation failed: ${escapeHtml(err.message)}</div>`;
      docGenExecTime.textContent = "Error";
    }
  }

  function renderUserStories(stories) {
    docGenReportTitle.textContent = `📖 Agile User Stories (${stories.length})`;
    docGenExecTime.textContent = `${stories.length} stories generated`;

    if (!stories || stories.length === 0) {
      docGenOutputContainer.innerHTML = `<div class="empty-state">No user stories could be derived from currently indexed documents.</div>`;
      return;
    }

    let html = `
      <div class="user-stories-list">
        ${stories.map(s => `
          <div class="user-story-card">
            <div class="user-story-header">
              <div>
                <strong>Story ${escapeHtml(s.story_id)}: ${escapeHtml(s.title)}</strong>
                <span class="type-tag" style="margin-left: 8px;">${escapeHtml(s.category)}</span>
              </div>
              <span class="status-pill ${s.priority === 'High' ? 'pill-high' : 'pill-medium'}">${escapeHtml(s.priority)} Priority</span>
            </div>
            <div class="user-story-formula">
              <div><strong>As a</strong> ${escapeHtml(s.as_a)}</div>
              <div><strong>I want</strong> ${escapeHtml(s.i_want)}</div>
              <div><strong>So that</strong> ${escapeHtml(s.so_that)}</div>
            </div>
            <div class="user-story-criteria">
              <strong>Acceptance Criteria:</strong>
              <ul>
                ${s.acceptance_criteria.map(ac => `<li>${escapeHtml(ac)}</li>`).join("")}
              </ul>
            </div>
            ${s.source_document ? `<div class="grounding-tag">📄 Source: ${escapeHtml(s.source_document)}</div>` : ''}
          </div>
        `).join("")}
      </div>
    `;

    docGenOutputContainer.innerHTML = html;
  }

  function renderRiskRegister(risks) {
    docGenReportTitle.textContent = `🛡️ Enterprise Risk Register (${risks.length})`;
    docGenExecTime.textContent = `${risks.length} risks logged`;

    if (!risks || risks.length === 0) {
      docGenOutputContainer.innerHTML = `<div class="empty-state">No project risks identified.</div>`;
      return;
    }

    let html = `
      <div class="data-table-wrapper">
        <table class="styled-table">
          <thead>
            <tr>
              <th>Risk ID</th>
              <th>Title / Description</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Likelihood / Impact</th>
              <th>Mitigation Strategy</th>
              <th>Owner / Source</th>
            </tr>
          </thead>
          <tbody>
            ${risks.map(r => `
              <tr>
                <td><code>${escapeHtml(r.risk_id)}</code></td>
                <td>
                  <strong>${escapeHtml(r.risk_title)}</strong>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(r.description)}</div>
                </td>
                <td><span class="type-tag">${escapeHtml(r.category)}</span></td>
                <td><span class="status-pill ${r.severity === 'Critical' ? 'pill-critical' : r.severity === 'High' ? 'pill-high' : 'pill-medium'}">${escapeHtml(r.severity)}</span></td>
                <td>L: ${escapeHtml(r.likelihood)} / I: ${escapeHtml(r.impact)}</td>
                <td style="max-width: 250px;">${escapeHtml(r.mitigation_strategy)}</td>
                <td>
                  <div>${escapeHtml(r.owner)}</div>
                  <div style="font-size: 0.75rem; color: #38bdf8;">${escapeHtml(r.source_document)}</div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    docGenOutputContainer.innerHTML = html;
  }

  function renderActionItems(actions) {
    docGenReportTitle.textContent = `✅ Action Items & Checklist (${actions.length})`;
    docGenExecTime.textContent = `${actions.length} action items`;

    if (!actions || actions.length === 0) {
      docGenOutputContainer.innerHTML = `<div class="empty-state">No action items extracted.</div>`;
      return;
    }

    let html = `
      <div class="data-table-wrapper">
        <table class="styled-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Task Description</th>
              <th>Assignee</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Source Document</th>
            </tr>
          </thead>
          <tbody>
            ${actions.map(a => `
              <tr>
                <td><code>${escapeHtml(a.item_id)}</code></td>
                <td><strong>${escapeHtml(a.task_description)}</strong></td>
                <td>👤 ${escapeHtml(a.assignee)}</td>
                <td>⏱️ ${escapeHtml(a.target_date || 'Planned')}</td>
                <td><span class="status-pill ${a.priority === 'High' ? 'pill-high' : 'pill-medium'}">${escapeHtml(a.priority)}</span></td>
                <td><span class="status-pill pill-on-track">${escapeHtml(a.status)}</span></td>
                <td><span style="font-size: 0.78rem; color: #38bdf8;">${escapeHtml(a.source_document)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    docGenOutputContainer.innerHTML = html;
  }

  function renderAllDocs(data) {
    docGenReportTitle.textContent = `🚀 Complete Project Documentation Package`;
    docGenExecTime.textContent = `${data.execution_time_ms}ms (${data.total_user_stories} stories, ${data.total_risks} risks, ${data.total_action_items} actions)`;

    let html = `
      <div class="executive-summary-box" style="margin-bottom: 1.2rem;">
        <strong>Documentation Package Summary:</strong> ${escapeHtml(data.executive_summary)}
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.8rem;">1. 📖 Agile User Stories (${data.user_stories.length})</h4>
        ${data.user_stories.slice(0, 5).map(s => `
          <div class="user-story-card" style="margin-bottom: 0.6rem;">
            <div class="user-story-header">
              <strong>Story ${escapeHtml(s.story_id)}: ${escapeHtml(s.title)}</strong>
              <span class="status-pill pill-medium">${escapeHtml(s.priority)}</span>
            </div>
            <div class="user-story-formula" style="font-size: 0.85rem; padding: 0.5rem 0.8rem;">
              As a <em>${escapeHtml(s.as_a)}</em>, I want <em>${escapeHtml(s.i_want)}</em>, so that <em>${escapeHtml(s.so_that)}</em>
            </div>
          </div>
        `).join("")}
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.8rem;">2. 🛡️ Enterprise Risk Register (${data.risk_register.length})</h4>
        <div class="data-table-wrapper">
          <table class="styled-table">
            <thead>
              <tr><th>Risk ID</th><th>Title</th><th>Severity</th><th>Mitigation</th><th>Source</th></tr>
            </thead>
            <tbody>
              ${data.risk_register.map(r => `
                <tr>
                  <td><code>${escapeHtml(r.risk_id)}</code></td>
                  <td><strong>${escapeHtml(r.risk_title)}</strong></td>
                  <td><span class="status-pill ${r.severity === 'Critical' ? 'pill-critical' : 'pill-high'}">${escapeHtml(r.severity)}</span></td>
                  <td>${escapeHtml(r.mitigation_strategy)}</td>
                  <td><span style="font-size: 0.75rem; color:#38bdf8;">${escapeHtml(r.source_document)}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.8rem;">3. ✅ Action Items (${data.action_items.length})</h4>
        <div class="data-table-wrapper">
          <table class="styled-table">
            <thead>
              <tr><th>Item ID</th><th>Task</th><th>Assignee</th><th>Due Date</th><th>Source</th></tr>
            </thead>
            <tbody>
              ${data.action_items.map(a => `
                <tr>
                  <td><code>${escapeHtml(a.item_id)}</code></td>
                  <td><strong>${escapeHtml(a.task_description)}</strong></td>
                  <td>${escapeHtml(a.assignee)}</td>
                  <td>${escapeHtml(a.target_date || 'Planned')}</td>
                  <td><span style="font-size: 0.75rem; color:#38bdf8;">${escapeHtml(a.source_document)}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div style="margin-top: 1.5rem;">
        <h4 style="margin-bottom: 0.5rem;">📋 Raw Markdown Export</h4>
        <div class="preview-box">${escapeHtml(data.markdown_export)}</div>
      </div>
    `;

    docGenOutputContainer.innerHTML = html;
  }

  // =========================================================================
  // Milestone 3: Conversational Intelligence Assistant Event Handlers
  // =========================================================================
  let conversationId = `CONV-${Date.now().toString(36).toUpperCase()}`;

  if (chatInputForm) {
    chatInputForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const query = chatInput.value.trim();
      if (!query) return;
      await sendChatMessage(query);
      chatInput.value = "";
    });
  }

  quickPromptChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-query");
      if (q) {
        sendChatMessage(q);
      }
    });
  });

  async function sendChatMessage(question) {
    // Append user message bubble
    appendChatBubble("user", question);

    // Append loading assistant bubble
    const loadingId = `msg-loading-${Date.now()}`;
    const loadingBubble = document.createElement("div");
    loadingBubble.className = "chat-message assistant-message";
    loadingBubble.id = loadingId;
    loadingBubble.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <span style="color: var(--text-muted);">Thinking & retrieving knowledge from indexed documents...</span>
      </div>
    `;
    chatMessagesContainer.appendChild(loadingBubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    if (btnSendChat) btnSendChat.disabled = true;

    try {
      const res = await fetch("/api/v1/m3/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          conversation_id: conversationId
        })
      });

      if (!res.ok) throw new Error(`Chat API error: ${res.statusText}`);
      const data = await res.json();

      // Remove loading placeholder
      const el = document.getElementById(loadingId);
      if (el) el.remove();

      // Append real response
      appendChatBubble("assistant", data.answer, data.source_references, data.suggested_followups);
    } catch (err) {
      const el = document.getElementById(loadingId);
      if (el) {
        el.querySelector(".message-content").innerHTML = `<span style="color: var(--danger);">Error: ${escapeHtml(err.message)}</span>`;
      }
    } finally {
      if (btnSendChat) btnSendChat.disabled = false;
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  }

  function appendChatBubble(role, content, references = [], followups = []) {
    const bubble = document.createElement("div");
    bubble.className = `chat-message ${role === 'user' ? 'user-message' : 'assistant-message'}`;

    const avatar = role === 'user' ? '👤' : '🤖';

    // Format simple markdown into HTML
    let formattedContent = escapeHtml(content)
      .replace(/^### (.*$)/gim, '<h3 style="margin: 6px 0; font-size: 1.05rem;">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 style="margin: 4px 0; font-size: 0.95rem; color: #38bdf8;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code style="background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px;">$1</code>')
      .replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 1.2rem;">$1</li>')
      .replace(/\n\n/g, '<br/><br/>');

    let refsHtml = "";
    if (references && references.length > 0) {
      refsHtml = `
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 0.8rem;">
          <strong style="color: var(--text-muted);">📄 Source Grounding Citations:</strong>
          <div style="display:flex; flex-wrap:wrap; gap: 4px; margin-top: 4px;">
            ${references.slice(0, 4).map(r => `
              <span class="grounding-tag" title="${escapeHtml(r.snippet)}">
                ${escapeHtml(r.filename)} (${(r.similarity_score * 100).toFixed(0)}% match)
              </span>
            `).join("")}
          </div>
        </div>
      `;
    }

    let followupsHtml = "";
    if (followups && followups.length > 0) {
      followupsHtml = `
        <div style="margin-top: 8px; display:flex; flex-wrap:wrap; gap: 4px;">
          ${followups.map(f => `
            <button class="chip-btn" style="font-size: 0.74rem;" onclick="document.getElementById('chatInput').value='${escapeHtml(f)}'; document.getElementById('btnSendChat').click();">
              ${escapeHtml(f)}
            </button>
          `).join("")}
        </div>
      `;
    }

    bubble.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div>${formattedContent}</div>
        ${refsHtml}
        ${followupsHtml}
      </div>
    `;

    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  // =====================================================================
  // Milestone 4: Executive Insights & Risk Dashboard Implementation
  // =====================================================================

  let currentDashboardData = null;
  let currentRiskFilter = "ALL";

  async function loadM4Dashboard(focusQuery = "") {
    const container = document.getElementById("m4DashboardContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="card-panel" style="text-align: center; padding: 50px 20px;">
        <div style="font-size: 2.5rem; animation: spin 2s linear infinite;">⚙️</div>
        <h3 style="margin-top: 14px; color: #fff;">Synthesizing Executive Intelligence &amp; Risk Dashboard...</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 6px;">
          Running multi-agent RAG reasoning over all indexed project documents
        </p>
      </div>
    `;

    try {
      const url = focusQuery ? `/api/v1/m4/dashboard?query_context=${encodeURIComponent(focusQuery)}` : `/api/v1/m4/dashboard`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Dashboard API responded with status ${res.status}`);
      }
      const data = await res.json();
      currentDashboardData = data;
      renderM4Dashboard(data, focusQuery);
    } catch (err) {
      console.error("Failed to load Milestone 4 Dashboard:", err);
      container.innerHTML = `
        <div class="card-panel banner-error" style="padding: 24px;">
          <h3>⚠️ Unable to Load Dashboard</h3>
          <p style="margin-top: 6px;">${escapeHtml(err.message)}</p>
          <button class="btn btn-primary" style="margin-top: 14px;" onclick="loadM4Dashboard()">🔄 Retry</button>
        </div>
      `;
    }
  }

  function renderM4Dashboard(data, focusQuery = "") {
    const container = document.getElementById("m4DashboardContainer");
    if (!container) return;

    const health = data.health || {};
    const scope = data.scope || {};
    const risks = data.risks || {};
    const blockersActions = data.blockers_actions || {};
    const kb = data.knowledge_base || {};
    const forecast = risks.forecast || {};
    const recommendations = data.key_recommendations || health.recommendations || [];

    const goals = scope.project_goals || scope.goals || [];
    const deliverables = scope.deliverables || [];
    const boundaries = scope.scope_boundaries || {};
    const detectedRisks = risks.detected_risks || [];
    const activeBlockers = blockersActions.active_blockers || blockersActions.blockers || [];
    const actionItems = blockersActions.action_items || [];

    const filteredRisks = currentRiskFilter === "ALL"
      ? detectedRisks
      : detectedRisks.filter(r => (r.level || "").toUpperCase() === currentRiskFilter);

    const healthScore = Math.round(health.overall_health_score || 0);
    const healthBadge = healthScore >= 80 ? "health-badge-good" : (healthScore >= 60 ? "health-badge-warning" : "health-badge-critical");
    const statusPillClass = (health.health_status || "").toLowerCase().includes("healthy") ? "status-healthy" : ((health.health_status || "").toLowerCase().includes("at risk") ? "status-warning" : "status-critical");

    container.innerHTML = `
      <div class="dashboard-root">
        <!-- 1. Toolbar & Controls -->
        <div class="card-panel dashboard-toolbar">
          <div class="toolbar-header">
            <div>
              <div style="display:flex; align-items:center; gap: 10px;">
                <h2 style="font-size: 1.35rem; font-weight: 700; color: #fff;">Executive Project Intelligence &amp; Risk Dashboard</h2>
              </div>
              <p style="color: var(--text-muted); font-size: 0.84rem; margin-top: 4px;">
                Workspace: <strong style="color: #c7d2fe;">${escapeHtml(data.project_title || 'Project')}</strong> • Live Multi-Agent Synthesis
              </p>
            </div>
            <button class="btn btn-primary" id="btnM4Rerun">⚡ Rerun Analysis</button>
          </div>

          <!-- Focus Query Input Form -->
          <form class="dashboard-filter-form" id="m4FilterForm">
            <div style="display: flex; gap: 8px;">
              <input 
                type="text" 
                id="m4FocusInput" 
                class="search-input" 
                placeholder="Filter analysis by sprint or feature focus (e.g. 'Sprint 4', 'Payment Gateway', 'Security')..."
                value="${escapeHtml(focusQuery)}"
              />
              <button type="submit" class="btn btn-primary">Focus</button>
              ${focusQuery ? `<button type="button" class="btn btn-secondary" id="btnM4ClearFocus">Clear</button>` : ''}
            </div>
          </form>

          <!-- Live KB Stats Strip -->
          <div class="kb-stats-strip">
            <div class="kb-stat-item">
              <span class="kb-stat-icon">📚</span>
              <div>
                <div class="kb-stat-num">${kb.total_documents || 0} Documents</div>
                <div class="kb-stat-lbl">PDF, DOCX, CSV, TXT</div>
              </div>
            </div>
            <div class="kb-stat-item">
              <span class="kb-stat-icon">🧩</span>
              <div>
                <div class="kb-stat-num">${kb.total_chunks || 0} Indexed Chunks</div>
                <div class="kb-stat-lbl">ChromaDB Vector Store</div>
              </div>
            </div>
            <div class="kb-stat-item">
              <span class="kb-stat-icon">⏱️</span>
              <div>
                <div class="kb-stat-num">${data.execution_time_ms || 0} ms</div>
                <div class="kb-stat-lbl">Synthesis Latency</div>
              </div>
            </div>
            <div class="kb-stat-item">
              <span class="kb-stat-icon">🛡️</span>
              <div>
                <div class="kb-stat-num">${detectedRisks.length} Risks / ${activeBlockers.length} Blockers</div>
                <div class="kb-stat-lbl">Detected Challenges</div>
              </div>
            </div>
          </div>

          <!-- Incremental Ingestion Box -->
          <div class="incremental-upload-box">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap: 10px;">
              <div>
                <h4 style="font-size: 0.92rem; font-weight: 600; color: #e0e7ff;">➕ Incremental Document Ingestion</h4>
                <p style="font-size: 0.78rem; color: var(--text-muted);">
                  Upload new PDF, DOCX, CSV, or TXT files to augment the knowledge base without deleting existing documents.
                </p>
              </div>
              <div style="display:flex; gap: 8px; align-items:center;">
                <input type="file" id="m4IncFileInput" multiple accept=".pdf,.docx,.doc,.csv,.txt,.md" style="display:none;" />
                <button type="button" class="btn btn-secondary" id="btnM4ChooseFiles">📂 Choose Files (<span id="m4IncCount">0</span>)</button>
                <button type="button" class="btn btn-primary" id="btnM4UploadInc" style="display:none;">🚀 Ingest &amp; Rerun</button>
              </div>
            </div>
            <div id="m4SelectedFilesList" class="selected-inc-files"></div>
            <div id="m4IncMessageBanner"></div>
          </div>
        </div>

        <!-- 2. KPI Cards Grid -->
        <div class="kpi-grid">
          <!-- Overall Health Score Card -->
          <div class="card-panel kpi-card">
            <div class="kpi-label">Project Health Score</div>
            <div class="kpi-health-wrapper">
              <div class="health-score-circle ${healthBadge}">
                <span class="health-score-val">${healthScore}</span>
                <span class="health-score-max">/100</span>
              </div>
              <div class="health-status-meta">
                <span class="status-pill ${statusPillClass}">${escapeHtml(health.health_status || 'Evaluating')}</span>
                <p style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">Multi-agent health synthesis</p>
              </div>
            </div>

            <div class="dimension-bar-list">
              <div class="dim-row">
                <span class="dim-name">Scope Clarity</span>
                <div class="dim-bar-track">
                  <div class="dim-bar-fill fill-cyan" style="width: ${Math.min(100, health.scope_clarity_score || 0)}%;"></div>
                </div>
                <span class="dim-val">${Math.round(health.scope_clarity_score || 0)}%</span>
              </div>
              <div class="dim-row">
                <span class="dim-name">Timeline Risk</span>
                <div class="dim-bar-track">
                  <div class="dim-bar-fill fill-amber" style="width: ${Math.min(100, health.timeline_risk_score || 0)}%;"></div>
                </div>
                <span class="dim-val">${Math.round(health.timeline_risk_score || 0)}%</span>
              </div>
              <div class="dim-row">
                <span class="dim-name">Blocker Score</span>
                <div class="dim-bar-track">
                  <div class="dim-bar-fill fill-rose" style="width: ${Math.min(100, health.blocker_score || 0)}%;"></div>
                </div>
                <span class="dim-val">${Math.round(health.blocker_score || 0)}%</span>
              </div>
            </div>
          </div>

          <!-- Timeline & Delivery Forecast Card -->
          <div class="card-panel kpi-card">
            <div class="kpi-label">Delivery Timeline Risk</div>
            <div style="display:flex; align-items:baseline; gap: 10px; margin-top: 8px;">
              <span class="status-pill ${statusPillClass}">⏱️ ${escapeHtml(forecast.overall_status || 'On Track')}</span>
              <span style="font-size: 0.82rem; color: var(--text-muted);">
                Slippage Risk: <strong style="color: #f59e0b;">${Math.round((forecast.slippage_probability || 0) * 100)}%</strong>
              </span>
            </div>

            <div style="margin-top: 14px;">
              <div style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 6px;">
                Forecast Factors:
              </div>
              ${(forecast.key_forecast_factors || forecast.forecast_factors) && (forecast.key_forecast_factors || forecast.forecast_factors).length > 0 ? `
                <ul style="list-style: none; padding-left: 0;">
                  ${(forecast.key_forecast_factors || forecast.forecast_factors).slice(0, 3).map(f => `
                    <li style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px; padding-left: 12px; position: relative;">
                      <span style="position: absolute; left: 0; color: var(--accent-amber); font-weight: bold;">•</span>
                      ${escapeHtml(f)}
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <p style="font-size: 0.82rem; color: var(--text-muted);">Milestone schedules aligned with projected delivery dates.</p>
              `}
            </div>
          </div>

          <!-- Executive Summary Card -->
          <div class="card-panel kpi-card">
            <div class="kpi-label">Executive Synthesis</div>
            <p style="margin-top: 8px; line-height: 1.55; font-size: 0.88rem; color: #e2e8f0;">
              ${escapeHtml(data.executive_summary || 'Analysis complete.')}
            </p>
          </div>
        </div>

        <!-- 3. Main Dashboard Columns Grid -->
        <div class="dashboard-columns-grid">
          <!-- Left Column: Scope & Action Items & Recommendations -->
          <div class="dashboard-col">
            <!-- Scope Summary -->
            <div class="card-panel widget-panel">
              <div class="widget-header">
                <h3>🎯 Scope &amp; Deliverables Summary</h3>
                <span class="badge-count">${deliverables.length} Deliverables</span>
              </div>

              <!-- Goals -->
              <div class="widget-subsection">
                <div class="widget-subtitle">Project Goals</div>
                ${goals.length > 0 ? `
                  <div class="goal-list">
                    ${goals.map(g => `
                      <div class="goal-card">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <span class="goal-category-tag">${escapeHtml(g.category || 'Goal')}</span>
                          <span style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(g.goal_id || '')}</span>
                        </div>
                        <p class="goal-text">${escapeHtml(g.statement)}</p>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <p style="font-size: 0.84rem; color: var(--text-muted);">${escapeHtml(scope.empty_goals_message || 'No explicit goals found.')}</p>
                `}
              </div>

              <!-- Deliverables Table -->
              <div class="widget-subsection">
                <div class="widget-subtitle">Key Deliverables</div>
                ${deliverables.length > 0 ? `
                  <div style="overflow-x: auto;">
                    <table class="dashboard-table">
                      <thead>
                        <tr>
                          <th>Deliverable</th>
                          <th>Owner</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${deliverables.map(d => `
                          <tr>
                            <td style="font-weight: 500;">${escapeHtml(d.name)}</td>
                            <td style="color: var(--text-muted);">${escapeHtml(d.owner || 'Unassigned')}</td>
                            <td><span class="status-pill status-healthy">${escapeHtml(d.status || 'Planned')}</span></td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : `
                  <p style="font-size: 0.84rem; color: var(--text-muted);">No deliverables extracted.</p>
                `}
              </div>

              <!-- Scope Boundaries -->
              ${(boundaries.in_scope?.length > 0 || boundaries.out_of_scope?.length > 0) ? `
                <div class="widget-subsection">
                  <div class="widget-subtitle">Scope Boundaries</div>
                  <div class="boundaries-grid">
                    ${boundaries.in_scope?.length > 0 ? `
                      <div class="boundary-col in-scope">
                        <span class="boundary-title">✅ In Scope</span>
                        <ul>
                          ${boundaries.in_scope.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                        </ul>
                      </div>
                    ` : ''}
                    ${boundaries.out_of_scope?.length > 0 ? `
                      <div class="boundary-col out-scope">
                        <span class="boundary-title">🚫 Out of Scope</span>
                        <ul>
                          ${boundaries.out_of_scope.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                        </ul>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Action Items Checklist -->
            <div class="card-panel widget-panel">
              <div class="widget-header">
                <h3>✅ Action Items Checklist</h3>
                <span class="badge-count">${actionItems.length} Tasks</span>
              </div>
              ${actionItems.length > 0 ? `
                <div class="action-items-list">
                  ${actionItems.map(a => `
                    <div class="action-item-row">
                      <div class="action-checkbox">✓</div>
                      <div style="flex:1;">
                        <div class="action-desc">${escapeHtml(a.task_description)}</div>
                        <div class="action-meta">
                          <span>👤 <strong>${escapeHtml(a.assignee || 'Unassigned')}</strong></span>
                          ${a.due_date ? `<span>📅 Due: ${escapeHtml(a.due_date)}</span>` : ''}
                          ${a.priority ? `<span class="priority-tag tag-${(a.priority || '').toLowerCase()}">${escapeHtml(a.priority)}</span>` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p style="font-size: 0.84rem; color: var(--text-muted);">${escapeHtml(blockersActions.empty_actions_message || 'No pending action items.')}</p>
              `}
            </div>

            <!-- Recommendations -->
            ${recommendations.length > 0 ? `
              <div class="card-panel widget-panel">
                <div class="widget-header">
                  <h3>💡 Strategic Recommendations</h3>
                  <span class="badge-count">${recommendations.length} Actions</span>
                </div>
                <div class="rec-list">
                  ${recommendations.map(r => `
                    <div class="rec-card">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="priority-tag tag-${(r.priority || 'medium').toLowerCase()}">${escapeHtml(r.priority || 'Medium')} Priority</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">Target: ${escapeHtml(r.target_owner || 'Team')}</span>
                      </div>
                      <p class="rec-action-text">${escapeHtml(r.action)}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Right Column: Active Blockers & Extracted Risks -->
          <div class="dashboard-col">
            <!-- Active Blockers Panel -->
            <div class="card-panel widget-panel">
              <div class="widget-header">
                <h3 style="color: #fda4af;">🛑 Active Blockers</h3>
                <span class="badge-count" style="background: rgba(244, 63, 94, 0.2); color: #f87171;">${activeBlockers.length} Active</span>
              </div>
              ${activeBlockers.length > 0 ? `
                <div class="blocker-list">
                  ${activeBlockers.map(b => `
                    <div class="blocker-card">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="risk-tag risk-tag-critical">${escapeHtml(b.severity?.value || b.severity || 'HIGH')} SEVERITY</span>
                        ${b.category ? `<span style="font-size: 0.74rem; color: var(--text-muted);">${escapeHtml(b.category)}</span>` : ''}
                      </div>
                      <div class="blocker-desc">${escapeHtml(b.description)}</div>
                      ${b.impact ? `<div class="blocker-impact"><strong>Impact:</strong> ${escapeHtml(b.impact)}</div>` : ''}
                      ${b.source_document ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">📄 Source: ${escapeHtml(b.source_document)}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="empty-substate">✅ No active blockers identified in knowledge base.</div>
              `}
            </div>

            <!-- Extracted Risks Register -->
            <div class="card-panel widget-panel">
              <div class="widget-header">
                <div style="display:flex; align-items:center; gap: 8px;">
                  <h3>⚠️ Extracted Risks Register</h3>
                  <span class="badge-count">${detectedRisks.length} Detected</span>
                </div>
                <div class="risk-filter-chips">
                  ${['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => `
                    <button class="filter-chip ${currentRiskFilter === lvl ? 'active' : ''}" data-level="${lvl}">
                      ${lvl}
                    </button>
                  `).join('')}
                </div>
              </div>

              ${filteredRisks.length > 0 ? `
                <div class="risks-list">
                  ${filteredRisks.map(r => {
                    const lvl = (r.level?.value || r.level || 'MEDIUM').toUpperCase();
                    const tagClass = lvl === 'CRITICAL' ? 'risk-tag-critical' : (lvl === 'HIGH' ? 'risk-tag-high' : (lvl === 'LOW' ? 'risk-tag-low' : 'risk-tag-medium'));
                    return `
                      <div class="risk-item-card">
                        <div class="risk-item-top">
                          <span class="risk-tag ${tagClass}">${escapeHtml(lvl)}</span>
                          <span class="risk-cat-label">${escapeHtml(r.category?.value || r.category || 'Risk')}</span>
                        </div>
                        <h4 class="risk-title">${escapeHtml(r.title)}</h4>
                        <p class="risk-reason">${escapeHtml(r.reason)}</p>
                        ${r.suggested_mitigation ? `
                          <div class="risk-mitigation-box">
                            🛡️ <strong>Mitigation:</strong> ${escapeHtml(r.suggested_mitigation)}
                          </div>
                        ` : ''}
                        ${r.source_document ? `
                          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">📄 Source: ${escapeHtml(r.source_document)}</div>
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : `
                <div class="empty-substate">No ${currentRiskFilter === 'ALL' ? '' : currentRiskFilter} risks detected in current project artifacts.</div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // Wire up events in newly rendered DOM
    wireM4Events(focusQuery);
  }

  function wireM4Events(focusQuery) {
    const btnRerun = document.getElementById("btnM4Rerun");
    if (btnRerun) {
      btnRerun.addEventListener("click", () => loadM4Dashboard(focusQuery));
    }

    const formFilter = document.getElementById("m4FilterForm");
    if (formFilter) {
      formFilter.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("m4FocusInput");
        const val = input ? input.value.trim() : "";
        loadM4Dashboard(val);
      });
    }

    const btnClearFocus = document.getElementById("btnM4ClearFocus");
    if (btnClearFocus) {
      btnClearFocus.addEventListener("click", () => loadM4Dashboard(""));
    }

    // Risk filter buttons
    const chips = document.querySelectorAll(".filter-chip[data-level]");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        currentRiskFilter = chip.getAttribute("data-level");
        if (currentDashboardData) {
          renderM4Dashboard(currentDashboardData, focusQuery);
        }
      });
    });

    // Incremental upload file input
    const incInput = document.getElementById("m4IncFileInput");
    const btnChoose = document.getElementById("btnM4ChooseFiles");
    const btnUpload = document.getElementById("btnM4UploadInc");
    const incCount = document.getElementById("m4IncCount");
    const selectedList = document.getElementById("m4SelectedFilesList");

    if (btnChoose && incInput) {
      btnChoose.addEventListener("click", () => incInput.click());
    }

    if (incInput) {
      incInput.addEventListener("change", () => {
        const files = Array.from(incInput.files || []);
        if (incCount) incCount.textContent = files.length;
        if (btnUpload) btnUpload.style.display = files.length > 0 ? "inline-block" : "none";
        if (selectedList) {
          selectedList.innerHTML = files.map(f => `
            <span class="inc-file-pill">📄 ${escapeHtml(f.name)} (${(f.size / 1024).toFixed(1)} KB)</span>
          `).join('');
        }
      });
    }

    if (btnUpload && incInput) {
      btnUpload.addEventListener("click", async () => {
        const files = incInput.files;
        if (!files || files.length === 0) return;

        btnUpload.disabled = true;
        btnUpload.textContent = "⏳ Ingesting...";
        const banner = document.getElementById("m4IncMessageBanner");

        try {
          const formData = new FormData();
          for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
          }

          const res = await fetch("/api/v1/m4/incremental-upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail?.message || err.detail || "Incremental upload failed");
          }

          const resData = await res.json();
          if (banner) {
            banner.innerHTML = `
              <div class="inc-message-banner banner-success">
                ${escapeHtml(resData.message)}
              </div>
            `;
          }

          // Clear files
          incInput.value = "";
          if (incCount) incCount.textContent = "0";
          if (selectedList) selectedList.innerHTML = "";
          btnUpload.style.display = "none";

          // Refresh documents and rerun dashboard
          fetchDocuments();
          await loadM4Dashboard(focusQuery);
        } catch (err) {
          if (banner) {
            banner.innerHTML = `
              <div class="inc-message-banner banner-error">
                ❌ Ingestion failed: ${escapeHtml(err.message)}
              </div>
            `;
          }
        } finally {
          btnUpload.disabled = false;
          btnUpload.textContent = "🚀 Ingest & Rerun";
        }
      });
    }
  }

  // Auto load Milestone 4 Dashboard on startup
  loadM4Dashboard();

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});

