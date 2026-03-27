# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

from typing import List, Any, Dict
import logging
from google.genai import types

from computer_use_eval.core.context.base import ContextStrategy
from computer_use_eval.config import ImageRetentionStrategy

logger = logging.getLogger(__name__)


class SmartTrimStrategy(ContextStrategy):
    """
    Implements the 'Keep Head, Keep Tail, Drop Middle' strategy.

    This strategy ensures that:
    1. The first turn (Goal + Initial State) is always preserved.
    2. The last N turns (Momentum) are always preserved.
    3. The middle section is trimmed if the history exceeds a maximum length.
    4. Function call/response pairs are never split (Atomic Slicing).
    """

    def __init__(self,
                 max_turns: int = 30,
                 keep_tail: int = 10,
                 protected_head: int = 1):
        self.max_turns = max_turns
        self.keep_tail = keep_tail
        self.protected_head = protected_head

    async def apply(self, history: List[types.Content]) -> List[types.Content]:
        if len(history) <= self.max_turns:
            return history

        logger.info(
            f"✂️ [CONTEXT] SmartTrim triggered: {len(history)} turns exceeds max_turns={self.max_turns}."
        )

        # Always keep Turn 0-N (Goal + Plan)
        head = history[:self.protected_head]

        # Calculate a safe start index for the Tail (Root Turn)
        target_start_index = self.find_safe_tail_start(history, self.keep_tail,
                                                       self.protected_head)

        # Construct new history: Head + Tail
        tail = history[target_start_index:]
        bridge = []

        # CRITICAL: Ensure Head ends and Tail starts with different roles to maintain alternation.
        if head and tail:
            last_head_role = head[-1].role
            first_tail_role = tail[0].role

            if last_head_role == first_tail_role:
                logger.debug(
                    f"✂️ [CONTEXT] SmartTrim role clash ({last_head_role}). Injecting bridge turn."
                )
                from google.genai import types

                # Inject a dummy turn to bridge the gap without dropping data
                if last_head_role == "user":
                    bridge.append(
                        types.Content(
                            role="model",
                            parts=[types.Part(text="[History Trimmed]")]))
                else:
                    bridge.append(
                        types.Content(
                            role="user",
                            parts=[types.Part(text="[History Trimmed]")]))

        new_history = head + bridge + tail
        logger.info(
            f"✂️ [CONTEXT] SmartTrim applied. {len(history)} -> {len(new_history)} turns."
        )
        return new_history


class ImageContextStrategy(ContextStrategy):
    """
    Manages image retention in history to optimize token usage.
    """

    def __init__(
        self,
        max_images: int = 3,
        retention_strategy: ImageRetentionStrategy = ImageRetentionStrategy.
        AGGRESSIVE,
    ):
        self.max_images = max_images
        self.retention_strategy = retention_strategy

    def _degrade_image(self, image_bytes: bytes) -> bytes:
        """Downscales image to 50% and converts to grayscale to save tokens."""
        from computer_use_eval.utils import resize_image
        from computer_use_eval.config import settings

        return resize_image(
            image_bytes,
            max_width=settings.SCREEN_WIDTH // 2,
            max_height=settings.SCREEN_HEIGHT // 2,
            grayscale=True,
        )

    async def apply(self, history: List[types.Content]) -> List[types.Content]:
        if (self.max_images == -1 and self.retention_strategy
                != ImageRetentionStrategy.VARIABLE_FIDELITY):
            return history

        if len(history) <= 1:
            return history

        # Identify which turns SHOULD keep their images
        # Index 0 (Goal) and the Last turn (Current state) are always kept at full res.
        full_res_indices = {0, len(history) - 1}
        degraded_indices = set()

        # Identify all user turns that HAVE images (excluding those already in full_res)
        eligible_user_turns = []
        for i, content in enumerate(history):
            if i in full_res_indices:
                continue
            if content.role == "user":
                has_img = any(
                    (p.inline_data and
                     p.inline_data.mime_type.startswith("image/")) or
                    (p.function_response and p.function_response.parts and any(
                        frp.inline_data and
                        frp.inline_data.mime_type.startswith("image/")
                        for frp in p.function_response.parts))
                    for p in content.parts)
                if has_img:
                    eligible_user_turns.append(i)

        eligible_user_turns.reverse()  # Most recent first

        if self.retention_strategy == ImageRetentionStrategy.AGGRESSIVE:
            # Traditional rolling window: keep last N eligible
            limit = self.max_images if self.max_images >= 0 else 3
            for i, idx in enumerate(eligible_user_turns):
                if i < limit:
                    full_res_indices.add(idx)

        elif self.retention_strategy == ImageRetentionStrategy.VARIABLE_FIDELITY:
            # Note: total_limit includes full_res turns from the rolling window
            # but NOT the guaranteed 0 and last turns.
            full_limit = self.max_images if self.max_images >= 0 else 5
            total_limit = full_limit * 2 if self.max_images >= 0 else 20
            for i, idx in enumerate(eligible_user_turns):
                if i < full_limit:
                    full_res_indices.add(idx)
                elif i < total_limit:
                    degraded_indices.add(idx)

        elif self.retention_strategy == ImageRetentionStrategy.FULL_FIDELITY:
            limit = self.max_images if self.max_images >= 0 else 20
            for i, idx in enumerate(eligible_user_turns):
                if i < limit:
                    full_res_indices.add(idx)

        new_history = []
        for i, content in enumerate(history):
            if i in full_res_indices:
                new_history.append(content)
                continue

            is_degraded = i in degraded_indices

            new_parts = []
            modified = False
            for part in content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith(
                        "image/"):
                    modified = True
                    if is_degraded:
                        degraded_bytes = self._degrade_image(
                            part.inline_data.data)
                        new_parts.append(
                            types.Part(inline_data=types.Blob(
                                mime_type="image/png", data=degraded_bytes)))
                    continue

                if part.function_response:
                    has_images = False
                    if part.function_response.parts:
                        has_images = any(
                            p.inline_data and
                            p.inline_data.mime_type.startswith("image/")
                            for p in part.function_response.parts)

                    if has_images:
                        modified = True
                        new_fr_parts = []
                        for frp in part.function_response.parts:
                            if frp.inline_data and frp.inline_data.mime_type.startswith(
                                    "image/"):
                                if is_degraded:
                                    degraded_bytes = self._degrade_image(
                                        frp.inline_data.data)
                                    new_fr_parts.append(
                                        types.FunctionResponsePart(
                                            inline_data=types.
                                            FunctionResponseBlob(
                                                mime_type="image/png",
                                                data=degraded_bytes,
                                            )))
                            else:
                                new_fr_parts.append(frp)

                        new_fr_kwargs = {
                            "name": part.function_response.name,
                            "response": part.function_response.response,
                            "parts": new_fr_parts,
                        }
                        if getattr(part.function_response, "id", None):
                            new_fr_kwargs["id"] = part.function_response.id

                        new_fr = types.FunctionResponse(**new_fr_kwargs)
                        new_parts.append(types.Part(function_response=new_fr))
                        continue

                new_parts.append(part)

            if modified:
                new_history.append(
                    types.Content(role=content.role, parts=new_parts))
            else:
                new_history.append(content)

        return new_history


