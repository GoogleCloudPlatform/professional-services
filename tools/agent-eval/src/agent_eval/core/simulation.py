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
"""In-process simulation runner using ADK Python APIs."""

import logging
import os
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from google.adk.cli.utils.agent_loader import AgentLoader
from google.adk.evaluation.eval_case import EvalCase, SessionInput
from google.adk.evaluation.conversation_scenarios import ConversationScenario
from google.adk.evaluation.in_memory_eval_sets_manager import InMemoryEvalSetsManager
from google.adk.evaluation.local_eval_service import LocalEvalService
from google.adk.evaluation.local_eval_set_results_manager import (
    LocalEvalSetResultsManager,
)
from google.adk.evaluation.base_eval_service import (
    InferenceRequest,
    InferenceConfig,
    EvaluateRequest,
    EvaluateConfig,
)

from google.adk.evaluation.simulation.user_simulator_provider import (
    UserSimulatorProvider,
)
from google.adk.evaluation.simulation.user_simulator import UserSimulator
import contextvars
import uuid
from google.adk.agents.base_agent import BaseAgent
from google.adk.evaluation.base_eval_service import InferenceResult
from google.adk.events.event import Event
from google.adk.sessions.in_memory_session_service import InMemorySessionService

from agent_eval.core.dataset_io import read_dataset, is_multi_turn, is_single_turn
from agent_eval.core.converters import AdkHistoryConverter


class SingleTurnLimitingUserSimulatorProvider(UserSimulatorProvider):
    """Custom provider that limits LlmBackedUserSimulator to 1 turn for single-turn cases."""

    def provide(self, eval_case: EvalCase) -> UserSimulator:
        if eval_case.eval_id.startswith("single_turn_"):
            from google.adk.evaluation.simulation.llm_backed_user_simulator import (
                LlmBackedUserSimulatorConfig,
                LlmBackedUserSimulator,
            )

            model = "gemini-2.5-flash"
            config_dict = self._user_simulator_config.model_dump()
            model = config_dict.get("model", model)

            single_turn_config = LlmBackedUserSimulatorConfig(
                model=model, max_allowed_invocations=1
            )
            return LlmBackedUserSimulator(
                config=single_turn_config,
                conversation_scenario=eval_case.conversation_scenario,
            )
        return super().provide(eval_case)


logger = logging.getLogger("agent_eval.simulation")


def _row_to_adk_scenario(row: dict, idx: int) -> dict:
    """Convert one unified ``dataset.jsonl`` row to ADK's ConversationScenario."""

    def _plan_to_string(items: list) -> str:
        clean = [str(item).strip() for item in items if str(item).strip()]
        if not clean:
            return ""
        if len(clean) == 1:
            return clean[0]
        return "\n".join(f"{i + 1}. {goal}" for i, goal in enumerate(clean))

    plan = row.get("conversation_plan")
    if plan:
        starting = row.get("prompt") or ""
        plan_list = list(plan) if isinstance(plan, list) else [str(plan)]
        return {
            "starting_prompt": starting,
            "conversation_plan": _plan_to_string(plan_list),
        }

    history = row.get("history") or row.get("conversation_history") or []
    history_texts: list[str] = []
    for turn in history:
        if isinstance(turn, dict):
            parts = turn.get("parts") or []
            text = " ".join(
                p.get("text", "") for p in parts if isinstance(p, dict)
            ).strip()
            if text:
                history_texts.append(text)

    prompt = row.get("prompt") or ""
    if history_texts:
        starting = history_texts[0]
        plan_list = history_texts[1:] + ([prompt] if prompt else [])
    else:
        starting = prompt
        plan_list = []
    return {
        "starting_prompt": starting,
        "conversation_plan": _plan_to_string(plan_list),
    }


current_case_id_var = contextvars.ContextVar("current_case_id")
EVAL_SESSION_ID_PREFIX = "___eval___session___"


