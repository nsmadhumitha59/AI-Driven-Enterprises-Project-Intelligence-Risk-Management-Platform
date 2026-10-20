"""
FastAPI REST Routes for Executive Insights & Risk Summary Dashboard,
Incremental Upload Management, and End-to-End Orchestration.
"""
import logging
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, status
from pydantic import BaseModel, Field

from configs.settings import settings
from src.ingestion.manager import IngestionManager
from src.rag.retriever import SemanticRetriever
from src.rag.embeddings import EmbeddingService
from src.rag.vectorstore import ChromaVectorStore
from src.agents.health_scorer import ProjectHealthScorer, ProjectHealthResult, HealthRecommendation
from src.agents.scope_agent import ScopeExtractionAgent, ScopeExtractionResult
from src.agents.risk_forecast_agent import RiskForecastAgent, RiskForecastResult, DetectedRisk, DeliveryForecast
from src.agents.blocker_action_agent import BlockerActionAgent, BlockerActionResult, BlockerItem, ActionItem
from src.api.schemas import UploadDocumentResult, BatchUploadResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/m4", tags=["Executive Insights & Risk Dashboard"])

# Shared singletons
_ingestion_mgr = IngestionManager()
_vector_store = ChromaVectorStore()
_embedding_svc = EmbeddingService.get_instance()
_retriever = SemanticRetriever(vector_store=_vector_store, embedding_service=_embedding_svc)

_health_scorer = ProjectHealthScorer(retriever=_retriever)
_scope_agent = ScopeExtractionAgent(retriever=_retriever)
_risk_agent = RiskForecastAgent(retriever=_retriever)
_blocker_agent = BlockerActionAgent(retriever=_retriever)


# =====================================================================
# Pydantic Schemas for Executive Dashboard
# =====================================================================

class DocumentSummary(BaseModel):
    document_id: str
    filename: str
    original_name: str
    file_type: str
    file_size_bytes: int
    chunk_count: int
    upload_timestamp: str


class KnowledgeBaseStats(BaseModel):
    total_documents: int
    total_chunks: int
    embedding_model: str
    vector_store: str
    documents: List[DocumentSummary] = Field(default_factory=list)


class DashboardFilterRequest(BaseModel):
    query_context: Optional[str] = Field(
        None,
        description="Optional focus query (e.g., 'Sprint 4 release', 'Authentication module', 'Payment gateway')"
    )
    document_id: Optional[str] = Field(
        None,
        description="Optional filter to restrict analysis to a specific ingested document"
    )


class ProjectDashboardResponse(BaseModel):
    """Unified Executive Project Intelligence & Risk Dashboard."""
    project_title: str
    generated_at: str
    execution_time_ms: float
    executive_summary: str
    
    # 1. Overall Health Score & Dimension Breakdown
    health: ProjectHealthResult
    
    # 2. Scope & Deliverables Summary
    scope: ScopeExtractionResult
    
    # 3. Extracted Risks & Delivery Forecast
    risks: RiskForecastResult
    
    # 4. Active Blockers & Action Items
    blockers_actions: BlockerActionResult
    
    # 5. Key Recommendations (aggregated from health + risk agents)
    key_recommendations: List[HealthRecommendation]
    
    # 6. Real-time Knowledge Base Statistics
    knowledge_base: KnowledgeBaseStats
    
    status: str = "success"


class IncrementalUploadResponse(BaseModel):
    """Response returned after incrementally uploading new documents."""
    success: bool
    message: str
    new_documents_uploaded: int
    new_chunks_indexed: int
    total_documents_count: int
    total_chunks_count: int
    documents: List[UploadDocumentResult]
    errors: List[dict] = Field(default_factory=list)


def _get_knowledge_base_stats() -> KnowledgeBaseStats:
    """Helper to fetch up-to-date knowledge base statistics."""
    docs = _ingestion_mgr.list_documents()
    store_stats = _vector_store.get_stats()
    
    doc_summaries = [
        DocumentSummary(
            document_id=d.document_id,
            filename=d.filename,
            original_name=d.original_name,
            file_type=d.file_type.value if hasattr(d.file_type, "value") else str(d.file_type),
            file_size_bytes=d.file_size_bytes,
            chunk_count=d.chunk_count,
            upload_timestamp=d.upload_timestamp
        )
        for d in docs
    ]
    
    return KnowledgeBaseStats(
        total_documents=len(docs),
        total_chunks=store_stats.get("total_chunks_indexed", 0),
        embedding_model=settings.EMBEDDING_MODEL_NAME,
        vector_store="ChromaDB (Persistent)",
        documents=doc_summaries
    )


