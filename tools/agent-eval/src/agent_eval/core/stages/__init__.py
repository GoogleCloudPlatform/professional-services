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
"""Modular CLI stages package for pipeline orchestration and validation."""

from __future__ import annotations

from typing import Any

from agent_eval.core.stages.base import BaseStage, StageResult
from agent_eval.core.stages.calibration import CalibrationStage
from agent_eval.core.stages.metric_selection import MetricSelectionStage
from agent_eval.core.stages.rubrics import RubricsStage

__all__ = [
    "BaseStage",
    "CalibrationStage",
    "MetricSelectionStage",
    "RubricsStage",
    "StageResult",
    "run_stage",
]

_STAGES: dict[str, type[BaseStage]] = {
    "metric_selection": MetricSelectionStage,
    "rubrics": RubricsStage,
    "calibration": CalibrationStage,
}


def run_stage(stage_name: str,
              config_data: dict[str, Any] | None = None,
              **kwargs: Any) -> StageResult:
    """Run a named evaluation CLI stage and return structured event output."""
    norm = stage_name.strip().lower()
    stage_cls = _STAGES.get(norm)
    if not stage_cls:
        raise ValueError(
            f"Unknown stage '{stage_name}'. Known stages: {list(_STAGES.keys())}"
        )
    return stage_cls().execute(config_data=config_data, **kwargs)
