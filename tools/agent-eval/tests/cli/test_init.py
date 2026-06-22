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
"""Tests for `agent-eval init` — auto-derivation of evaluation surfaces.

Phase 7 removed the A/B chooser; `init` now derives which surfaces to
scaffold from path detection. These tests lock in that contract so a future
change can't quietly bring back a phantom Path A/B prompt.
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from click.testing import CliRunner

from agent_eval.cli.commands.init import _derive_chosen_paths, init
from agent_eval.core.path_detector import PathDetection

# ---------------------------------------------------------------------------
# Unit tests — _derive_chosen_paths
# ---------------------------------------------------------------------------


class TestDeriveChosenPaths(unittest.TestCase):
    """Lock the auto-derivation rule: detection state → which surfaces to scaffold.

    There is no chooser. UserSim composes with the streamlined Agent Engine
    pass — both surfaces are scaffolded whenever both are detected.
    """

    def test_local_only_yields_b(self):
        detection = PathDetection(
            path="B",
            evidence="local ADK agent",
            local_agents=[Path("app/agent.py")],
        )
        assert _derive_chosen_paths(detection) == {"B"}

    def test_agent_engine_only_yields_a(self):
        detection = PathDetection(
            path="A",
            evidence="env",
            agent_engine_resource="projects/p/locations/us-central1/reasoningEngines/123",
        )
        assert _derive_chosen_paths(detection) == {"A"}

    def test_both_detected_yields_both(self):
        detection = PathDetection(
            path="A",  # primary, but B is also available
            evidence="both",
            agent_engine_resource="projects/p/locations/us-central1/reasoningEngines/123",
            local_agents=[Path("app/agent.py")],
        )
        assert _derive_chosen_paths(detection) == {"A", "B"}

    def test_unknown_yields_empty(self):
        # Caller (init -y branch) defaults the empty set to {"B"} — local-only.
        # Verifying the empty return here keeps that policy in init.py, not here.
        detection = PathDetection(path="unknown", evidence="nothing found")
        assert _derive_chosen_paths(detection) == set()


# ---------------------------------------------------------------------------
# Helpers for the CliRunner integration tests
# ---------------------------------------------------------------------------


def _seed_local_agent(root: Path, *, module_name: str = "app") -> Path:
    """Drop a minimal agent.py + __init__.py so path detection finds it."""
    pkg = root / module_name
    pkg.mkdir(parents=True)
    (pkg / "__init__.py").write_text("from .agent import root_agent\n")
    (pkg / "agent.py").write_text(
        "class _Stub:\n    name = 'stub'\nroot_agent = _Stub()\n"
    )
    return pkg


def _seed_deployment_metadata(root: Path) -> Path:
    """Drop a deployment_metadata.json with a real resource name."""
    md = root / "deployment_metadata.json"
    md.write_text(
        json.dumps(
            {
                "remote_agent_engine_id": "projects/p/locations/us-central1/reasoningEngines/123",
            }
        )
    )
    return md


def _env_for_init(root: Path) -> dict[str, str]:
    """Env that satisfies init's Step 0 (env check) without touching gcloud.

    `init` calls `_verify_environment` which checks GOOGLE_CLOUD_PROJECT, ADC
    file existence, and Vertex API enablement. We stub those at the call sites
    rather than here — these env values just keep config helpers happy.
    """
    return {
        "GOOGLE_CLOUD_PROJECT": "test-project",
        "GOOGLE_CLOUD_LOCATION": "us-central1",
        "AGENT_EVAL_NO_PAUSES": "1",
        # Force AE detection off when we don't seed metadata — otherwise a
        # stray env var on the developer's box would flip B-only tests to
        # both-detected and the assertions would slip silently.
        "AGENT_ENGINE_RESOURCE_NAME": "",
    }


# ---------------------------------------------------------------------------
# Integration tests — CliRunner against `init -y`
# ---------------------------------------------------------------------------


class TestInitAutoApprove(unittest.TestCase):
    """`init -y` must derive surfaces from detection — no chooser, no prompts.

    We stub `_verify_environment` to skip gcloud checks, then assert that the
    correct surfaces are scaffolded based on what we seeded into the tmp dir.
    """

    def _invoke(self, target_dir: Path) -> object:
        """Invoke init -y with env stubbed and the gcloud check no-oped."""
        runner = CliRunner()
        with mock.patch(
            "agent_eval.cli.commands.init._verify_environment",
            return_value=None,
        ):
            return runner.invoke(
                init,
                ["-y", "--target-dir", str(target_dir)],
                env=_env_for_init(target_dir),
                catch_exceptions=False,
            )

    def test_local_only_scaffolds_b_and_leads_with_run(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            _seed_local_agent(root)

            result = self._invoke(root)

            assert result.exit_code == 0, result.output
            # Phase D unified layout: ONE source of truth at the project
            # root. No more eval/scenarios/ or eval/eval_data/ files —
            # multi-turn rows go in dataset.jsonl and simulate.py projects
            # them to ADK's expected files at runtime.
            assert (
                root / "tests" / "eval" / "metrics" / "metric_definitions.json"
            ).exists()
            assert (root / "tests" / "eval" / "dataset.jsonl").exists()
            assert not (
                root / "eval" / "scenarios" / "conversation_scenarios.json"
            ).exists()
            assert not (root / "eval" / "eval_data" / "golden_dataset.json").exists()
            assert not (root / "app" / "tests").exists(), (
                "F3 regression: app/tests/ must not exist; tests/eval/ lives at the project root"
            )
            # Next-steps leads with the local iteration loop
            assert "agent-eval run" in result.output
            # No chooser, no Path A/B leak
            assert "Choose path" not in result.output
            assert "Path A" not in result.output
            assert "Path B" not in result.output

    def test_both_detected_scaffolds_both_and_leads_with_run(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            _seed_local_agent(root)
            _seed_deployment_metadata(root)

            result = self._invoke(root)

            assert result.exit_code == 0, result.output
            # Same unified layout regardless of detection.
            assert (
                root / "tests" / "eval" / "metrics" / "metric_definitions.json"
            ).exists()
            assert (root / "tests" / "eval" / "dataset.jsonl").exists()
            assert not (root / "app" / "tests").exists(), (
                "F3 regression: app/tests/ must not exist"
            )
            # Next-steps STILL leads with `run` (the iteration loop), then
            # mentions agent-engine as the secondary pass.
            run_idx = result.output.find("agent-eval run")
            ae_idx = result.output.find("agent-eval agent-engine")
            assert run_idx != -1, "agent-eval run missing from next-steps"
            assert ae_idx != -1, "agent-eval agent-engine missing from next-steps"
            assert run_idx < ae_idx, (
                "Next-steps must lead with `agent-eval run` (local iteration "
                "loop) and surface `agent-engine` second — got run at "
                f"{run_idx}, agent-engine at {ae_idx}"
            )
            assert "Path A" not in result.output
            assert "Path B" not in result.output

    def test_no_detection_falls_back_to_local_only(self):
        """Empty target dir — no agent.py, no deployment metadata.

        `_derive_chosen_paths` returns set(); `init -y` defaults to {"B"} so the
        user can keep going (typical "I'm wiring up agent.py next" flow).
        """
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            # No seeding. Just an empty dir.

            result = self._invoke(root)

            assert result.exit_code == 0, result.output
            # Unified scaffold lands at <project_root>/tests/eval/.
            assert (
                root / "tests" / "eval" / "metrics" / "metric_definitions.json"
            ).exists()
            assert "Path A" not in result.output
            assert "Path B" not in result.output


class TestRequiredReferenceFields(unittest.TestCase):
    def test_extracts_from_dataset_mapping(self):
        from agent_eval.cli.commands.init import _required_reference_fields

        custom_metrics = {
            "m1": {
                "kind": "custom_llm_judge",
                "dataset_mapping": {
                    "reference": {"source_column": "reference_data:expected_behavior"}
                },
            },
            "m2": {
                "kind": "custom_llm_judge",
                "dataset_mapping": {
                    "expected_audiences": {
                        "source_column": "reference_data:expected_audiences"
                    }
                },
            },
            "m3": {"kind": "managed", "reference_field": "expected_route"},
        }

        fields = _required_reference_fields(custom_metrics)
        expected = [
            ("m1", "expected_behavior"),
            ("m2", "expected_audiences"),
            ("m3", "expected_route"),
        ]
        self.assertEqual(fields, expected)


if __name__ == "__main__":
    unittest.main()
