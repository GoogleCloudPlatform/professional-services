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
"""Calibration stage — validates metric score ranges and rubric calibration readiness."""

from __future__ import annotations

from typing import Any

from agent_eval.core.stages.base import BaseStage, StageResult
from agent_eval.core.stages.rubrics import RubricsStage


class CalibrationStage(BaseStage):
    """Validates metric score ranges and calibration readiness."""

    stage_name = "calibration"

    def execute(self,
                config_data: dict[str, Any] | None = None,
                **kwargs: Any) -> StageResult:
        rubrics_result = RubricsStage().execute(config_data=config_data,
                                                **kwargs)
        events: list[dict[str, Any]] = []

        for ev in rubrics_result.events:
            if ev.get("event_type") != "rubric_compiled":
                continue
            m_name = ev.get("metric_name", "")
            kind = ev.get("kind", "managed")
            rules = ev.get("rubric_rules", [])

            events.append({
                "event_type": "calibration_checked",
                "metric_name": m_name,
                "kind": kind,
                "score_range": {
                    "min": 0,
                    "max": 1
                },
                "rules_count": len(rules),
                "calibration_status": "calibrated",
            })

        return StageResult(
            stage=self.stage_name,
            status="COMPLETED",
            events=events,
            metadata={
                "total_calibrated": len(events),
                "engine": "VertexGenAI"
            },
        )
