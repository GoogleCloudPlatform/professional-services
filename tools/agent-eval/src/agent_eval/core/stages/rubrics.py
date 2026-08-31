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
"""Rubrics stage — compiles two-step decomposed rubrics for evaluation metrics."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml

from agent_eval.core.stages.base import BaseStage, StageResult
from agent_eval.core.stages.metric_selection import MetricSelectionStage


class RubricsStage(BaseStage):
    """Compiles two-step decomposed rubrics for selected metrics."""

    stage_name = "rubrics"

    def execute(self,
                config_data: dict[str, Any] | None = None,
                **kwargs: Any) -> StageResult:
        selection_result = MetricSelectionStage().execute(
            config_data=config_data, **kwargs)
        events: list[dict[str, Any]] = []

        # Load raw specs to get criteria / instructions
        metrics_dict: dict[str, Any] = {}
        if (config_data and "metrics" in config_data and
                isinstance(config_data["metrics"], dict)):
            metrics_dict = config_data["metrics"]
        else:
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
                                break
                        except Exception:
                            pass

        for ev in selection_result.events:
            if ev.get("event_type") != "metric_selected":
                continue
            m_name = ev.get("metric_name", "")
            kind = ev.get("kind", "managed")
            spec = metrics_dict.get(m_name, {})

            rules: list[str] = []
            if kind == "managed":
                if "hallucination" in m_name.lower():
                    rules = [
                        "Verify 100% of numerical claims match raw database records returned by tool payload reference data.",
                        "Check grounding against reference tool outputs without unverified external assertions.",
                    ]
                else:
                    rules = [
                        f"Evaluate standard managed rubric rules for '{m_name}' (RFC 105 / RFC 462).",
                    ]
            elif kind == "custom_llm_judge":
                criteria = spec.get("criteria", {}) if isinstance(spec,
                                                                  dict) else {}
                if isinstance(criteria, dict) and criteria:
                    for c_val in criteria.values():
                        rules.append(str(c_val).strip())
                elif isinstance(spec, dict) and spec.get("instruction"):
                    rules.append(str(spec.get("instruction")).strip())
                else:
                    rules = [
                        f"Evaluate custom LLM judge criteria for '{m_name}' against reference answer.",
                    ]
            elif kind == "python_function":
                rules = [
                    f"Execute deterministic Python code checker '{spec.get('function', m_name)}' on dataset rows.",
                ]
            else:
                rules = [f"Evaluate '{m_name}' ({kind})."]

            events.append({
                "event_type": "rubric_compiled",
                "metric_name": m_name,
                "kind": kind,
                "rubric_rules": rules,
            })

        return StageResult(
            stage=self.stage_name,
            status="COMPLETED",
            events=events,
            metadata={
                "total_compiled": len(events),
                "decomposed_rubric_engine": "RFC-105-two-step",
            },
        )
