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

from abc import ABC, abstractmethod
from typing import Dict, Any, Literal
import logging


class SafetyPolicy(ABC):
    """Abstract base class for handling safety decisions."""

    def __init__(self):
        self.trigger_count = 0
        self.intervention_count = 0

    @abstractmethod
    def confirm_action(
            self,
            safety_decision: Dict[str,
                                  Any]) -> Literal["CONTINUE", "TERMINATE"]:
        """
        Determines whether to proceed with an action flagged by the safety system.

        Args:
            safety_decision: The dictionary returned by the model containing 'decision' and 'explanation'.

        Returns:
            "CONTINUE" if the action is approved, "TERMINATE" if denied.
        """
        pass


class InteractiveSafetyPolicy(SafetyPolicy):
    """Prompts the user via CLI for confirmation (Human-in-the-Loop)."""

    def confirm_action(
            self,
            safety_decision: Dict[str,
                                  Any]) -> Literal["CONTINUE", "TERMINATE"]:
        self.trigger_count += 1
        self.intervention_count += 1
        try:
            import termcolor

            termcolor.cprint("Safety service requires explicit confirmation!",
                             color="red")
        except ImportError:
            print("Safety service requires explicit confirmation!")

        print(
            f"Explanation: {safety_decision.get('explanation', 'No explanation provided.')}"
        )

        decision = ""
        while decision.lower() not in ("y", "n", "ye", "yes", "no"):
            decision = input("Do you wish to proceed? [Y]es/[N]o\n")

        if decision.lower() in ("n", "no"):
            return "TERMINATE"
        return "CONTINUE"


class AutoApproveSafetyPolicy(SafetyPolicy):
    """Automatically approves all actions. USE ONLY FOR TESTING/BENCHMARKS."""

    def __init__(self):
        super().__init__()
        self.logger = logging.getLogger(__name__)

    def confirm_action(
            self,
            safety_decision: Dict[str,
                                  Any]) -> Literal["CONTINUE", "TERMINATE"]:
        self.trigger_count += 1
        self.logger.warning(
            f"Auto-approving safety check. Explanation: {safety_decision.get('explanation')}"
        )
        return "CONTINUE"


class AutoDenySafetyPolicy(SafetyPolicy):
    """Automatically denies all actions. Useful for verifying safety triggers."""

    def __init__(self):
        super().__init__()
        self.logger = logging.getLogger(__name__)

    def confirm_action(
            self,
            safety_decision: Dict[str,
                                  Any]) -> Literal["CONTINUE", "TERMINATE"]:
        self.trigger_count += 1
        self.logger.warning(
            f"Auto-denying safety check. Explanation: {safety_decision.get('explanation')}"
        )
        return "TERMINATE"


def get_safety_policy(mode: str, headless: bool) -> SafetyPolicy:
    """
    Factory function to return the appropriate safety policy.
    """
    mode = mode.lower().replace("-", "_")
    if mode == "auto":
        if headless:
            return AutoApproveSafetyPolicy()
        else:
            return InteractiveSafetyPolicy()

    if mode == "interactive":
        return InteractiveSafetyPolicy()
    elif mode == "auto_approve":
        return AutoApproveSafetyPolicy()
    elif mode == "auto_deny":
        return AutoDenySafetyPolicy()
    else:
        logging.getLogger(__name__).warning(
            f"Unknown safety mode: {mode}. Defaulting to AutoApprove.")
        return AutoApproveSafetyPolicy()
