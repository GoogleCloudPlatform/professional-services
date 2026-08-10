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
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from click.testing import CliRunner

from agent_eval.cli.commands.interact import interact


class TestInteractCommand(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.agent_dir = Path(self.test_dir) / "my_agent"
        self.agent_dir.mkdir()
        (self.agent_dir / "agent.py").write_text("# dummy")
        self.eval_dir = self.agent_dir / "eval"
        self.eval_dir.mkdir()
        self.dataset_path = self.eval_dir / "dataset.jsonl"
        self.dataset_path.write_text(
            '{"id": "case_1", "prompt": "Hello", "kind": "single_turn"}'
        )

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    @patch("agent_eval.core.simulation.run_simulation_in_process")
    @patch("agent_eval.core.path_resolver.agent_project_root")
    @patch("agent_eval.cli.commands.interact.find_eval_dir")
    @patch("agent_eval.cli.commands.interact.write_jsonl")
    def test_interact_in_process_success(
        self,
        mock_write_jsonl,
        mock_find_eval_dir_helper,
        mock_project_root,
        mock_run_sim,
    ):
        mock_find_eval_dir_helper.return_value = self.eval_dir
        mock_project_root.return_value = self.agent_dir
        mock_run_sim.return_value = [{"converted": "record"}]

        runner = CliRunner()
        result = runner.invoke(
            interact,
            [
                "--agent-dir",
                str(self.agent_dir),
                "--questions-file",
                str(self.dataset_path),
                "--in-process",
                "--run-id",
                "test-run",
            ],
            catch_exceptions=False,
        )

        self.assertEqual(result.exit_code, 0, result.output)
        self.assertIn("Interactions complete!", result.output)

        # Verify run_simulation_in_process was called with correct arguments
        mock_run_sim.assert_called_once_with(
            agent_dir=self.agent_dir,
            project_root=self.agent_dir,
            dataset_path=self.dataset_path,
            parallelism=4,
            run_mode="single_turn",
            case_id=None,
        )

        # Verify write_jsonl was called to save results
        expected_output_path = (
            self.eval_dir
            / "results"
            / "test-run"
            / "raw"
            / "processed_interaction_my_agent.jsonl"
        )
        mock_write_jsonl.assert_called_once_with(
            [{"converted": "record"}], str(expected_output_path)
        )

    @patch("agent_eval.core.simulation.run_simulation_in_process")
    @patch("agent_eval.core.path_resolver.agent_project_root")
    @patch("agent_eval.cli.commands.interact.find_eval_dir")
    @patch("agent_eval.cli.commands.interact.write_jsonl")
    def test_interact_in_process_with_case_id(
        self,
        mock_write_jsonl,
        mock_find_eval_dir_helper,
        mock_project_root,
        mock_run_sim,
    ):
        mock_find_eval_dir_helper.return_value = self.eval_dir
        mock_project_root.return_value = self.agent_dir
        mock_run_sim.return_value = [{"converted": "record"}]

        runner = CliRunner()
        result = runner.invoke(
            interact,
            [
                "--agent-dir",
                str(self.agent_dir),
                "--questions-file",
                str(self.dataset_path),
                "--in-process",
                "--case-id",
                "case_1",
                "--run-id",
                "test-run",
            ],
            catch_exceptions=False,
        )

        self.assertEqual(result.exit_code, 0, result.output)

        # Verify run_simulation_in_process was called with case_id
        mock_run_sim.assert_called_once_with(
            agent_dir=self.agent_dir,
            project_root=self.agent_dir,
            dataset_path=self.dataset_path,
            parallelism=4,
            run_mode="single_turn",
            case_id="case_1",
        )

    @patch("agent_eval.core.simulation.run_simulation_in_process")
    @patch("agent_eval.core.path_resolver.agent_project_root")
    @patch("agent_eval.cli.commands.interact.write_jsonl")
    def test_interact_in_process_with_eval_dir(
        self, mock_write_jsonl, mock_project_root, mock_run_sim
    ):
        mock_project_root.return_value = self.agent_dir
        mock_run_sim.return_value = [{"converted": "record"}]

        custom_eval_dir = Path(self.test_dir) / "custom_eval"
        custom_eval_dir.mkdir()
        custom_dataset = custom_eval_dir / "dataset.jsonl"
        custom_dataset.write_text(
            '{"id": "case_1", "prompt": "Hello", "kind": "single_turn"}'
        )

        runner = CliRunner()
        result = runner.invoke(
            interact,
            [
                "--agent-dir",
                str(self.agent_dir),
                "--eval-dir",
                str(custom_eval_dir),
                "--questions-file",
                str(custom_dataset),
                "--in-process",
                "--run-id",
                "test-run",
            ],
            catch_exceptions=False,
        )

        self.assertEqual(result.exit_code, 0, result.output)
        self.assertIn("Interactions complete!", result.output)

        # Verify run_simulation_in_process was called with correct arguments
        mock_run_sim.assert_called_once_with(
            agent_dir=self.agent_dir,
            project_root=self.agent_dir,
            dataset_path=custom_dataset,
            parallelism=4,
            run_mode="single_turn",
            case_id=None,
        )

        # Verify write_jsonl was called to save results under custom_eval_dir
        expected_output_path = (
            custom_eval_dir
            / "results"
            / "test-run"
            / "raw"
            / "processed_interaction_my_agent.jsonl"
        )
        mock_write_jsonl.assert_called_once_with(
            [{"converted": "record"}], str(expected_output_path)
        )


if __name__ == "__main__":
    unittest.main()
