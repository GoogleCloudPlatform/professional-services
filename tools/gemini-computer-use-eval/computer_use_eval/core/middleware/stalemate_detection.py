# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import logging
import hashlib
from typing import List, Dict, Any, Tuple, Optional

from computer_use_eval.core.base import ActionMiddleware
from computer_use_eval.config import ReflectionStrategy
from computer_use_eval.prompts import MICRO_REFLECTION_TEMPLATE

logger = logging.getLogger(__name__)


class StalemateDetectionMiddleware(ActionMiddleware):
    """
    Detects and resolves agent stalemates via Aria Hashing and Loop Detection.
    """

    def __init__(
        self,
        env: Any,
        reflection_strategy: ReflectionStrategy = ReflectionStrategy.NUDGE,
        stagnation_threshold: int = 3,
        history_window: int = 10,
        goal: str = "",
        client: Any = None,
        strict_threshold: int = 3,
        loose_threshold: int = 5,
    ):
        self.env = env
        self.reflection_strategy = reflection_strategy
        self.stagnation_threshold = stagnation_threshold
        self.history_window = history_window if history_window is not None else 10
        self.goal = goal
        self.client = client
        self.strict_threshold = strict_threshold if strict_threshold is not None else 3
        self.loose_threshold = loose_threshold if loose_threshold is not None else 5

        self.action_history: List[Tuple[str, str]] = []
        self.state_history: List[str] = []
        self.failure_counters: Dict[str, int] = {}
        self.stagnation_counter = 0
        self.pre_action_hash: Optional[str] = None
        self.turn_stagnation_incremented = False
        self._reflection_engine = None
        self._loop_injected = False

    @property
    def reflection_engine(self):
        if not self._reflection_engine:
            from computer_use_eval.reflection import ReflectionEngine

            self._reflection_engine = ReflectionEngine(self.env.page, [],
                                                       client=self.client,
                                                       goal=self.goal)
        return self._reflection_engine

    @reflection_engine.setter
    def reflection_engine(self, value):
        self._reflection_engine = value

    def _get_state_hash(self, aria_tree: str) -> str:
        if not aria_tree:
            return ""
        if not isinstance(aria_tree, str):
            aria_tree = str(aria_tree)

        import re

        # 1. Remove generic transient state markers like [focused]
        sanitized = re.sub(r"\[focused\]", "", aria_tree)

        # 2. Remove highly volatile temporal data (e.g. "12:00 PM", "updated 5 mins ago")
        # This matches basic time patterns like HH:MM AM/PM and simple relative times.
        sanitized = re.sub(r"\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\b",
                           "[TIME_MASK]", sanitized)
        sanitized = re.sub(
            r"\b(?:updated|created)?\s*(?:\d+)\s*(?:sec|min|hour|day)s?\s*(?:ago)?\b",
            "[TIME_MASK]",
            sanitized,
            flags=re.IGNORECASE,
        )

        # 3. Strip dynamically generated UUIDs/Hash strings often used in element names/values
        # (e.g. hex strings 8+ chars long, or standard UUIDs)
        sanitized = re.sub(
            r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b",
            "[UUID_MASK]",
            sanitized,
        )
        sanitized = re.sub(r"\b[0-9a-fA-F]{8,32}\b", "[HEX_MASK]", sanitized)

        # 4. Normalize excess whitespace resulting from deletions
        sanitized = re.sub(r"\s+", " ", sanitized).strip()

        return hashlib.sha256(sanitized.encode("utf-8")).hexdigest()

    def _detect_state_cycle(self) -> int:
        if len(self.state_history) < 3:
            return 0
        current_hash = self.state_history[-1]

        # Prevent false positives: only trigger if we've seen this state 3+ times
        occurrences = self.state_history.count(current_hash)
        if occurrences >= 3:
            # Find the cycle length by looking at the last occurrence before this one
            for i in range(len(self.state_history) - 2, -1, -1):
                if self.state_history[i] == current_hash:
                    return len(self.state_history) - 1 - i
        return 0

    def _normalize_args(self, action: str, args: Dict[str,
                                                      Any]) -> Dict[str, Any]:
        norm = dict(args)
        for key in ["x", "y", "destination_x", "destination_y"]:
            if key in norm and isinstance(norm[key], (int, float)):
                val = norm[key]
                if val == 9:
                    norm[key] = 0
                elif val == 105:
                    norm[key] = 100
                elif val == 114:
                    norm[key] = 120
                elif val == 505:
                    norm[key] = 500
                else:
                    norm[key] = int(round(val / 10.0) * 10)
        return norm

    async def start_turn(self):
        self.turn_stagnation_incremented = False

    async def end_turn(self):
        pass

    async def before_action(
            self, action_name: str,
            args: Dict[str, Any]) -> Tuple[str, Dict[str, Any], bool]:
        from computer_use_eval.utils import await_if_needed

        norm_args = self._normalize_args(action_name, args)
        self.action_history.append((action_name, str(norm_args)))
        if len(self.action_history) > self.history_window:
            self.action_history.pop(0)
        try:
            aria = await await_if_needed(self.env.get_aria_snapshot())
            self.pre_action_hash = self._get_state_hash(aria)
        except Exception:
            self.pre_action_hash = None
        return action_name, args, True

    async def _get_injected_context(self, context_str: str) -> List[str]:
        """Helper to format the injected context with XML tags."""
        if not context_str:
            return []
        return [
            "\n--- AUTO-INJECTED PAGE CONTEXT ---",
            "<page_context>",
            context_str,
            "</page_context>",
            "----------------------------------",
        ]

    async def after_action(self, action_name: str, args: Dict[str, Any],
                           result: Dict[str, Any]) -> Dict[str, Any]:
        from computer_use_eval.utils import await_if_needed

        # Query the tool registry for passive status
        is_passive = False
        try:
            if hasattr(self.env, "executor") and hasattr(
                    self.env.executor, "executor"):
                action_instance = self.env.executor.executor.get_action(
                    action_name)
                if action_instance:
                    is_passive = action_instance.is_passive
        except Exception:
            pass

        is_fail = False
        error_msg = "Unknown error"
        if isinstance(result, dict):
            is_fail = "error" in result or result.get("status") == "error"
            error_msg = result.get("error", "Unknown error")
        elif isinstance(result, str):
            is_fail = "error" in result.lower()
            error_msg = result if is_fail else "Unknown error"

        if is_fail:
            count = self.failure_counters.get(action_name, 0) + 1
            self.failure_counters[action_name] = count

            thresh = self.loose_threshold if is_passive else self.strict_threshold
            guidance = [
                f"FAILURE DETECTED: Tool '{action_name}' failed with error: {error_msg}",
                f"Retry attempt {count} of {thresh}.",
            ]
            if count == 2:
                guidance.append(
                    MICRO_REFLECTION_TEMPLATE.format(action=action_name,
                                                     error=error_msg))
            if count >= thresh:
                guidance.append(
                    f"CRITICAL: Maximum retries ({thresh}) reached for this specific action."
                )
                guidance.append(
                    "Try a completely different approach (e.g. searching, scrolling differently, or checking a different part of the UI)."
                )
                strategy_str = str(self.reflection_strategy)
                if "INJECT" in strategy_str:
                    try:
                        aria = await await_if_needed(
                            self.env.get_aria_snapshot())
                    except Exception:
                        aria = "{}"

                    reasoning = getattr(self.env, "current_reasoning", None)
                    context = await self.reflection_engine.get_context_for_failure(
                        strategy_str, aria, action_name, args, error_msg,
                        reasoning)
                    guidance.extend(await self._get_injected_context(context))
            result["reflection_guidance"] = "\n".join(guidance)
        else:
            self.failure_counters.pop(action_name, None)

        try:
            post_aria = await await_if_needed(self.env.get_aria_snapshot())
            post_hash = self._get_state_hash(post_aria)
            if self.pre_action_hash and post_hash == self.pre_action_hash:
                if not is_passive and not self.turn_stagnation_incremented:
                    self.stagnation_counter += 1
                    self.turn_stagnation_incremented = True
                    logger.warning(
                        f"⚠️ [STAGNATION] No UI change detected ({self.stagnation_counter}/{self.stagnation_threshold})"
                    )
            else:
                if self.pre_action_hash:
                    self.stagnation_counter = 0

            if post_hash:
                if not self.state_history or post_hash != self.state_history[-1]:
                    self.state_history.append(post_hash)
                    if len(self.state_history) > self.history_window:
                        self.state_history.pop(0)
        except Exception:
            pass

        cycle_len = self._detect_state_cycle()

        is_loop_trigger = cycle_len > 0

        is_stagnant_trigger = (self.stagnation_counter
                               >= self.stagnation_threshold and
                               not is_loop_trigger)

        if is_stagnant_trigger or is_loop_trigger:
            warning_parts = [
                "<system_warning>",
                "<type>State Stagnation Detected</type>",
            ]

            if is_stagnant_trigger:
                warning_parts.append(
                    f"<details>The UI has not reacted to your last {self.stagnation_counter} consecutive actions.</details>"
                )
            elif cycle_len > 0:
                warning_parts.append(
                    f"<details>The UI state has not changed after a loop of {cycle_len} consecutive actions.</details>"
                )
                warning_parts.append(
                    "<analysis>Oscillating behavior detected: You are repeating the same sequence of actions without progress.</analysis>"
                )

            warning_parts.append(
                "<analysis>You may be clicking an inactive element, scrolling at a boundary, or waiting on a blocked network request.</analysis>"
            )
            warning_parts.append(
                "<directive>You MUST verify your current state and attempt a COMPLETELY DIFFERENT strategy to proceed.</directive>"
            )

            strategy_str = str(self.reflection_strategy)
            if "INJECT" in strategy_str:
                if not self._loop_injected:
                    try:
                        aria = await await_if_needed(
                            self.env.get_aria_snapshot())
                    except Exception:
                        aria = "{}"

                    reasoning = getattr(self.env, "current_reasoning", None)
                    context = await self.reflection_engine.get_context_for_loop(
                        strategy_str, aria, self.action_history[-4:], reasoning)
                    warning_parts.extend(await
                                         self._get_injected_context(context))
                    if is_loop_trigger:
                        self._loop_injected = True

            warning_parts.append("</system_warning>")
            warning = "\n".join(warning_parts)

            result["stalemate_warning"] = warning
            logger.warning(
                f"🔔 [NUDGE] Injected stalemate warning into function response: {warning}"
            )

            if is_stagnant_trigger:
                self.stagnation_counter = 0

        return result
