# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Pydantic schemas for agent-eval data structures."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class ScoreRange(BaseModel):
    """Represents the range of scores for a metric."""
    min: float
    max: float
    type: str | None = None


class LLMMetricSummary(BaseModel):
    """Summary of a single LLM-based metric."""
    average: float
    threshold: float | None = None
    score_range: ScoreRange | None = None


class ADKEvalScore(BaseModel):
    """Summary of a single ADK-sourced metric."""
    average: float


class GitInfo(BaseModel):
    """Git repository metadata at the time of run."""
    branch: str | None = None
    commit: str | None = None
    dirty: bool | None = None
    diff: str | None = None


class OverallSummary(BaseModel):
    """Aggregated metrics summary for the entire run."""
    deterministic_metrics: dict[str, float] = Field(default_factory=dict)
    llm_based_metrics: dict[str, LLMMetricSummary] = Field(default_factory=dict)
    adk_eval_scores: dict[str, ADKEvalScore] = Field(default_factory=dict)
    failed_metrics: list[dict[str, Any] | str] = Field(default_factory=list)
    skipped_metrics: list[dict[str, Any] | str] = Field(default_factory=list)


class EvaluationSummary(BaseModel):
    """Comprehensive evaluation summary (eval_summary.json structure)."""
    experiment_id: str | None = None
    run_type: str | None = None
    test_description: str | None = None
    interaction_datetime: datetime | None = None
    git_info: GitInfo | None = None
    overall_summary: OverallSummary
    per_question_summary: list[dict[str, Any]] = Field(default_factory=list)
