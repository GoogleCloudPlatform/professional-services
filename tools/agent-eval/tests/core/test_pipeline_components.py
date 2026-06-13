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
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock

import pandas as pd

# Mock Google Cloud libraries
sys.modules["google.genai"] = MagicMock()
sys.modules["google.genai.types"] = MagicMock()


class TestConverters(unittest.TestCase):
    def setUp(self):
        from agent_eval.core.converters import (
            AdkHistoryConverter,
            synthesize_trace_from_events,
        )

        self.AdkHistoryConverter = AdkHistoryConverter
        self.synthesize_trace_from_events = synthesize_trace_from_events
        self.test_dir = tempfile.mkdtemp()
        self.agent_dir = Path(self.test_dir) / "agent"
        self.history_dir = self.agent_dir / ".adk" / "eval_history"
        self.history_dir.mkdir(parents=True)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_synthesize_trace_from_events(self):
        """Test that flat events are converted to nested spans."""
        events = [
            {
                "author": "user",
                "timestamp": 1000,
                "content": {"parts": [{"text": "hello"}]},
            },
            {
                "author": "model",
                "timestamp": 1001,
                "content": {"parts": [{"text": "hi"}]},
            },
        ]
        spans = self.synthesize_trace_from_events(events, "session-123", "test-app")

        # Should have invocation span, agent span, and at least one step span (call_llm)
        self.assertTrue(len(spans) >= 3)
        span_names = [s["name"] for s in spans]
        self.assertIn("invocation", span_names)
        self.assertIn("invoke_agent test-app", span_names)
        self.assertIn("call_llm", span_names)

    def test_process_file_with_adk_scores(self):
        """Test that process_file extracts adk_score.* fields correctly."""

        # Create a dummy ADK history file
        history_data = {
            "eval_case_results": [
                {
                    "eval_id": "eval_1",
                    "session_details": {
                        "id": "session_1",
                        "app_name": "test_agent",
                        "user_id": "user_1",
                        "events": [
                            {
                                "author": "user",
                                "timestamp": 1000,
                                "content": {"parts": [{"text": "hi"}]},
                            },
                            {
                                "author": "agent",
                                "timestamp": 1001,
                                "content": {"parts": [{"text": "hello"}]},
                                "text_response": "hello",
                            },
                        ],
                    },
                    # This is the key part: Simulated scores
                    "eval_metric_results": [
                        {"metric_name": "hallucination", "score": 0.1},
                        {"metric_name": "safety", "score": 1.0},
                    ],
                }
            ]
        }

        history_file = self.history_dir / "test_history.json"
        with open(history_file, "w") as f:
            json.dump(history_data, f)

        converter = self.AdkHistoryConverter(str(self.agent_dir))
        rows = converter.run()

        self.assertEqual(len(rows), 1)
        row = rows[0]

        # Verify ADK scores are in the top-level row
        self.assertIn("adk_score.hallucination", row)
        self.assertEqual(row["adk_score.hallucination"], 0.1)
        self.assertIn("adk_score.safety", row)
        self.assertEqual(row["adk_score.safety"], 1.0)

        # Verify Gemini batch structure
        self.assertIn("request", row)
        self.assertIn("response", row)


class TestAnalyzer(unittest.TestCase):
    def setUp(self):
        from agent_eval.core.analyzer import Analyzer, LogEntry

        self.LogEntry = LogEntry
        self.config = {"results_dir": "/tmp"}
        self.analyzer = Analyzer(self.config)

    def test_process_log_row_robustness(self):
        """Test extracting log entry from a dataframe row with mixed types."""
        row_data = {
            "question_id": "q1",
            "metadata": '{"category": "test"}',  # JSON string
            "user_inputs": "['help']",  # Python string repr of list
            "final_response": "Here is help",
            "eval_results": json.dumps(
                {"quality": {"score": 5, "explanation": "Good"}}
            ),
            "adk_score.hallucination": 0.0,  # Float directly in row
        }
        row = pd.Series(row_data)

        entry = self.analyzer._process_log_row(row, 0)

        self.assertIsNotNone(entry)
        self.assertEqual(entry["question_id"], "q1")
        self.assertEqual(entry["user_inputs"], ["help"])

        # Check eval results parsing
        self.assertEqual(entry["eval_results"]["quality"]["score"], 5)

        # Check ADK score extraction
        self.assertIn("hallucination", entry["adk_scores"])
        self.assertEqual(entry["adk_scores"]["hallucination"], 0.0)

    def test_format_log_entry_markdown(self):
        """Test markdown generation."""
        entry = self.LogEntry(
            question_id="q1",
            metadata={"priority": "high"},
            user_inputs=["input 1"],
            final_response="response 1",
            trace_summary=["step1", "step2"],
            sub_agent_trace=[],
            tool_interactions=[
                {
                    "tool_name": "search",
                    "input_arguments": {"q": "foo"},
                    "output_result": "bar",
                }
            ],
            eval_results={"quality": {"score": 5, "explanation": "ok"}},
            latency_summary={"total_seconds": 1.5},
            adk_scores={"hallucination": 0.0},
            agents_evaluated=["agent_a"],
        )

        md = self.analyzer._format_log_entry_markdown(entry, 1)

        self.assertIn("## 1. Question: `q1`", md)
        self.assertIn("**Agents** | agent_a", md)
        self.assertIn("**hallucination:** 0.00", md)  # ADK score check
        self.assertIn("#### quality: **5.00**", md)  # Metric check
        self.assertIn("| `search` | q | success |", md)  # Tool check


if __name__ == "__main__":
    unittest.main()
