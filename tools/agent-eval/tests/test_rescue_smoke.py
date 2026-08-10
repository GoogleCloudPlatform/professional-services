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
"""Rescue smoke — guards every fix landed in the post-2026-04-23 rescue.

The 2026-04-23 customer demo had eight distinct failures (F1-F8 in the
rescue plan) and pytest caught zero of them. This file is the integration
layer the unit tests don't cover: the column shape we send to Vertex,
the bucket location we send to GCS, the file paths the scaffold writes
to, and the truthfulness of the end-of-run banner.

If any of these tests start failing, the rescue is regressing — investigate
the corresponding plan item BEFORE editing the test.
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import pandas as pd

# Quiet env keeps gcloud/etc. from being probed during the smoke.
_QUIET_ENV = {
    "GOOGLE_CLOUD_PROJECT": "test-project",
    "GOOGLE_CLOUD_LOCATION": "us-central1",
    "AGENT_EVAL_NO_PAUSES": "1",
    "AGENT_ENGINE_RESOURCE_NAME": "",
}

# ---------------------------------------------------------------------------
# A1 / A1.5 — Managed metric request shape
# ---------------------------------------------------------------------------


class TestA15ManagedMetricColumnShape(unittest.TestCase):
    """The pydantic crash from F1 came from sending a JSON-wrapped
    ``{"contents": [...]}`` blob in the ``prompt`` column. Vertex's
    RubricMetric judges expect plain text plus per-metric extras like
    ``intermediate_events``. This test asserts our column-build helper
    produces the right shape — if the wrapped form ever sneaks back in,
    this fails BEFORE Vertex does."""

    def _row(self) -> dict:
        return {
            "user_inputs": ["What's in the legal docs about CrowdStrike?"],
            "final_response": "Which dataset — Delta or CrowdStrike?",
            "final_session_state": {
                "events": [
                    {
                        "id": "evt-1",
                        "author": "user",
                        "timestamp": 1776962954.33858,
                        "content": {
                            "role": "user",
                            "parts": [{"text": "What's in the legal docs?"}],
                        },
                    },
                    {
                        "id": "evt-2",
                        "author": "root_agent",
                        "timestamp": 1776962955.5,
                        "content": {
                            "role": "model",
                            "parts": [{"text": "Which dataset?"}],
                        },
                    },
                ]
            },
        }

    def test_general_quality_uses_plain_prompt_response(self):
        from agent_eval.core.evaluator import _build_managed_eval_dataset

        df = pd.DataFrame([self._row()])
        ed, err = _build_managed_eval_dataset(
            {"kind": "managed", "base": "GENERAL_QUALITY"},
            "general_quality",
            "GENERAL_QUALITY",
            df,
        )
        self.assertIsNone(err)
        self.assertEqual(set(ed.columns), {"prompt", "response"})
        # Plain text — the F1 regression was sending the JSON wrapper here.
        self.assertEqual(
            ed["prompt"].iloc[0], "What's in the legal docs about CrowdStrike?"
        )
        self.assertEqual(
            ed["response"].iloc[0], "Which dataset — Delta or CrowdStrike?"
        )

    def test_tool_use_quality_includes_intermediate_events(self):
        """TOOL_USE_QUALITY needs `intermediate_events` per the Vertex
        rubric-metric-details docs. Pre-A1.5 we sent only prompt+response
        and Vertex returned `Variable tool_usage required`."""
        from agent_eval.core.evaluator import _build_managed_eval_dataset

        df = pd.DataFrame([self._row()])
        ed, err = _build_managed_eval_dataset(
            {"kind": "managed", "base": "TOOL_USE_QUALITY"},
            "tool_use_quality",
            "TOOL_USE_QUALITY",
            df,
        )
        self.assertIsNone(err)
        self.assertEqual(set(ed.columns), {"prompt", "response", "intermediate_events"})
        events = ed["intermediate_events"].iloc[0]
        self.assertIsInstance(events, list)
        self.assertEqual(len(events), 2)
        # ADK→Vertex Event normalization: id→event_id, float→ISO timestamp.
        self.assertEqual(events[0]["event_id"], "evt-1")
        self.assertEqual(events[0]["author"], "user")
        self.assertIn("creation_timestamp", events[0])
        # Content stays as Gemini Content shape — what Vertex's pydantic accepts.
        self.assertEqual(events[0]["content"]["role"], "user")

    def test_dataset_mapping_override_wins(self):
        """User can override the default source_column per metric. This
        is the contract the customer's metric files rely on."""
        from agent_eval.core.evaluator import _build_managed_eval_dataset

        df = pd.DataFrame(
            [
                {
                    "user_inputs": ["fallback prompt"],
                    "final_response": "default response",
                    "session_id": "use-this-instead",
                    "final_session_state": {"events": []},
                }
            ]
        )
        ed, err = _build_managed_eval_dataset(
            {
                "kind": "managed",
                "base": "GENERAL_QUALITY",
                "dataset_mapping": {
                    "prompt": {"source_column": "session_id"},
                },
            },
            "gq",
            "GENERAL_QUALITY",
            df,
        )
        self.assertIsNone(err)
        self.assertEqual(ed["prompt"].iloc[0], "use-this-instead")

    def test_state_grounded_metric_extraction(self):
        """Verify that we can extract nested fields from final_session_state
        using dataset_mapping."""
        from agent_eval.core.evaluator import _build_managed_eval_dataset

        row = {
            "user_inputs": ["What's in the legal docs?"],
            "final_response": "Which dataset?",
            "final_session_state": {
                "state": {
                    "campaign_brief": "This is the campaign brief content.",
                    "other_var": "unused",
                }
            },
        }
        df = pd.DataFrame([row])

        metric_info = {
            "kind": "managed",
            "base": "GROUNDING",
            "dataset_mapping": {
                "context": {"source_column": "final_session_state:state.campaign_brief"}
            },
        }

        ed, err = _build_managed_eval_dataset(
            metric_info,
            "plan_grounding",
            "GROUNDING",
            df,
        )
        self.assertIsNone(err)
        self.assertEqual(set(ed.columns), {"prompt", "response", "context"})
        self.assertEqual(ed["context"].iloc[0], "This is the campaign brief content.")


