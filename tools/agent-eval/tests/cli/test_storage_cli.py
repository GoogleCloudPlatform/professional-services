"""CLI tests for --storage, --gcs-bucket, and --bq-dataset flags in agent-eval run."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from click.testing import CliRunner
from agent_eval.cli.main import cli


class TestStorageCLI(unittest.TestCase):
    """Verify that agent-eval run accepts --storage flags and delegates to StorageBackend."""

    def setUp(self):
        self.runner = CliRunner()
        self.env = {"AGENT_EVAL_NO_PAUSES": "1"}

    @mock.patch("agent_eval.cli.commands.run._run_analyze_phase")
    @mock.patch("agent_eval.cli.commands.run._run_evaluate_phase")
    @mock.patch("agent_eval.cli.commands.run._run_interact_phase")
    @mock.patch("agent_eval.cli.commands.run._run_simulate_phase")
    def test_run_with_storage_flags_accepted(
        self,
        mock_simulate,
        _mock_interact,
        mock_evaluate,
        mock_analyze,
    ):
        with tempfile.TemporaryDirectory() as tmpdir:
            project_root = Path(tmpdir)
            agent_dir = project_root / "app"
            eval_dir = project_root / "tests" / "eval"
            metrics_dir = eval_dir / "metrics"
            run_dir = eval_dir / "results" / "test_run"
            raw_dir = run_dir / "raw"
            agent_dir.mkdir(parents=True)
            metrics_dir.mkdir(parents=True)
            raw_dir.mkdir(parents=True)

            # Create required files
            (agent_dir / "agent.py").write_text("root_agent = None\n", encoding="utf-8")
            (eval_dir / "dataset.jsonl").write_text(
                json.dumps(
                    {"id": "q1", "prompt": "test", "conversation_plan": ["step 1"]}
                )
                + "\n",
                encoding="utf-8",
            )
            (metrics_dir / "metric.json").write_text(
                '{"name": "test_metric"}', encoding="utf-8"
            )

            mock_simulate.return_value = True
            (raw_dir / "processed_interaction_sim.jsonl").write_text(
                "{}", encoding="utf-8"
            )

            result = self.runner.invoke(
                cli,
                [
                    "run",
                    "--agent-dir",
                    str(agent_dir),
                    "--eval-dir",
                    str(eval_dir),
                    "--run-id",
                    "test_run",
                    "--storage",
                    "local",
                    "--no-interact",
                    "--skip-gemini",
                    "--no-dashboard",
                ],
                env=self.env,
            )
            self.assertEqual(
                result.exit_code,
                0,
                f"CLI should succeed with --storage=local: {result.output}",
            )

    @mock.patch("agent_eval.cli.commands.run._run_analyze_phase")
    @mock.patch("agent_eval.cli.commands.run._run_evaluate_phase")
    @mock.patch("agent_eval.cli.commands.run._run_interact_phase")
    @mock.patch("agent_eval.cli.commands.run._run_simulate_phase")
    @mock.patch("agent_eval.core.storage.get_storage_backend")
    def test_run_with_gcs_storage(
        self,
        mock_get_backend,
        mock_simulate,
        _mock_interact,
        mock_evaluate,
        mock_analyze,
    ):
        with tempfile.TemporaryDirectory() as tmpdir:
            project_root = Path(tmpdir)
            agent_dir = project_root / "app"
            eval_dir = project_root / "tests" / "eval"
            metrics_dir = eval_dir / "metrics"
            run_dir = eval_dir / "results" / "test_run"
            raw_dir = run_dir / "raw"
            agent_dir.mkdir(parents=True)
            metrics_dir.mkdir(parents=True)
            raw_dir.mkdir(parents=True)

            # Create required files
            (agent_dir / "agent.py").write_text("root_agent = None\n", encoding="utf-8")
            (eval_dir / "dataset.jsonl").write_text(
                json.dumps(
                    {"id": "q1", "prompt": "test", "conversation_plan": ["step 1"]}
                )
                + "\n",
                encoding="utf-8",
            )
            (metrics_dir / "metric.json").write_text(
                '{"name": "test_metric"}', encoding="utf-8"
            )

            # Simulate writes processed_interaction_sim.jsonl to raw_dir
            mock_simulate.return_value = True
            (raw_dir / "processed_interaction_sim.jsonl").write_text(
                "{}", encoding="utf-8"
            )

            # Create dummy eval_summary.json
            summary_file = run_dir / "eval_summary.json"
            summary_file.write_text('{"score": 1.0}', encoding="utf-8")

            mock_backend = mock.MagicMock()
            mock_backend.save_summary.return_value = (
                "gs://my-eval-bucket/eval_runs/test_run/eval_summary.json"
            )
            mock_get_backend.return_value = mock_backend

            result = self.runner.invoke(
                cli,
                [
                    "run",
                    "--agent-dir",
                    str(agent_dir),
                    "--eval-dir",
                    str(eval_dir),
                    "--run-id",
                    "test_run",
                    "--storage",
                    "gcs",
                    "--gcs-bucket",
                    "my-eval-bucket",
                    "--no-interact",
                    "--skip-gemini",
                    "--no-dashboard",
                ],
                env=self.env,
            )
            self.assertEqual(
                result.exit_code, 0, f"CLI should succeed: {result.output}"
            )
            mock_get_backend.assert_called_once()
            mock_backend.save_summary.assert_called_once()


if __name__ == "__main__":
    unittest.main()
