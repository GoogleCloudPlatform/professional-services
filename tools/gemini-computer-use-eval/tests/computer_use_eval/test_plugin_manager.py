# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

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
