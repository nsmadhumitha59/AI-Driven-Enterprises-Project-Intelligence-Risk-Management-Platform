"""
End-to-End Comprehensive Test Suite:
Validates the complete project intelligence workflow, all four document formats (PDF, DOCX, CSV, TXT),
multi-agent reasoning, documentation generation, health scoring, executive dashboard synthesis,
conversational Q&A, and incremental document upload with dynamic knowledge base re-analysis.
"""
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from src.api.app import app
from src.ingestion.manager import IngestionManager
from src.rag.retriever import SemanticRetriever
from src.rag.embeddings import EmbeddingService
from src.rag.vectorstore import ChromaVectorStore
from src.agents import (
    ScopeExtractionAgent,
    RiskForecastAgent,
    BlockerActionAgent,
    DocumentationGenerationAgent,
    ProjectHealthScorer,
    ProjectIntelligenceChatAssistant
)
from src.api.m4_routes import _build_dashboard_payload, _get_knowledge_base_stats


@pytest.fixture
def client():
    return TestClient(app)


class TestMilestone4EndToEndWorkflow:
    """Validates the full enterprise platform workflow end-to-end."""

    def test_complete_workflow_across_all_four_formats(
        self,
        sample_pdf_file: Path,
        sample_docx_file: Path,
        sample_csv_file: Path,
        sample_txt_file: Path
    ):
        """
        Step 1: Upload PDF, DOCX, CSV, TXT
        Step 2: RAG Ingestion & Vector Indexing
        Step 3: Semantic Retrieval
        Step 4: Multi-Agent Analysis (Scope, Risk, Blocker)
        Step 5: Documentation Generation (Stories, Risks, Actions)
        Step 6: Health Scoring
        Step 7: Executive Dashboard Synthesis
        Step 8: Conversational Assistant Grounding
        """
        ingestion_mgr = IngestionManager()
        vector_store = ChromaVectorStore()
        retriever = SemanticRetriever(vector_store=vector_store, embedding_service=EmbeddingService.get_instance())
        vector_store.reset()
        ingestion_mgr.clear_all_documents()

        # 1. Ingest all 4 document types
        docs = [
            (sample_pdf_file, "system_specification.pdf"),
            (sample_docx_file, "project_charter.docx"),
            (sample_csv_file, "sprint_tasks.csv"),
            (sample_txt_file, "project_architecture_notes.txt")
        ]

        indexed_chunks = []
        for file_path, orig_name in docs:
            parsed = ingestion_mgr.process_file(file_path, original_filename=orig_name)
            assert parsed.metadata.document_id is not None
            assert len(parsed.normalized_text) > 0
            chunks = retriever.index_document(parsed)
            ingestion_mgr.update_document_chunk_count(parsed.metadata.document_id, len(chunks))
            indexed_chunks.extend(chunks)

        assert len(indexed_chunks) > 0

        # 2. Vector Retrieval Verification
        query_results = retriever.retrieve(query="What are the project deliverables and milestones?", top_k=5)
        assert len(query_results) > 0
        for r in query_results:
            assert r.score >= 0.0
            assert r.content
            assert r.metadata.filename

        # 3. Multi-Agent Analysis
        scope_agent = ScopeExtractionAgent(retriever=retriever)
        scope_res = scope_agent.analyze()
        assert scope_res.project_title is not None
        assert len(scope_res.deliverables) >= 0

        risk_agent = RiskForecastAgent(retriever=retriever)
        risk_res = risk_agent.analyze()
        assert risk_res.forecast is not None
        assert 0.0 <= risk_res.forecast.slippage_probability <= 1.0

        blocker_agent = BlockerActionAgent(retriever=retriever)
        blocker_res = blocker_agent.analyze()
        assert blocker_res.total_action_items >= 0
        assert blocker_res.total_blockers >= 0

        # 4. Documentation Generation
        doc_agent = DocumentationGenerationAgent(retriever=retriever)
        doc_res = doc_agent.analyze()
        assert len(doc_res.user_stories) > 0
        assert len(doc_res.risk_register) > 0
        assert len(doc_res.action_items) > 0
        assert doc_res.markdown_export is not None
        assert "Agile User Stories" in doc_res.markdown_export

        # 5. Health Scoring Calculation
        health_scorer = ProjectHealthScorer(retriever=retriever)
        health_res = health_scorer.analyze()
        assert 0.0 <= health_res.overall_health_score <= 100.0
        assert health_res.health_status in ["Healthy", "At Risk", "Critical"]
        assert len(health_res.dimensions) in [3, 6]
        assert 0.0 <= health_res.scope_clarity_score <= 100.0
        assert 0.0 <= health_res.timeline_risk_score <= 100.0
        assert 0.0 <= health_res.blocker_score <= 100.0

        # 6. Unified Dashboard Synthesis
        dashboard = _build_dashboard_payload()
        assert dashboard.status == "success"
        assert dashboard.project_title is not None
        assert 0.0 <= dashboard.health.overall_health_score <= 100.0
        assert dashboard.scope is not None
        assert dashboard.risks is not None
        assert dashboard.blockers_actions is not None
        assert dashboard.knowledge_base.total_documents >= 4
        assert dashboard.knowledge_base.total_chunks >= len(indexed_chunks)

        # 7. Conversational Assistant with Grounding Citations
        chat_bot = ProjectIntelligenceChatAssistant(retriever=retriever)
        chat_res = chat_bot.answer_question(question="What are the key deliverables of this project?")
        assert chat_res.answer is not None
        assert len(chat_res.answer) > 20
        assert len(chat_res.source_references) > 0
        assert len(chat_res.grounded_document_names) > 0

    def test_incremental_document_upload_and_reanalysis(
        self,
        temp_test_dir: Path,
        sample_txt_file: Path
    ):
        """
        Verifies requirement 2:
        - Initial document upload
        - Incremental addition of a new document (without replacing prior documents)
        - Vector store index increments
        - Rerunning analysis reflects updated knowledge base.
        """
        ingestion_mgr = IngestionManager()
        vector_store = ChromaVectorStore()
        retriever = SemanticRetriever(vector_store=vector_store, embedding_service=EmbeddingService.get_instance())

        # Baseline: Ingest initial document
        initial_file = temp_test_dir / "initial_doc.txt"
        initial_file.write_text("Project Architecture Baseline Notes:\nGoal: Launch scalable microservices platform.\nOwner: Core Team.", encoding="utf-8")
        parsed1 = ingestion_mgr.process_file(initial_file, original_filename="initial_doc.txt")
        chunks1 = retriever.index_document(parsed1)
        ingestion_mgr.update_document_chunk_count(parsed1.metadata.document_id, len(chunks1))

        initial_kb = _get_knowledge_base_stats()
        initial_doc_count = initial_kb.total_documents
        initial_chunk_count = initial_kb.total_chunks

        # Create an incremental document introducing new critical risks and blockers
        inc_file = temp_test_dir / "sprint_4_blocker_escalation.txt"
        inc_content = (
            "Sprint 4 Emergency Blocker Escalation Note:\n"
            "BLOCKER: Third-party OAuth identity provider API rate limits are blocking automated QA pipelines.\n"
            "RISK: Critical security audit deadline scheduled for next Friday with zero test coverage on payment checkout.\n"
            "ACTION ITEM: John Doe must negotiate OAuth rate limit quota increase by Wednesday.\n"
            "DELIVERABLE: Payment Gateway Integration V2 signed off by Security Lead."
        )
        inc_file.write_text(inc_content, encoding="utf-8")

        # Ingest incrementally
        parsed2 = ingestion_mgr.process_file(inc_file, original_filename="sprint_4_blocker_escalation.txt")
        chunks2 = retriever.index_document(parsed2)
        ingestion_mgr.update_document_chunk_count(parsed2.metadata.document_id, len(chunks2))

        # Check knowledge base updated incrementally without replacing initial document
        updated_kb = _get_knowledge_base_stats()
        assert updated_kb.total_documents == initial_doc_count + 1
        assert updated_kb.total_chunks == initial_chunk_count + len(chunks2)

        # Retrieve new content from incremental document
        retrieved = retriever.retrieve(query="OAuth rate limits third-party blocker", top_k=3)
        assert len(retrieved) > 0
        assert any("OAuth" in r.content for r in retrieved)

        # Rerun dashboard dynamically with updated knowledge base
        updated_dashboard = _build_dashboard_payload()
        assert updated_dashboard.knowledge_base.total_documents == updated_kb.total_documents
        
        # Verify the blocker agent extracted the new blocker
        blockers = updated_dashboard.blockers_actions.active_blockers or updated_dashboard.blockers_actions.blockers
        assert len(blockers) > 0
        assert any("OAuth" in b.description or "rate limit" in b.description.lower() for b in blockers)