def _build_dashboard_payload(
    query_context: Optional[str] = None,
    document_id: Optional[str] = None
) -> ProjectDashboardResponse:
    """Synthesizes dynamic dashboard payload using integrated multi-agent and health scoring engines."""
    start_time = time.perf_counter()
    
    # Check if we have documents
    kb_stats = _get_knowledge_base_stats()

    if kb_stats.total_documents == 0 or kb_stats.total_chunks == 0:
        empty_msg = "No relevant information found in the uploaded documents."
        health_res = ProjectHealthResult(
            agent_name=_health_scorer.name,
            agent_role=_health_scorer.role,
            execution_status="no_data",
            overall_health_score=0.0,
            health_status="No Documents",
            status_color="#6b7280",
            scope_clarity_score=0.0,
            timeline_risk_score=0.0,
            blocker_score=0.0,
            dimensions=[],
            recommendations=[],
            notes=empty_msg,
            executive_summary=empty_msg,
            execution_time_ms=0.0
        )
        scope_res = ScopeExtractionResult(
            agent_name=_scope_agent.name,
            agent_role=_scope_agent.role,
            execution_status="no_data",
            project_title="No Documents Uploaded",
            empty_goals_message=empty_msg,
            notes=empty_msg,
            execution_time_ms=0.0
        )
        risk_res = RiskForecastResult(
            agent_name=_risk_agent.name,
            agent_role=_risk_agent.role,
            execution_status="no_data",
            notes=empty_msg,
            executive_risk_statement=empty_msg,
            forecast=DeliveryForecast(
                overall_status="On Track",
                slippage_probability=0.0,
                confidence_level="Low",
                key_forecast_factors=[empty_msg],
                delivery_summary=empty_msg
            ),
            execution_time_ms=0.0
        )
        blocker_res = BlockerActionResult(
            agent_name=_blocker_agent.name,
            agent_role=_blocker_agent.role,
            execution_status="no_data",
            empty_blockers_message=empty_msg,
            executive_summary=empty_msg,
            execution_time_ms=0.0
        )
        return ProjectDashboardResponse(
            project_title="No Documents Uploaded",
            generated_at=datetime.utcnow().isoformat() + "Z",
            execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
            executive_summary=empty_msg,
            health=health_res,
            scope=scope_res,
            risks=risk_res,
            blockers_actions=blocker_res,
            key_recommendations=[],
            knowledge_base=kb_stats,
            status="success"
        )
    
    # Retrieve targeted chunks if document_id is specified
    scope_chunks = None
    risk_chunks = None
    blocker_chunks = None
    
    if document_id:
        scope_chunks = _retriever.retrieve(query="project goals scope deliverables", document_id=document_id, top_k=10)
        risk_chunks = _retriever.retrieve(query="risks bottlenecks blockers delays dependencies", document_id=document_id, top_k=10)
        blocker_chunks = _retriever.retrieve(query="action items blockers tasks decisions unresolved", document_id=document_id, top_k=10)
    
    # 1. Run Scope Extraction Agent
    scope_res = _scope_agent.analyze(retrieval_chunks=scope_chunks, query_context=query_context)
    
    # 2. Run Risk Detection & Delivery Forecast Agent
    risk_res = _risk_agent.analyze(retrieval_chunks=risk_chunks, query_context=query_context)
    
    # 3. Run Blocker & Action Item Agent
    blocker_res = _blocker_agent.analyze(retrieval_chunks=blocker_chunks, query_context=query_context)
    
    # 4. Run Project Health Scorer
    health_res = _health_scorer.analyze(query_context=query_context)
    
    # Aggregate key recommendations
    recommendations = list(health_res.recommendations) if health_res.recommendations else []
    
    # Synthesize project title and summary
    project_title = scope_res.project_title or "AI Project Intelligence Workspace"
    
    exec_summary_parts = []
    if health_res.executive_summary:
        exec_summary_parts.append(health_res.executive_summary)
    if risk_res.forecast:
        exec_summary_parts.append(
            f"Delivery forecast indicates status is '{risk_res.forecast.overall_status.value}' "
            f"with a slippage risk of {round(risk_res.forecast.slippage_probability * 100, 1)}%."
        )
    active_blockers_count = len(blocker_res.active_blockers) if blocker_res.active_blockers else len(blocker_res.blockers)
    if active_blockers_count > 0:
        exec_summary_parts.append(
            f"There are currently {active_blockers_count} active blocker(s) requiring immediate resolution."
        )
    
    combined_summary = " ".join(exec_summary_parts) if exec_summary_parts else "Dynamic project intelligence synthesized from RAG knowledge base."
    
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    
    return ProjectDashboardResponse(
        project_title=project_title,
        generated_at=datetime.utcnow().isoformat() + "Z",
        execution_time_ms=elapsed_ms,
        executive_summary=combined_summary,
        health=health_res,
        scope=scope_res,
        risks=risk_res,
        blockers_actions=blocker_res,
        key_recommendations=recommendations,
        knowledge_base=kb_stats,
        status="success"
    )


