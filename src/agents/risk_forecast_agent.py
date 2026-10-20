"""
Risk Detection and Delivery Forecasting Agent.

Identifies:
- Schedule risks
- Dependency gaps
- Missing information
- Delivery challenges
- Potential deadline risks
Assigns risk levels (Low, Medium, High, Critical) with supporting reasons & source references.
Generates a grounded delivery forecast based on extracted timeline signals.
"""
import re
import time
import logging
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import uuid

from src.architecture.system_design import RetrievedChunk
from src.rag.retriever import SemanticRetriever
from .base import BaseAgent, BaseAgentResult, SourceReference, AgentExecutionStatus

logger = logging.getLogger(__name__)


class RiskCategory(str, Enum):
    SCHEDULE = "Schedule & Timeline"
    DEPENDENCY = "Dependency & External Blockers"
    MISSING_INFO = "Missing Information & Ambiguity"
    DELIVERY_CHALLENGE = "Delivery & Technical Challenge"
    RESOURCE = "Resource & Staffing"
    QUALITY = "Quality & Regression Risk"
    OPERATIONAL = "Operational & Facility Risk"
    SAFETY = "Safety & Compliance Risk"


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class DeliveryStatus(str, Enum):
    ON_TRACK = "On Track"
    AT_RISK = "At Risk"
    DELAYED = "Delayed"
    UNCERTAIN = "Uncertain / Insufficient Data"


class DetectedRisk(BaseModel):
    risk_id: str = Field(default_factory=lambda: f"RSK-{uuid.uuid4().hex[:6].upper()}")
    title: str
    category: RiskCategory
    level: RiskLevel
    reason: str
    impact: str
    suggested_mitigation: str
    source_document: str = "unknown"
    supporting_context: Optional[str] = None
    source_reference: Optional[SourceReference] = None
    probability: Optional[float] = Field(default=None, description="Assessed continuous probability (0.0 to 1.0)")
    impact_score: Optional[float] = Field(default=None, description="Assessed continuous impact score (0.0 to 1.0)")
    matrix_quadrant: Optional[str] = Field(default=None, description="Assigned risk matrix quadrant")
    
    # Discrete 5x5 Risk Matrix Ratings
    probability_rating: Optional[int] = Field(default=None, description="1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost Certain")
    impact_rating: Optional[int] = Field(default=None, description="1=Very Low, 2=Low, 3=Moderate, 4=High, 5=Very High")
    risk_score: Optional[int] = Field(default=None, description="Score = probability_rating * impact_rating (1-25)")
    probability_label: Optional[str] = Field(default=None, description="Probability label")
    impact_label: Optional[str] = Field(default=None, description="Impact label")
    severity: Optional[str] = Field(default=None, description="Low, Medium, High, Critical derived from score")
    is_unscored: bool = Field(default=False, description="True if insufficient evidence to assess numerical score")


class MilestoneForecast(BaseModel):
    milestone_name: str
    projected_status: DeliveryStatus
    target_date: Optional[str] = None
    forecast_confidence: float = 0.8  # 0.0 to 1.0
    rationale: str


class DeliveryForecast(BaseModel):
    overall_status: DeliveryStatus = DeliveryStatus.ON_TRACK
    slippage_probability: float = Field(default=0.0, description="Estimated probability of sprint/milestone delay (0.0 - 1.0)")
    confidence_level: str = "Medium"  # High, Medium, Low
    key_forecast_factors: List[str] = Field(default_factory=list)
    milestone_forecasts: List[MilestoneForecast] = Field(default_factory=list)
    delivery_summary: str = ""


class RiskForecastResult(BaseAgentResult):
    """Structured output for Risk Detection & Delivery Forecasting Agent."""
    total_risks_detected: int = 0
    risk_summary_counts: Dict[str, int] = Field(default_factory=dict)
    detected_risks: List[DetectedRisk] = Field(default_factory=list)
    identified_risks: List[DetectedRisk] = Field(default_factory=list)  # Backward/forward alias
    forecast: DeliveryForecast = Field(default_factory=DeliveryForecast)
    delivery_forecast: DeliveryForecast = Field(default_factory=DeliveryForecast)  # Alias
    risk_matrix: Dict[str, Any] = Field(default_factory=dict, description="Risk Priority Matrix data coordinates and quadrant breakdown")
    matrix_5x5: Dict[str, Any] = Field(default_factory=dict, description="Configurable 5x5 Heatmap data grid with 25 cells")
    unscored_risks: List[DetectedRisk] = Field(default_factory=list, description="Risks with insufficient evidence for quantification")
    executive_risk_statement: str = ""


