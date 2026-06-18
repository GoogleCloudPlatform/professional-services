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
from unittest import IsolatedAsyncioTestCase
from pathlib import Path
from unittest.mock import patch, AsyncMock

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
        with open(input_file, "w") as f:
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
        with open(input_file, "w") as f:
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


if __name__ == "__main__":
    unittest.main()