def custom_session_id_supplier() -> str:
    case_id = current_case_id_var.get(None)
    if case_id:
        return f"{EVAL_SESSION_ID_PREFIX}{case_id}___{str(uuid.uuid4())}"
    return f"{EVAL_SESSION_ID_PREFIX}{str(uuid.uuid4())}"


class PrePopulatingSessionService(InMemorySessionService):
    def __init__(self, dataset_rows: list[dict]):
        super().__init__()
        self.rows_map = {}
        for i, r in enumerate(dataset_rows):
            orig_id = r.get("id") or f"case_{i}"
            self.rows_map[orig_id] = r
            self.rows_map[f"single_turn_{orig_id}"] = r

    async def create_session(self, app_name, user_id, state, session_id):
        case_id = None
        if session_id.startswith(EVAL_SESSION_ID_PREFIX):
            parts = session_id[len(EVAL_SESSION_ID_PREFIX) :].split("___")
            if len(parts) > 0:
                case_id = parts[0]

        session = await super().create_session(
            app_name=app_name, user_id=user_id, state=state, session_id=session_id
        )

        if case_id and case_id in self.rows_map:
            row = self.rows_map[case_id]
            history = row.get("history") or row.get("conversation_history") or []
            if history:
                logger.info(
                    "Pre-populating session %s with history for case %s",
                    session_id,
                    case_id,
                )
                for turn in history:
                    if isinstance(turn, dict):
                        role = turn.get("role") or "user"
                        parts = turn.get("parts") or []
                        text = " ".join(
                            p.get("text", "") for p in parts if isinstance(p, dict)
                        ).strip()
                        if text:
                            author = "user" if role == "user" else app_name
                            event = Event(author=author, message=text)
                            await self.append_event(session, event)
        return session


class PrePopulatingEvalService(LocalEvalService):
    async def _perform_inference_single_eval_item(
        self,
        app_name: str,
        eval_set_id: str,
        eval_case: EvalCase,
        root_agent: BaseAgent,
        use_live: bool,
        live_timeout_seconds: int,
    ) -> InferenceResult:
        token = current_case_id_var.set(eval_case.eval_id)
        try:
            return await super()._perform_inference_single_eval_item(
                app_name=app_name,
                eval_set_id=eval_set_id,
                eval_case=eval_case,
                root_agent=root_agent,
                use_live=use_live,
                live_timeout_seconds=live_timeout_seconds,
            )
        finally:
            current_case_id_var.reset(token)


