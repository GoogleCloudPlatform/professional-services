# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import logging
from typing import Dict, Any
from computer_use_eval.actions import BaseAction
from computer_use_eval.browser.playwright_env import PlaywrightEnv

logger = logging.getLogger(__name__)


class HelloWorldAction(BaseAction):
    """
    A simple example action that logs a message.
    """

    async def execute(self, env: PlaywrightEnv, args: Dict[str, Any]) -> Dict[str, Any]:
        message = args.get("message", "Hello, World!")
        logger.info(f"PLUGIN: {message}")

        # You can also interact with the browser here using env.page
        # Example: await env.page.evaluate(f"console.log('{message}')")

        return {"status": "ok", "plugin_message": message}
