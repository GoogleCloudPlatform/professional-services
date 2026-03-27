# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

from abc import ABC, abstractmethod
from typing import List, Dict, Any
from google.genai import types


class ContextStrategy(ABC):
    @abstractmethod
    async def apply(self, history: List[types.Content]) -> List[types.Content]:
        pass

    async def apply_with_metadata(
        self, history: List[types.Content], metadata: Dict[str, Any]
    ) -> List[types.Content]:
        """
        Optional: Allows strategies to use telemetry (e.g. token counts) to make decisions.
        Defaults to standard apply if not overridden.
        """
        return await self.apply(history)

    def find_safe_tail_start(
        self, history: List[types.Content], keep_tail: int, protected_head: int
    ) -> int:
        """
        Calculates a safe index to start the 'Tail' section of history.
        Ensures we don't cut between a function_call and its response.
        Inspired by ADK's _safe_token_compaction_split_index.
        """
        if len(history) <= keep_tail:
            return 0

        target_start_index = len(history) - keep_tail

        # ADK Inspiration: Iterate backward to ensure no unmatched responses
        # are left hanging in the tail if their calls get pushed into the compacted middle.
        unmatched_response_names = set()

        for i in range(len(history) - 1, protected_head - 1, -1):
            content = history[i]

            # 1. Collect response names
            if content.role == "user" and content.parts:
                for p in content.parts:
                    if p.function_response:
                        unmatched_response_names.add(p.function_response.name)

            # 2. Remove matching calls
            if content.role == "model" and content.parts:
                for p in content.parts:
                    if (
                        p.function_call
                        and p.function_call.name in unmatched_response_names
                    ):
                        unmatched_response_names.remove(p.function_call.name)

            # 3. If we've reached our target length AND have no hanging responses, we are safe.
            if not unmatched_response_names and i <= target_start_index:
                return i

        # Fallback to protected head if we can't find a clean break
        return protected_head

    def find_safe_head_end(
        self, history: List[types.Content], protected_head: int
    ) -> int:
        """
        Calculates a safe index to end the 'Head' section.
        Ensures we don't leave an orphaned function_call at the end of the head.
        """
        if len(history) <= protected_head:
            return len(history)

        index = protected_head

        # 1. Walk forward to include all function responses for calls in the head
        while index < len(history):
            current_turn = history[index - 1]
            has_fc = (
                any(p.function_call for p in current_turn.parts)
                if current_turn.parts
                else False
            )

            next_turn = history[index]
            has_fr = (
                any(p.function_response for p in next_turn.parts)
                if next_turn.parts
                else False
            )

            if has_fc and has_fr:
                index += 1
            else:
                break

        # 2. Final check: If the last turn in head is a model turn with an FC,
        # and we couldn't include the FR, we MUST back up to remove the FC.
        # Otherwise the model gets a call it can't see the result for.
        while index > 0:
            last_turn = history[index - 1]
            if last_turn.role == "model" and any(
                p.function_call for p in last_turn.parts
            ):
                index -= 1
            else:
                break

        return index


class ContextPipeline:
    def __init__(self, strategies: List[ContextStrategy]):
        self.strategies = strategies

    async def process(
        self, history: List[types.Content], metadata: Dict[str, Any] = None
    ) -> List[types.Content]:
        context = list(history)  # Create a shallow copy
        for strategy in self.strategies:
            if metadata is not None:
                context = await strategy.apply_with_metadata(context, metadata)
            else:
                context = await strategy.apply(context)
        return context
