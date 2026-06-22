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
"""Tests for scaffold.py — focused on dataset.jsonl AI-content derivation."""

import json
import tempfile
import unittest
from pathlib import Path

from agent_eval.core.scaffold import _rows_from_recommendations, scaffold_dataset_jsonl

_DEFAULT_SESSION = {"app_name": "app", "user_id": "eval_user", "state": {}}


class TestRowsFromRecommendations(unittest.TestCase):
    """`_rows_from_recommendations` converts Gemini's recs into JSONL rows."""

    def test_empty_recommendations_returns_empty(self):
        assert _rows_from_recommendations(None, _DEFAULT_SESSION) == []
        assert _rows_from_recommendations({}, _DEFAULT_SESSION) == []

    def test_scenario_becomes_prompt_row(self):
        # Scenarios produce kind="multi_turn" rows. conversation_plan is
        # ALWAYS coerced to a list — even if Gemini returns a string, the
        # scaffold normalizes it (numbered "1. X 2. Y" → ["X", "Y"]) so
        # ADK's UserSim doesn't iterate over individual characters.
        recs = {
            "scenarios": [
                {"starting_prompt": "Plan a trip", "conversation_plan": "Then refine"},
            ],
        }
        rows = _rows_from_recommendations(recs, _DEFAULT_SESSION)
        assert len(rows) == 1
        assert rows[0]["kind"] == "multi_turn"
        assert rows[0]["prompt"] == "Plan a trip"
        assert rows[0]["conversation_plan"] == ["Then refine"]
        assert rows[0]["session_inputs"] == _DEFAULT_SESSION

    def test_scenario_with_list_conversation_plan_kept_as_list(self):
        recs = {
            "scenarios": [
                {
                    "starting_prompt": "Start",
                    "conversation_plan": ["First follow-up", "Second", "Third"],
                },
            ],
        }
        rows = _rows_from_recommendations(recs, _DEFAULT_SESSION)
        assert rows[0]["conversation_plan"] == ["First follow-up", "Second", "Third"]

    def test_scenario_with_numbered_string_plan_split_to_list(self):
        # Gemini sometimes ignores the "use a JSON array" instruction and
        # returns a numbered string. Scaffold splits on the markers.
        recs = {
            "scenarios": [
                {
                    "starting_prompt": "Start",
                    "conversation_plan": "1. Wait for the agent to reply.\n2. Ask a follow-up.\n3. Confirm and exit.",
                },
            ],
        }
        rows = _rows_from_recommendations(recs, _DEFAULT_SESSION)
        assert rows[0]["conversation_plan"] == [
            "Wait for the agent to reply.",
            "Ask a follow-up.",
            "Confirm and exit.",
        ]

    def test_golden_data_with_reference_behavior_maps_to_reference(self):
        # expected_behavior stays nested under reference_data AND is also
        # mirrored to the SDK-canonical top-level `reference` column for
        # managed metrics like FINAL_RESPONSE_MATCH.
        recs = {
            "golden_data": [
                {
                    "user_inputs": ["What's the weather in SF?"],
                    "reference_data": {"expected_behavior": "60 and foggy"},
                },
            ],
        }
        rows = _rows_from_recommendations(recs, _DEFAULT_SESSION)
        assert len(rows) == 1
        assert rows[0]["kind"] == "single_turn"
        assert rows[0]["prompt"] == "What's the weather in SF?"
        # reference_data stays NESTED — no top-level `reference` mirror anymore
        # (pre-2026-05-02 we duplicated expected_behavior to top-level which
        # forced users to edit two places to stay in sync).
        assert rows[0]["reference_data"] == {"expected_behavior": "60 and foggy"}
        assert "reference" not in rows[0]
        assert rows[0]["session_inputs"] == _DEFAULT_SESSION
        # IDs are now per-kind: scenarios → multi_turn_NNN, golden_data → single_turn_NNN.
        # (Pre-2026-05-01 used a generic ai_generated_NNN.)
        assert rows[0]["id"] == "single_turn_001"

    def test_golden_data_multi_turn_history(self):
        recs = {
            "golden_data": [
                {"user_inputs": ["First", "Second", "Third"]},
            ],
        }
        rows = _rows_from_recommendations(recs, _DEFAULT_SESSION)
        assert rows[0]["prompt"] == "Third"
        # SDK FLATTEN canonical column name is 'history'; older code used
        # 'conversation_history' but new scaffolds emit 'history' so it
        # round-trips to evaluate() without translation.
        assert rows[0]["history"] == [
            {"role": "user", "parts": [{"text": "First"}]},
            {"role": "user", "parts": [{"text": "Second"}]},
        ]

    def test_extra_reference_fields_stay_nested_under_reference_data(self):
        # Pre-2026-05-01 the scaffold flattened reference_data.* to top-level
        # row columns (row["expected_docs"] = ...). The evaluator's
        # `reference_data:expected_docs` source-column lookup then found
        # nothing → metric silently skipped every row. Now we keep them
        # nested so the lookup works.
        recs = {
            "golden_data": [
                {
                    "user_inputs": ["List docs"],
                    "reference_data": {
                        "expected_behavior": "Returns docs",
                        "expected_docs": ["a", "b"],
                    },
                },
            ],
        }
        rows = _rows_from_recommendations(recs, _DEFAULT_SESSION)
        assert rows[0]["reference_data"] == {
            "expected_behavior": "Returns docs",
            "expected_docs": ["a", "b"],
        }
        # No top-level `reference` mirror, no top-level `expected_docs` flatten.
        # The evaluator pulls from reference_data via SDK_COLUMN_DEFAULTS +
        # per-metric reference_field overrides.
        assert "reference" not in rows[0]
        assert "expected_docs" not in rows[0]