async def run_simulation_in_process(
    agent_dir: Path,
    project_root: Path,
    dataset_path: Path,
    parallelism: int = 4,
    run_mode: str = "all",
    case_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Runs the simulation in-process using ADK Python APIs and returns converted records."""

    # Ensure project root is in sys.path so the agent can import shared modules
    import sys

    project_root_str = str(project_root.resolve())
    if project_root_str not in sys.path:
        sys.path.insert(0, project_root_str)

    # 1. Load agent
    agent_dir = agent_dir.resolve()
    agents_dir = str(agent_dir.parent)
    agent_name = agent_dir.name

    logger.info("Loading agent %s from %s", agent_name, agents_dir)
    loader = AgentLoader(agents_dir=agents_dir)
    agent_or_app = loader.load_agent(agent_name)

    # Extract root agent
    from google.adk.apps.app import App

    if isinstance(agent_or_app, App):
        root_agent = agent_or_app.root_agent
        app_name = agent_or_app.name
    else:
        root_agent = agent_or_app
        app_name = agent_name

    # 2. Load dataset
    rows = read_dataset(dataset_path)

    # 3. Create EvalCases for both multi-turn and single-turn based on run_mode
    eval_cases = []
    for i, r in enumerate(rows):
        orig_id = r.get("id") or f"case_{i}"
        if case_id and orig_id != case_id and f"single_turn_{orig_id}" != case_id:
            continue

        adk_scenario_dict = _row_to_adk_scenario(r, i)
        if not adk_scenario_dict.get("starting_prompt"):
            continue

        scenario = ConversationScenario(
            starting_prompt=adk_scenario_dict["starting_prompt"],
            conversation_plan=adk_scenario_dict["conversation_plan"],
        )

        session_inputs_dict = r.get("session_inputs") or {}
        state = session_inputs_dict.get("state") or r.get("state") or {}
        session_input = SessionInput(
            app_name=app_name,
            user_id=session_inputs_dict.get("user_id", "eval_user"),
            state=state,
        )

        if run_mode in ("all", "multi_turn") and is_multi_turn(r):
            eval_case = EvalCase(
                eval_id=orig_id,
                conversation_scenario=scenario,
                session_input=session_input,
            )
            eval_cases.append(eval_case)

        prompt = r.get("prompt") or ""
        if run_mode in ("all", "single_turn") and is_single_turn(r):
            # For single-turn, force conversation plan to be the starting prompt
            # to avoid simulator trying to continue the conversation.
            # We use the final prompt here because history (if any) is pre-populated.
            st_scenario = ConversationScenario(
                starting_prompt=prompt,
                conversation_plan=prompt,
            )
            eval_case = EvalCase(
                eval_id=f"single_turn_{orig_id}",
                conversation_scenario=st_scenario,
                session_input=session_input,
            )
            eval_cases.append(eval_case)

    if not eval_cases:
        logger.warning("No valid eval cases created.")
        return []

    # 4. Setup InMemoryEvalSetsManager
    eval_sets_manager = InMemoryEvalSetsManager()
    eval_set_id = "eval_set"
    eval_sets_manager.create_eval_set(app_name=app_name, eval_set_id=eval_set_id)
    for eval_case in eval_cases:
        eval_sets_manager.add_eval_case(
            app_name=app_name,
            eval_set_id=eval_set_id,
            eval_case=eval_case,
        )

    # 5. Setup LocalEvalSetResultsManager with a temp dir
    with tempfile.TemporaryDirectory() as temp_dir:
        logger.info("Using temp directory for simulation history: %s", temp_dir)
        results_manager = LocalEvalSetResultsManager(agents_dir=temp_dir)

        # 6. Setup PrePopulatingEvalService with custom session service and supplier
        session_service = PrePopulatingSessionService(rows)
        eval_service = PrePopulatingEvalService(
            root_agent=root_agent,
            eval_sets_manager=eval_sets_manager,
            eval_set_results_manager=results_manager,
            session_service=session_service,
            session_id_supplier=custom_session_id_supplier,
            user_simulator_provider=SingleTurnLimitingUserSimulatorProvider(),
        )

        # 7. Run Inferences
        inference_requests = [
            InferenceRequest(
                app_name=app_name,
                eval_set_id=eval_set_id,
                inference_config=InferenceConfig(parallelism=parallelism),
            )
        ]

        logger.info("Running simulation inferences (parallelism=%d)...", parallelism)
        inference_results = []
        for req in inference_requests:
            async for res in eval_service.perform_inference(inference_request=req):
                inference_results.append(res)

        # 8. Run Evaluation (with empty metrics to trigger saving results to disk)
        evaluate_request = EvaluateRequest(
            inference_results=inference_results,
            evaluate_config=EvaluateConfig(eval_metrics=[], parallelism=parallelism),
        )

        logger.info("Saving simulation results...")
        async for _ in eval_service.evaluate(evaluate_request=evaluate_request):
            pass

        # 9. Convert results
        history_dir = os.path.join(temp_dir, app_name, ".adk", "eval_history")
        logger.info("Converting simulation results from %s", history_dir)

        # Build prompt_to_reference map for converter using all rows
        prompt_to_ref = {}
        for r in rows:
            ref = r.get("reference_data")
            p = r.get("prompt")
            if isinstance(ref, dict) and ref and p:
                prompt_to_ref[p] = ref

        converter = AdkHistoryConverter(
            history_dir,
            questions_file=str(dataset_path),
            prompt_to_reference=prompt_to_ref,
        )
        records = converter.run()

        return records