class CompactionStrategy(ContextStrategy):
    """
    Reduces noise by folding repetitive actions into descriptive summaries.
    Converts (Model+User) pairs into a single Model Turn summary to maintain valid turn order.
    """

    async def apply(self, history: List[types.Content]) -> List[types.Content]:
        initial_len = len(history)
        if initial_len <= 4:
            return history

        def estimate_tokens(h: List[types.Content]) -> int:
            return sum(len(str(c)) for c in h) // 4

        initial_tokens = estimate_tokens(history)
        new_history = [history[0]]  # Keep Head
        i = 1

        while i < len(history) - 2:
            current_model_turn = history[i]

            if (current_model_turn.role == "model" and
                    current_model_turn.parts and
                    len(current_model_turn.parts) == 1 and
                    current_model_turn.parts[0].function_call):
                fc = current_model_turn.parts[0].function_call
                if fc.name in [
                        "wait_5_seconds",
                        "scroll_at",
                        "scroll_document",
                        "mouse_move",
                ]:
                    next_model_turn = history[i + 2]
                    if (next_model_turn.role == "model" and
                            next_model_turn.parts and
                            len(next_model_turn.parts) == 1 and
                            next_model_turn.parts[0].function_call and
                            next_model_turn.parts[0].function_call.name
                            == fc.name):
                        loop_name = fc.name
                        loop_count = 0
                        while i < len(history) - 2:
                            m_turn = history[i]
                            if (m_turn.role == "model" and m_turn.parts and
                                    len(m_turn.parts) == 1 and
                                    m_turn.parts[0].function_call and
                                    m_turn.parts[0].function_call.name
                                    == loop_name):
                                loop_count += 1
                                i += 2
                            else:
                                break

                        summary = f"[Summarized: Agent executed '{loop_name}' {loop_count} times to stabilize UI/Navigation.]\nAcknowledged. Page is now ready."

                        logger.info(
                            f"🔄 [CONTEXT] Compaction: Summarized loop of {loop_count} '{loop_name}' turns."
                        )

                        # Gemini 3 requires a thought signature for any turn in an active sequence.
                        # We use the 'skip' dummy signature (as bytes) to satisfy the validator.
                        new_history.append(
                            types.Content(
                                role="model",
                                parts=[types.Part(text=summary,)],
                            ))
                        # CRITICAL: We MUST append a User turn here to maintain the
                        # mandatory User-Model-User alternation in history.
                        new_history.append(
                            types.Content(
                                role="user",
                                parts=[types.Part(text="Acknowledged.")]))
                        continue

            new_history.append(history[i])
            new_history.append(history[i + 1])
            i += 2

        new_history.extend(history[i:])

        final_len = len(new_history)
        if final_len < initial_len:
            final_tokens = estimate_tokens(new_history)
            saved_tokens = initial_tokens - final_tokens
            logger.info(
                f"🔄 [CONTEXT] Compaction applied. {initial_len} -> {final_len} turns (Saved ~{saved_tokens} tokens)."
            )
        return new_history


