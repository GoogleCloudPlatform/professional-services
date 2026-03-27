# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple


@dataclass
class Action:
    name: str
    args: Dict[str, Any]
    id: str = None


@dataclass
class ActionExecutionResult:
    action_id: str
    action_name: str
    result_data: Dict[str, Any]
    safety_acknowledged: bool
    mw_duration: float = 0.0


@dataclass
class AgentResult:
    success: bool
    steps: int
    retries: int
    history: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    thinking_tokens: int = 0


class BaseAgent(ABC):
    @abstractmethod
    async def run_task(self, task: str, env: Any) -> AgentResult:
        pass


class ActionMiddleware(ABC):
    """
    Base class for agent interceptors.
    Allows modifying or analyzing actions before and after execution.
    """

    async def start_turn(self):
        """Called at the beginning of each agent turn (before any actions)."""
        pass

    async def end_turn(self):
        """Called at the end of each agent turn (after all actions and observations)."""
        pass

    @abstractmethod
    async def before_action(
        self, action_name: str, args: Dict[str, Any]
    ) -> Tuple[str, Dict[str, Any], bool]:
        """
        Intersects an action before it is executed.
        Returns: (action_name, args, skip_execution)
        """
        return action_name, args, False

    @abstractmethod
    async def after_action(
        self, action_name: str, args: Dict[str, Any], result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Intersects an action result after it is executed.
        """
        return result
