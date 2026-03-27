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

from typing import Dict, Any
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from .base import BaseAction


class ClickAction(BaseAction):

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        x, y = self.denormalize(args["x"], args["y"], env)
        await self.highlight_click(env, x, y)
        await env.page.mouse.click(x, y)

        # Follow official Google pattern: Wait for load state, then a brief hard sleep for JS rendering.
        try:
            await env.page.wait_for_load_state("domcontentloaded", timeout=3000)
        except Exception:
            pass  # Ignore timeouts if no navigation occurs

        # Stability wait after click to allow for UI reactions/animations
        await env.page.wait_for_timeout(500)
        return {"status": "ok"}


class DoubleClickAction(BaseAction):

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        x, y = self.denormalize(args["x"], args["y"], env)
        await self.highlight_click(env, x, y)
        # Playwright's mouse.dblclick handles the two clicks with appropriate delay
        await env.page.mouse.dblclick(x, y)

        try:
            await env.page.wait_for_load_state("domcontentloaded", timeout=3000)
        except Exception:
            pass

        await env.page.wait_for_timeout(500)
        return {"status": "ok"}


class HoverAction(BaseAction):

    @property
    def is_passive(self) -> bool:
        return True

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        x, y = self.denormalize(args["x"], args["y"], env)
        await env.page.mouse.move(x, y)
        return {"status": "ok"}


class DragAndDropAction(BaseAction):

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        sx, sy = self.denormalize(args["x"], args["y"], env)
        dx, dy = self.denormalize(args["destination_x"], args["destination_y"],
                                  env)
        await env.page.mouse.move(sx, sy)
        await env.page.mouse.down()
        # Use steps=10 to simulate a human-like drag speed, which is
        # required for some interactive elements (like sliders or reorderable lists).
        await env.page.mouse.move(dx, dy, steps=10)
        await env.page.mouse.up()
        return {"status": "ok"}
