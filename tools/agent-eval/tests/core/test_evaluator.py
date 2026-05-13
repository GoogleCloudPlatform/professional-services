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
"""Tests for evaluator.py — multi-file loading and per-source summary."""

import json
import shutil
import tempfile
import unittest
from pathlib import Path

import pandas as pd

from agent_eval.core.evaluator import save_metrics_summary
from agent_eval.core.converters import write_jsonl, read_jsonl

# ── Helpers ──────────────────────────────────────────────────────────


def _make_eval_row(question_id, source_type, metrics):
    """Create a row dict matching what the evaluator produces after consolidation.

    Args:
        question_id: Question identifier.
        source_type: "simulation" or "interaction".
        metrics: Dict of {metric_name: score} — simplified for testing.
    """
    eval_results = {
        name: {
            "score": score,
            "explanation": f"Score {score} for {name}"
        } for name, score in metrics.items()
    }
    return {
        "question_id": question_id,
        "source_type": source_type,
        "eval_results": json.dumps(eval_results),
        "question_metadata": json.dumps({"category": "test"}),
    }


def _make_interaction_record(question_id,
                             source_type="interaction",
                             app_name="app"):
    """Create a minimal JSONL interaction record."""
    return {
        "question_id": question_id,
        "source_type": source_type,
        "app_name": app_name,
        "agents_evaluated": [app_name],
        "user_inputs": [f"Question {question_id}"],
        "final_response": f"Answer for {question_id}",
        "question_metadata": {
            "category": "test"
        },
        "reference_data": {},
        "extracted_data": {
            "tool_interactions": [{
                "tool_name": "search",
                "output_result": "ok"
            }],
        },
        "final_session_state": {},
        "session_trace": [],
        "latency_data": [],
    }


# ── Tests for save_metrics_summary ───────────────────────────────────


class TestSaveMetricsSummary(unittest.TestCase):

    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def _read_summary(self):
        with open(self.test_dir / "eval_summary.json") as f:
            return json.load(f)

    def test_basic_summary_without_source_type(self):
        """Standard summary works when source_type is absent (backward compat)."""
        df = pd.DataFrame([
            {
                "question_id":
                    "q1",
                "eval_results":
                    json.dumps({
                        "quality": {
                            "score": 4.0,
                            "explanation": "Good"
                        },
                    }),
                "question_metadata":
                    "{}",
            },
        ])
        save_metrics_summary(df, self.test_dir, "exp-1", "manual", "Test run")
        summary = self._read_summary()

        assert "per_source_summary" not in summary
        assert summary["overall_summary"]["llm_based_metrics"]["quality"][
            "average"] == 4.0

    def test_single_source_type_no_per_source_summary(self):
        """When all rows have the same source_type, no per_source_summary is added."""
        df = pd.DataFrame([
            _make_eval_row("q1", "simulation", {"quality": 4.0}),
            _make_eval_row("q2", "simulation", {"quality": 3.0}),
        ])
        save_metrics_summary(df, self.test_dir, "exp-1", "manual", "Test run")
        summary = self._read_summary()

        assert "per_source_summary" not in summary

    def test_multiple_source_types_produces_per_source_summary(self):
        """When rows have different source_types, per_source_summary is generated."""
        df = pd.DataFrame([
            _make_eval_row("sim_q1", "simulation", {
                "quality": 5.0,
                "accuracy": 4.0
            }),
            _make_eval_row("sim_q2", "simulation", {
                "quality": 3.0,
                "accuracy": 2.0
            }),
            _make_eval_row("int_q1", "interaction", {
                "quality": 4.0,
                "accuracy": 3.0
            }),
        ])
        save_metrics_summary(df, self.test_dir, "exp-1", "manual", "Test run")
        summary = self._read_summary()

        assert "per_source_summary" in summary
        pss = summary["per_source_summary"]

        # Simulation: quality avg = (5+3)/2 = 4.0, accuracy avg = (4+2)/2 = 3.0
        assert pss["simulation"]["quality"]["average"] == 4.0
        assert pss["simulation"]["quality"]["count"] == 2
        assert pss["simulation"]["accuracy"]["average"] == 3.0

        # Interaction: quality avg = 4.0, accuracy avg = 3.0
        assert pss["interaction"]["quality"]["average"] == 4.0
        assert pss["interaction"]["quality"]["count"] == 1
        assert pss["interaction"]["accuracy"]["average"] == 3.0

    def test_source_type_in_per_question_summary(self):
        """Per-question summaries include source_type when present."""
        df = pd.DataFrame([
            _make_eval_row("q1", "simulation", {"quality": 4.0}),
            _make_eval_row("q2", "interaction", {"quality": 3.0}),
        ])
        save_metrics_summary(df, self.test_dir, "exp-1", "manual", "Test run")
        summary = self._read_summary()

        questions = {
            q["question_id"]: q for q in summary["per_question_summary"]
        }
        assert questions["q1"]["source_type"] == "simulation"
        assert questions["q2"]["source_type"] == "interaction"

    def test_overall_summary_combines_all_sources(self):
        """overall_summary aggregates across ALL source types."""
        df = pd.DataFrame([
            _make_eval_row("q1", "simulation", {"quality": 5.0}),
            _make_eval_row("q2", "interaction", {"quality": 3.0}),
        ])
        save_metrics_summary(df, self.test_dir, "exp-1", "manual", "Test run")
        summary = self._read_summary()

        # Overall average: (5+3)/2 = 4.0
        assert summary["overall_summary"]["llm_based_metrics"]["quality"][
            "average"] == 4.0

    def test_score_range_preserved(self):
        """score_range from metric_definitions is included in the summary."""
        df = pd.DataFrame([
            _make_eval_row("q1", "simulation", {"quality": 4.0}),
        ])
        metric_defs = {
            "quality": {
                "score_range": {
                    "min": 0,
                    "max": 5,
                    "description": "Quality score"
                }
            }
        }
        save_metrics_summary(df, self.test_dir, "exp-1", "manual", "Test",
                             metric_defs)
        summary = self._read_summary()

        assert summary["overall_summary"]["llm_based_metrics"]["quality"][
            "score_range"]["max"] == 5


