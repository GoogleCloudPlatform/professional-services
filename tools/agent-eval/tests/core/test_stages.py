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
"""Unit tests for modular CLI stages and canonical AgentData schema."""

import json

from click.testing import CliRunner

from agent_eval.cli.commands.stage import stage
from agent_eval.core.schema import AgentData
from agent_eval.core.stages import run_stage


def test_agentdata_canonical_schema():
    """Verify canonical AgentData schema with AgentConfig adjacency map per RFC 477 / RFC 135."""
    row = {
        "id":
            "NA_Q1",
        "prompt":
            "Test prompt",
        "agents": {
            "root_agent": {
                "agent_id": "root_agent",
                "type": "LlmAgent",
                "description": "Orchestrator",
                "sub_agents": ["data_analytics_subagent"],
            },
            "data_analytics_subagent": {
                "agent_id": "data_analytics_subagent",
                "type": "LlmAgent",
                "description": "Analytics",
                "sub_agents": [],
            },
        },
        "turns": [{
            "turn_id":
                1,
            "state":
                "COMPLETED",
            "events": [
                {
                    "author": "USER",
                    "content": "Test prompt"
                },
                {
                    "author": "AGENT",
                    "content": "Test answer"
                },
            ],
        }],
        "events": [
            {
                "author": "USER",
                "content": "Test prompt"
            },
            {
                "author": "AGENT",
                "content": "Test answer"
            },
        ],
    }

    ad = AgentData.model_validate(row)
    assert "root_agent" in ad.agents
    assert ad.agents["root_agent"].sub_agents == ["data_analytics_subagent"]
    assert len(ad.turns) == 1
    assert len(ad.events) == 2


def test_run_stage_metric_selection():
    """Verify metric_selection stage discovers configured metrics."""
    res = run_stage("metric_selection")
    assert res.stage == "metric_selection"
    assert res.status == "COMPLETED"
    assert len(res.events) > 0
    selected_names = {ev["metric_name"] for ev in res.events}
    assert "hallucination" in selected_names
    assert "tool_use_quality" in selected_names


def test_run_stage_rubrics():
    """Verify rubrics stage compiles two-step decomposed rubrics per RFC 105."""
    res = run_stage("rubrics")
    assert res.stage == "rubrics"
    assert res.status == "COMPLETED"
    compiled_names = {ev["metric_name"] for ev in res.events}
    assert "agronomic_accuracy" in compiled_names or "hallucination" in compiled_names
    for ev in res.events:
        assert "rubric_rules" in ev
        assert isinstance(ev["rubric_rules"], list)


def test_run_stage_calibration():
    """Verify calibration stage checks rubric calibration status."""
    res = run_stage("calibration")
    assert res.stage == "calibration"
    assert res.status == "COMPLETED"
    for ev in res.events:
        assert ev.get("calibration_status") == "calibrated"


def test_stage_cli_json_output():
    """Verify CLI stage command emits clean structured JSON for downstream ingestion."""
    runner = CliRunner()
    result = runner.invoke(stage, ["--only", "rubrics", "--output", "json"])
    assert result.exit_code == 0, f"Stage command failed: {result.output}"
    data = json.loads(result.output)
    assert data["stage"] == "rubrics"
    assert data["status"] == "COMPLETED"
    assert isinstance(data["events"], list)