# ---------------------------------------------------------------------------
# A4 — GCS bucket location decoupled from Vertex eval location
# ---------------------------------------------------------------------------


class TestA4BucketLocation(unittest.TestCase):
    """F5: passing Vertex's location verbatim to GCS broke first-time runs
    when Gemini 3+ defaults Vertex's location to 'global' (which GCS
    rejects for STANDARD-class buckets). The resolver must never pass
    'global' (or any non-region) to create_bucket."""

    def test_global_vertex_location_falls_back_to_us_central1(self):
        from agent_eval.cli.commands.agent_engine import _resolve_bucket_location

        self.assertEqual(_resolve_bucket_location("global", None), "us-central1")

    def test_real_region_passes_through(self):
        from agent_eval.cli.commands.agent_engine import _resolve_bucket_location

        self.assertEqual(_resolve_bucket_location("us-east1", None), "us-east1")

    def test_explicit_override_always_wins(self):
        from agent_eval.cli.commands.agent_engine import _resolve_bucket_location

        # Override beats both 'global' fallback AND a real region.
        self.assertEqual(
            _resolve_bucket_location("global", "europe-west1"), "europe-west1"
        )
        self.assertEqual(_resolve_bucket_location("us-east1", "us-west2"), "us-west2")

    def test_create_bucket_never_called_with_global(self):
        """The integration: when Vertex location is 'global', the
        ``_ensure_bucket_exists`` call into ``storage.create_bucket`` MUST
        receive a real region. Pre-A4 it received 'global' and GCS 400'd."""
        with mock.patch("google.cloud.storage.Client") as MockClient:
            instance = MockClient.return_value
            instance.lookup_bucket.return_value = None
            instance.create_bucket.return_value = mock.MagicMock()

            from agent_eval.cli.commands.agent_engine import _ensure_bucket_exists

            _ensure_bucket_exists(
                uri="gs://my-bucket/some/prefix",
                project="test-project",
                vertex_location="global",
                bucket_location_override=None,
            )

            create_call = instance.create_bucket.call_args
            self.assertIsNotNone(create_call, "create_bucket should have been called")
            # Could be positional or keyword — accept both.
            kwargs = create_call.kwargs
            args = create_call.args
            location = kwargs.get("location") or (args[1] if len(args) > 1 else None)
            self.assertNotEqual(
                location,
                "global",
                f"GCS rejects location='global' for STANDARD buckets — got: {location}",
            )
            self.assertEqual(location, "us-central1")


