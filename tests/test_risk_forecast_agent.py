"""
Unit and integration tests for Risk Detection and Delivery Forecasting Agent.
"""
import pytest
from pathlib import Path
from src.ingestion.parsers import TXTParser, CSVParser
from src.rag.retriever import SemanticRetriever
from src.agents.risk_forecast_agent import (
    RiskForecastAgent,
    RiskForecastResult,
    RiskCategory,
    RiskLevel,
    DeliveryStatus
)


@pytest.fixture
def risk_report_file(temp_test_dir) -> Path:
    file_path = temp_test_dir / "sprint_risk_briefing.txt"
    content = (
        "Sprint 4 Risk Briefing & Engineering Status\n\n"
        "1. Critical Dependency: Payment gateway integration is blocked by third party vendor API outage.\n"
        "2. Schedule Slippage: Database indexing task is overdue and delayed by 4 business days.\n"
        "3. Missing Specification: Requirements for multi-tenant analytics are TBD and unclear.\n"
        "4. Technical Bottleneck: High memory leak during large batch CSV vector indexing."
    )
    file_path.write_text(content, encoding="utf-8")
    return file_path


class TestRiskForecastAgent:
    def test_risk_detection_and_delivery_forecast(self, test_vector_store, embedding_service, risk_report_file):
        test_vector_store.reset()
        retriever = SemanticRetriever(vector_store=test_vector_store, embedding_service=embedding_service)
        
        parsed = TXTParser().parse(risk_report_file)
        retriever.index_document(parsed)

        agent = RiskForecastAgent(retriever=retriever)
        result = agent.analyze()

        assert isinstance(result, RiskForecastResult)
        assert result.agent_role == "risk_forecaster"
        assert result.total_risks_detected >= 3

        # Verify risk categories detected
        categories = [r.category for r in result.detected_risks]
        assert RiskCategory.DEPENDENCY in categories or RiskCategory.SCHEDULE in categories

        # Verify high/critical level assigned
        levels = [r.level for r in result.detected_risks]
        assert RiskLevel.CRITICAL in levels or RiskLevel.HIGH in levels or RiskLevel.MEDIUM in levels

        # Verify supporting reasons & grounding
        for r in result.detected_risks:
            assert len(r.reason) > 10
            assert len(r.suggested_mitigation) > 10
            if r.source_reference:
                assert r.source_reference.filename == risk_report_file.name

        # Verify Delivery Forecast
        assert result.forecast.overall_status in [DeliveryStatus.AT_RISK, DeliveryStatus.DELAYED, DeliveryStatus.ON_TRACK]
        assert result.forecast.slippage_probability > 0.0
        assert len(result.forecast.key_forecast_factors) > 0

        # Verify Risk Priority Matrix coordinates & data
        assert "points" in result.risk_matrix
        assert len(result.risk_matrix["points"]) >= 3
        for pt in result.risk_matrix["points"]:
            assert 0.0 <= pt["probability"] <= 1.0
            assert 0.0 <= pt["impact_score"] <= 1.0
            assert pt["quadrant"] in [
                "Critical Action Zone",
                "High Impact / Contingency",
                "High Prob / Mitigate",
                "Routine Monitoring"
            ]
        assert "quadrant_counts" in result.risk_matrix
        assert result.risk_matrix["total_plotted"] >= 3

        # Verify 5x5 Enterprise Risk Matrix Heatmap structure & 25 cells
        assert "grid" in result.matrix_5x5
        assert len(result.matrix_5x5["grid"]) == 5  # 5 probability rows
        total_cells = sum(len(row) for row in result.matrix_5x5["grid"])
        assert total_cells == 25  # Exactly 25 cells

        # Verify formula: Score = Probability * Impact and severity threshold mapping
        for row in result.matrix_5x5["grid"]:
            for cell in row:
                p = cell["probability"]
                i = cell["impact"]
                assert 1 <= p <= 5
                assert 1 <= i <= 5
                expected_score = p * i
                assert cell["score"] == expected_score
                if expected_score >= 17:
                    assert cell["severity"] == "Critical"
                    assert cell["color"] == "#ef4444"
                elif expected_score >= 10:
                    assert cell["severity"] == "High"
                    assert cell["color"] == "#f97316"
                elif expected_score >= 5:
                    assert cell["severity"] == "Medium"
                    assert cell["color"] == "#f59e0b"
                else:
                    assert cell["severity"] == "Low"
                    assert cell["color"] == "#10b981"

        # Verify detected risks have discrete 1-5 ratings and calculated scores
        for r in result.detected_risks:
            if not r.is_unscored:
                assert 1 <= r.probability_rating <= 5
                assert 1 <= r.impact_rating <= 5
                assert r.risk_score == r.probability_rating * r.impact_rating
                assert r.severity in ["Critical", "High", "Medium", "Low"]

