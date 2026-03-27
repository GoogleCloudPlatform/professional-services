# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)


class ActionMiddleware(ABC):
    """
    Base class for action execution middleware.
    """

    @abstractmethod
    async def before_action(
            self, action_name: str,
            args: Dict[str, Any]) -> Tuple[str, Dict[str, Any], bool]:
        """
        Run before an action is executed.
        Returns: (modified_action_name, modified_args, should_continue)
        """
        return action_name, args, True

    @abstractmethod
    async def after_action(self, action_name: str, args: Dict[str, Any],
                           result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run after an action is executed.
        Returns: modified_result
        """
        return result

    async def start_turn(self):
        """
        Called at the start of each agent turn (step).
        """
        pass


class SafetyMiddleware(ActionMiddleware):
    """
    Handles safety_decision handshake:
    If require_confirmation is present, it's expected to have been handled by the agent loop.
    This middleware ensures the safety_acknowledgement is properly injected into the result.
    """

    async def start_turn(self):
        pass

    async def end_turn(self):
        pass

    async def before_action(
            self, action_name: str,
            args: Dict[str, Any]) -> Tuple[str, Dict[str, Any], bool]:
        # The actual confirmation logic is in GeminiAgent.run_task (SafetyPolicy).
        # Middleware just observes if we should proceed.
        return action_name, args, True

    async def after_action(self, action_name: str, args: Dict[str, Any],
                           result: Dict[str, Any]) -> Dict[str, Any]:
        # If the input args had a safety decision that required confirmation,
        # and we reached here (result is ok), we should flag it as acknowledged.
        # Note: In our current run_task, the agent loop handles the injection.
        # However, moving it here makes it more modular.

        safety_decision = args.get("safety_decision")
        if (safety_decision and
                safety_decision.get("decision") == "require_confirmation"):
            if "status" in result and result["status"] == "ok":
                result["safety_acknowledgement"] = "true"

        return result


class DialogMiddleware(ActionMiddleware):
    """
    Handles browser dialogs (alerts, confirmations, prompts) automatically.

    Why: Playwright execution freezes/hangs if a dialog appears and isn't handled.
    This middleware listens for the 'dialog' event, logs the message, and
    automatically dismisses it to allow execution to proceed.
    The message is then injected into the action result so the Agent is aware of it.
    """

    def __init__(self, env):
        self.env = env
        self.last_dialog_message = None
        self._setup_listener()

    async def start_turn(self):
        pass

    async def end_turn(self):
        pass

    def _setup_listener(self):
        if self.env.page:
            self.env.page.on("dialog", self._on_dialog)

    async def _on_dialog(self, dialog):
        self.last_dialog_message = dialog.message
        logger.info(
            f"Browser Dialog detected: {dialog.type} - {dialog.message}")
        # Auto-accept/dismiss based on type or just accept all to keep moving
        await dialog.dismiss()

    async def before_action(
            self, action_name: str,
            args: Dict[str, Any]) -> Tuple[str, Dict[str, Any], bool]:
        return action_name, args, True

    async def after_action(self, action_name: str, args: Dict[str, Any],
                           result: Dict[str, Any]) -> Dict[str, Any]:
        if self.last_dialog_message:
            result["browser_dialog"] = self.last_dialog_message
            self.last_dialog_message = None
        return result