# =====================================================================
# Endpoints
# =====================================================================

@router.get(
    "/dashboard",
    response_model=ProjectDashboardResponse,
    summary="Get Dynamic Project Insights & Risk Summary Dashboard",
    description="Synthesizes Overall Project Health Score, Scope Summary, Extracted Risks, Active Blockers, Action Items, Timeline Risk, and Key Recommendations dynamically."
)
async def get_dashboard(query_context: Optional[str] = None):
    try:
        return _build_dashboard_payload(query_context=query_context)
    except Exception as e:
        logger.error(f"Failed to generate project dashboard: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard generation failed: {str(e)}"
        )


@router.post(
    "/dashboard",
    response_model=ProjectDashboardResponse,
    summary="Generate Focused Project Insights & Risk Dashboard",
    description="Recomputes dashboard with custom topic or document focus."
)
async def generate_focused_dashboard(request: Optional[DashboardFilterRequest] = None):
    try:
        q_ctx = request.query_context if request else None
        d_id = request.document_id if request else None
        return _build_dashboard_payload(query_context=q_ctx, document_id=d_id)
    except Exception as e:
        logger.error(f"Failed to generate focused dashboard: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard generation failed: {str(e)}"
        )


@router.get(
    "/stats",
    response_model=KnowledgeBaseStats,
    summary="Get Real-Time Knowledge Base Statistics",
    description="Returns updated document count and indexed chunk count across the vector index."
)
async def get_knowledge_base_stats():
    try:
        return _get_knowledge_base_stats()
    except Exception as e:
        logger.error(f"Failed to get knowledge base stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Knowledge base stats failed: {str(e)}"
        )


@router.post(
    "/incremental-upload",
    response_model=IncrementalUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Incrementally Ingest Additional Project Documents",
    description="Uploads new PDF, DOCX, CSV, or TXT documents, extracts, chunks, embeds, and appends to the existing vector store without replacing prior documents."
)
async def incremental_upload(
    files: List[UploadFile] = File(..., description="One or more incremental files to add to knowledge base")
):
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided for incremental upload."
        )

    processed_results: List[UploadDocumentResult] = []
    errors: List[dict] = []
    new_chunks_count = 0

    for upload_file in files:
        filename = upload_file.filename or "unknown"
        detected_type = _ingestion_mgr.detect_file_type(filename)
        if not detected_type:
            errors.append({
                "filename": filename,
                "error": f"Unsupported file type. Supported extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            })
            continue

        stored_path = None
        try:
            # 1. Save uploaded file with unique ID
            stored_path, doc_id = _ingestion_mgr.save_uploaded_file(upload_file.file, filename)
            
            # 2. Extract & normalize text (with duplicate prevention)
            parsed_doc = _ingestion_mgr.process_file(stored_path, original_filename=filename)
            
            # 3. Chunk, embed, and append to existing ChromaDB index without deletion
            chunks = _retriever.index_document(parsed_doc)
            _ingestion_mgr.update_document_chunk_count(parsed_doc.metadata.document_id, len(chunks))
            new_chunks_count += len(chunks)

            processed_results.append(
                UploadDocumentResult(
                    document_id=parsed_doc.metadata.document_id,
                    filename=filename,
                    file_type=parsed_doc.metadata.file_type.value,
                    file_size_bytes=parsed_doc.metadata.file_size_bytes,
                    page_count=parsed_doc.metadata.page_count,
                    row_count=parsed_doc.metadata.row_count,
                    char_count=parsed_doc.metadata.char_count,
                    chunk_count=len(chunks),
                    status="indexed",
                    message=f"Incrementally added {len(chunks)} chunks to vector index."
                )
            )
        except Exception as e:
            if stored_path and stored_path.exists():
                try:
                    stored_path.unlink()
                except Exception:
                    pass
            logger.error(f"Error in incremental upload for {filename}: {e}")
            errors.append({
                "filename": filename,
                "error": str(e)
            })

    success_count = len(processed_results)
    if success_count == 0 and errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "All incremental uploads failed.", "errors": errors}
        )

    # Fetch updated total counts
    kb_stats = _get_knowledge_base_stats()

    return IncrementalUploadResponse(
        success=(success_count > 0),
        message=f"Successfully incrementally indexed {success_count} document(s) with {new_chunks_count} new vector chunks.",
        new_documents_uploaded=success_count,
        new_chunks_indexed=new_chunks_count,
        total_documents_count=kb_stats.total_documents,
        total_chunks_count=kb_stats.total_chunks,
        documents=processed_results,
        errors=errors
    )