class SummarizationStrategy(ContextStrategy):
    """
    Uses an LLM to summarize the 'Middle' of history based on telemetry tokens.
    """

    def __init__(
        self,
        client: Any,
        model_name: str = "gemini-3-flash-preview",
        token_threshold: int = 40000,
        keep_tail: int = 10,
        protected_head: int = 1,
        summary_prompt: str = None,
    ):
        self.client = client
        self.model_name = model_name
        self.token_threshold = token_threshold
        self.keep_tail = keep_tail
        self.protected_head = protected_head
        self.summary_prompt = summary_prompt or (
            "Summarize the conversation history between the User and Browser Agent. "
            "Focus on the PROGRESS made toward the goal, key UI elements interacted with, "
            "and any specific failures or hurdles encountered. Keep it concise. "
            "Output only the summary text.")

    async def apply(self, history: List[types.Content]) -> List[types.Content]:
        # Standard apply without metadata uses heuristic
        return await self.apply_with_metadata(history, {})

    async def apply_with_metadata(
            self, history: List[types.Content],
            metadata: Dict[str, Any]) -> List[types.Content]:
        # 1. Decision: Trigger based on metadata if available, else heuristic
        # Use 'last_input_tokens' to measure the current context window size,
        # NOT 'total_input_tokens' which is the lifetime cumulative sum.
        current_tokens = metadata.get("last_input_tokens", 0)

        trigger_by_token = False
        if current_tokens == 0:
            # Fallback to heuristic (approx 4 chars per token)
            chars = sum(len(str(c)) for c in history)
            if chars >= self.token_threshold * 4:
                trigger_by_token = True
        elif current_tokens >= self.token_threshold:
            trigger_by_token = True

        if not trigger_by_token:
            return history

        # 2. Slicing
        head_end = self.find_safe_head_end(history, self.protected_head)
        tail_start = self.find_safe_tail_start(history, self.keep_tail,
                                               head_end)

        head = history[:head_end]
        tail = history[tail_start:]
        middle = history[head_end:tail_start]

        if not middle:
            return history

        # 3. Execution
        logger.info(
            f"📝 [CONTEXT] Summarization triggered (by tokens): ~{current_tokens} tokens, {len(history)} total turns. Summarizing middle {len(middle)} turns."
        )

        history_text = self._format_history(middle)
        prompt = f"{self.summary_prompt}\n\nHistory To Summarize:\n{history_text}"

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(role="user", parts=[types.Part(text=prompt)])
                ],
            )

            logger.info("✅ [CONTEXT] Summarization complete.")

            last_head_role = head[-1].role if head else "user"
            first_tail_role = tail[0].role if tail else "model"

            injected_turns = []
            summary_part = types.Part(
                text=f"[History Summary: {response.text}]")
            ack_part = types.Part(text="Acknowledged.")

            if last_head_role == "user":
                if first_tail_role == "user":
                    # User -> [Model(Summary)] -> User
                    injected_turns.append(
                        types.Content(role="model", parts=[summary_part]))
                else:
                    # User -> [Model(Summary), User(Ack)] -> Model
                    injected_turns.append(
                        types.Content(role="model", parts=[summary_part]))
                    injected_turns.append(
                        types.Content(role="user", parts=[ack_part]))
            else:  # last_head_role == "model"
                if first_tail_role == "user":
                    # Model -> [User(Ack), Model(Summary)] -> User
                    injected_turns.append(
                        types.Content(role="user", parts=[ack_part]))
                    injected_turns.append(
                        types.Content(role="model", parts=[summary_part]))
                else:
                    # Model -> [User(Ack), Model(Summary), User(Ack)] -> Model
                    injected_turns.append(
                        types.Content(role="user", parts=[ack_part]))
                    injected_turns.append(
                        types.Content(role="model", parts=[summary_part]))
                    injected_turns.append(
                        types.Content(role="user", parts=[ack_part]))

            return head + injected_turns + tail

        except Exception as e:
            logger.warning(f"Failed to summarize history: {e}")
            # CRITICAL: If summarization fails, return the ORIGINAL unmodified history.
            # Returning head + tail here would result in silent data loss of the 'middle' segment.
            return history

    def _format_history(self, history: List[types.Content]) -> str:
        lines = []
        for c in history:
            role = c.role.upper()
            parts = []
            for p in c.parts:
                if p.text:
                    parts.append(p.text)
                if p.function_call:
                    parts.append(f"CALL: {p.function_call.name}")
                if p.function_response:
                    parts.append(f"RESULT: {p.function_response.response}")
            lines.append(f"{role}: {' '.join(parts)}")
        return "\n".join(lines)
