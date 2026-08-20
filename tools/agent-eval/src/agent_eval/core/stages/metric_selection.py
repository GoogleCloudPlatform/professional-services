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
"""Metric selection stage — discovers and selects metrics for evaluation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml

from agent_eval.core.stages.base import BaseStage, StageResult


class MetricSelectionStage(BaseStage):
    """Discovers and selects evaluation metrics from declarative configs or JSON definitions."""

    stage_name = "metric_selection"

    def execute(self,
                config_data: dict[str, Any] | None = None,
                **kwargs: Any) -> StageResult:
        events: list[dict[str, Any]] = []
        metrics_dict: dict[str, Any] = {}
        source = "default"

        if (config_data and "metrics" in config_data and
                isinstance(config_data["metrics"], dict)):
            metrics_dict = config_data["metrics"]
            source = "eval_config.yaml"
        else:
            # Fallback to local discovery
            for candidate in (
                    Path("app/eval_config.yaml"),
                    Path("tests/eval/eval_config.yaml"),
            ):
                if candidate.exists():
                    try:
                        loaded = (yaml.safe_load(
                            candidate.read_text(encoding="utf-8")) or {})
                        if "metrics" in loaded and isinstance(
                                loaded["metrics"], dict):
                            metrics_dict = loaded["metrics"]
                            source = str(candidate)
                            break
                    except Exception:
                        pass
            if not metrics_dict:
                for candidate_json in (
                        Path("tests/eval/metrics/metric_definitions.json"),):
                    if candidate_json.exists():
                        try:
                            loaded_json = json.loads(
                                candidate_json.read_text(encoding="utf-8"))
                            if "metrics" in loaded_json:
                                metrics_dict = loaded_json["metrics"]
                                source = str(candidate_json)
                                break
                        except Exception:
                            pass

        if not metrics_dict:
            # Standard OOTB baseline
            metrics_dict = {
                "hallucination": {
                    "kind": "managed",
                    "base": "HALLUCINATION"
                },
                "tool_use_quality": {
                    "kind": "custom_llm_judge"
                },
            }
            source = "default_ootb_baseline"

        for m_name, spec in metrics_dict.items():
            kind = spec.get("kind", "managed") if isinstance(
                spec, dict) else "managed"
            events.append({
                "event_type": "metric_selected",
                "metric_name": m_name,
                "kind": kind,
                "source": source,
                "status": "selected",
            })

        return StageResult(
            stage=self.stage_name,
            status="COMPLETED",
            events=events,
            metadata={
                "total_selected": len(events),
                "source": source
            },
        )