# ---------------------------------------------------------------------------
# D5 — Scaffold writes at the project root, NEVER inside the agent module
# ---------------------------------------------------------------------------


class TestD5ScaffoldAtProjectRoot(unittest.TestCase):
    """F3: pre-rescue ``scaffold.py`` wrote ``<agent_dir>/tests/eval/...``
    which created a confusing parallel folder INSIDE the agent module.
    Phase D resolves the project root via ``agent_project_root`` and
    writes there. This test asserts the F3 layout never reappears."""

    def _make_project(self, td: Path) -> Path:
        """ASP-style layout: pyproject.toml at root, app/ module dir."""
        (td / "pyproject.toml").write_text("[project]\nname = 'fixture'\n")
        (td / "app").mkdir()
        (td / "app" / "__init__.py").write_text("")
        (td / "app" / "agent.py").write_text("# stub\n")
        return td / "app"

    def test_scaffold_dataset_lands_at_project_root(self):
        from agent_eval.core.scaffold import scaffold_dataset_jsonl

        with tempfile.TemporaryDirectory() as raw_td:
            td = Path(raw_td).resolve()
            agent_dir = self._make_project(td)
            scaffold_dataset_jsonl(agent_dir, agent_name="app")
            self.assertTrue(
                (td / "tests" / "eval" / "dataset.jsonl").exists(),
                "dataset.jsonl must land at <project_root>/tests/eval/",
            )
            self.assertFalse(
                (agent_dir / "tests").exists(),
                "F3 regression: app/tests/ must not exist",
            )

    def test_scaffold_metrics_lands_at_project_root(self):
        from agent_eval.core.scaffold import scaffold_metrics_only

        with tempfile.TemporaryDirectory() as raw_td:
            td = Path(raw_td).resolve()
            agent_dir = self._make_project(td)
            scaffold_metrics_only(agent_dir, agent_name="app")
            self.assertTrue(
                (
                    td / "tests" / "eval" / "metrics" / "metric_definitions.json"
                ).exists(),
                "metric_definitions.json must land at <project_root>/tests/eval/metrics/",
            )
            self.assertFalse(
                (agent_dir / "tests").exists(),
                "F3 regression: app/tests/ must not exist",
            )


# ---------------------------------------------------------------------------
# Phase D unified dataset — interact + agent-engine + simulate share one file
# ---------------------------------------------------------------------------