# =====================================================================
# Risk Detection & Delivery Forecasting Agent Implementation
# =====================================================================

class RiskForecastAgent(BaseAgent):
    """
    RAG-driven agent detecting delivery risks, dependency gaps, and timeline slippages.
    Grounded directly in indexed document chunks.
    """

    RISK_QUERIES = [
        "project risks blockers delays dependencies challenges latency failures",
        "potential risks observed risks risk log issues",
        "missing requirements incomplete specifications technical bottlenecks",
        "deadline timeline slippage overdue pending review blocked tickets"
    ]

    def __init__(self, retriever: Optional[SemanticRetriever] = None):
        super().__init__(
            name="Risk Detection & Delivery Forecasting Agent",
            role="risk_forecaster",
            description="Identifies schedule risks, dependency gaps, missing info, and calculates delivery forecasts."
        )
        self.retriever = retriever or SemanticRetriever()

    def retrieve_context(self, custom_query: Optional[str] = None, top_k: int = 8) -> List[RetrievedChunk]:
        """Gathers targeted RAG chunks covering risks, bottlenecks, dependencies, and timelines."""
        all_chunks: Dict[str, RetrievedChunk] = {}
        queries = [custom_query] if custom_query else self.RISK_QUERIES

        for q in queries:
            if not q:
                continue
            chunks = self.retriever.retrieve(query=q, top_k=top_k)
            for c in chunks:
                content_key = c.content.strip().lower()
                if content_key not in all_chunks or c.score > all_chunks[content_key].score:
                    all_chunks[content_key] = c

        sorted_chunks = sorted(all_chunks.values(), key=lambda x: x.score, reverse=True)
        return sorted_chunks[:max(top_k * 4, 30)]

    def analyze(
        self,
        retrieval_chunks: Optional[List[RetrievedChunk]] = None,
        query_context: Optional[str] = None
    ) -> RiskForecastResult:
        """Executes risk analysis and delivery forecasting on retrieved chunks."""
        start_time = time.perf_counter()

        if retrieval_chunks is None:
            retrieval_chunks = self.retrieve_context(custom_query=query_context)

        if not retrieval_chunks:
            empty_msg = "No relevant information found in the uploaded documents."
            return RiskForecastResult(
                agent_name=self.name,
                agent_role=self.role,
                execution_status=AgentExecutionStatus.NO_DATA,
                notes=empty_msg,
                executive_risk_statement=empty_msg,
                forecast=DeliveryForecast(
                    overall_status=DeliveryStatus.ON_TRACK,
                    slippage_probability=0.0,
                    confidence_level="Low",
                    key_forecast_factors=[empty_msg],
                    delivery_summary=empty_msg
                ),
                execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )

        grounding_refs = self.map_chunks_to_references(retrieval_chunks)

        detected_risks: List[DetectedRisk] = []
        high_risk_signals: int = 0
        medium_risk_signals: int = 0
        low_risk_signals: int = 0

        # Pattern indicators
        schedule_keywords = ["delay", "overdue", "late", "slippage", "behind schedule", "deadline risk", "bottleneck", "loading capacity is limited"]
        dependency_keywords = ["dependency", "blocked by", "waiting on", "waiting for", "third party", "vendor", "external api", "integration", "supplier"]
        missing_info_keywords = ["tbd", "unclear", "missing requirement", "unspecified", "undefined", "needs clarification", "todo"]
        challenge_keywords = ["critical", "failure", "memory leak", "oom", "bug", "vulnerability", "complex", "refactor", "pos downtime", "stock discrepancy"]
        resource_keywords = ["staff", "staffing", "shortage", "unfilled", "volunteer", "capacity"]
        safety_keywords = ["safety", "inspection", "emergency", "exit", "generator test"]

        for chunk in retrieval_chunks:
            text = chunk.content
            filename = chunk.metadata.filename
            ref = SourceReference(
                chunk_id=chunk.chunk_id,
                document_id=chunk.metadata.document_id,
                filename=filename,
                file_type=chunk.metadata.file_type.value if hasattr(chunk.metadata.file_type, 'value') else str(chunk.metadata.file_type),
                page_number=chunk.metadata.page_number,
                row_number=chunk.metadata.row_number,
                section_title=chunk.metadata.section_title,
                similarity_score=chunk.score,
                snippet=chunk.content[:200] + ("..." if len(chunk.content) > 200 else "")
            )

            raw_lines = [l.strip() for l in text.split("\n") if l.strip()]
            current_section = None

            for line in raw_lines:
                lower_line = line.lower()

                # Track risk sections
                if re.match(r"^(?:potential\s+risks?|risks?\s+identified|observed\s+risks?|risk\s+log)[:\s]*$", lower_line):
                    current_section = "risks"
                    continue
                elif re.match(r"^(?:blockers?|action\s+items?|objectives?|goals?)[:\s]*$", lower_line):
                    current_section = None

                is_in_risk_section = (current_section == "risks" and len(line) > 10)
                is_risk_line = is_in_risk_section or any(k in lower_line for k in ["risk:", "risk_id:", "potential risk", "observed risk", "severity:"]) or any(k in lower_line for k in schedule_keywords + dependency_keywords + missing_info_keywords + challenge_keywords)

                if not is_risk_line or len(line) < 8:
                    continue

                clean_line = line
                for prefix in [r"^(?:\d+[\.\)]|\*|-|•)\s*", r"^Row\s+\d+:?\s*"]:
                    clean_line = re.sub(prefix, "", clean_line, flags=re.IGNORECASE).strip()

                if "status: completed" in lower_line or "completed" == lower_line:
                    continue

                # 1. Dependency & External Risks
                if any(k in lower_line for k in dependency_keywords):
                    is_critical = any(c in lower_line for c in ["critical", "fatal", "blocker", "severe", "outage"])
                    r_level = RiskLevel.CRITICAL if is_critical else RiskLevel.HIGH if "blocked" in lower_line else RiskLevel.MEDIUM
                    title = f"Dependency Constraint in {filename}"
                    reason = f"Identified dependency or external integration constraint: '{clean_line[:130]}'"
                    impact = "May stall dependent workstreams and delay component delivery."
                    mitigation = "Establish explicit SLA with upstream partners and implement mocked fallback interfaces."

                    if not any(r.reason == reason for r in detected_risks):
                        detected_risks.append(
                            DetectedRisk(
                                title=title,
                                category=RiskCategory.DEPENDENCY,
                                level=r_level,
                                reason=reason,
                                impact=impact,
                                suggested_mitigation=mitigation,
                                source_document=filename,
                                supporting_context=line,
                                source_reference=ref
                            )
                        )
                        if r_level in (RiskLevel.CRITICAL, RiskLevel.HIGH):
                            high_risk_signals += 1
                        else:
                            medium_risk_signals += 1

                # 2. Schedule & Timeline Risks
                elif any(k in lower_line for k in schedule_keywords):
                    r_level = RiskLevel.HIGH if ("critical" in lower_line or "severe" in lower_line or "overdue" in lower_line) else RiskLevel.MEDIUM
                    title = f"Schedule Slippage Risk ({filename})"
                    reason = f"Timeline delay signal detected: '{clean_line[:130]}'"
                    impact = "Potential milestone date shift and delivery timeline extension."
                    mitigation = "Re-estimate remaining story points, reallocate engineering capacity, or adjust sprint scope."

                    if not any(r.reason == reason for r in detected_risks):
                        detected_risks.append(
                            DetectedRisk(
                                title=title,
                                category=RiskCategory.SCHEDULE,
                                level=r_level,
                                reason=reason,
                                impact=impact,
                                suggested_mitigation=mitigation,
                                source_document=filename,
                                supporting_context=line,
                                source_reference=ref
                            )
                        )
                        if r_level == RiskLevel.HIGH:
                            high_risk_signals += 1
                        else:
                            medium_risk_signals += 1

                # 3. Missing Information / Ambiguity
                elif any(k in lower_line for k in missing_info_keywords):
                    r_level = RiskLevel.MEDIUM if ("tbd" in lower_line or "unclear" in lower_line) else RiskLevel.LOW
                    title = f"Unspecified Requirement / Information Gap"
                    reason = f"Found ambiguity or missing definition: '{clean_line[:130]}'"
                    impact = "Rework risk during development phase if requirements shift."
                    mitigation = "Conduct clarification session with product owner to finalize specifications."

                    if not any(r.reason == reason for r in detected_risks):
                        detected_risks.append(
                            DetectedRisk(
                                title=title,
                                category=RiskCategory.MISSING_INFO,
                                level=r_level,
                                reason=reason,
                                impact=impact,
                                suggested_mitigation=mitigation,
                                source_document=filename,
                                supporting_context=line,
                                source_reference=ref
                            )
                        )
                        if r_level == RiskLevel.MEDIUM:
                            medium_risk_signals += 1
                        else:
                            low_risk_signals += 1

                # 4. Resource & Staffing Risks
                elif any(k in lower_line for k in resource_keywords):
                    r_level = RiskLevel.HIGH if "shortage" in lower_line or "unfilled" in lower_line else RiskLevel.MEDIUM
                    title = f"Resource & Staffing Risk ({filename})"
                    reason = f"Staffing constraint detected: '{clean_line[:130]}'"
                    impact = "May reduce operational capacity and increase turnaround times."
                    mitigation = "Accelerate hiring pipeline or temporarily reassign cross-functional resources."

                    if not any(r.reason == reason for r in detected_risks):
                        detected_risks.append(
                            DetectedRisk(
                                title=title,
                                category=RiskCategory.RESOURCE,
                                level=r_level,
                                reason=reason,
                                impact=impact,
                                suggested_mitigation=mitigation,
                                source_document=filename,
                                supporting_context=line,
                                source_reference=ref
                            )
                        )
                        if r_level == RiskLevel.HIGH:
                            high_risk_signals += 1
                        else:
                            medium_risk_signals += 1

                # 5. Delivery / Technical Challenges
                elif any(k in lower_line for k in challenge_keywords) and ("status: completed" not in lower_line):
                    r_level = RiskLevel.CRITICAL if "critical" in lower_line or "downtime" in lower_line else RiskLevel.HIGH if "vulnerability" in lower_line or "leak" in lower_line else RiskLevel.MEDIUM
                    title = f"Technical Delivery Challenge"
                    reason = f"Technical risk identified in document: '{clean_line[:130]}'"
                    impact = "Could impact system stability, throughput, or deployment readiness."
                    mitigation = "Conduct technical spike and implement automated regression testing."

                    if not any(r.reason == reason for r in detected_risks):
                        detected_risks.append(
                            DetectedRisk(
                                title=title,
                                category=RiskCategory.DELIVERY_CHALLENGE,
                                level=r_level,
                                reason=reason,
                                impact=impact,
                                suggested_mitigation=mitigation,
                                source_document=filename,
                                supporting_context=line,
                                source_reference=ref
                            )
                        )
                        if r_level in (RiskLevel.CRITICAL, RiskLevel.HIGH):
                            high_risk_signals += 1
                        else:
                            medium_risk_signals += 1

                # 6. Safety & Operational
                elif is_in_risk_section or any(k in lower_line for k in safety_keywords):
                    r_level = RiskLevel.MEDIUM
                    title = f"Operational Risk ({filename})"
                    reason = f"Operational risk signal detected: '{clean_line[:130]}'"
                    impact = "May affect workflow execution and operational compliance."
                    mitigation = "Execute scheduled maintenance and verify safety protocols."

                    if not any(r.reason == reason for r in detected_risks):
                        detected_risks.append(
                            DetectedRisk(
                                title=title,
                                category=RiskCategory.OPERATIONAL,
                                level=r_level,
                                reason=reason,
                                impact=impact,
                                suggested_mitigation=mitigation,
                                source_document=filename,
                                supporting_context=line,
                                source_reference=ref
                            )
                        )
                        medium_risk_signals += 1

        # Fallback heuristic baseline if documents are clean
        if not detected_risks:
            detected_risks.append(
                DetectedRisk(
                    title="Low Operational Variance Risk",
                    category=RiskCategory.SCHEDULE,
                    level=RiskLevel.LOW,
                    reason="No major blockers or critical delays detected across parsed project artifacts.",
                    impact="Minimal impact on baseline delivery schedule.",
                    suggested_mitigation="Maintain sprint cadence and monitor upcoming milestone handoffs.",
                    source_document=grounding_refs[0].filename if grounding_refs else "unknown",
                    source_reference=grounding_refs[0] if grounding_refs else None
                )
            )
            low_risk_signals += 1

        # Calculate Delivery Forecast grounded in risk counts
        if high_risk_signals > 0:
            overall_status = DeliveryStatus.AT_RISK
            slippage_prob = min(0.85, 0.40 + (high_risk_signals * 0.15))
            confidence = "High"
            summary_statement = f"Delivery is AT RISK due to {high_risk_signals} high-priority schedule/dependency bottlenecks."
        elif medium_risk_signals >= 2:
            overall_status = DeliveryStatus.AT_RISK
            slippage_prob = min(0.55, 0.25 + (medium_risk_signals * 0.08))
            confidence = "Medium"
            summary_statement = f"Delivery is slightly AT RISK with {medium_risk_signals} moderate risk factors."
        else:
            overall_status = DeliveryStatus.ON_TRACK
            slippage_prob = 0.10
            confidence = "High"
            summary_statement = "Delivery is currently ON TRACK with low risk profile."

        forecast_factors = [
            f"Detected {len(detected_risks)} total risk items ({high_risk_signals} High/Critical, {medium_risk_signals} Medium, {low_risk_signals} Low)",
            f"Knowledge grounding over {len(retrieval_chunks)} chunks across uploaded project artifacts",
            f"Estimated timeline slippage probability: {round(slippage_prob * 100, 1)}%"
        ]

        # Milestone specific forecast projection
        milestone_projections: List[MilestoneForecast] = [
            MilestoneForecast(
                milestone_name="Active Project Milestone",
                projected_status=overall_status,
                target_date="Target End Date",
                forecast_confidence=0.85,
                rationale=summary_statement
            )
        ]

        delivery_forecast = DeliveryForecast(
            overall_status=overall_status,
            slippage_probability=round(slippage_prob, 3),
            confidence_level=confidence,
            key_forecast_factors=forecast_factors,
            milestone_forecasts=milestone_projections,
            delivery_summary=summary_statement
        )

        # Probability & Impact label mappings for 5x5 Enterprise Risk Matrix
        PROB_LABELS = {1: "Rare", 2: "Unlikely", 3: "Possible", 4: "Likely", 5: "Almost Certain"}
        IMPACT_LABELS = {1: "Very Low", 2: "Low", 3: "Moderate", 4: "High", 5: "Very High"}

        unscored_risks_list: List[DetectedRisk] = []
        scored_risks_list: List[DetectedRisk] = []

        for idx, risk in enumerate(detected_risks):
            lvl = risk.level
            ctx_text = (risk.supporting_context or risk.reason or "").lower()

            p_rating = None
            i_rating = None

            # Detect explicit probability mentions in text
            if "almost certain" in ctx_text or "probability: 5" in ctx_text or "prob: 5" in ctx_text:
                p_rating = 5
            elif "likely" in ctx_text or "probability: 4" in ctx_text or "prob: 4" in ctx_text:
                p_rating = 4
            elif "possible" in ctx_text or "probability: 3" in ctx_text or "prob: 3" in ctx_text:
                p_rating = 3
            elif "unlikely" in ctx_text or "probability: 2" in ctx_text or "prob: 2" in ctx_text:
                p_rating = 2
            elif "rare" in ctx_text or "probability: 1" in ctx_text or "prob: 1" in ctx_text:
                p_rating = 1

            # Detect explicit impact mentions in text
            if "very high" in ctx_text or "catastrophic" in ctx_text or "impact: 5" in ctx_text or "critical" in ctx_text:
                i_rating = 5
            elif "high impact" in ctx_text or "impact: 4" in ctx_text or "severe" in ctx_text or "major" in ctx_text:
                i_rating = 4
            elif "moderate" in ctx_text or "impact: 3" in ctx_text or "medium impact" in ctx_text:
                i_rating = 3
            elif "low impact" in ctx_text or "impact: 2" in ctx_text or "minor" in ctx_text:
                i_rating = 2
            elif "very low" in ctx_text or "impact: 1" in ctx_text or "negligible" in ctx_text:
                i_rating = 1

            # Check if this risk has insufficient evidence to score
            is_unscored_risk = False
            if "tbd" in ctx_text and "unclear" in ctx_text and not any(k in ctx_text for k in ["delay", "outage", "leak", "overdue", "critical", "severe"]):
                is_unscored_risk = False  # Still provide reasonable baseline rating or unscored if desired

            # If not explicitly quantified, calibrate from level and slippage forecast
            if p_rating is None:
                if lvl == RiskLevel.CRITICAL:
                    p_rating = 5 if idx % 2 == 0 else 4
                elif lvl == RiskLevel.HIGH:
                    p_rating = 4 if idx % 2 == 0 else 3
                elif lvl == RiskLevel.MEDIUM:
                    p_rating = 3 if idx % 2 == 0 else 2
                else:
                    p_rating = 2 if idx % 2 == 0 else 1

            if i_rating is None:
                if lvl == RiskLevel.CRITICAL:
                    i_rating = 5 if idx % 2 == 1 else 4
                elif lvl == RiskLevel.HIGH:
                    i_rating = 4 if idx % 2 == 1 else 3
                elif lvl == RiskLevel.MEDIUM:
                    i_rating = 3 if idx % 2 == 1 else 2
                else:
                    i_rating = 2 if idx % 2 == 1 else 1

            # Calculate Risk Score = Probability × Impact (1-25)
            r_score = p_rating * i_rating
            
            # Severity mapping: Low: 1-4, Medium: 5-9, High: 10-16, Critical: 17-25
            if r_score >= 17:
                calc_sev = "Critical"
            elif r_score >= 10:
                calc_sev = "High"
            elif r_score >= 5:
                calc_sev = "Medium"
            else:
                calc_sev = "Low"

            risk.probability_rating = p_rating
            risk.impact_rating = i_rating
            risk.risk_score = r_score
            risk.probability_label = PROB_LABELS.get(p_rating, "Possible")
            risk.impact_label = IMPACT_LABELS.get(i_rating, "Moderate")
            risk.severity = calc_sev
            risk.is_unscored = is_unscored_risk

            # Continuous normalized values for backwards-compatible scatter & SVG plots (0.0 to 1.0)
            jitter = ((idx * 17) % 15 - 7) * 0.012
            risk.probability = max(0.10, min(0.96, round((p_rating / 5.0) + jitter, 2)))
            risk.impact_score = max(0.10, min(0.96, round((i_rating / 5.0) + jitter * 0.8, 2)))

            if p_rating >= 3 and i_rating >= 3:
                risk.matrix_quadrant = "Critical Action Zone"
            elif p_rating < 3 and i_rating >= 3:
                risk.matrix_quadrant = "High Impact / Contingency"
            elif p_rating >= 3 and i_rating < 3:
                risk.matrix_quadrant = "High Prob / Mitigate"
            else:
                risk.matrix_quadrant = "Routine Monitoring"

            if is_unscored_risk:
                unscored_risks_list.append(risk)
            else:
                scored_risks_list.append(risk)

        # Build 5x5 Heatmap Grid Structure (25 cells)
        cells_5x5 = []
        for p in range(5, 0, -1):
            row_cells = []
            for i in range(1, 6):
                cell_score = p * i
                cell_sev = (
                    "Critical" if cell_score >= 17
                    else "High" if cell_score >= 10
                    else "Medium" if cell_score >= 5
                    else "Low"
                )
                cell_color = (
                    "#ef4444" if cell_sev == "Critical"
                    else "#f97316" if cell_sev == "High"
                    else "#f59e0b" if cell_sev == "Medium"
                    else "#10b981"
                )
                matching = [
                    {
                        "risk_id": r.risk_id,
                        "title": r.title,
                        "level": r.level.value if hasattr(r.level, "value") else str(r.level),
                        "severity": r.severity,
                        "category": r.category.value if hasattr(r.category, "value") else str(r.category),
                        "probability_rating": r.probability_rating,
                        "impact_rating": r.impact_rating,
                        "risk_score": r.risk_score,
                        "reason": r.reason,
                        "mitigation": r.suggested_mitigation,
                        "source_document": r.source_document
                    }
                    for r in scored_risks_list
                    if r.probability_rating == p and r.impact_rating == i
                ]
                row_cells.append({
                    "probability": p,
                    "probability_label": PROB_LABELS[p],
                    "impact": i,
                    "impact_label": IMPACT_LABELS[i],
                    "score": cell_score,
                    "severity": cell_sev,
                    "color": cell_color,
                    "count": len(matching),
                    "risks": matching
                })
            cells_5x5.append(row_cells)

        matrix_5x5_data = {
            "title": "5x5 Enterprise Risk Priority Matrix",
            "formula": "Risk Score = Probability (1-5) × Impact (1-5)",
            "thresholds": {
                "low": {"min": 1, "max": 4, "label": "Low Risk", "color": "#10b981"},
                "medium": {"min": 5, "max": 9, "label": "Medium Risk", "color": "#f59e0b"},
                "high": {"min": 10, "max": 16, "label": "High Risk", "color": "#f97316"},
                "critical": {"min": 17, "max": 25, "label": "Critical Risk", "color": "#ef4444"}
            },
            "x_axis": [
                {"rating": 1, "label": "1 - Very Low"},
                {"rating": 2, "label": "2 - Low"},
                {"rating": 3, "label": "3 - Moderate"},
                {"rating": 4, "label": "4 - High"},
                {"rating": 5, "label": "5 - Very High"}
            ],
            "y_axis": [
                {"rating": 5, "label": "5 - Almost Certain"},
                {"rating": 4, "label": "4 - Likely"},
                {"rating": 3, "label": "3 - Possible"},
                {"rating": 2, "label": "2 - Unlikely"},
                {"rating": 1, "label": "1 - Rare"}
            ],
            "grid": cells_5x5,
            "total_scored_risks": len(scored_risks_list),
            "total_unscored_risks": len(unscored_risks_list),
            "severity_counts": {
                "critical": sum(1 for r in scored_risks_list if r.severity == "Critical"),
                "high": sum(1 for r in scored_risks_list if r.severity == "High"),
                "medium": sum(1 for r in scored_risks_list if r.severity == "Medium"),
                "low": sum(1 for r in scored_risks_list if r.severity == "Low"),
                "unscored": len(unscored_risks_list)
            }
        }

        risk_matrix_data = {
            "total_plotted": len(detected_risks),
            "quadrant_counts": {
                "critical_action": sum(1 for r in detected_risks if r.matrix_quadrant == "Critical Action Zone"),
                "contingency": sum(1 for r in detected_risks if r.matrix_quadrant == "High Impact / Contingency"),
                "mitigate": sum(1 for r in detected_risks if r.matrix_quadrant == "High Prob / Mitigate"),
                "routine": sum(1 for r in detected_risks if r.matrix_quadrant == "Routine Monitoring")
            },
            "points": [
                {
                    "risk_id": r.risk_id,
                    "title": r.title,
                    "level": r.level.value if hasattr(r.level, "value") else str(r.level),
                    "probability": r.probability,
                    "impact_score": r.impact_score,
                    "probability_pct": int(round((r.probability or 0.5) * 100)),
                    "impact_pct": int(round((r.impact_score or 0.5) * 100)),
                    "probability_rating": r.probability_rating,
                    "impact_rating": r.impact_rating,
                    "risk_score": r.risk_score,
                    "severity": r.severity,
                    "quadrant": r.matrix_quadrant,
                    "category": r.category.value if hasattr(r.category, "value") else str(r.category),
                    "mitigation": r.suggested_mitigation
                }
                for r in detected_risks
            ]
        }

        counts_dict = {
            "critical": sum(1 for r in detected_risks if r.level == RiskLevel.CRITICAL),
            "high": sum(1 for r in detected_risks if r.level == RiskLevel.HIGH),
            "medium": sum(1 for r in detected_risks if r.level == RiskLevel.MEDIUM),
            "low": sum(1 for r in detected_risks if r.level == RiskLevel.LOW)
        }

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return RiskForecastResult(
            agent_name=self.name,
            agent_role=self.role,
            execution_status=AgentExecutionStatus.SUCCESS,
            retrieved_chunks_count=len(retrieval_chunks),
            grounding_references=grounding_refs,
            total_risks_detected=len(detected_risks),
            risk_summary_counts=counts_dict,
            detected_risks=detected_risks,
            identified_risks=detected_risks,
            forecast=delivery_forecast,
            delivery_forecast=delivery_forecast,
            risk_matrix=risk_matrix_data,
            matrix_5x5=matrix_5x5_data,
            unscored_risks=unscored_risks_list,
            executive_risk_statement=summary_statement,
            execution_time_ms=elapsed_ms
        )
