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
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path
import tempfile
import shutil

# No mocks needed if google-genai is installed in the venv
from google.adk.evaluation.base_eval_service import InferenceResult
from agent_eval.core.simulation import _row_to_adk_scenario, run_simulation_in_process


class TestSimulationUtils(unittest.TestCase):
    def test_row_to_adk_scenario_with_plan(self):
        row = {
            "id": "test_id",
            "prompt": "Hello",
            "conversation_plan": ["Step 1", "Step 2"],
            "kind": "multi_turn",
        }
        res = _row_to_adk_scenario(row, 0)
        self.assertEqual(res["starting_prompt"], "Hello")
        self.assertEqual(res["conversation_plan"], "1. Step 1\n2. Step 2")

    def test_row_to_adk_scenario_with_plan_string(self):
        row = {"prompt": "Hello", "conversation_plan": "Step 1", "kind": "multi_turn"}
        res = _row_to_adk_scenario(row, 0)
        self.assertEqual(res["starting_prompt"], "Hello")
        self.assertEqual(res["conversation_plan"], "Step 1")

    def test_row_to_adk_scenario_with_history(self):
        row = {
            "prompt": "Final prompt",
            "history": [
                {"parts": [{"text": "Hi"}]},
                {"parts": [{"text": "Hello"}]},
                {"parts": [{"text": "How are you?"}]},
            ],
            "kind": "multi_turn",
        }
        res = _row_to_adk_scenario(row, 0)
        self.assertEqual(res["starting_prompt"], "Hi")
        self.assertEqual(
            res["conversation_plan"], "1. Hello\n2. How are you?\n3. Final prompt"
        )

    def test_row_to_adk_scenario_no_plan_no_history(self):
        row = {"prompt": "Just a prompt", "kind": "multi_turn"}
        res = _row_to_adk_scenario(row, 0)
        self.assertEqual(res["starting_prompt"], "Just a prompt")
        self.assertEqual(res["conversation_plan"], "")