class TestPhaseDUnifiedDataset(unittest.TestCase):
    """The Phase D promise: ONE ``tests/eval/dataset.jsonl`` feeds simulate
    (multi-turn rows), interact (single-turn), and agent-engine (single-turn,
    skipping multi-turn with a clear message)."""

    def test_simulate_projects_only_multi_turn_rows(self):
        from agent_eval.cli.commands.simulate import _project_dataset_to_adk_files

        with tempfile.TemporaryDirectory() as raw_td:
            td = Path(raw_td).resolve()
            (td / "pyproject.toml").write_text("[project]\nname = 'fx'\n")
            agent_dir = td / "app"
            agent_dir.mkdir()
            eval_dir = td / "tests" / "eval"
            eval_dir.mkdir(parents=True)
            (eval_dir / "dataset.jsonl").write_text(
                "\n".join(
                    [
                        json.dumps({"id": "single", "prompt": "single-turn"}),
                        json.dumps(
                            {
                                "id": "multi",
                                "prompt": "follow-up",
                                "history": [
                                    {"role": "user", "parts": [{"text": "first"}]}
                                ],
                            }
                        ),
                        json.dumps(
                            {
                                "id": "plan",
                                "prompt": "starter",
                                "conversation_plan": ["step a", "step b"],
                            }
                        ),
                    ]
                )
                + "\n"
            )
            n, source = _project_dataset_to_adk_files(agent_dir, td)
            self.assertEqual(n, 2, "single-turn row must be filtered out")
            self.assertEqual(source, "dataset.jsonl")
            scenarios = json.loads(
                (agent_dir / "conversation_scenarios.json").read_text()
            )
            ids = [s["starting_prompt"] for s in scenarios["scenarios"]]
            self.assertNotIn("single-turn", ids)

            # ADK's ConversationScenarios pydantic schema is `extra="forbid"`
            # — only `scenarios` is allowed at the top level. The `_generated_by`
            # marker we used to write tripped pydantic validation in `adk eval`.
            self.assertEqual(
                set(scenarios.keys()),
                {"scenarios"},
                "no extra top-level keys may leak into the projection",
            )

            # ADK expects `conversation_plan` to be a STRING (high-level goals)
            # per https://adk.dev/evaluate/user-sim/. Our row schema uses a list;
            # the projection joins them. List-typed values trip pydantic
            # validation as `string_type` errors.
            for scenario in scenarios["scenarios"]:
                self.assertIsInstance(
                    scenario["conversation_plan"],
                    str,
                    f"conversation_plan must be a string, got {type(scenario['conversation_plan']).__name__}",
                )
            # The list-shape row should yield numbered goals.
            plan_row = next(
                s for s in scenarios["scenarios"] if s["starting_prompt"] == "starter"
            )
            self.assertIn("1. step a", plan_row["conversation_plan"])
            self.assertIn("2. step b", plan_row["conversation_plan"])

    def test_interact_skips_multi_turn_rows(self):
        from agent_eval.core.interactions import get_golden_questions

        with tempfile.TemporaryDirectory() as raw_td:
            td = Path(raw_td).resolve()
            ds = td / "dataset.jsonl"
            ds.write_text(
                "\n".join(
                    [
                        json.dumps({"id": "q1", "prompt": "single-turn"}),
                        json.dumps(
                            {
                                "id": "q2",
                                "prompt": "follow-up",
                                "history": [{"role": "user", "parts": [{"text": "x"}]}],
                            }
                        ),
                    ]
                )
                + "\n"
            )
            qs = get_golden_questions(str(ds))
            self.assertEqual(len(qs), 1)
            self.assertEqual(qs[0]["id"], "q1")
            self.assertEqual(qs[0]["user_inputs"], ["single-turn"])

    def test_interact_preserves_nested_reference_data(self):
        """Canonical dataset.jsonl rows have `reference_data` as a NESTED dict.

        Earlier the loader only read top-level `expected_*` fields, so the
        nested shape was silently dropped — every metric with
        `requires_reference: true` then SKIPPED every row even though the
        data was right there in the dataset. This guards against regressing
        that bug.
        """
        from agent_eval.core.interactions import get_golden_questions

        with tempfile.TemporaryDirectory() as raw_td:
            td = Path(raw_td).resolve()
            ds = td / "dataset.jsonl"
            ds.write_text(
                json.dumps(
                    {
                        "id": "q1",
                        "prompt": "What is X?",
                        "reference_data": {
                            "expected_behavior": "agent answers grounded in docs",
                            "expected_facts": ["X is a service", "It launched in 2023"],
                        },
                    }
                )
                + "\n"
            )
            qs = get_golden_questions(str(ds))
            self.assertEqual(len(qs), 1)
            ref = qs[0]["reference_data"]
            self.assertIn(
                "expected_behavior",
                ref,
                "nested reference_data fields must survive the loader",
            )
            self.assertIn(
                "expected_facts",
                ref,
                "list-typed expected_* fields must survive the loader",
            )
            self.assertEqual(
                ref["expected_facts"], ["X is a service", "It launched in 2023"]
            )


