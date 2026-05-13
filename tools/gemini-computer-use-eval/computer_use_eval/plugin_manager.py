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

import importlib
import logging
import sys
from typing import Dict

if sys.version_info >= (3, 10):
    from importlib.metadata import entry_points
else:
    from importlib_metadata import entry_points

from computer_use_eval.actions import BaseAction, ActionExecutor

logger = logging.getLogger(__name__)


class PluginManager:
    """
    Manages loading and registration of external plugins for actions and judges.
    """

    @staticmethod
    def discover_plugins(executor: ActionExecutor):
        """
        Discovers and loads plugins via entry_points.
        Expected entry point group: 'computer_use.actions'
        """
        eps = entry_points(group="computer_use.actions")
        for ep in eps:
            try:
                action_cls = ep.load()
                if not issubclass(action_cls, BaseAction):
                    logger.warning(
                        f"Plugin {ep.name} ({ep.value}) is not a subclass of BaseAction. Skipping."
                    )
                    continue

                action_instance = action_cls()
                executor.register(ep.name, action_instance)
                logger.info(f"Loaded plugin action: {ep.name} from {ep.value}")
            except Exception as e:
                logger.error(f"Failed to load plugin action {ep.name}: {e}")

    @staticmethod
    def load_custom_actions(action_map: Dict[str, str],
                            executor: ActionExecutor):
        """
        Loads custom action classes and registers them with the executor.
        Args:
            action_map: Dict mapping action name to class path (e.g. "my_tool": "my_pkg.MyClass")
            executor: The ActionExecutor instance
        """
        if not action_map:
            return

        for name, cls_path in action_map.items():
            try:
                module_name, class_name = cls_path.rsplit(".", 1)
                module = importlib.import_module(module_name)
                action_cls = getattr(module, class_name)

                if not issubclass(action_cls, BaseAction):
                    logger.warning(
                        f"Plugin {cls_path} is not a subclass of BaseAction. Skipping."
                    )
                    continue

                action_instance = action_cls()
                executor.register(name, action_instance)
                logger.info(f"Registered custom action: {name} from {cls_path}")

            except Exception as e:
                logger.error(
                    f"Failed to load custom action {name} ({cls_path}): {e}")