@router.delete(
    "/documents/clear",
    summary="Clear All Documents and Reset Knowledge Base"
)
async def clear_all_m4_documents():
    """Wipes all documents, text chunks, embeddings, and vector store entries."""
    _retriever.reset_index()
    cleared = _ingestion_mgr.clear_all_documents()
    return {
        "success": True,
        "message": f"Successfully cleared all {cleared} old documents and reset vector store.",
        "cleared_count": cleared
    }


@router.get(
    "/risk-matrix",
    summary="Get Structured Risk Priority Matrix Graph Data",
    description="Returns interactive risk priority matrix coordinates, quadrant breakdowns, and plotted risks."
)
async def get_risk_matrix(query_context: Optional[str] = None):
    try:
        risk_res = _risk_agent.analyze(query_context=query_context)
        return {
            "status": "success",
            "total_risks": risk_res.total_risks_detected,
            "forecast_status": risk_res.forecast.overall_status.value if hasattr(risk_res.forecast.overall_status, "value") else str(risk_res.forecast.overall_status),
            "slippage_probability": risk_res.forecast.slippage_probability,
            "risk_matrix": risk_res.risk_matrix,
            "matrix_5x5": risk_res.matrix_5x5,
            "unscored_risks": [r.dict() for r in risk_res.unscored_risks],
            "detected_risks": [r.dict() for r in risk_res.detected_risks]
        }
    except Exception as e:
        logger.error(f"Failed to generate risk matrix: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk matrix generation failed: {str(e)}"
        )