# ── Tests for multi-file JSONL loading ───────────────────────────────


class TestMultiFileLoading(unittest.TestCase):
    """Tests that multiple JSONL files can be loaded and concatenated."""

    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_write_and_read_jsonl(self):
        """Verify write_jsonl / read_jsonl roundtrip."""
        records = [
            _make_interaction_record("q1", "simulation"),
            _make_interaction_record("q2", "simulation"),
        ]
        path = str(self.test_dir / "test.jsonl")
        write_jsonl(records, path)
        loaded = read_jsonl(path)

        assert len(loaded) == 2
        assert loaded[0]["question_id"] == "q1"
        assert loaded[1]["source_type"] == "simulation"

    def test_concat_multiple_jsonl_files(self):
        """Multiple JSONL files can be concatenated into one DataFrame."""
        sim_records = [
            _make_interaction_record("sim_q1", "simulation"),
            _make_interaction_record("sim_q2", "simulation"),
        ]
        int_records = [
            _make_interaction_record("int_q1", "interaction"),
        ]

        sim_path = str(self.test_dir / "sim.jsonl")
        int_path = str(self.test_dir / "int.jsonl")
        write_jsonl(sim_records, sim_path)
        write_jsonl(int_records, int_path)

        # Simulate what Evaluator.evaluate() does
        all_dfs = []
        for path in [sim_path, int_path]:
            records = read_jsonl(path)
            all_dfs.append(pd.DataFrame(records))

        combined = pd.concat(all_dfs, ignore_index=True)

        assert len(combined) == 3
        assert list(combined["source_type"]) == [
            "simulation", "simulation", "interaction"
        ]
        assert list(combined["question_id"]) == ["sim_q1", "sim_q2", "int_q1"]

    def test_source_type_preserved_through_concat(self):
        """source_type column survives DataFrame concatenation."""
        rec1 = _make_interaction_record("q1", "simulation")
        rec2 = _make_interaction_record("q2", "interaction")

        path1 = str(self.test_dir / "a.jsonl")
        path2 = str(self.test_dir / "b.jsonl")
        write_jsonl([rec1], path1)
        write_jsonl([rec2], path2)

        df1 = pd.DataFrame(read_jsonl(path1))
        df2 = pd.DataFrame(read_jsonl(path2))
        combined = pd.concat([df1, df2], ignore_index=True)

        assert combined["source_type"].iloc[0] == "simulation"
        assert combined["source_type"].iloc[1] == "interaction"
        assert len(combined["source_type"].unique()) == 2


# ── Tests for source_type in record creation ─────────────────────────


class TestSourceTypeInRecords(unittest.TestCase):
    """Verify source_type is set correctly in converters and interactions."""

    def test_simulation_record_has_source_type(self):
        """Records from converters should have source_type='simulation'."""
        record = _make_interaction_record("q1", "simulation")
        assert record["source_type"] == "simulation"

    def test_interaction_record_has_source_type(self):
        """Records from interactions should have source_type='interaction'."""
        record = _make_interaction_record("q1", "interaction")
        assert record["source_type"] == "interaction"


if __name__ == "__main__":
    unittest.main()
