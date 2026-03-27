# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import asyncio
from typing import Dict, Any
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from .base import BaseAction


class NavigateAction(BaseAction):

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        url = args.get("url")
        if not url:
            return {"error": "url argument is required"}

        if url.startswith("/"):
            from urllib.parse import urljoin

            url = urljoin(env.page.url, url)

        # We use 'networkidle' to ensure heavy enterprise applications
        # have fully loaded their data-grids and API-backed components before
        # the agent takes the next screenshot.
        await env.page.goto(url, wait_until="networkidle", timeout=60000)
        await env.page.wait_for_timeout(500)
        return {"status": "ok"}


class OpenBrowserAction(BaseAction):

    @property
    def is_passive(self) -> bool:
        return True

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "ok"}


class GoBackAction(BaseAction):

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        await env.page.go_back()
        return {"status": "ok"}


class GoForwardAction(BaseAction):

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        await env.page.go_forward()
        return {"status": "ok"}


class ScrollAction(BaseAction):

    @property
    def is_passive(self) -> bool:
        return True

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        direction = args.get("direction", "down")
        magnitude = args.get("magnitude", 800)
        dimension = "height" if direction in ["up", "down"] else "width"
        px = self.denormalize_magnitude(magnitude, env, dimension)

        if direction == "down":
            await env.page.mouse.wheel(0, px)
        elif direction == "up":
            await env.page.mouse.wheel(0, -px)
        elif direction == "right":
            await env.page.mouse.wheel(px, 0)
        elif direction == "left":
            await env.page.mouse.wheel(-px, 0)
        return {"status": "ok"}


class ScrollAtAction(BaseAction):

    @property
    def is_passive(self) -> bool:
        return True

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        x, y = self.denormalize(args["x"], args["y"], env)
        direction = args.get("direction", "down")
        magnitude = args.get("magnitude", 600)
        dimension = "height" if direction in ["up", "down"] else "width"
        px = self.denormalize_magnitude(magnitude, env, dimension)

        await env.page.mouse.move(x, y)
        if direction == "down":
            await env.page.mouse.wheel(0, px)
        elif direction == "up":
            await env.page.mouse.wheel(0, -px)
        elif direction == "right":
            await env.page.mouse.wheel(px, 0)
        elif direction == "left":
            await env.page.mouse.wheel(-px, 0)
        else:
            await env.page.mouse.wheel(0, px)
        return {"status": "ok"}


class WaitAction(BaseAction):

    @property
    def is_passive(self) -> bool:
        return True

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        # Explicit wait requested by the model.
        # Useful for async background processes or legacy slow UIs.
        await asyncio.sleep(5)
        return {"status": "ok"}