@router.get(
    "/risk-matrix/svg",
    summary="Generate Interactive Vector SVG of Risk Priority Matrix",
    description="Renders a standalone, high-resolution SVG graph of the Risk Priority Matrix."
)
async def get_risk_matrix_svg(query_context: Optional[str] = None):
    from fastapi.responses import Response
    try:
        risk_res = _risk_agent.analyze(query_context=query_context)
        points = risk_res.risk_matrix.get("points", [])
        
        # SVG layout constants
        width, height = 700, 460
        margin_left, margin_right = 70, 40
        margin_top, margin_bottom = 40, 60
        plot_w = width - margin_left - margin_right
        plot_h = height - margin_top - margin_bottom

        def get_x(prob_pct):
            return margin_left + (prob_pct / 100.0) * plot_w

        def get_y(impact_pct):
            return margin_top + ((100.0 - impact_pct) / 100.0) * plot_h

        svg_parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background: #0f172a; font-family: system-ui, -apple-system, sans-serif;">',
            '<defs>',
            '  <linearGradient id="qCritical" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ef4444" stop-opacity="0.22"/><stop offset="100%" stop-color="#ef4444" stop-opacity="0.05"/></linearGradient>',
            '  <linearGradient id="qContingency" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f59e0b" stop-opacity="0.18"/><stop offset="100%" stop-color="#f59e0b" stop-opacity="0.04"/></linearGradient>',
            '  <linearGradient id="qMitigate" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#06b6d4" stop-opacity="0.18"/><stop offset="100%" stop-color="#06b6d4" stop-opacity="0.04"/></linearGradient>',
            '  <linearGradient id="qRoutine" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10b981" stop-opacity="0.16"/><stop offset="100%" stop-color="#10b981" stop-opacity="0.04"/></linearGradient>',
            '  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
            '</defs>',
            # Title
            f'<text x="{width/2}" y="26" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="700">🎯 Project Intelligence — Risk Priority Matrix</text>',
            # Quadrants
            f'<rect x="{get_x(50)}" y="{margin_top}" width="{plot_w/2}" height="{plot_h/2}" fill="url(#qCritical)" rx="6"/>',
            f'<rect x="{margin_left}" y="{margin_top}" width="{plot_w/2}" height="{plot_h/2}" fill="url(#qContingency)" rx="6"/>',
            f'<rect x="{get_x(50)}" y="{get_y(50)}" width="{plot_w/2}" height="{plot_h/2}" fill="url(#qMitigate)" rx="6"/>',
            f'<rect x="{margin_left}" y="{get_y(50)}" width="{plot_w/2}" height="{plot_h/2}" fill="url(#qRoutine)" rx="6"/>',
            # Quadrant Labels
            f'<text x="{get_x(75)}" y="{margin_top + 22}" text-anchor="middle" fill="#f87171" font-size="11" font-weight="700">CRITICAL ACTION ZONE</text>',
            f'<text x="{get_x(25)}" y="{margin_top + 22}" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="700">HIGH IMPACT / CONTINGENCY</text>',
            f'<text x="{get_x(75)}" y="{margin_top + plot_h - 14}" text-anchor="middle" fill="#38bdf8" font-size="11" font-weight="700">HIGH PROB / MITIGATE</text>',
            f'<text x="{get_x(25)}" y="{margin_top + plot_h - 14}" text-anchor="middle" fill="#34d399" font-size="11" font-weight="700">ROUTINE MONITORING</text>',
        ]

        # Grid lines
        for tick in [0, 25, 50, 75, 100]:
            y = get_y(tick)
            dash = "4,4" if tick == 50 else "2,2"
            opacity = "0.28" if tick == 50 else "0.10"
            svg_parts.append(f'<line x1="{margin_left}" y1="{y}" x2="{margin_left + plot_w}" y2="{y}" stroke="#ffffff" stroke-opacity="{opacity}" stroke-dasharray="{dash}"/>')
            svg_parts.append(f'<text x="{margin_left - 10}" y="{y + 4}" text-anchor="end" fill="#94a3b8" font-size="10">{tick}%</text>')

            x = get_x(tick)
            svg_parts.append(f'<line x1="{x}" y1="{margin_top}" x2="{x}" y2="{margin_top + plot_h}" stroke="#ffffff" stroke-opacity="{opacity}" stroke-dasharray="{dash}"/>')
            svg_parts.append(f'<text x="{x}" y="{margin_top + plot_h + 18}" text-anchor="middle" fill="#94a3b8" font-size="10">{tick}%</text>')

        # Axes titles
        svg_parts.append(f'<text x="-{margin_top + plot_h/2}" y="20" transform="rotate(-90)" text-anchor="middle" fill="#cbd5e1" font-size="12" font-weight="700" letter-spacing="1">▲ IMPACT</text>')
        svg_parts.append(f'<text x="{margin_left + plot_w/2}" y="{margin_top + plot_h + 42}" text-anchor="middle" fill="#cbd5e1" font-size="12" font-weight="700" letter-spacing="1">PROBABILITY ►</text>')

        # Points
        color_map = {
            "CRITICAL": "#ef4444",
            "HIGH": "#f97316",
            "MEDIUM": "#06b6d4",
            "LOW": "#10b981"
        }
        for pt in points:
            cx = get_x(pt.get("probability_pct", 50))
            cy = get_y(pt.get("impact_pct", 50))
            lvl = pt.get("level", "MEDIUM").upper()
            col = color_map.get(lvl, "#6366f1")
            r = 12 if lvl == "CRITICAL" else 10 if lvl == "HIGH" else 8.5
            rid = pt.get("risk_id", "")
            title = pt.get("title", "")
            svg_parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r+4}" fill="none" stroke="{col}" stroke-opacity="0.4" stroke-width="1.5"/>')
            svg_parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{col}" filter="url(#glow)" stroke="#ffffff" stroke-width="1.2"><title>{rid}: {title} ({lvl}) - Prob: {pt.get("probability_pct")}% Impact: {pt.get("impact_pct")}%</title></circle>')
            svg_parts.append(f'<text x="{cx + r + 5}" y="{cy + 3.5}" fill="#f1f5f9" font-size="9" font-weight="600">{rid}</text>')

        svg_parts.append('</svg>')
        svg_content = "\n".join(svg_parts)
        return Response(content=svg_content, media_type="image/svg+xml")
    except Exception as e:
        logger.error(f"Failed to generate risk matrix SVG: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SVG generation failed: {str(e)}"
        )

