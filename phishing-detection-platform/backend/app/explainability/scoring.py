"""Shared explainable risk-scoring engine.

Scoring method (documented for the report):
  * Every indicator (Finding) carries a weight w in [0, 1] representing how
    strongly that evidence suggests phishing on its own.
  * Each indicator id is counted at most once per scan (no double counting).
  * Aggregation uses noisy-OR:  score = 100 * (1 - prod(1 - w_i)).
    This is monotonic and bounded to [0, 100]; more evidence never lowers it.
  * Benign / mitigating observations are reported but contribute 0.
  * Checks that could not run are reported as "unavailable" and never lower
    the score.
  * Thresholds are prototype values, configurable via ScoringConfig.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Literal

Severity = Literal["info", "low", "medium", "high"]
Source = Literal["url_rules", "qr", "ocr", "visual_model", "reputation"]


class Classification(str, Enum):
    LOW = "Low Risk"
    CAUTION = "Caution"
    SUSPICIOUS = "Suspicious"
    HIGH = "High Risk"


@dataclass(frozen=True)
class ScoringConfig:
    caution_min: int = 25
    suspicious_min: int = 50
    high_min: int = 75

    def classify(self, score: int) -> Classification:
        if score >= self.high_min:
            return Classification.HIGH
        if score >= self.suspicious_min:
            return Classification.SUSPICIOUS
        if score >= self.caution_min:
            return Classification.CAUTION
        return Classification.LOW


@dataclass
class Finding:
    indicator_id: str
    name: str
    evidence: str
    severity: Severity
    weight: float
    explanation: str
    recommendation: str
    source: Source = "url_rules"
    benign: bool = False

    def contribution(self) -> float:
        return 0.0 if self.benign else max(0.0, min(1.0, self.weight))


@dataclass
class CheckStatus:
    name: str
    status: Literal["completed", "unavailable", "not_applicable"]
    note: str = ""


@dataclass
class ScoreResult:
    score: int
    classification: Classification
    findings: list[Finding] = field(default_factory=list)
    checks: list[CheckStatus] = field(default_factory=list)
    limitations: list[str] = field(default_factory=list)

    @property
    def coverage(self) -> dict:
        applicable = [c for c in self.checks if c.status != "not_applicable"]
        completed = [c for c in applicable if c.status == "completed"]
        unavailable = [c for c in applicable if c.status == "unavailable"]
        pct = round(100 * len(completed) / len(applicable)) if applicable else 0
        return {
            "applicable": len(applicable),
            "completed": len(completed),
            "unavailable": len(unavailable),
            "percent": pct,
        }


def score_findings(
    findings: list[Finding],
    checks: list[CheckStatus] | None = None,
    limitations: list[str] | None = None,
    config: ScoringConfig | None = None,
) -> ScoreResult:
    config = config or ScoringConfig()
    seen: set[str] = set()
    unique: list[Finding] = []
    for f in findings:
        if f.indicator_id in seen:
            continue
        seen.add(f.indicator_id)
        unique.append(f)

    remaining = 1.0
    for f in unique:
        remaining *= 1.0 - f.contribution()
    score = max(0, min(100, int(round(100 * (1.0 - remaining)))))

    return ScoreResult(
        score=score,
        classification=config.classify(score),
        findings=unique,
        checks=checks or [],
        limitations=limitations or [],
    )
