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
from unittest.mock import MagicMock, patch

import pandas as pd

# Mock Google Cloud libraries
import sys
sys.modules["google.genai"] = MagicMock()
sys.modules["google.genai.types"] = MagicMock()

from agent_eval.core.converters import AdkHistoryConverter

class TestAdkHistoryConverterPerInvocation(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.agent_dir = Path(self.test_dir) / "agent"
        self.history_dir = self.agent_dir / ".adk" / "eval_history"
        self.history_dir.mkdir(parents=True)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_process_file_per_invocation_format(self):
        """Test processing of the new 'eval_metric_result_per_invocation' format."""
        
        # Mock data mimicking the structure found in the Retail agent logs
        history_data = {
            "eval_set_result_id": "test_run_1",
            "eval_case_results": [
                {
                    "eval_id": "case_1",
                    "session_details": None, # This is null in the new format
                    "eval_metric_result_per_invocation": [
                        {
                            "actual_invocation": {
                                "invocation_id": "inv_1",
                                "user_content": {"parts": [{"text": "Hello"}]},
                                "final_response": {"parts": [{"text": "Hi there"}]},
                                "intermediate_data": {
                                    "invocation_events": [
                                        {
                                            "author": "IntakeAgent",
                                            "content": {"parts": [{"functionCall": {"name": "parse_request"}}]}
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    "overall_eval_metric_results": [
                        {"metric_name": "hallucinations_v1", "score": 0.8}
                    ]
                }
            ]
        }
        
        history_file = self.history_dir / "test_history.json"
        with open(history_file, "w") as f:
            json.dump(history_data, f)
            
        converter = AdkHistoryConverter(str(self.agent_dir))
        rows = converter.run()
        
        self.assertEqual(len(rows), 1)
        row = rows[0]
        
        # 1. Verify Data Extraction
        self.assertEqual(row["question_id"], "case_1")
        self.assertEqual(row["app_name"], "IntakeAgent") # Should discover app name from tool events
        self.assertEqual(row["base_url"], "simulation")
        
        # 2. Verify Conversation Reconstruction
        user_inputs = row["user_inputs"]
        self.assertEqual(user_inputs, ["Hello"])
        self.assertEqual(row["final_response"], "Hi there")
        
        # 3. Verify Trace Synthesis
        # Should have user -> invocation -> agent -> tool -> final response
        trace = row["session_trace"]
        span_names = [s["name"] for s in trace]
        self.assertIn("invocation", span_names)
        self.assertIn("invoke_agent IntakeAgent", span_names)
        self.assertTrue(any("execute_tool parse_request" in name for name in span_names))
        
        # 4. Verify ADK Scores
        self.assertIn("adk_score.hallucinations_v1", row)
        self.assertEqual(row["adk_score.hallucinations_v1"], 0.8)

if __name__ == "__main__":
    unittest.main()
