# AI-Driven Enterprise Project Intelligence & Risk Management Platform

> An enterprise-grade, agentic AI platform designed to continuously analyze project artifacts (PRDs, sprint backlogs, architecture decision records, standup logs, and meeting minutes) across multiple document formats. The platform autonomously detects risks, forecasts delivery timelines, identifies blockers and action items, calculates multi-dimensional health scores, generates grounded documentation, and renders live executive insights on an interactive dashboard.

---

## 🌟 Platform Capabilities Overview

### 1. Multi-Format Document Ingestion & Persistent Vector RAG Subsystem
- **Multi-Format Parsing Engine**: Native extraction across PDF (`pypdf`), DOCX (`python-docx`), CSV (`pandas`), and TXT / Markdown files with multi-encoding detection (UTF-8, Latin-1, CP1252).
- **Content Normalizer**: Unicode NFKC normalization, whitespace sanitization, hyphenated line-wrap restoration, and structural section boundary preservation ([`src/ingestion/normalizer.py`](file:///src/ingestion/normalizer.py)).
- **Chunking & Dense Vector Indexing**: Recursive boundary-aware text splitter (paragraph, sentence, clause boundaries with sliding-window overlap), SentenceTransformers (`all-MiniLM-L6-v2`, 384-dimensional dense semantic vectors with L2 normalization), and persistent ChromaDB vector storage ([`src/rag/`](file:///src/rag/)).
- **Semantic Retrieval**: Cosine similarity retrieval with confidence thresholding, top-k ranking, and rich metadata filtering (`document_id`, `file_type`, `chunk_index`, provenance snippet).

### 2. Autonomous Multi-Agent Intelligence Network
1. **Scope & Deliverables Extraction Agent** ([`src/agents/scope_agent.py`](file:///src/agents/scope_agent.py)):
   - Identifies project objectives and prioritization levels.
   - Extracts explicit scope boundaries (in-scope vs. out-of-scope boundaries and technical constraints).
   - Extracts deliverables, target milestones, and team responsibility assignments.
2. **Risk Detection & Delivery Forecasting Agent** ([`src/agents/risk_forecast_agent.py`](file:///src/agents/risk_forecast_agent.py)):
   - Identifies technical bottlenecks, schedule risks, dependency vulnerabilities, missing specifications, and staffing gaps.
   - Categorization & Severity Matrix: `Critical`, `High`, `Medium`, and `Low` with technical rationale and actionable mitigations.
   - Delivery Forecasting: Predicts overall delivery trajectory (`On Track`, `At Risk`, `Delayed`), delivery slippage probability percentage, and primary contributing factors.
3. **Blocker & Action Item Resolution Agent** ([`src/agents/blocker_action_agent.py`](file:///src/agents/blocker_action_agent.py)):
   - Extracts active blockers, pending technical decisions, unresolved architecture hurdles, and action items with assignees and due dates.
4. **Multi-Agent Orchestrator** ([`src/agents/orchestrator.py`](file:///src/agents/orchestrator.py)):
   - Coordinates multi-agent parallel execution and synthesizes individual agent findings into a cohesive project intelligence report.

### 3. Multi-Dimensional Project Health Scoring & Diagnostics
- **Comprehensive Health Score (0–100)**: Transparent weighted scoring engine providing an instant status badge (`Healthy`, `At Risk`, `Critical`) ([`src/agents/health_scorer.py`](file:///src/agents/health_scorer.py)).
- **Diagnostic Dimensions**:
  - **Scope Clarity Score (0–100)**: Evaluates clarity of requirements, goal completeness, and constraint definition.
  - **Timeline Risk Score (0–100)**: Evaluates schedule slippage risk, deadline tightness, and velocity.
  - **Blocker Severity Score (0–100)**: Evaluates active blocker volume and unresolved dependencies.
- **Actionable Strategic Recommendations**: Automatically produces prioritized mitigation tasks with designated owners.

### 4. Grounded Agile Documentation Generation Studio
- **Agile User Stories**: Generates structured stories in `As a... I want... So that...` syntax complete with Gherkin-style Acceptance Criteria ([`src/agents/doc_gen_agent.py`](file:///src/agents/doc_gen_agent.py)).
- **Enterprise Risk Register**: Comprehensive risk matrices including category, impact, likelihood, overall severity, mitigation strategy, and contingency ownership.
- **Action Items Checklist**: Actionable tasks mapped to specific assignees, target deadlines, priority flags, and source provenance.
- **Export Formats**: Supports clean, presentation-ready Markdown and structured JSON exports.

### 5. Conversational Project Intelligence Assistant (RAG Chatbot)
- **Natural Language Inquiry**: Inquire about project status in plain English (`Are we on track?`, `What are our highest risks?`, `Who is assigned to authentication?`) ([`src/agents/chat_assistant.py`](file:///src/agents/chat_assistant.py)).
- **Strict Evidence Provenance**: Answers are strictly grounded in retrieved chunks with citations, similarity scores, and document source previews.
- **Smart Follow-ups**: Provides context-aware proactive follow-up suggestions for deeper exploration.

### 6. Executive Project Insights & Risk Summary Dashboard
- **Interactive Health Gauge**: Circular animated health score meter with dynamic status pill and diagnostic sub-score progress bars.
- **Scope Breakdown**: Clear visual layout of goals, in-scope vs out-of-scope boundaries, deliverables table, and key milestones.
- **Risk Severity Filter**: Interactive filtering (`ALL`, `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) with detailed technical mitigations.
- **High-Priority Blocker Cards**: Prominent alerts highlighting critical blockers requiring immediate attention.
- **Action Items Checklist**: Live checklist with assignees, target dates, and priority indicators.
- **Timeline & Slippage Forecast**: Statistical forecast displaying slippage probability percentage and core forecast factors.
- **Executive Recommendations**: Prioritized actionable guidance targeted at project leadership.

### 7. Incremental Document Upload & Dynamic Knowledge Base Re-Analysis
- **Zero-Loss Incremental Uploads**: Upload new PDF, DOCX, CSV, or TXT project documents at any time. The system processes, splits, embeds, and appends new vectors to the existing ChromaDB collection without overwriting historical data.
- **Live Knowledge Statistics**: Real-time tracking of active document count and total indexed chunk count.
- **Dynamic Re-Analysis**: Re-runs all intelligence agents across the updated corpus with one click.

---

## 🚀 Quickstart Guide

### 1. Launching the Backend API & Integrated Web Portal

```bash
python run.py serve --port 8000
```

- **Interactive Web Portal**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger Interactive API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc API Specification**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### 2. Launching the React Frontend Application (Optional)

```bash
cd frontend
npm install
npm run dev
```

- **React Executive Dashboard UI**: [http://localhost:3000/](http://localhost:3000/)

---

## 🛠️ Command-Line Interface (CLI)

The platform provides a comprehensive CLI for ingestion, analysis, and dashboard synthesis:

```bash
# 1. Executive Dashboard (Dynamic Knowledge Base Synthesis)
python run.py dashboard                                  # Full Dashboard summary
python run.py dashboard --focus "Sprint 4"               # Focused Dashboard on Sprint 4
python run.py dashboard --focus "hotel operations"       # Focused on Hotel Operations

# 2. Ingestion & Semantic Retrieval
python run.py ingest path/to/project_charter.docx
python run.py ingest path/to/sprint_tasks.csv
python run.py query "Who is responsible for authentication?" --top-k 5
python run.py stats                                      # Knowledge base statistics

# 3. Specialized Multi-Agent Intelligence
python run.py agent scope                                # Scope & Deliverables Extraction
python run.py agent risk                                 # Risk Detection & Delivery Forecasting
python run.py agent blockers                             # Blockers & Action Items Identification
python run.py agent all                                  # Full Multi-Agent Pipeline Execution

# 4. Documentation Generation, Health Scoring & Chat
python run.py docs all                                   # Full Documentation Package Export
python run.py docs stories                               # Generate Agile User Stories
python run.py docs risks                                 # Generate Enterprise Risk Register
python run.py docs actions                               # Generate Action Checklist
python run.py health                                     # Project Health Scorecard
python run.py chat "What are the active blockers?"        # Conversational Intelligence Query
```

---

## 📡 REST API Reference

### 1. Document Ingestion & RAG Subsystem
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/documents/upload` | Upload & index documents (PDF, DOCX, CSV, TXT) |
| `GET` | `/api/v1/documents` | List all ingested project documents |
| `GET` | `/api/v1/documents/{id}` | Get document metadata and text preview |
| `DELETE` | `/api/v1/documents/{id}` | Delete document and associated vector embeddings |
| `POST` | `/api/v1/rag/query` | Semantic vector retrieval with confidence scores |
| `GET` | `/api/v1/health` | System health check and storage metrics |

### 2. Specialized Multi-Agent Intelligence
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/agents/scope` | Run Scope & Deliverable Extraction Agent |
| `POST` | `/api/v1/agents/risk-forecast` | Run Risk Detection & Delivery Forecasting Agent |
| `POST` | `/api/v1/agents/blockers-actions` | Run Blocker & Action Item Identification Agent |
| `POST` | `/api/v1/agents/analyze-all` | Run complete multi-agent pipeline with unified synthesis |

### 3. Health Scoring, Documentation Studio & Conversational Assistant
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/m3/health-score` | Calculate Project Health Score (0-100) & dimensions |
| `POST` | `/api/v1/m3/docs/user-stories` | Generate Agile User Stories with acceptance criteria |
| `POST` | `/api/v1/m3/docs/risk-register` | Generate Enterprise Risk Register |
| `POST` | `/api/v1/m3/docs/action-items` | Generate Action Items Checklist |
| `POST` | `/api/v1/m3/docs/all` | Generate full documentation package with Markdown export |
| `POST` | `/api/v1/m3/chat` | Conversational RAG assistant with grounded citations |

### 4. Executive Dashboard & Incremental Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/m4/dashboard` | Get synthesized Executive Project Insights & Risk Summary Dashboard |
| `POST` | `/api/v1/m4/dashboard` | Generate focused dashboard filtered by custom sprint or topic |
| `GET` | `/api/v1/m4/stats` | Real-time Knowledge Base metrics (document count & chunk count) |
| `POST` | `/api/v1/m4/incremental-upload` | Incrementally upload and index new documents without data loss |

---

## 🧪 Automated Testing Suite (50 Tests Passing)

The entire platform is backed by an automated test suite verifying all parsers, embeddings, agents, health scoring, API routes, and end-to-end workflows:

```bash
.venv\Scripts\pytest -v
```

### Test Coverage Highlights:
- **`tests/test_milestone4_e2e.py`**: Complete end-to-end multi-format workflow across PDF, DOCX, CSV, and TXT, incremental document upload and knowledge preservation, dashboard API routes, and live statistics endpoints.
- **`tests/test_m3_api.py`**: Health scoring endpoints, documentation generation routes, and conversational assistant validation.
- **`tests/test_doc_gen_agent.py`**, **`test_health_scorer.py`**, **`test_chat_assistant.py`**: Unit and integration testing for health diagnostics and documentation agents.
- **`tests/test_agent_api.py`**, **`test_agent_validation.py`**, **`test_scope_agent.py`**, **`test_risk_forecast_agent.py`**, **`test_blocker_action_agent.py`**: Autonomous multi-agent pipeline validation across all document formats.
- **`tests/test_ingestion.py`**, **`test_chunking.py`**, **`test_embeddings.py`**, **`test_vectorstore.py`**, **`test_retrieval.py`**, **`test_api.py`**: Document parsing, Unicode normalization, chunk splitting, dense embedding generation, and vector retrieval.

---

## 🛡️ Enterprise Architecture & Technology Stack

| Layer | Component | Implementation |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI + Uvicorn | High-throughput asynchronous REST API gateway |
| **Validation & Schemas** | Pydantic v2 | Strict data modeling, validation, and type safety |
| **Document Parsers** | `pypdf`, `python-docx`, `pandas` | Multi-format PDF, DOCX, CSV, and TXT parsing |
| **Normalization** | Python `unicodedata` | NFKC normalization, whitespace sanitization, hyphen resolution |
| **Chunking Engine** | Hierarchical Boundary Splitter | 500-character target with 100-character sliding overlap |
| **Dense Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` | 384-dimensional dense semantic vectors with L2 normalization |
| **Vector Database** | ChromaDB | Local persistent cosine similarity vector database |
| **Agent Intelligence** | Autonomous Agentic Pipeline | Scope, Risk/Forecast, Blocker, Health Scorer, Doc Gen, Chat |
| **Integrated Portal** | Vanilla HTML5 / Modern CSS / Vanilla JS | Fast, responsive glassmorphic dark-mode web portal |
| **Frontend Dashboard** | React 19 + Vite | Componentized executive analytics dashboard |
| **Test Automation** | Pytest + AnyIO + HTTPX | 50 automated tests with comprehensive subsystem validation |