# ---------------------------------------------------------------------------
# A2 — Honest failure copy (no more "API rate limits" lie)
# ---------------------------------------------------------------------------


class TestA2HonestFailureCopy(unittest.TestCase):
    """When a metric exhausts retries, the worker now returns the actual
    exception class + first-line message. Pre-A2 we said 'API rate limits'
    for every failure regardless of cause."""

    def test_failed_worker_returns_real_exception_info(self):
        from agent_eval.core.evaluator import run_single_metric_evaluation

        class StubClient:
            class evals:
                @staticmethod
                def evaluate(*_, **__):
                    raise ValueError("contents/Extra inputs are not permitted")

        eval_dataset = pd.DataFrame([{"prompt": "x", "response": "y"}])
        metric_obj = mock.MagicMock(name="metric")
        metric_df = eval_dataset.copy()
        result = run_single_metric_evaluation(
            (
                eval_dataset,
                metric_obj,
                metric_df,
                "general_quality",
                StubClient(),
                1,
                0,
                None,
            )
        )
        parsed_df, name, _, error_info = result
        self.assertIsNone(parsed_df)
        self.assertEqual(name, "general_quality")
        self.assertIsNotNone(error_info)
        self.assertEqual(error_info["exception_type"], "ValueError")
        self.assertIn("contents", error_info["message"])


class TestCustomLlmJudgeStateGrounded(unittest.TestCase):
    def test_custom_placeholder_mapped_to_state(self):
        from agent_eval.core.data_mapper import map_dataset_columns

        row = {
            "user_inputs": ["prompt"],
            "final_response": "response",
            "final_session_state": {"state": {"my_data": "value_from_state"}},
        }
        agent_df = pd.DataFrame([row])
        original_df = agent_df.copy()

        mapping = {"state_val": {"source_column": "final_session_state:state.my_data"}}

        eval_dataset = map_dataset_columns(
            agent_df, original_df, mapping, "my_metric", is_managed_metric=False
        )

        self.assertEqual(set(eval_dataset.columns), {"prompt", "response", "state_val"})
        self.assertEqual(eval_dataset["state_val"].iloc[0], "value_from_state")


# ---------------------------------------------------------------------------
# agent-engine metric check tests
# ---------------------------------------------------------------------------


class TestAgentEngineMetricsCheck(unittest.TestCase):
    """Verify that _has_agent_specific_metrics detects tool/agent metrics correctly."""

    def test_non_agent_metrics_returns_false(self):
        from agent_eval.cli.commands.agent_engine import _has_agent_specific_metrics

        m1 = mock.MagicMock()
        m1.metric = "general_quality"
        m2 = mock.MagicMock()
        m2.metric = "safety"

        self.assertFalse(_has_agent_specific_metrics([m1, m2]))

    def test_tool_use_metric_returns_true(self):
        from agent_eval.cli.commands.agent_engine import _has_agent_specific_metrics

        m1 = mock.MagicMock()
        m1.metric = "general_quality"
        m2 = mock.MagicMock()
        m2.metric = "TOOL_USE_QUALITY"

        self.assertTrue(_has_agent_specific_metrics([m1, m2]))

    def test_tool_call_metric_returns_true(self):
        from agent_eval.cli.commands.agent_engine import _has_agent_specific_metrics

        m1 = mock.MagicMock()
        m1.metric = "TOOL_CALL_ACCURACY"

        self.assertTrue(_has_agent_specific_metrics([m1]))



if __name__ == "__main__":
    unittest.main()