class TestMilestone4APIRoutes:
    """Validates the Executive Dashboard REST API endpoints."""

    def test_get_dashboard_endpoint(self, client: TestClient):
        response = client.get("/api/v1/m4/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "health" in data
        assert "scope" in data
        assert "risks" in data
        assert "blockers_actions" in data
        assert "knowledge_base" in data
        assert "overall_health_score" in data["health"]

    def test_post_focused_dashboard_endpoint(self, client: TestClient):
        response = client.post(
            "/api/v1/m4/dashboard",
            json={"query_context": "authentication security sprint"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "health" in data

    def test_get_knowledge_stats_endpoint(self, client: TestClient):
        response = client.get("/api/v1/m4/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_documents" in data
        assert "total_chunks" in data
        assert "documents" in data

    def test_incremental_upload_endpoint(self, client: TestClient, temp_test_dir: Path):
        test_file = temp_test_dir / "api_test_incremental_endpoint.txt"
        test_file.write_text("Incremental upload test document unique content for executive dashboard API validation.", encoding="utf-8")

        with open(test_file, "rb") as f:
            response = client.post(
                "/api/v1/m4/incremental-upload",
                files={"files": ("api_test_incremental_endpoint.txt", f, "text/plain")}
            )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["new_documents_uploaded"] == 1
        assert data["new_chunks_indexed"] > 0
        assert data["total_documents_count"] >= 1
        assert len(data["documents"]) == 1

    def test_get_risk_matrix_endpoint(self, client: TestClient):
        response = client.get("/api/v1/m4/risk-matrix")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "risk_matrix" in data
        assert "points" in data["risk_matrix"]
        assert "quadrant_counts" in data["risk_matrix"]

    def test_get_risk_matrix_svg_endpoint(self, client: TestClient):
        response = client.get("/api/v1/m4/risk-matrix/svg")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("image/svg+xml")
        svg_content = response.text
        assert "<svg" in svg_content
        assert "Risk Priority Matrix" in svg_content
        assert "CRITICAL ACTION ZONE" in svg_content

