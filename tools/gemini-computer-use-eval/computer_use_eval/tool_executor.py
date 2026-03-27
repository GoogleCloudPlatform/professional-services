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

from typing import Dict, Any, List, Optional, Tuple, Callable, TYPE_CHECKING
import logging
from computer_use_eval.browser.playwright_env import PlaywrightEnv

if TYPE_CHECKING:
    from computer_use_eval.core.base import ActionExecutionResult  # noqa: F401
from computer_use_eval.actions import ActionExecutor
from computer_use_eval.core.middleware import ActionMiddleware
import computer_use_eval.custom_tools as custom_tools
import inspect

logger = logging.getLogger(__name__)


class ToolExecutor:
    """
    A unified executor that can run both browser actions and custom Python functions.
    """

    def __init__(
        self,
        env: PlaywrightEnv,
        custom_actions: Dict[str, str] = None,
        middleware: Optional[List[ActionMiddleware]] = None,
        custom_tools_list: Optional[List[Callable]] = None,
        disable_fast_typing_bundles: bool = False,
    ):
        self.env = env
        self.browser_action_executor = ActionExecutor()
        self.custom_tools_map = custom_tools.get_available_custom_tools()
        self.disable_fast_typing_bundles = disable_fast_typing_bundles

        # Merge dynamically provided custom tools
        if custom_tools_list:
            for tool_func in custom_tools_list:
                self.custom_tools_map[tool_func.__name__] = tool_func

        self.middleware = middleware or []

        from computer_use_eval.plugin_manager import PluginManager

        # 1. Discover plugins via entry_points
        PluginManager.discover_plugins(self.browser_action_executor)

        # 2. Load explicit custom actions from config
        if custom_actions:
            PluginManager.load_custom_actions(custom_actions,
                                              self.browser_action_executor)

    @property
    def executor(self) -> ActionExecutor:
        """Exposes the underlying browser action executor."""
        return self.browser_action_executor

    async def execute(self, action_name: str,
                      args: Dict[str, Any]) -> Tuple[Dict[str, Any], float]:
        """
        Executes a given tool/action by name and tracks middleware execution time.
        Returns: (result_dict, middleware_duration_seconds)
        """
        import time

        logger.info(f"Executing Tool: {action_name} with args {args}")

        mw_duration = 0.0

        # 1. Run before_action middleware
        start_mw = time.perf_counter()
        for mw in self.middleware:
            action_name, args, should_continue = await mw.before_action(
                action_name, args)
            if not should_continue:
                mw_duration += time.perf_counter() - start_mw
                return {
                    "status": "aborted",
                    "reason": "Middleware blocked action",
                }, mw_duration
        mw_duration += time.perf_counter() - start_mw

        try:
            if action_name in self.browser_action_executor.get_available_action_names(
            ):
                # Browser action
                result = await self.browser_action_executor.execute(
                    self.env, action_name, args)
            elif action_name in self.custom_tools_map:
                # Custom Python function
                tool_func = self.custom_tools_map[action_name]
                if inspect.iscoroutinefunction(tool_func):
                    result = await tool_func(**args)
                else:
                    import asyncio

                    result = await asyncio.to_thread(tool_func, **args)
            else:
                result = {"error": f"Unknown tool: {action_name}"}
        except Exception as e:
            logger.error(f"Tool '{action_name}' failed with error: {e}",
                         exc_info=True)
            result = {"error": str(e)}

        # 2. Run after_action middleware (in reverse order)
        start_mw = time.perf_counter()
        for mw in reversed(self.middleware):
            result = await mw.after_action(action_name, args, result)
        mw_duration += time.perf_counter() - start_mw

        return result, mw_duration

    async def execute_bundle(
        self,
        actions: List[Any],
        safety_coordinator: Any = None
    ) -> Tuple[List["ActionExecutionResult"], float]:
        """
        Executes a sequence of actions, attempting to bundle inputs for performance.
        Safety coordinator is used to check each action before execution.
        Perception guards prevent executing actions on stale UI state.
        Returns: (results_list, total_middleware_duration_seconds)
        """
        from computer_use_eval.core.base import ActionExecutionResult  # noqa: F811
        import time

        results_with_safety = []
        i = 0
        total_mw_duration = 0.0

        # Capture baseline state (Treating ARIA snapshots as middleware/perception time)
        start_mw = time.perf_counter()
        pre_bundle_url = self.env.page.url if self.env.page else ""
        pre_bundle_aria = ""
        try:
            if getattr(self.env, "enable_mutation_observer",
                       False) and self.env.page:
                # Fast perception engine active, just reset the flag
                await self.env.page.evaluate(
                    "if (window.reset_ui_changed) window.reset_ui_changed()")
            else:
                pre_bundle_aria = await self.env.get_aria_snapshot()
        except Exception:
            pass
        total_mw_duration += time.perf_counter() - start_mw

        while i < len(actions):
            action = actions[i]

            # Perception Guard: Check if UI has drifted significantly since we started
            start_mw = time.perf_counter()
            if i > 0:
                current_url = self.env.page.url if self.env.page else ""
                if current_url != pre_bundle_url:
                    logger.warning(
                        f"PERCEPTION GUARD: Navigation detected ({pre_bundle_url} -> {current_url}). Cancelling remaining {len(actions) - i} actions."
                    )
                    while i < len(actions):
                        results_with_safety.append(
                            ActionExecutionResult(
                                action_id=actions[i].id,
                                action_name=actions[i].name,
                                result_data={
                                    "error":
                                        "CANCELLED_BY_PERCEPTION_GUARD",
                                    "details":
                                        "Navigation detected between batched steps.",
                                },
                                safety_acknowledged=False,
                                mw_duration=0.0,
                            ))
                        i += 1
                    break

                # Check for major DOM mutations (e.g. modals)
                should_check = i % 3 == 0
                if getattr(self.env, "enable_mutation_observer", False):
                    should_check = True  # Fast check, do it every step

                if should_check:
                    try:
                        major_mutation = False
                        if (getattr(self.env, "enable_mutation_observer", False)
                                and self.env.page):
                            major_mutation = await self.env.page.evaluate(
                                "window.ui_changed === true")
                        else:
                            current_aria = await self.env.get_aria_snapshot()
                            major_mutation = (self.env.perception_service.
                                              is_significant_change(
                                                  pre_bundle_aria,
                                                  current_aria))

                        if major_mutation:
                            logger.warning(
                                f"PERCEPTION GUARD: Major UI mutation detected. Cancelling remaining {len(actions) - i} actions."
                            )
                            while i < len(actions):
                                results_with_safety.append(
                                    ActionExecutionResult(
                                        action_id=actions[i].id,
                                        action_name=actions[i].name,
                                        result_data={
                                            "error":
                                                "CANCELLED_BY_PERCEPTION_GUARD",
                                            "details":
                                                "Major UI mutation detected between batched steps.",
                                        },
                                        safety_acknowledged=False,
                                    ))
                                i += 1
                            break
                    except Exception:
                        pass

            # 1. Safety Check
            safety_acknowledged = False
            if safety_coordinator:
                safety_result = safety_coordinator.check_action(
                    action.name, action.args)
                if safety_result == "TERMINATE":
                    results_with_safety.append(
                        ActionExecutionResult(
                            action_id=action.id,
                            action_name=action.name,
                            result_data={"error": "TERMINATED_BY_SAFETY"},
                            safety_acknowledged=False,
                        ))
                    i += 1
                    while i < len(actions):
                        results_with_safety.append(
                            ActionExecutionResult(
                                action_id=actions[i].id,
                                action_name=actions[i].name,
                                result_data={
                                    "error":
                                        "CANCELLED_BY_PREVIOUS_SAFETY_TERMINATION"
                                },
                                safety_acknowledged=False,
                            ))
                        i += 1
                    break
                elif safety_result == "APPROVED":
                    safety_acknowledged = True

            # 2. Check for bundling opportunity (Fast Path)
            # The Fast Path uses custom JavaScript injection to instantly set multiple form values.
            # While high-performance, this can trigger DOM race conditions in modern reactive
            # frameworks (React/Angular) if too many fields are mutated simultaneously.
            # We gate this via 'disable_fast_typing_bundles' for high-concurrency models like Flash.
            from computer_use_eval.constants import ToolNames

            if (not self.disable_fast_typing_bundles and
                    action.name == ToolNames.TYPE_TEXT_AT and
                    not action.args.get("press_enter") and
                    i + 1 < len(actions) and
                    actions[i + 1].name == ToolNames.TYPE_TEXT_AT):
                bundle = []
                while (i < len(actions) and
                       actions[i].name == ToolNames.TYPE_TEXT_AT and
                       not actions[i].args.get("press_enter")):
                    bundle.append(actions[i])
                    i += 1

                logger.info(f"FAST PATH: Bundling {len(bundle)} input actions.")
                bundle_results = (
                    await self.browser_action_executor._execute_input_bundle(
                        self.env, bundle))
                for action_id, name, res in bundle_results:
                    results_with_safety.append(
                        ActionExecutionResult(
                            action_id=action_id,
                            action_name=name,
                            result_data=res,
                            safety_acknowledged=safety_acknowledged,
                        ))
                continue

            # 3. Standard Path
            result, mw_dur = await self.execute(action.name, action.args)
            total_mw_duration += mw_dur
            results_with_safety.append(
                ActionExecutionResult(
                    action_id=action.id,
                    action_name=action.name,
                    result_data=result,
                    safety_acknowledged=safety_acknowledged,
                    mw_duration=mw_dur,
                ))

            start_mw = time.perf_counter()
            if self.browser_action_executor.is_terminal(action.name,
                                                        action.args):
                is_last_in_batch = i == len(actions) - 1
                if not is_last_in_batch:
                    logger.info(
                        f"Action '{action.name}' is marked terminal, but batch has {len(actions) - i - 1} remaining actions. Continuing execution to honor model plan."
                    )
                else:
                    total_mw_duration += time.perf_counter() - start_mw
                    break
            i += 1
            total_mw_duration += time.perf_counter() - start_mw

        return results_with_safety, total_mw_duration