class TestSimulationFlow(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.agent_dir = Path(self.test_dir) / "my_agent"
        self.agent_dir.mkdir()
        (self.agent_dir / "agent.py").write_text("# dummy")
        self.project_root = Path(self.test_dir)
        self.dataset_path = self.project_root / "dataset.jsonl"
        self.dataset_path.write_text("{}")  # dummy

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    @patch("agent_eval.core.simulation.read_dataset")
    @patch("agent_eval.core.simulation.AgentLoader")
    @patch("agent_eval.core.simulation.PrePopulatingEvalService")
    @patch("agent_eval.core.simulation.AdkHistoryConverter")
    async def test_run_simulation_in_process_success(
        self, mock_converter_cls, mock_service_cls, mock_loader_cls, mock_read_dataset
    ):
        # 1. Setup mocks
        mock_read_dataset.return_value = [
            {
                "id": "case_1",
                "prompt": "Hello",
                "conversation_plan": "Goal 1",
                "kind": "multi_turn",
            },
            {"id": "case_2", "prompt": "Single turn", "kind": "single_turn"},
        ]

        mock_loader = MagicMock()
        mock_agent = MagicMock()
        mock_loader.load_agent.return_value = mock_agent
        mock_loader_cls.return_value = mock_loader

        mock_service = MagicMock()

        async def mock_perform_inference(*args, **kwargs):
            yield InferenceResult(
                app_name="my_agent",
                eval_set_id="eval_set",
                eval_case_id="case_1",
                session_id="dummy_session",
            )

        async def mock_evaluate(*args, **kwargs):
            yield MagicMock()

        mock_service.perform_inference.side_effect = mock_perform_inference
        mock_service.evaluate.side_effect = mock_evaluate
        mock_service_cls.return_value = mock_service

        mock_converter = MagicMock()
        mock_converter.run.return_value = [{"converted": "record"}]
        mock_converter_cls.return_value = mock_converter

        # 2. Run
        records = await run_simulation_in_process(
            agent_dir=self.agent_dir,
            project_root=self.project_root,
            dataset_path=self.dataset_path,
            parallelism=2,
        )

        # 3. Assertions
        mock_read_dataset.assert_called_once_with(self.dataset_path)
        mock_loader.load_agent.assert_called_once_with("my_agent")

        mock_service.perform_inference.assert_called_once()
        called_request = mock_service.perform_inference.call_args[1][
            "inference_request"
        ]
        self.assertEqual(called_request.app_name, "my_agent")
        self.assertEqual(called_request.eval_set_id, "eval_set")

        mock_service.evaluate.assert_called_once()
        mock_converter.run.assert_called_once()
        self.assertEqual(records, [{"converted": "record"}])

        # Verify both cases were registered
        mock_service_cls.assert_called_once()
        eval_sets_mgr = mock_service_cls.call_args[1]["eval_sets_manager"]
        eval_cases = eval_sets_mgr.get_eval_set("my_agent", "eval_set").eval_cases
        self.assertEqual(len(eval_cases), 2)
        self.assertEqual(eval_cases[0].eval_id, "case_1")
        self.assertEqual(eval_cases[1].eval_id, "single_turn_case_2")

    @patch("agent_eval.core.simulation.read_dataset")
    @patch("agent_eval.core.simulation.AgentLoader")
    @patch("agent_eval.core.simulation.PrePopulatingEvalService")
    @patch("agent_eval.core.simulation.AdkHistoryConverter")
    async def test_run_simulation_in_process_only_single_turn(
        self, mock_converter_cls, mock_service_cls, mock_loader_cls, mock_read_dataset
    ):
        mock_read_dataset.return_value = [
            {"id": "case_2", "prompt": "Single turn", "kind": "single_turn"}
        ]
        mock_loader = MagicMock()
        mock_loader.load_agent.return_value = MagicMock()
        mock_loader_cls.return_value = mock_loader

        mock_service = MagicMock()

        async def mock_perform_inference(*args, **kwargs):
            yield InferenceResult(
                app_name="my_agent",
                eval_set_id="eval_set",
                eval_case_id="single_turn_case_2",
                session_id="dummy_session",
            )

        async def mock_evaluate(*args, **kwargs):
            yield MagicMock()

        mock_service.perform_inference.side_effect = mock_perform_inference
        mock_service.evaluate.side_effect = mock_evaluate
        mock_service_cls.return_value = mock_service

        mock_converter = MagicMock()
        mock_converter.run.return_value = [{"converted": "record"}]
        mock_converter_cls.return_value = mock_converter

        records = await run_simulation_in_process(
            agent_dir=self.agent_dir,
            project_root=self.project_root,
            dataset_path=self.dataset_path,
            parallelism=2,
        )
        self.assertEqual(records, [{"converted": "record"}])

        # Verify it was registered as single_turn_case_2
        eval_sets_mgr = mock_service_cls.call_args[1]["eval_sets_manager"]
        eval_cases = eval_sets_mgr.get_eval_set("my_agent", "eval_set").eval_cases
        self.assertEqual(len(eval_cases), 1)
        self.assertEqual(eval_cases[0].eval_id, "single_turn_case_2")

    @patch("agent_eval.core.simulation.read_dataset")
    @patch("agent_eval.core.simulation.AgentLoader")
    async def test_run_simulation_in_process_empty_dataset(
        self, mock_loader_cls, mock_read_dataset
    ):
        mock_read_dataset.return_value = []
        mock_loader = MagicMock()
        mock_loader.load_agent.return_value = MagicMock()
        mock_loader_cls.return_value = mock_loader

        records = await run_simulation_in_process(
            agent_dir=self.agent_dir,
            project_root=self.project_root,
            dataset_path=self.dataset_path,
            parallelism=2,
        )
        self.assertEqual(records, [])

    @patch("agent_eval.core.simulation.read_dataset")
    @patch("agent_eval.core.simulation.AgentLoader")
    @patch("agent_eval.core.simulation.PrePopulatingEvalService")
    @patch("agent_eval.core.simulation.AdkHistoryConverter")
    async def test_run_simulation_in_process_run_mode_single_turn(
        self, mock_converter_cls, mock_service_cls, mock_loader_cls, mock_read_dataset
    ):
        mock_read_dataset.return_value = [
            {
                "id": "case_1",
                "prompt": "Hello",
                "conversation_plan": "Goal 1",
                "kind": "multi_turn",
            },
            {"id": "case_2", "prompt": "Single turn", "kind": "single_turn"},
        ]
        mock_loader = MagicMock()
        mock_loader.load_agent.return_value = MagicMock()
        mock_loader_cls.return_value = mock_loader

        mock_service = MagicMock()

        async def mock_perform_inference(*args, **kwargs):
            yield InferenceResult(
                app_name="my_agent",
                eval_set_id="eval_set",
                eval_case_id="single_turn_case_2",
                session_id="dummy_session",
            )

        async def mock_evaluate(*args, **kwargs):
            yield MagicMock()

        mock_service.perform_inference.side_effect = mock_perform_inference
        mock_service.evaluate.side_effect = mock_evaluate
        mock_service_cls.return_value = mock_service

        mock_converter = MagicMock()
        mock_converter.run.return_value = [{"converted": "record"}]
        mock_converter_cls.return_value = mock_converter

        records = await run_simulation_in_process(
            agent_dir=self.agent_dir,
            project_root=self.project_root,
            dataset_path=self.dataset_path,
            parallelism=2,
            run_mode="single_turn",
        )
        self.assertEqual(records, [{"converted": "record"}])

        # Verify only case_2 (single-turn) was registered
        eval_sets_mgr = mock_service_cls.call_args[1]["eval_sets_manager"]
        eval_cases = eval_sets_mgr.get_eval_set("my_agent", "eval_set").eval_cases
        self.assertEqual(len(eval_cases), 1)
        self.assertEqual(eval_cases[0].eval_id, "single_turn_case_2")

    @patch("agent_eval.core.simulation.read_dataset")
    @patch("agent_eval.core.simulation.AgentLoader")
    @patch("agent_eval.core.simulation.PrePopulatingEvalService")
    @patch("agent_eval.core.simulation.AdkHistoryConverter")
    async def test_run_simulation_in_process_run_mode_multi_turn(
        self, mock_converter_cls, mock_service_cls, mock_loader_cls, mock_read_dataset
    ):
        mock_read_dataset.return_value = [
            {
                "id": "case_1",
                "prompt": "Hello",
                "conversation_plan": "Goal 1",
                "kind": "multi_turn",
            },
            {"id": "case_2", "prompt": "Single turn", "kind": "single_turn"},
        ]
        mock_loader = MagicMock()
        mock_loader.load_agent.return_value = MagicMock()
        mock_loader_cls.return_value = mock_loader

        mock_service = MagicMock()

        async def mock_perform_inference(*args, **kwargs):
            yield InferenceResult(
                app_name="my_agent",
                eval_set_id="eval_set",
                eval_case_id="case_1",
                session_id="dummy_session",
            )

        async def mock_evaluate(*args, **kwargs):
            yield MagicMock()

        mock_service.perform_inference.side_effect = mock_perform_inference
        mock_service.evaluate.side_effect = mock_evaluate
        mock_service_cls.return_value = mock_service

        mock_converter = MagicMock()
        mock_converter.run.return_value = [{"converted": "record"}]
        mock_converter_cls.return_value = mock_converter

        records = await run_simulation_in_process(
            agent_dir=self.agent_dir,
            project_root=self.project_root,
            dataset_path=self.dataset_path,
            parallelism=2,
            run_mode="multi_turn",
        )
        self.assertEqual(records, [{"converted": "record"}])

        # Verify only case_1 (multi-turn) was registered
        eval_sets_mgr = mock_service_cls.call_args[1]["eval_sets_manager"]
        eval_cases = eval_sets_mgr.get_eval_set("my_agent", "eval_set").eval_cases
        self.assertEqual(len(eval_cases), 1)
        self.assertEqual(eval_cases[0].eval_id, "case_1")


class TestPrePopulatingSessionService(unittest.IsolatedAsyncioTestCase):
    async def test_pre_population(self):
        rows = [
            {
                "id": "case_1",
                "prompt": "Final prompt",
                "history": [
                    {"role": "user", "parts": [{"text": "Hello 1"}]},
                    {"role": "model", "parts": [{"text": "Response 1"}]},
                ],
            }
        ]
        from agent_eval.core.simulation import (
            PrePopulatingSessionService,
            EVAL_SESSION_ID_PREFIX,
        )

        service = PrePopulatingSessionService(rows)
        session_id = f"{EVAL_SESSION_ID_PREFIX}case_1___uuid"
        session = await service.create_session(
            app_name="test_app", user_id="test_user", state={}, session_id=session_id
        )

        self.assertEqual(len(session.events), 2)
        self.assertEqual(session.events[0].author, "user")
        self.assertEqual(session.events[0].message.parts[0].text, "Hello 1")
        self.assertEqual(session.events[1].author, "test_app")
        self.assertEqual(session.events[1].message.parts[0].text, "Response 1")

    async def test_pre_population_no_history(self):
        rows = [
            {
                "id": "case_2",
                "prompt": "Final prompt",
            }
        ]
        from agent_eval.core.simulation import (
            PrePopulatingSessionService,
            EVAL_SESSION_ID_PREFIX,
        )

        service = PrePopulatingSessionService(rows)
        session_id = f"{EVAL_SESSION_ID_PREFIX}case_2___uuid"
        session = await service.create_session(
            app_name="test_app", user_id="test_user", state={}, session_id=session_id
        )
        self.assertEqual(len(session.events), 0)


if __name__ == "__main__":
    unittest.main()