class TestScaffoldDatasetJsonl(unittest.TestCase):
    """End-to-end check that scaffold_dataset_jsonl writes the expected file."""

    def test_falls_back_to_boilerplate_without_recommendations(self):
        with tempfile.TemporaryDirectory() as td:
            scaffold_dataset_jsonl(Path(td), agent_name="my_agent")
            out = Path(td) / "tests" / "eval" / "dataset.jsonl"
            rows = [json.loads(line) for line in out.read_text().splitlines() if line]
            assert len(rows) == 2
            assert rows[0]["session_inputs"]["app_name"] == "my_agent"

    def test_uses_recommendations_when_present(self):
        recs = {
            "scenarios": [{"starting_prompt": "Trip", "conversation_plan": "Refine"}],
            "golden_data": [
                {
                    "user_inputs": ["Weather?"],
                    "reference_data": {"expected_behavior": "Foggy"},
                }
            ],
        }
        with tempfile.TemporaryDirectory() as td:
            scaffold_dataset_jsonl(Path(td), agent_name="app", recommendations=recs)
            out = Path(td) / "tests" / "eval" / "dataset.jsonl"
            rows = [json.loads(line) for line in out.read_text().splitlines() if line]
            assert len(rows) == 2
            assert rows[0]["prompt"] == "Trip"
            assert rows[1]["prompt"] == "Weather?"
            # Post-2026-05-02: reference_data stays nested; no top-level mirror.
            # The evaluator pulls `reference` from reference_data:expected_behavior
            # via SDK_COLUMN_DEFAULTS.
            assert rows[1]["reference_data"] == {"expected_behavior": "Foggy"}
            assert "reference" not in rows[1]

    def test_existing_file_preserved(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / "tests" / "eval" / "dataset.jsonl"
            out.parent.mkdir(parents=True)
            out.write_text('{"prompt": "untouched"}\n')
            scaffold_dataset_jsonl(Path(td), agent_name="app")
            assert out.read_text() == '{"prompt": "untouched"}\n'


if __name__ == "__main__":
    unittest.main()
