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

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple, Optional

from computer_use_eval.browser.playwright_env import PlaywrightEnv

logger = logging.getLogger(__name__)


class BaseAction(ABC):
    """
    Abstract base class for all agent actions.
    Provides common utilities for coordinate scaling and visual feedback.
    """

    @property
    def is_passive(self) -> bool:
        """
        Returns True if the action is passive (e.g. scrolling, waiting, hovering)
        and typically doesn't mutate the core UI state.
        """
        return False

    @abstractmethod
    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        pass

    def denormalize(self, x: int, y: int,
                    env: PlaywrightEnv) -> tuple[int, int]:
        """Convert normalized 0-1000 coordinates to actual pixels."""
        return env.scaler.denormalize(x, y)

    def denormalize_magnitude(self,
                              magnitude: int,
                              env: PlaywrightEnv,
                              dimension: str = "height") -> int:
        """Convert normalized 0-1000 magnitude to actual pixels."""
        return env.scaler.scale_magnitude(magnitude, dimension)

    async def highlight_click(self, env: PlaywrightEnv, x: int, y: int):
        """Injects a temporary red circle to visualize clicks."""
        if not env.page:
            return
        try:
            # We use a JS-based highlight to provide immediate visual feedback
            # on where the agent is interacting, which is critical for debugging
            # multimodal trace logs.
            await env.page.evaluate(
                """([x, y]) => {
                    const el = document.createElement('div');
                    el.style.position = 'absolute';
                    el.style.left = x + 'px';
                    el.style.top = y + 'px';
                    el.style.width = '20px';
                    el.style.height = '20px';
                    el.style.background = 'rgba(255, 0, 0, 0.5)';
                    el.style.borderRadius = '50%';
                    el.style.pointerEvents = 'none';
                    el.style.zIndex = '999999';
                    el.style.transform = 'translate(-50%, -50%)';
                    el.style.transition = 'opacity 0.5s';
                    document.body.appendChild(el);
                    setTimeout(() => {
                        el.style.opacity = '0';
                        setTimeout(() => el.remove(), 500);
                    }, 500);
                }""",
                [x, y],
            )
        except Exception:
            # Visualization is non-critical; don't break the action if it fails.
            pass


