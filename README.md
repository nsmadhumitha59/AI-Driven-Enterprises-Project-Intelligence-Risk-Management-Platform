# AI Project Intelligence & Risk Advisor (Milestones 1, 2, 3 & 4)

> **Complete Platform Deliverables**: Document Ingestion (PDF, DOCX, CSV, TXT), Persistent RAG Subsystem (ChromaDB + SentenceTransformers), Specialized Multi-Agent Intelligence (Scope, Risk Forecasting, Blocker & Action Items), Grounded Documentation Generation (Agile User Stories, Enterprise Risk Register, Action Item Checklist), Multi-Dimensional Project Health Scoring, Conversational Project Intelligence Assistant, and the **Milestone 4 Executive Project Insights & Risk Summary Dashboard with Incremental Document Upload & Dynamic Knowledge Base Re-Analysis**.

---

## 🌟 Platform Capabilities Overview

### Milestone 1: Core Ingestion & RAG Subsystem
- **Multi-Format Ingestion**: PDF (`pypdf`), DOCX (`python-docx`), CSV (`pandas`), and TXT / Markdown.
- **Content Normalizer**: Unicode NFKC normalization, whitespace sanitization, and structural boundary preservation ([`src/ingestion/normalizer.py`](file:///src/ingestion/normalizer.py)).
- **Chunking & Vector Indexing**: Recursive boundary-aware text splitter, SentenceTransformers (`all-MiniLM-L6-v2`, 384-dim dense embeddings), and persistent ChromaDB vector storage ([`src/rag/`](file:///src/rag/)).
- **Semantic Retrieval**: Cosine similarity search with score thresholding, top-k ranking, and metadata filtering ([`src/rag/retriever.py`](file:///src/rag/retriever.py)).

### Milestone 2: Specialized Intelligence Agents
1. **Scope & Deliverables Extraction Agent** ([`src/agents/scope_agent.py`](file:///src/agents/scope_agent.py)):
   - Extracts: Project goals with priority, Scope boundaries (in-scope, out-of-scope, constraints), Deliverables, Milestones, and Responsibility assignments.
2. **Risk Detection & Delivery Forecasting Agent** ([`src/agents/risk_forecast_agent.py`](file:///src/agents/risk_forecast_agent.py)):
   - Identifies: Schedule risks, dependency bottlenecks, missing specifications, delivery challenges, and deadline risks.
   - Categorization & Severity: `Critical`, `High`, `Medium`, `Low` with supporting rationale and actionable mitigations.
   - Delivery Forecast: Overall status (`On Track`, `At Risk`, `Delayed`), slippage probability percentage, and forecast factors.
3. **Blocker & Action Item Identification Agent** ([`src/agents/blocker_action_agent.py`](file:///src/agents/blocker_action_agent.py)):
   - Extracts: Active blockers, pending decisions, unresolved issues, and action items with assignees and due dates.
4. **Milestone 2 Multi-Agent Orchestrator** ([`src/agents/orchestrator.py`](file:///src/agents/orchestrator.py)):
   - Combines and synthesizes all 3 agents into a unified project intelligence report with executive summary.

### Milestone 3: Health Scoring, Documentation Generation & Conversational Assistant
1. **Documentation Generation Studio** ([`src/agents/doc_gen_agent.py`](file:///src/agents/doc_gen_agent.py)):
   - Generates Agile User Stories (`As a... I want... So that...` with acceptance criteria).
   - Generates Enterprise Risk Registers (Impact, Likelihood, Severity, Mitigation, Contingency).
   - Generates Action Items Checklists (Assignee, Target Date, Status, Provenance).
   - Exports complete documentation in clean Markdown and structured JSON.
2. **Multi-Dimensional Project Health Scoring** ([`src/agents/health_scorer.py`](file:///src/agents/health_scorer.py)):
   - Overall Project Health Score (0–100) and Health Status (`Healthy`, `At Risk`, `Critical`).
   - Dimension 1: Scope Clarity (0–100).
   - Dimension 2: Timeline Risk (0–100).
   - Dimension 3: Blocker Count & Issue Severity (0–100).
   - Actionable, prioritized health recommendations with target owners.
3. **Conversational Project Intelligence Assistant** ([`src/agents/chat_assistant.py`](file:///src/agents/chat_assistant.py)):
   - Natural language conversational queries (`Are we on track?`, `What are our biggest risks?`, `What are current blockers?`).
   - Direct provenance tracking with similarity scores, chunk snippets, and document references.

### Milestone 4: Executive Insights & Risk Summary Dashboard & Incremental Upload
1. **Project Insights & Risk Summary Dashboard** ([`src/api/m4_routes.py`](file:///src/api/m4_routes.py), [`frontend/src/components/ProjectDashboard.jsx`](file:///frontend/src/components/ProjectDashboard.jsx)):
   - **Overall Project Health Score**: Circular score meter with diagnostic status pill and progress bars for Scope Clarity, Timeline Risk, and Blocker Severity.
   - **Scope Summary**: Goals with priority, Scope boundaries (In-Scope vs. Out-of-Scope), Deliverables table with owners, and Milestones.
   - **Extracted Risks Register**: Interactive severity filtering (`ALL`, `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), risk rationale, mitigation strategies, and source provenance.
   - **Active Blockers**: Prominent high-severity blocker cards with impact analysis and source document references.
   - **Action Items Checklist**: Checklist with assignees, due dates, priority tags, and status.
   - **Timeline Risk & Delivery Forecast**: Slippage probability percentage, delivery status, and key forecast factors.
   - **Key Recommendations**: Prioritized actionable recommendations targeting executive owners.
   - **Live Synthesis**: Recomputes all widgets dynamically across the RAG knowledge base.
2. **Incremental Document Upload & Dynamic Re-Analysis**:
   - Allows users to upload additional PDF, DOCX, CSV, and TXT files after initial ingestion.
   - Extracts → Chunks → Embeds → Appends to the existing ChromaDB vector index without deleting prior data.
   - Displays real-time document count and indexed chunk count.
   - Live "Rerun Analysis" button recomputes the entire dashboard dynamically with the updated knowledge base.

---

## 🚀 Quickstart Guide

### 1. Launching the Backend API & Web Server

```bash
python run.py serve --port 8000
```

- **Interactive Web Portal**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger API Interactive Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Specification**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### 2. Launching the React Frontend Application (Optional)

```bash
cd frontend
npm install
npm run dev
```

- **React Dashboard UI**: [http://localhost:3000/](http://localhost:3000/)

---

## 🛠️ Command-Line Interface (CLI)

```bash
# 1. Milestone 4 Executive Dashboard (Dynamic Synthesis)
python run.py dashboard                                  # Full Dashboard summary
python run.py dashboard --focus "Sprint 4"               # Focused Dashboard on Sprint 4
python run.py dashboard --focus "hotel operations"       # Focused on Hotel Operations

# 2. Ingestion & RAG
python run.py ingest path/to/document.pdf
python run.py ingest path/to/sprint_tasks.csv
python run.py query "Who is responsible for authentication?" --top-k 5
python run.py stats                                      # Knowledge base stats

# 3. Milestone 2 Agents
python run.py agent scope                                # Scope & Deliverables
python run.py agent risk                                 # Risk Detection & Forecast
python run.py agent blockers                             # Blockers & Action Items
python run.py agent all                                  # Full Multi-Agent Pipeline

# 4. Milestone 3 Documentation & Health & Chat
python run.py docs all                                   # Full Documentation Package
python run.py docs stories                               # User Stories
python run.py docs risks                                 # Risk Register
python run.py docs actions                               # Action Checklist
python run.py health                                     # Project Health Scorecard
python run.py chat "What are the active blockers?"        # Conversational Assistant
```

---

## 📡 REST API Reference

### Milestone 1: Ingestion & RAG
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/documents/upload` | Upload & index documents (PDF, DOCX, CSV, TXT) |
| `GET` | `/api/v1/documents` | List all ingested documents |
| `GET` | `/api/v1/documents/{id}` | Get document metadata and preview |
| `DELETE` | `/api/v1/documents/{id}` | Delete document and vector embeddings |
| `POST` | `/api/v1/rag/query` | Semantic vector retrieval with scores |
| `GET` | `/api/v1/health` | System health and vector metrics |

### Milestone 2: Specialized Agents
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/agents/scope` | Run Scope & Deliverable Extraction Agent |
| `POST` | `/api/v1/agents/risk-forecast` | Run Risk Detection & Delivery Forecasting Agent |
| `POST` | `/api/v1/agents/blockers-actions` | Run Blocker & Action Item Identification Agent |
| `POST` | `/api/v1/agents/analyze-all` | Run all 3 agents and get unified synthesis |

### Milestone 3: Health Score, Documentation & Chat
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/m3/health-score` | Calculate Project Health Score (0-100) & dimensions |
| `POST` | `/api/v1/m3/docs/user-stories` | Generate Agile User Stories |
| `POST` | `/api/v1/m3/docs/risk-register` | Generate Enterprise Risk Register |
| `POST` | `/api/v1/m3/docs/action-items` | Generate Action Items Checklist |
| `POST` | `/api/v1/m3/docs/all` | Generate full documentation package (Markdown export) |
| `POST` | `/api/v1/m3/chat` | Conversational RAG assistant with citations |

### Milestone 4: Executive Dashboard & Incremental Ingestion
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/m4/dashboard` | Get dynamic Project Insights & Risk Summary Dashboard |
| `POST` | `/api/v1/m4/dashboard` | Generate focused dashboard with custom topic/sprint |
| `GET` | `/api/v1/m4/stats` | Real-time Knowledge Base stats (doc count & chunk count) |
| `POST` | `/api/v1/m4/incremental-upload` | Incrementally upload new documents without replacing previous data |

---

## 🧪 Automated Testing (50 Tests Passing)

Run the full automated test suite with pytest:

```bash
.venv\Scripts\pytest -v
```

### Test Coverage Summary:
- **`tests/test_milestone4_e2e.py`**:
  - Full end-to-end multi-format workflow across PDF, DOCX, CSV, and TXT.
  - Incremental document upload verification (knowledge base preservation and chunk count growth).
  - Dynamic dashboard API endpoints (`GET` / `POST` `/api/v1/m4/dashboard`).
  - Incremental upload API endpoint (`POST` `/api/v1/m4/incremental-upload`).
  - Real-time knowledge stats endpoint (`GET` `/api/v1/m4/stats`).
- **`tests/test_m3_api.py`**: Health scoring, user stories, risk register, action checklist, and chat endpoints.
- **`tests/test_doc_gen_agent.py`**, **`test_health_scorer.py`**, **`test_chat_assistant.py`**: Milestone 3 agents.
- **`tests/test_agent_api.py`**, **`test_agent_validation.py`**, **`test_scope_agent.py`**, **`test_risk_forecast_agent.py`**, **`test_blocker_action_agent.py`**: Milestone 2 agents.
- **`tests/test_ingestion.py`**, **`test_chunking.py`**, **`test_embeddings.py`**, **`test_vectorstore.py`**, **`test_retrieval.py`**, **`test_api.py`**: Milestone 1 core engine.

---

## 🛡️ Milestone 4 Completion Status

- [x] **Project Insights & Risk Summary Dashboard**: Dynamic health score, scope summary, extracted risks, active blockers, action items, timeline risk, key recommendations.
- [x] **Incremental Document Upload**: Seamless multi-format upload appending to vector store without data loss.
- [x] **End-to-End Workflow Testing**: Validated across PDF, DOCX, CSV, TXT, all agents, health scorer, dashboard, and chatbot.
- [x] **Technical Documentation**: Comprehensive architecture, module layout, API reference, CLI guides, and test suite.
