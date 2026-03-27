# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import logging
from typing import List, Dict, Any
from google.genai import types

logger = logging.getLogger(__name__)


class HistoryManager:
    """
    Manages the conversation history for the agent.
    Handles adding messages, trimming history, and providing context for the model.
    """

    def __init__(self, max_history_turns: int = 10):
        self.history: List[types.Content] = []
        self.max_history_turns = max_history_turns

    def add_content(self, content: types.Content):
        """Adds a content block (user or model) to the history."""
        self.history.append(content)

    def get_full_history(self) -> List[types.Content]:
        """Returns the full history of the session."""
        return self.history

    def get_trimmed_history(self) -> List[types.Content]:
        """Returns a subset of the history based on max_history_turns, ensuring API constraints."""
        if len(self.history) <= self.max_history_turns:
            return self.history

        first_turn = self.history[0]
        target_start_index = len(self.history) - self.max_history_turns

        # Adjust target index to ensure we start the tail with a 'user' role
        # and don't split function call/response pairs.
        # We search FORWARD from the ideal start to find a valid turn start.
        while target_start_index < len(self.history) - 1:
            content = self.history[target_start_index]
            if content.role == "user":
                is_function_response = False
                if content.parts:
                    is_function_response = any(
                        p.function_response for p in content.parts
                    )
                if not is_function_response:
                    break
            target_start_index += 1

        return [first_turn] + self.history[target_start_index:]

    def clear(self):
        """Clears the history."""
        self.history = []


class TelemetryTracker:
    """
    Tracks token usage and performance metrics for the agent session.
    """

    def __init__(self):
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_thinking_tokens = 0
        self.total_cached_tokens = 0
        self.start_time = 0.0
        self.step_details = []

    def log_usage(self, response: types.GenerateContentResponse) -> Dict[str, int]:
        """Accumulates token usage from a model response and returns the extracted counts."""
        usage = {"input": 0, "output": 0, "thinking": 0, "cached": 0}
        if response.usage_metadata:
            usage["input"] = (
                getattr(response.usage_metadata, "prompt_token_count", 0) or 0
            )
            usage["output"] = (
                getattr(response.usage_metadata, "candidates_token_count", 0) or 0
            )
            usage["cached"] = (
                getattr(response.usage_metadata, "cached_content_token_count", 0) or 0
            )

            # Gemini 3 Support: Check both potential fields for thinking tokens
            usage["thinking"] = (
                getattr(response.usage_metadata, "thinking_token_count", 0)
                or getattr(response.usage_metadata, "thoughts_token_count", 0)
                or 0
            )

            self.total_input_tokens += usage["input"]
            self.total_output_tokens += usage["output"]
            self.total_thinking_tokens += usage["thinking"]
            self.total_cached_tokens += usage["cached"]
            self.last_input_tokens = usage["input"]

        return usage

    def add_step_detail(self, detail: Dict[str, Any]):
        """Records performance metrics for a single step."""
        self.step_details.append(detail)

    def get_summary(self) -> Dict[str, Any]:
        """Returns a summary of the session telemetry."""
        return {
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_thinking_tokens": self.total_thinking_tokens,
            "total_cached_tokens": self.total_cached_tokens,
            "last_input_tokens": getattr(self, "last_input_tokens", 0),
            "step_details": self.step_details,
        }


class SafetyCoordinator:
    """
    Coordinates safety policy checks and user interventions.
    """

    def __init__(self, safety_policy: Any):
        self.safety_policy = safety_policy

    def check_action(self, action_name: str, action_args: Dict[str, Any]) -> str:
        """
        Checks if an action requires manual approval or should be blocked.
        Returns 'PROCEED', 'TERMINATE', or 'APPROVED'.
        """
        safety_decision = action_args.get("safety_decision")
        if (
            safety_decision
            and safety_decision.get("decision") == "require_confirmation"
        ):
            explanation = safety_decision.get("explanation", "No explanation provided.")
            logger.warning(f"[SAFETY] Intervention triggered: {explanation}")
            decision = self.safety_policy.confirm_action(safety_decision)
            if decision == "CONTINUE":
                return "APPROVED"
            return decision  # TERMINATE
        return "PROCEED"

    @property
    def trigger_count(self) -> int:
        return self.safety_policy.trigger_count

    @property
    def intervention_count(self) -> int:
        return self.safety_policy.intervention_count