class ActionExecutor:
    """Registry and Executor for Actions."""

    def __init__(self):
        # We use a deferred import pattern for specific actions to avoid circular
        # dependencies between the registry and specific tool implementations.
        from computer_use_eval.constants import ToolNames
        from .mouse import (
            ClickAction,
            DoubleClickAction,
            HoverAction,
            DragAndDropAction,
        )
        from .keyboard import TypeAction, KeyCombinationAction
        from .navigation import (
            NavigateAction,
            GoBackAction,
            GoForwardAction,
            ScrollAction,
            ScrollAtAction,
            OpenBrowserAction,
            WaitAction,
        )

        self.actions: Dict[str, BaseAction] = {
            ToolNames.CLICK_AT: ClickAction(),
            ToolNames.DOUBLE_CLICK_AT: DoubleClickAction(),
            ToolNames.TYPE_TEXT_AT: TypeAction(),
            ToolNames.NAVIGATE: NavigateAction(),
            ToolNames.SCROLL_AT: ScrollAtAction(),
            ToolNames.HOVER_AT: HoverAction(),
            ToolNames.KEY_COMBINATION: KeyCombinationAction(),
            ToolNames.DRAG_AND_DROP: DragAndDropAction(),
            ToolNames.OPEN_WEB_BROWSER: OpenBrowserAction(),
            ToolNames.WAIT_5_SECONDS: WaitAction(),
            ToolNames.SCROLL_DOCUMENT: ScrollAction(),
            ToolNames.GO_BACK: GoBackAction(),
            ToolNames.GO_FORWARD: GoForwardAction(),
            ToolNames.SEARCH: NavigateAction(),
        }

    def get_available_action_names(self) -> List[str]:
        return list(self.actions.keys())

    def get_action(self, action_name: str) -> Optional[BaseAction]:
        """Returns the action instance for a given name."""
        return self.actions.get(action_name)

    def register(self, name: str, action: BaseAction):
        self.actions[name] = action
        logger.info(f"Registered action: {name}")

    def denormalize(self, x: int, y: int,
                    env: PlaywrightEnv) -> Tuple[int, int]:
        """Helper to denormalize coordinates via environment scaler."""
        return env.scaler.denormalize(x, y)

    async def highlight_click(self, env: PlaywrightEnv, x: int, y: int):
        """Helper to visualize clicks via any available action."""
        if self.actions:
            # Pick any action to use its highlight implementation
            any_action = next(iter(self.actions.values()))
            await any_action.highlight_click(env, x, y)

    async def execute(self, env: PlaywrightEnv, action_name: str,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        action = self.actions.get(action_name)
        if not action:
            return {"error": f"Unknown action: {action_name}"}

        try:
            logger.debug(f"Executing Action: {action_name} with args {args}")
            return await action.execute(env, args)
        except Exception as e:
            logger.error(f"Action {action_name} failed: {e}")
            return {"error": str(e)}

    async def execute_bundle(
            self, env: PlaywrightEnv,
            actions: List[Any]) -> List[Tuple[str, Dict[str, Any]]]:
        """
        Executes a sequence of actions, attempting to bundle inputs for performance.
        Returns a list of (action_name, result) tuples.
        """
        from computer_use_eval.constants import ToolNames

        results = []
        i = 0
        while i < len(actions):
            action = actions[i]

            # FAST PATH: Bundle consecutive 'type_text_at' calls that don't press enter
            if (action.name == ToolNames.TYPE_TEXT_AT and
                    not action.args.get("press_enter") and
                    i + 1 < len(actions) and
                    actions[i + 1].name == ToolNames.TYPE_TEXT_AT):
                bundle = []
                while (i < len(actions) and
                       actions[i].name == ToolNames.TYPE_TEXT_AT and
                       not actions[i].args.get("press_enter")):
                    bundle.append(actions[i])
                    i += 1

                bundle_names = [a.name for a in bundle]
                logger.info(
                    f"🚀 FAST PATH: Bundling {len(bundle)} input actions: {bundle_names}"
                )
                bundle_results = await self._execute_input_bundle(env, bundle)
                results.extend(bundle_results)
                continue

            # Standard Path: Single execution
            logger.debug(f"Executing single action: {action.name}")
            result = await self.execute(env, action.name, action.args)
            results.append((action.name, result))

            if self.is_terminal(action.name, action.args):
                break
            i += 1

        return results

    async def _execute_input_bundle(
            self, env: PlaywrightEnv,
            bundle: List[Any]) -> List[Tuple[str, str, Dict[str, Any]]]:
        """Executes multiple type actions using a single JS evaluate call."""
        if not env.page:
            return [(a.id, a.name, {
                "error": "Page not available"
            }) for a in bundle]

        # Prepare payload: list of {x, y, text, clear}
        payload = []
        for a in bundle:
            x, y = self.denormalize(a.args["x"], a.args["y"], env)
            payload.append({
                "x": x,
                "y": y,
                "text": a.args.get("text", ""),
                "clear": a.args.get("clear_before_typing", True),
            })

        # Single execution JS: finds elements at points and sets values
        # We also trigger input/change events to ensure framework state sync.
        BUNDLE_JS = """(items) => {
            for (const item of items) {
                const el = document.elementFromPoint(item.x, item.y);
                if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
                    if (item.clear) el.value = '';
                    el.value += item.text;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    el.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            }
        }"""

        try:
            # Visualize all bundle points first
            for item in payload:
                await self.highlight_click(env, item["x"], item["y"])

            await env.page.evaluate(BUNDLE_JS, payload)
            # Short wait for any batched UI reactions
            await env.page.wait_for_timeout(500)
            return [(a.id, a.name, {
                "status": "ok",
                "bundled": True
            }) for a in bundle]
        except Exception as e:
            logger.error(f"Input bundle failed: {e}")
            # Fallback results if JS fails
            return [(a.id, a.name, {
                "error": f"Bundled execution failed: {e}"
            }) for a in bundle]

    def is_terminal(self, action_name: str, args: Dict[str, Any]) -> bool:
        """
        Determines if an action is 'Terminal' (e.g. triggers navigation or
        major state change) and should conclude a batch.
        """
        from computer_use_eval.constants import ToolNames

        # 1. Navigation is always terminal
        if action_name in [
                ToolNames.NAVIGATE,
                ToolNames.DOUBLE_CLICK_AT,
                ToolNames.GO_BACK,
                ToolNames.GO_FORWARD,
                ToolNames.SEARCH,
        ]:
            return True

        # 2. Browser lifecycle is terminal
        if action_name == ToolNames.OPEN_WEB_BROWSER:
            return True

        # 3. Enter key in combinations is often terminal (submits forms)
        if action_name == ToolNames.KEY_COMBINATION:
            keys = str(args.get("keys", "")).lower()
            if "enter" in keys:
                return True

        # 4. Explicit 'press_enter' in type actions
        if action_name == ToolNames.TYPE_TEXT_AT and args.get("press_enter"):
            return True

        return False
