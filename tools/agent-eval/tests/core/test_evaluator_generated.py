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
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

import pandas as pd

# Import the class under test
from agent_eval.core.evaluator import Evaluator


@patch("agent_eval.core.evaluator.get_project_id", return_value="test-project")
@patch("agent_eval.core.evaluator.CONFIG")
@patch("agent_eval.core.evaluator.aiplatform")
@patch("agent_eval.core.evaluator.Client")
class TestEvaluator(IsolatedAsyncioTestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.results_dir = Path(self.test_dir) / "results"
        self.results_dir.mkdir()
        self.config = {
            "metric_filters": {},
            "input_label": "test_label",
            "test_description": "test_desc",
        }

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_initialization(
        self, mock_client, mock_aiplatform, mock_config, mock_get_project_id
    ):
        mock_config.GOOGLE_CLOUD_LOCATION = "us-central1"

        Evaluator(self.config)

        # Verify the mocked library was initialized
        mock_aiplatform.init.assert_called_with(
            project="test-project", location="us-central1"
        )

    @patch("agent_eval.core.evaluator.load_and_consolidate_metrics")
    @patch("agent_eval.core.evaluator.evaluate_deterministic_metrics")
    @patch("agent_eval.core.evaluator.save_metrics_summary")
    async def test_evaluate_adk_score_integration_jsonl(
        self,
        mock_save_summary,
        mock_det_metrics,
        mock_load_metrics,
        mock_client,
        mock_aiplatform,
        mock_config,
        mock_get_project_id,
    ):
        """
        Validates that ADK scores are correctly extracted from JSONL input
        and passed to the summary generation.
        """
        mock_config.MAX_WORKERS = 1

        # Setup Input Data with ADK Scores in JSONL format
        input_data = [
            {
                "question_id": "q1",
                "final_session_state": {},
                "session_trace": [],
                "agents_evaluated": ["agent1"],
                "adk_score.hallucination": 0.1,
                "adk_score.safety": 1.0,
            }
        ]
        input_file = Path(self.test_dir) / "input.jsonl"

        # Write as JSONL
        with input_file.open("w") as f:
            for record in input_data:
                f.write(json.dumps(record) + "\n")

        # Mock Dependencies
        mock_load_metrics.return_value = {}
        mock_det_metrics.return_value = {}

        # Run
        evaluator = Evaluator(self.config)
        await evaluator.evaluate(
            metrics_files=["metrics.json"],
            results_dir=self.results_dir,
            interaction_files=[input_file],
        )

        # Verify
        args, _ = mock_save_summary.call_args
        result_df = args[0]

        # Parse the JSON string in the 'eval_results' column
        first_row_results = json.loads(result_df.iloc[0]["eval_results"])

        # Assert ADK scores are present
        self.assertIn("hallucination", first_row_results)
        self.assertEqual(first_row_results["hallucination"]["score"], 0.1)
        self.assertEqual(first_row_results["safety"]["score"], 1.0)

    @patch("agent_eval.core.evaluator.load_and_consolidate_metrics")
    @patch("agent_eval.core.evaluator.asyncio.to_thread", new_callable=AsyncMock)
    async def test_evaluate_llm_metrics_execution_jsonl(
        self,
        mock_to_thread,
        mock_load_metrics,
        mock_client,
        mock_aiplatform,
        mock_config,
        mock_get_project_id,
    ):
        """Test LLM metrics execution using JSONL input."""
        mock_config.MAX_WORKERS = 2

        # Input data
        input_file = Path(self.test_dir) / "input.jsonl"
        input_data = [
            {
                "question_id": "q1",
                "agents_evaluated": ["agent1"],
                "request": "req",
                "response": "res",
            }
        ]
        with input_file.open("w") as f:
            for record in input_data:
                f.write(json.dumps(record) + "\n")

        # Mock Metrics — canonical schema (kind: custom_llm_judge with criteria + rating_scores)
        mock_load_metrics.return_value = {
            "test_metric": {
                "kind": "custom_llm_judge",
                "agents": ["agent1"],
                "instruction": "Test instruction",
                "criteria": {"only": "test criterion"},
                "rating_scores": {"1": "Pass", "0": "Fail"},
            }
        }

        # Setup to_thread Mock
        mock_parsed_df = pd.DataFrame([{"original_index": 0, "test_metric/score": 5.0}])
        mock_input_df = pd.DataFrame(input_data)
        # return (parsed_results_df, metric_name, input_dataset_df, error_info)
        mock_to_thread.return_value = (
            mock_parsed_df,
            "test_metric",
            mock_input_df,
            None,
        )

        evaluator = Evaluator(self.config)
        await evaluator.evaluate(
            metrics_files=[],
            results_dir=self.results_dir,
            interaction_files=[input_file],
        )

        # Verify to_thread was used
        mock_to_thread.assert_called_once()

    @patch("agent_eval.core.evaluator.load_and_consolidate_metrics")
    @patch("agent_eval.core.evaluator.asyncio.to_thread", new_callable=AsyncMock)
    async def test_evaluate_row_level_metric_filtering(
        self,
        mock_to_thread,
        mock_load_metrics,
        mock_client,
        mock_aiplatform,
        mock_config,
        mock_get_project_id,
    ):
        """Test that metrics are filtered at the row level based on the 'metrics' column."""
        import logging
        import sys

        import agent_eval

        test_logger = logging.getLogger("agent_eval")
        test_logger.info(f"TEST: agent_eval file: {agent_eval.__file__}")
        test_logger.info(f"TEST: sys.path: {sys.path}")

        mock_config.MAX_WORKERS = 2

        # Input data: 3 rows
        # Row 0: targets only metric_A
        # Row 1: targets only metric_B
        # Row 2: targets no metrics (defaults to all)
        input_file = Path(self.test_dir) / "input.jsonl"
        input_data = [
            {
                "question_id": "q1",
                "agents_evaluated": ["agent1"],
                "request": "req1",
                "response": "res1",
                "user_inputs": ["req1"],
                "metrics": ["metric_A"],
            },
            {
                "question_id": "q2",
                "agents_evaluated": ["agent1"],
                "request": "req2",
                "response": "res2",
                "user_inputs": ["req2"],
                "metrics": ["metric_B"],
            },
            {
                "question_id": "q3",
                "agents_evaluated": ["agent1"],
                "request": "req3",
                "response": "res3",
                "user_inputs": ["req3"],
                # no metrics specified
            },
        ]
        with input_file.open("w") as f:
            for record in input_data:
                f.write(json.dumps(record) + "\n")

        # Mock Metrics
        mock_load_metrics.return_value = {
            "metric_A": {
                "kind": "custom_llm_judge",
                "agents": ["agent1"],
                "instruction": "Instruction A",
                "criteria": {"only": "criterion A"},
                "rating_scores": {"1": "Pass", "0": "Fail"},
            },
            "metric_B": {
                "kind": "custom_llm_judge",
                "agents": ["agent1"],
                "instruction": "Instruction B",
                "criteria": {"only": "criterion B"},
                "rating_scores": {"1": "Pass", "0": "Fail"},
            },
        }

        def to_thread_side_effect(func, task_arg):
            eval_dataset, _metric_obj, _agent_df, metric_name, *_rest = task_arg
            # Return dummy parsed_df aligned with the eval_dataset index
            parsed_rows = []
            for idx in eval_dataset.index:
                parsed_rows.append(
                    {
                        "original_index": idx,
                        f"{metric_name}/score": 1.0,
                        f"{metric_name}/explanation": "Good",
                    }
                )
            parsed_df = pd.DataFrame(parsed_rows)
            return parsed_df, metric_name, eval_dataset, None

        mock_to_thread.side_effect = to_thread_side_effect

        evaluator = Evaluator(self.config)
        await evaluator.evaluate(
            metrics_files=[],
            results_dir=self.results_dir,
            interaction_files=[input_file],
        )

        # Verify to_thread was called for both metrics
        self.assertEqual(mock_to_thread.call_count, 2)

        # Check call arguments to verify filtering
        calls = mock_to_thread.call_args_list
        import logging

        test_logger = logging.getLogger("agent_eval")
        test_logger.info(f"TEST: Number of calls recorded: {len(calls)}")
        for i, call in enumerate(calls):
            test_logger.info(f"TEST: Call {i} args: {call.args}")
            test_logger.info(f"TEST: Call {i} kwargs: {call.kwargs}")
            task_arg = call.args[1]
            test_logger.info(f"TEST: Call {i} task_arg type: {type(task_arg)}")
            test_logger.info(f"TEST: Call {i} task_arg length: {len(task_arg)}")
            eval_dataset = task_arg[0]
            metric_name = task_arg[3]
            test_logger.info(f"TEST: Call {i} metric_name: {metric_name}")
            test_logger.info(
                f"TEST: Call {i} eval_dataset index: {list(eval_dataset.index)}"
            )

        # We expect one call for metric_A and one for metric_B
        call_args_by_metric = {}
        for call in calls:
            task_arg = call.args[1]  # Use .args instead of [0] for clarity
            eval_dataset, _metric_obj, _agent_df, metric_name, *_rest = task_arg
            call_args_by_metric[metric_name] = eval_dataset

        self.assertIn("metric_A", call_args_by_metric)
        self.assertIn("metric_B", call_args_by_metric)

        # For metric_A, it should run on Row 0 (targeted) and Row 2 (default)
        dataset_A = call_args_by_metric["metric_A"]
        self.assertEqual(list(dataset_A.index), [0, 2])
        self.assertEqual(list(dataset_A["prompt"]), ["req1", "req3"])

        # For metric_B, it should run on Row 1 (targeted) and Row 2 (default)
        dataset_B = call_args_by_metric["metric_B"]
        self.assertEqual(list(dataset_B.index), [1, 2])
        self.assertEqual(list(dataset_B["prompt"]), ["req2", "req3"])


if __name__ == "__main__":
    unittest.main()
