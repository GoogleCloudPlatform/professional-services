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


class HelloWorldAction(BaseAction):
    """
    A simple example action that logs a message.
    """

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        message = args.get("message", "Hello, World!")
        logger.info(f"PLUGIN: {message}")

        # You can also interact with the browser here using env.page
        # Example: await env.page.evaluate(f"console.log('{message}')")

        return {"status": "ok", "plugin_message": message}
