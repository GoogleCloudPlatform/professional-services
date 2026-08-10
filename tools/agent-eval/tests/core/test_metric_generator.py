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
"""Tests for metric_generator.py."""

import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from agent_eval.core.metric_generator import (
    MetricGenerationError,
    generate_eval_data,
    generate_metric_definitions,
)


@patch("agent_eval.core.metric_generator._call_gemini")
def test_generate_metric_definitions_success(mock_call_gemini):
    mock_response = {
        "metrics": {
            "custom_quality": {
                "kind": "custom_llm_judge",
                "instruction": "Evaluate quality",
                "criteria": {"good": "is good"},
                "rating_scores": {"1": "Yes", "0": "No"},
            }
        },
        "rationale": "Test rationale",
    }
    mock_call_gemini.return_value = json.dumps(mock_response)

    with tempfile.TemporaryDirectory() as td:
        target_dir = Path(td)
        agent_dir = target_dir / "app"
        agent_dir.mkdir()
        (agent_dir / "agent.py").write_text("class Agent: pass")

        agent_analysis = {
            "tools": [],
            "state_variables": {},
            "key_behaviors": [],
            "suggested_state_variables": [],
        }
        selected_managed = {
            "general_quality": {"kind": "managed", "base": "GENERAL_QUALITY"}
        }

        metrics, rationale = generate_metric_definitions(
            agent_dir=agent_dir,
            agent_name="app",
            agent_analysis=agent_analysis,
            selected_managed=selected_managed,
        )

        assert "custom_quality" in metrics
        assert metrics["custom_quality"]["kind"] == "custom_llm_judge"
        assert rationale == "Test rationale"
        mock_call_gemini.assert_called_once()


@patch("agent_eval.core.metric_generator._call_gemini")
def test_generate_metric_definitions_invalid_json_fallback(mock_call_gemini):
    mock_call_gemini.return_value = "invalid json"

    with tempfile.TemporaryDirectory() as td:
        agent_dir = Path(td) / "app"
        agent_dir.mkdir()
        (agent_dir / "agent.py").write_text("class Agent: pass")

        agent_analysis = {
            "tools": [],
            "state_variables": {},
            "key_behaviors": [],
            "suggested_state_variables": [],
        }
        selected_managed = {
            "general_quality": {"kind": "managed", "base": "GENERAL_QUALITY"}
        }

        with pytest.raises(MetricGenerationError, match="none passed validation"):
            generate_metric_definitions(
                agent_dir=agent_dir,
                agent_name="app",
                agent_analysis=agent_analysis,
                selected_managed=selected_managed,
            )


@patch("agent_eval.core.metric_generator._call_gemini")
def test_generate_eval_data_success(mock_call_gemini):
    mock_response = {
        "scenarios": [
            {"starting_prompt": "Scenario 1", "conversation_plan": ["Step 1"]}
        ],
        "golden_data": [
            {
                "user_inputs": ["Input 1"],
                "reference_data": {"expected_behavior": "Behavior 1"},
            }
        ],
    }
    mock_call_gemini.return_value = json.dumps(mock_response)

    with tempfile.TemporaryDirectory() as td:
        agent_dir = Path(td) / "app"
        agent_dir.mkdir()
        (agent_dir / "agent.py").write_text("class Agent: pass")

        metrics = {
            "custom_quality": {
                "kind": "custom_llm_judge",
                "criteria": {"good": "is good"},
                "rating_scores": {"1": "Yes", "0": "No"},
            }
        }

        agent_analysis = {"some": "analysis"}

        recs = generate_eval_data(
            agent_dir=agent_dir,
            agent_name="app",
            agent_analysis=agent_analysis,
            metric_definitions=metrics,
        )

        assert "scenarios" in recs
        assert len(recs["scenarios"]) == 1
        assert recs["scenarios"][0]["starting_prompt"] == "Scenario 1"
        assert "golden_data" in recs
        assert len(recs["golden_data"]) == 1
        assert recs["golden_data"][0]["user_inputs"] == ["Input 1"]
