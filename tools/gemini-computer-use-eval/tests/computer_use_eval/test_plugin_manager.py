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

from unittest.mock import MagicMock, patch
from computer_use_eval.plugin_manager import PluginManager
from computer_use_eval.actions import BaseAction


class MockAction(BaseAction):

    async def execute(self, env, args):
        pass


def test_load_custom_actions():
    executor = MagicMock()
    action_map = {"test_tool": "pkg.module.MockAction"}

    with patch("importlib.import_module") as mock_import:
        mock_module = MagicMock()
        mock_module.MockAction = MockAction
        mock_import.return_value = mock_module

        PluginManager.load_custom_actions(action_map, executor)

        executor.register.assert_called_once()
        name, instance = executor.register.call_args[0]
        assert name == "test_tool"
        assert isinstance(instance, MockAction)


def test_discover_plugins():
    executor = MagicMock()

    mock_ep = MagicMock()
    mock_ep.name = "plugin_tool"
    mock_ep.value = "pkg.module:PluginAction"
    mock_ep.load.return_value = MockAction

    with patch("computer_use_eval.plugin_manager.entry_points") as mock_eps:
        mock_eps.return_value = [mock_ep]

        PluginManager.discover_plugins(executor)

        executor.register.assert_called_once()
        name, instance = executor.register.call_args[0]
        assert name == "plugin_tool"
        assert isinstance(instance, MockAction)
