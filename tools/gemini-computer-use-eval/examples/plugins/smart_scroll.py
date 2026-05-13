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
from typing import Dict, Any
from computer_use_eval.actions import BaseAction
from computer_use_eval.browser.playwright_env import PlaywrightEnv

logger = logging.getLogger(__name__)


class ScrollToViewAction(BaseAction):
    """
    A robust action that finds an element at (x, y) and forces it into view.
    Useful for stubborn horizontal scrollbars or nested containers.
    """

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        x, y = self.denormalize(args["x"], args["y"], env)

        if not env.page:
            return {"error": "Page not available"}

        try:
            # Use JavaScript to find the element at the coordinates and scroll it into view
            # This is more robust than mouse.wheel for many enterprise UIs
            await env.page.evaluate(
                """(coords) => {
                    const el = document.elementFromPoint(coords.x, coords.y);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                        return true;
                    }
                    return false;
                }""",
                {
                    "x": x,
                    "y": y
                },
            )
            logger.info(
                f"SMART_SCROLL: Scrolled element at ({x}, {y}) into view.")
            return {
                "status": "ok",
                "message": f"Scrolled element at ({x}, {y}) into view",
            }

        except Exception as e:
            logger.error(
                f"SMART_SCROLL: Failed to scroll element at ({x}, {y}): {e}")
            return {"error": str(e)}
