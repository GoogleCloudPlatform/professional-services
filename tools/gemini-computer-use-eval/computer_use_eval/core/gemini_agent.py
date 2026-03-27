# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import logging
import time
import asyncio
from typing import List, Callable, TYPE_CHECKING, Tuple, Dict, Any
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from google import genai
from google.genai import types

from computer_use_eval.core.base import (
    BaseAgent,
    AgentResult,
    Action,
    ActionExecutionResult,
)
from computer_use_eval.config import settings, ContextConfig

if TYPE_CHECKING:
    from computer_use_eval.browser.playwright_env import PlaywrightEnv
from computer_use_eval.tool_executor import ToolExecutor
from computer_use_eval.safety import SafetyPolicy, get_safety_policy
from computer_use_eval.core.context.base import ContextPipeline
from computer_use_eval.core.managers import (
    HistoryManager,
    TelemetryTracker,
    SafetyCoordinator,
)


# Custom Exception for Retry Logic
class TemporaryGeminiError(Exception):
    pass


class GeminiAgent(BaseAgent):
    """
    Agent that uses Vertex AI (Gemini 2.5) to control the browser.
    """

    def __init__(
        self,
        system_prompt: str = "",
        model_name: str = None,
        client: genai.Client = None,
        safety_policy: SafetyPolicy = None,
        max_history_turns: int = None,
        max_steps: int = None,
        context_pipeline: ContextPipeline = None,
        reflection_strategy: str = None,
        context_config=None,
        excluded_functions: List[str] = None,
        custom_tools: List[Callable] = None,
        hooks: dict = None,
    ):
        self.model_version = model_name or settings.MODEL_NAME
        self.system_prompt = system_prompt
        self.max_history_turns = max_history_turns or settings.MAX_HISTORY_TURNS
        self.max_steps = max_steps or settings.MAX_STEPS
        self.step_delay = (
            context_config.step_delay
            if context_config and hasattr(context_config, "step_delay")
            else 0.0
        )
        self.excluded_functions = excluded_functions or []
        self.custom_tools = custom_tools or []
        self.hooks = hooks or {}
        self.context_config = context_config

        self.reflection_strategy = reflection_strategy or "NUDGE"

        self.logger = logging.getLogger(__name__)

        self.safety_policy = safety_policy or get_safety_policy(
            settings.SAFETY_MODE, settings.HEADLESS_MODE
        )
        self.safety_coordinator = SafetyCoordinator(self.safety_policy)
        self.history_manager = HistoryManager(max_history_turns=self.max_history_turns)
        self.telemetry = TelemetryTracker()

        if client:
            self.client = client
        elif settings.API_KEY:
            self.logger.info("Initializing Gemini Client using AI Studio (API Key)")
            self.client = genai.Client(api_key=settings.API_KEY)
        else:
            self.logger.info(
                f"Initializing Gemini Client using Vertex AI (Project: {settings.PROJECT_ID})"
            )
            self.client = genai.Client(
                vertexai=True, project=settings.PROJECT_ID, location=settings.REGION
            )

        if context_pipeline:
            self.context_pipeline = context_pipeline
        else:
            # Fallback if no pipeline provided (e.g. in some tests)
            from computer_use_eval.core.context.factory import ContextPipelineFactory

            self.context_pipeline = ContextPipelineFactory.build(
                ContextConfig(), self.client, self.max_history_turns
            )

        self.context_cache_name = None

    @property
    def history(self) -> List[types.Content]:
        """Provides backwards compatibility for legacy history access."""
        return self.history_manager.get_full_history()

    @property
    def total_input_tokens(self) -> int:
        return self.telemetry.total_input_tokens

    @property
    def total_output_tokens(self) -> int:
        return self.telemetry.total_output_tokens

    @property
    def total_thinking_tokens(self) -> int:
        return self.telemetry.total_thinking_tokens

    def _log_history_skeleton(self, history: List[types.Content]):
        """Logs a simplified view of the history for debugging structure issues."""
        self.logger.debug("📜 [HISTORY SKELETON]")
        for i, turn in enumerate(history):
            parts_desc = []
            for p in turn.parts:
                if p.text:
                    parts_desc.append(f"Text({len(p.text)})")
                if getattr(p, "function_call", None):
                    fc_id = (
                        f"[{p.function_call.id}]"
                        if getattr(p.function_call, "id", None)
                        else ""
                    )
                    parts_desc.append(f"FC:{p.function_call.name}{fc_id}")
                if getattr(p, "function_response", None):
                    fr_id = (
                        f"[{p.function_response.id}]"
                        if getattr(p.function_response, "id", None)
                        else ""
                    )
                    parts_desc.append(f"FR:{p.function_response.name}{fr_id}")
                if getattr(p, "inline_data", None):
                    parts_desc.append(f"Img:{p.inline_data.mime_type}")
                if getattr(p, "thought", False):
                    parts_desc.append("Thought")
                if getattr(p, "thought_signature", None):
                    parts_desc.append(f"Sig:{len(p.thought_signature)}b")

            self.logger.debug(f"  {i:2}: {turn.role:5} | {' | '.join(parts_desc)}")

    def _get_or_create_cache(
        self, initial_contents: List[types.Content], all_tools: list
    ) -> str:
        """
        Creates or retrieves a context cache for the static parts of the prompt.
        We cache the system prompt, tools, and the very first turn (the Goal).
        """
        enable_caching = settings.ENABLE_CONTEXT_CACHING
        if (
            self.context_config
            and self.context_config.enable_context_caching is not None
        ):
            enable_caching = self.context_config.enable_context_caching

        if not enable_caching:
            return None

        if self.context_cache_name:
            return self.context_cache_name

        if not initial_contents:
            return None

        try:
            self.logger.info("📦 Creating Context Cache for System Prompt and Tools...")
            ttl_seconds = settings.CACHE_TTL_MINUTES * 60

            cache_config = types.CreateCachedContentConfig(
                system_instruction=self.system_prompt if self.system_prompt else None,
                tools=all_tools,
                ttl=f"{ttl_seconds}s",
                contents=[initial_contents[0]],  # Cache the initial goal turn
            )

            # Use synchronous create if possible, or assume client handles it
            cache = self.client.caches.create(
                model=self.model_version, config=cache_config
            )

            self.context_cache_name = (
                cache.name if isinstance(cache.name, str) else "mock_cache"
            )
            self.logger.info(f"✅ Context Cache created: {self.context_cache_name}")
            return self.context_cache_name
        except Exception as e:
            self.logger.warning(f"Failed to create context cache: {e}")
            return None

    def cleanup_cache(self):
        """Deletes the context cache if it exists."""
        if self.context_cache_name and self.client:
            try:
                self.logger.info(
                    f"🧹 Deleting Context Cache: {self.context_cache_name}"
                )
                self.client.caches.delete(name=self.context_cache_name)
                self.context_cache_name = None
            except Exception as e:
                self.logger.warning(
                    f"Failed to delete context cache {self.context_cache_name}: {e}"
                )

    @retry(
        stop=stop_after_attempt(settings.MODEL_API_RETRIES),
        wait=wait_exponential(multiplier=2, min=4, max=60),
        retry=retry_if_exception_type((TemporaryGeminiError, Exception)),
        before_sleep=before_sleep_log(logging.getLogger(__name__), logging.WARNING),
    )
    async def _predict(
        self, contents: List[types.Content]
    ) -> types.GenerateContentResponse:
        """
        Calls Gemini 2.5 with retry logic and a MANUAL tool configuration.
        """
        if not self.client:
            raise RuntimeError("Client not initialized")

        # --- Gemini 3.0 FIX: Signature Integrity & Role Alternation Safety ---
        # The API strictly forbids consecutive turns with the same role.
        # We perform a pass to inject required thought signatures AND merge accidental clashes
        # WITHOUT mutating the original history manager objects.
        safe_contents = []
        for turn in contents:
            # Create a shallow copy of the parts list so we can modify it
            parts_copy = list(turn.parts) if turn.parts else []

            if turn.role == "model":
                has_sig = any(getattr(p, "thought_signature", None) for p in parts_copy)
                has_fc = any(getattr(p, "function_call", None) for p in parts_copy)

                if has_fc and not has_sig:
                    # Inject dummy signature onto the FIRST function_call part
                    # Gemini 3.0 requires the signature to be on the call part for tool turns
                    for idx, p in enumerate(parts_copy):
                        if getattr(p, "function_call", None):
                            part_copy = p.model_copy()
                            part_copy.thought_signature = (
                                b"skip_thought_signature_validator"
                            )
                            parts_copy[idx] = part_copy
                            break

            new_turn = types.Content(role=turn.role, parts=parts_copy)
            if not safe_contents:
                safe_contents.append(new_turn)
                continue

            # Role Merge Logic: Only merge if they aren't tool-related turns
            # Merging tool turns breaks the 1:1 call/response mapping.
            is_tool_turn = any(
                getattr(p, "function_call", None)
                or getattr(p, "function_response", None)
                for p in new_turn.parts
            )
            prev_is_tool_turn = any(
                getattr(p, "function_call", None)
                or getattr(p, "function_response", None)
                for p in safe_contents[-1].parts
            )

            if (
                new_turn.role == safe_contents[-1].role
                and not is_tool_turn
                and not prev_is_tool_turn
            ):
                self.logger.warning(
                    f"⚠️ [CONTEXT] Role clash detected ({new_turn.role}). Merging turns."
                )
                safe_contents[-1].parts.extend(new_turn.parts)
            else:
                if new_turn.role == safe_contents[-1].role:
                    # If we MUST have different roles but can't merge (tool turns),
                    # we insert a dummy turn. This is rare but safer for the backend.
                    dummy_role = "user" if new_turn.role == "model" else "model"
                    dummy_text = (
                        "Acknowledged." if dummy_role == "user" else "I understand."
                    )
                    dummy_turn = types.Content(
                        role=dummy_role, parts=[types.Part(text=dummy_text)]
                    )
                    if dummy_role == "model":
                        dummy_turn.parts[
                            0
                        ].thought_signature = b"skip_thought_signature_validator"
                    safe_contents.append(dummy_turn)

                safe_contents.append(new_turn)

        contents = safe_contents  # --- DIAGNOSTIC LOGGING (Safe) ---
        self._log_history_skeleton(contents)

        try:
            # Per working examples, only the computer_use tool should be passed.
            # Custom tools are handled by our manual ToolExecutor.
            base_tools = [
                types.Tool(
                    computer_use=types.ComputerUse(
                        environment=types.Environment.ENVIRONMENT_BROWSER,
                        excluded_predefined_functions=self.excluded_functions,
                    )
                )
            ]

            # Combine ComputerUse tool with any user-provided custom Python tools
            all_tools = base_tools + self.custom_tools

            cache_name = self._get_or_create_cache(contents, all_tools)

            # Configure for MANUAL function calling
            config_kwargs = {
                "automatic_function_calling": {
                    "disable": True,
                    "maximum_remote_calls": 50,
                },
            }

            # Gemini 3.0 Flash Transition: Inject ThinkingConfig for supported models
            if "gemini-3" in self.model_version:
                thinking_lvl = "MEDIUM"
                if self.context_config and self.context_config.thinking_level:
                    thinking_lvl = self.context_config.thinking_level.value
                elif settings.THINKING_LEVEL:
                    thinking_lvl = settings.THINKING_LEVEL.value

                config_kwargs["thinking_config"] = types.ThinkingConfig(
                    include_thoughts=True, thinking_level=thinking_lvl
                )

            if cache_name:
                config_kwargs["cached_content"] = str(cache_name)
                # If cached, the first turn (Goal) is inside the cache.
                # We must send only the subsequent turns to avoid duplication.
                contents_to_send = contents[1:] if len(contents) > 1 else []
                # Fallback: if somehow we have no turns to send after stripping the cache,
                # we just send a dummy user turn (unlikely in normal flow).
                if not contents_to_send:
                    contents_to_send = [
                        types.Content(
                            role="user",
                            parts=[types.Part(text="Awaiting next instruction.")],
                        )
                    ]
            else:
                config_kwargs["tools"] = all_tools
                contents_to_send = contents

            config = types.GenerateContentConfig(**config_kwargs)
            if self.system_prompt and not cache_name:
                config.system_instruction = self.system_prompt

            response = await self.client.aio.models.generate_content(
                model=self.model_version, contents=contents_to_send, config=config
            )

            # Accumulate token usage via telemetry manager
            usage = self.telemetry.log_usage(response)

            # Check for thinking signature
            has_thoughts = False
            candidates = getattr(response, "candidates", None)
            if candidates and len(candidates) > 0 and candidates[0].content:
                for part in candidates[0].content.parts:
                    if getattr(part, "thought", False):
                        has_thoughts = True
                        break

            # Defensive parsing of usage metrics
            def get_int(val):
                try:
                    return int(val)
                except (TypeError, ValueError):
                    return 0

            u_in = get_int(usage.get("input"))
            u_out = get_int(usage.get("output"))
            u_think = get_int(usage.get("thinking"))

            if u_in > 0 or u_out > 0:
                think_status = (
                    f", Think={u_think}" if has_thoughts or u_think > 0 else ""
                )
                self.logger.info(
                    f"🧠 [PREDICTION] Model reasoning complete "
                    f"(Tokens: In={u_in}, Out={u_out}{think_status})"
                )
            else:
                self.logger.info(
                    "🧠 [PREDICTION] Model reasoning complete (Token usage unavailable)"
                )

            return response

        except Exception as e:
            self.logger.exception("Model prediction failed.")
            raise e

    def _extract_actions(self, response: types.GenerateContentResponse) -> list[Action]:
        """
        Parses the model response to extract tool calls.
        """
        actions = []
        candidates = getattr(response, "candidates", None)
        if not candidates or len(candidates) == 0:
            self.logger.warning("No candidates returned from model.")
            return actions

        candidate = candidates[0]

        finish_reason = getattr(candidate, "finish_reason", "UNKNOWN")
        if finish_reason == "MALFORMED_FUNCTION_CALL":
            self.logger.error(
                f"Model returned a malformed function call: {getattr(candidate, 'finish_message', 'No message')}"
            )
            return actions

        content = getattr(candidate, "content", None)
        if not content or not getattr(content, "parts", None):
            self.logger.warning(
                f"Model returned empty content. Finish Reason: {finish_reason}"
            )
            if finish_reason == "SAFETY":
                self.logger.error("Response blocked by Safety Filters.")
            return actions

        import time

        for idx, part in enumerate(content.parts):
            if getattr(part, "function_call", None):
                fc = part.function_call
                action_name = fc.name
                action_args = dict(fc.args) if getattr(fc, "args", None) else {}

                # Gemini 3.0 Parallel matching requires IDs.
                # If the model didn't provide one, we generate a deterministic one
                # and INJECT it back into the history object so the next turn matches.
                action_id = getattr(fc, "id", None)
                if not action_id:
                    action_id = f"inc_{int(time.time())}_{idx}"
                    fc.id = action_id
                    self.logger.debug(
                        f"Fixed missing ID for parallel call: {action_name} -> {action_id}"
                    )

                actions.append(Action(name=action_name, args=action_args, id=action_id))

        return actions

    def _build_result(
        self, success: bool, step: int, step_details: list, **metadata_overrides
    ) -> AgentResult:
        """Helper to construct AgentResult with consistent telemetry."""
        autonomy_score = 1.0
        if step > 0:
            autonomy_score = 1.0 - (self.safety_coordinator.intervention_count / step)

        metadata = {
            "total_input_tokens": self.telemetry.total_input_tokens,
            "total_output_tokens": self.telemetry.total_output_tokens,
            "total_thinking_tokens": self.telemetry.total_thinking_tokens,
            "total_cached_tokens": self.telemetry.total_cached_tokens,
            "safety_trigger_count": self.safety_coordinator.trigger_count,
            "intervention_count": self.safety_coordinator.intervention_count,
            "autonomy_score": max(0.0, autonomy_score),
            "step_details": step_details,
        }
        metadata.update(metadata_overrides)

        return AgentResult(
            success=success,
            steps=step,
            retries=0,
            history=self.history_manager.get_full_history(),
            thinking_tokens=self.telemetry.total_thinking_tokens,
            metadata=metadata,
        )

    async def _execute_batch(
        self,
        env: "PlaywrightEnv",
        executor: ToolExecutor,
        actions: List[Action],
        step: int,
        step_details: list,
    ) -> Tuple[List["ActionExecutionResult"], List[Dict[str, Any]]]:
        """
        Executes a batch of actions using the executor's bundling capabilities.
        Handles safety coordinator integration and per-action timing.
        """

        start_batch = time.perf_counter()

        # Delegating batch execution to the specialized ToolExecutor
        self.logger.info(f"⚡ BATCH START: Processing {len(actions)} actions.")
        results_with_safety, total_mw_time = await executor.execute_bundle(
            actions, self.safety_coordinator
        )

        batch_duration = time.perf_counter() - start_batch

        # Calculate Mix for High-Signal Logging
        bundled_count = sum(
            1 for res in results_with_safety if res.result_data.get("bundled")
        )
        seq_count = len(results_with_safety) - bundled_count

        self.logger.info(
            f"✅ BATCH COMPLETE: {len(results_with_safety)} actions in {batch_duration:.2f}s "
            f"(Bundled: {bundled_count}, Sequential: {seq_count})"
        )

        action_durations = []
        if results_with_safety:
            # We split the total batch duration equally across all executed actions
            # for telemetry purposes. In bundles, we don't have individual action
            # start/stop times.
            avg_duration = batch_duration / len(results_with_safety)
            for res in results_with_safety:
                action_durations.append(
                    {"name": res.action_name, "duration": avg_duration}
                )

        return results_with_safety, action_durations, total_mw_time

    async def run_task(
        self,
        goal: str,
        env: "PlaywrightEnv",
        golden_path: List[Action] = None,
        custom_actions: dict = None,
    ) -> AgentResult:
        """
        Main loop for the agent to execute a task.
        """
        self._start_time = time.perf_counter()

        thinking_lvl = (
            self.context_config.thinking_level.value
            if self.context_config and self.context_config.thinking_level
            else (
                settings.THINKING_LEVEL.value
                if hasattr(settings, "THINKING_LEVEL")
                else "N/A"
            )
        )
        ctx_dump = (
            "\n".join(
                f"      {k}: {v.value if hasattr(v, 'value') else v}"
                for k, v in self.context_config.__dict__.items()
                if v is not None
            )
            if self.context_config
            else "None"
        )
        self.logger.info(
            f"\n"
            f"🚀 [AGENT START]\n"
            f"   Model:    {self.model_version}\n"
            f"   Thinking: {thinking_lvl}\n"
            f"   Context Config:\n{ctx_dump}\n"
            f"   Task:     {goal}\n"
            f"   System Instructions: {self.system_prompt[:500]}..."
        )

        # Initialize Middleware
        from computer_use_eval.core.middleware import DialogMiddleware, SafetyMiddleware

        middleware = [DialogMiddleware(env), SafetyMiddleware()]

        # Determine if Stalemate Detection should run
        # Priority: YAML reflection_strategy > Global settings.ENABLE_STALEMATE_DETECTION
        from computer_use_eval.config import ReflectionStrategy

        # If the user explicitly asks for a strategy (NUDGE/INJECT), we assume they want detection enabled.
        if self.reflection_strategy == ReflectionStrategy.NONE:
            enable_stalemate = False
        elif self.reflection_strategy in (
            ReflectionStrategy.NUDGE,
            ReflectionStrategy.INJECT,
        ):
            enable_stalemate = True
        else:
            # Fallback to the global default if the strategy is somehow undefined or custom
            enable_stalemate = settings.ENABLE_STALEMATE_DETECTION

        if enable_stalemate:
            from computer_use_eval.core.middleware.stalemate_detection import (
                StalemateDetectionMiddleware,
            )

            strict_val = (
                getattr(self.context_config, "stalemate_strict_threshold", None)
                if self.context_config
                else None
            )
            loose_val = (
                getattr(self.context_config, "stalemate_loose_threshold", None)
                if self.context_config
                else None
            )
            window_val = (
                getattr(self.context_config, "stalemate_history_window", None)
                if self.context_config
                else None
            )

            middleware.append(
                StalemateDetectionMiddleware(
                    env,
                    reflection_strategy=self.reflection_strategy,
                    strict_threshold=strict_val,
                    loose_threshold=loose_val,
                    history_window=window_val,
                    goal=goal,
                    client=self.client,
                )
            )
            self.logger.info(
                f"Stalemate detection middleware enabled (Strategy: {self.reflection_strategy})."
            )

        executor = ToolExecutor(
            env,
            custom_actions=custom_actions,
            middleware=middleware,
            custom_tools_list=self.custom_tools,
            disable_fast_typing_bundles=getattr(
                self.context_config, "disable_fast_typing_bundles", False
            ),
        )

        step = 0
        max_steps = self.max_steps
        step_details = []

        try:
            while step < max_steps:
                step += 1
                self.logger.info(f"--- Step {step} ---")

                # Step Delay for Rate Limiting / Model "Breathing Room"
                if self.step_delay > 0 and step > 1:
                    delay_trigger_count = step - 1
                    self.logger.info(
                        f"⏳ Sleeping for {self.step_delay}s between steps... (Triggered {delay_trigger_count} times so far)"
                    )
                    await asyncio.sleep(self.step_delay)

                durations = {}

                # Signal start of turn to middleware
                start_mw = time.perf_counter()
                for mw in middleware:
                    await mw.start_turn()
                durations["middleware_start"] = time.perf_counter() - start_mw

                if not self.history_manager.get_full_history():
                    start_obs = time.perf_counter()
                    screenshot_bytes = await env.get_screenshot()

                    # Save screenshot to disk for debugging
                    import os

                    run_dir = os.environ.get("RUN_DIR")
                    if run_dir:
                        images_dir = os.path.join(
                            run_dir,
                            "images",
                            f"{env.viewport_size['width']}x{env.viewport_size['height']}",
                        )
                        os.makedirs(images_dir, exist_ok=True)
                        image_path = os.path.join(images_dir, "step_0_initial.png")
                        with open(image_path, "wb") as f:
                            f.write(screenshot_bytes)
                        self.logger.info(
                            f"📸 [OBSERVATION] Initial screenshot saved to: {image_path}"
                        )

                    self.logger.info(
                        f"📸 [OBSERVATION] Initial screenshot captured ({len(screenshot_bytes)} bytes). Sending to model..."
                    )
                    durations["observation"] = time.perf_counter() - start_obs
                    user_text = f"Goal: {goal}"
                    self.history_manager.add_content(
                        types.Content(
                            role="user",
                            parts=[
                                types.Part(text=user_text),
                                types.Part(
                                    inline_data=types.Blob(
                                        mime_type="image/png",
                                        data=screenshot_bytes,
                                    )
                                ),
                            ],
                        )
                    )

                # Process history through pipeline to create an optimized context for prediction
                start_ctx = time.perf_counter()
                metadata = self.telemetry.get_summary()
                context = await self.context_pipeline.process(
                    self.history_manager.get_full_history(), metadata=metadata
                )
                durations["context_processing"] = time.perf_counter() - start_ctx

                self.logger.debug(
                    f"History size: {len(self.history_manager.get_full_history())}, Context size: {len(context)}"
                )

                start_pred = time.perf_counter()
                response = None

                if golden_path:
                    durations["prediction"] = 0.0
                    if step <= len(golden_path):
                        action = golden_path[step - 1]
                        actions = [action]
                        self.logger.info(
                            f"Using Golden Path action {step}/{len(golden_path)}: {action.name}"
                        )

                        # Add synthetic model turn to history for consistency
                        synthetic_content = types.Content(
                            role="model",
                            parts=[
                                types.Part(
                                    function_call=types.FunctionCall(
                                        name=action.name, args=action.args
                                    )
                                )
                            ],
                        )
                        self.history_manager.add_content(synthetic_content)
                    else:
                        self.logger.info("Golden Path execution complete.")
                        return self._build_result(
                            success=True,
                            step=step,
                            step_details=step_details,
                            status="golden_path_complete",
                        )
                else:
                    response = await self._predict(context)
                    durations["prediction"] = time.perf_counter() - start_pred

                    if response.candidates:
                        content = response.candidates[0].content
                        self.history_manager.add_content(content)

                    # Log reasoning text if present
                    agent_reasoning = ""
                    if response.candidates and response.candidates[0].content.parts:
                        for p in response.candidates[0].content.parts:
                            if p.text:
                                agent_reasoning += p.text.strip() + "\n"

                        if agent_reasoning.strip():
                            self.logger.info(
                                f"\n"
                                f"┌─────────────────────── AGENT REASONING ───────────────────────┐\n"
                                f" {agent_reasoning.strip()}\n"
                                f"└───────────────────────────────────────────────────────────────┘"
                            )

                    if hasattr(env, "current_reasoning"):
                        env.current_reasoning = agent_reasoning.strip()
                    else:
                        setattr(env, "current_reasoning", agent_reasoning.strip())

                    actions = self._extract_actions(response)

                # =========================================================================
                # EXPLICIT TERMINATION CHECK
                # =========================================================================
                # Identify if the model has explicitly called the 'finish' tool.
                # If so, we separate it from the execution batch so that any parallel
                # observation/interaction tools can execute first, followed by termination.
                finish_action = None
                executable_actions = []
                for action in actions:
                    if action.name == "finish":
                        finish_action = action
                    else:
                        executable_actions.append(action)

                actions = executable_actions

                if not actions and not golden_path and not finish_action:
                    text_response = ""
                    if response.candidates and response.candidates[0].content.parts:
                        for p in response.candidates[0].content.parts:
                            if p.text:
                                text_response += p.text

                    self.logger.info(
                        f"Agent Finished: {text_response or 'No text response.'}"
                    )

                    return self._build_result(
                        success=True,
                        step=step,
                        step_details=step_details,
                        final_message=text_response,
                    )

                # Execute actions (if any exist besides finish)
                if actions:
                    start_exec = time.perf_counter()
                    (
                        name_result_safety_triples,
                        action_durations,
                        total_mw_time,
                    ) = await self._execute_batch(
                        env, executor, actions, step, step_details
                    )
                    durations["middleware_batch"] = total_mw_time
                    durations["execution"] = (
                        time.perf_counter() - start_exec
                    ) - total_mw_time

                    # Check for safety termination
                    if (
                        name_result_safety_triples
                        and name_result_safety_triples[-1].result_data.get("error")
                        == "TERMINATED_BY_SAFETY"
                    ):
                        return self._build_result(
                            success=False,
                            step=step,
                            step_details=step_details,
                            error=f"Action denied by safety: {name_result_safety_triples[-1].action_name}",
                        )

                # If finish was called, terminate the run AFTER executing the other actions
                if finish_action:
                    status = finish_action.args.get("status", "success")
                    result_data = finish_action.args.get("result_data", {})
                    self.logger.info(
                        f"🏁 Agent explicitly called finish() with status: {status}"
                    )

                    # Log it as a completed step
                    step_details.append(
                        {
                            "step": step,
                            "durations": durations,
                            "actions": [
                                {
                                    "name": "finish",
                                    "args": finish_action.args,
                                    "result": {"status": "ok"},
                                }
                            ],
                        }
                    )

                    return self._build_result(
                        success=(status == "success"),
                        step=step,
                        step_details=step_details,
                        final_message=f"Status: {status}, Data: {result_data}",
                    )

                # Gather extra state for "proprioception" once per turn
                active_el = await env.get_active_element_info()
                current_url = await env.get_page_url()

                # execution time is already set after _execute_batch, so we only fallback if it wasn't set.
                if "execution" not in durations and "start_exec" in locals():
                    durations["execution"] = time.perf_counter() - start_exec
                durations["action_durations"] = action_durations

                # Create feedback turn with screenshot embedded in FunctionResponse
                start_post_obs = time.perf_counter()
                executed_count = len(name_result_safety_triples)
                if executed_count > 1:
                    self.logger.debug(
                        f"Batch Execution: Shared post-action screenshot across {executed_count} results."
                    )
                post_action_bytes = await env.get_screenshot()

                # Save screenshot to disk for debugging
                if run_dir:
                    images_dir = os.path.join(
                        run_dir,
                        "images",
                        f"{env.viewport_size['width']}x{env.viewport_size['height']}",
                    )
                    os.makedirs(images_dir, exist_ok=True)
                    image_path = os.path.join(images_dir, f"step_{step}_post.png")
                    with open(image_path, "wb") as f:
                        f.write(post_action_bytes)
                    self.logger.info(
                        f"📸 [OBSERVATION] Post-action screenshot saved to: {image_path}"
                    )

                self.logger.info(
                    f"📸 [OBSERVATION] Post-action screenshot captured ({len(post_action_bytes)} bytes). Passing state back to model..."
                )
                durations["post_observation"] = time.perf_counter() - start_post_obs

                start_mw_end = time.perf_counter()
                for mw in middleware:
                    await mw.end_turn()
                durations["middleware_end"] = time.perf_counter() - start_mw_end

                # Log timing summary
                obs_time = durations.get("observation", 0)
                post_obs_time = durations.get("post_observation", 0)
                pred_time = durations.get("prediction", 0)
                exec_time = durations.get("execution", 0)
                ctx_time = durations.get("context_processing", 0)
                mw_time = (
                    durations.get("middleware_start", 0)
                    + durations.get("middleware_end", 0)
                    + durations.get("middleware_batch", 0)
                )
                total_time = (
                    obs_time
                    + post_obs_time
                    + pred_time
                    + exec_time
                    + ctx_time
                    + mw_time
                )

                # We need a cumulative duration. Start with a naive one if we don't have it tracked exactly,
                # or compute it roughly from start of run. We'll use self.telemetry which might track it.
                cumulative_time = 0
                if hasattr(self, "_start_time"):
                    cumulative_time = time.perf_counter() - self._start_time

                # Fetch tokens
                tot_in = self.telemetry.total_input_tokens
                tot_out = self.telemetry.total_output_tokens
                tot_cached = self.telemetry.total_cached_tokens

                self.logger.info(
                    f"\n"
                    f"⏱️  [TELEMETRY] Step {step} Duration: {total_time:.2f}s (Total: {cumulative_time:.2f}s)\n"
                    f"   Context Prep: {ctx_time:.2f}s\n"
                    f"   Middleware:   {mw_time:.2f}s\n"
                    f"   Pre-Observe:  {obs_time:.2f}s\n"
                    f"   Prediction:   {pred_time:.2f}s\n"
                    f"   Execution:    {exec_time:.2f}s\n"
                    f"   Post-Observe: {post_obs_time:.2f}s\n"
                    f"📊 [TOKENS] Total Input: {tot_in} | Total Cached: {tot_cached} | Total Output: {tot_out}"
                )

                # Record step details via telemetry tracker
                step_record = {
                    "step": step,
                    "durations": durations,
                    "actions": [
                        {
                            "name": res.action_name,
                            "args": actions[idx].args,
                            "result": res.result_data,
                        }
                        for idx, res in enumerate(name_result_safety_triples)
                    ],
                }
                self.telemetry.add_step_detail(step_record)
                step_details = self.telemetry.step_details

                # --- Gemini 3.0 FIX: History Linearization ---
                # Gemini 3 backend currently requires strictly 1:1 for computer_use.
                # Gemini 2.5 natively supports true parallel tool calls.

                history = self.history_manager.get_full_history()
                if history and history[-1].role == "model":
                    if (
                        "gemini-3" in self.model_version
                        and len(name_result_safety_triples) > 1
                    ):
                        self.logger.warning(
                            f"\n"
                            f"╭──────────────────────────────────────────────────────────────────────────╮\n"
                            f"│ 🔄 [HISTORY LINEARIZATION]                                               │\n"
                            f"│ Unrolling {len(name_result_safety_triples)} parallel tool calls into sequential turns to satisfy API. │\n"
                            f"╰──────────────────────────────────────────────────────────────────────────╯"
                        )

                        model_turn = history.pop()  # Remove the multi-call turn

                        # Distribute the multiple calls into separate Turn pairs
                        for idx, res in enumerate(name_result_safety_triples):
                            call_id = res.action_id
                            name = res.action_name
                            result = res.result_data
                            safety_acknowledged = res.safety_acknowledged

                            # 1. Create Model Turn
                            parts = []
                            # On the first turn, we can preserve the original reasoning text if it existed
                            if idx == 0:
                                for p in model_turn.parts:
                                    if p.text:
                                        parts.append(p)

                            # Add the single function call
                            # We use the Action object from our 'actions' list which corresponds to this result
                            target_action = actions[idx]
                            fc = types.FunctionCall(
                                name=target_action.name,
                                args=target_action.args,
                                id=target_action.id,
                            )
                            parts.append(types.Part(function_call=fc))

                            self.history_manager.add_content(
                                types.Content(role="model", parts=parts)
                            )

                            # 2. Create corresponding User Response Turn
                            response_data = {
                                "url": current_url,
                                "active_element": active_el,
                                **(result or {}),
                            }
                            if safety_acknowledged:
                                response_data["safety_acknowledgement"] = "true"

                            fr_kwargs = {"name": name, "response": response_data}
                            if call_id:
                                fr_kwargs["id"] = call_id

                            # Only attach screenshot to the final response turn in the sequence
                            if idx == len(name_result_safety_triples) - 1:
                                fr_kwargs["parts"] = [
                                    types.FunctionResponsePart(
                                        inline_data=types.FunctionResponseBlob(
                                            mime_type="image/png",
                                            data=post_action_bytes,
                                        )
                                    )
                                ]

                            fr = types.FunctionResponse(**fr_kwargs)
                            self.history_manager.add_content(
                                types.Content(
                                    role="user",
                                    parts=[types.Part(function_response=fr)],
                                )
                            )
                    else:
                        # True Parallel Function Calling (Gemini 2.5, or single action)
                        fr_parts = []
                        for idx, res in enumerate(name_result_safety_triples):
                            call_id = res.action_id
                            name = res.action_name
                            result = res.result_data
                            safety_acknowledged = res.safety_acknowledged

                            response_data = {
                                "url": current_url,
                                "active_element": active_el,
                                **(result or {}),
                            }
                            if safety_acknowledged:
                                response_data["safety_acknowledgement"] = "true"

                            fr_kwargs = {"name": name, "response": response_data}
                            if call_id:
                                fr_kwargs["id"] = call_id

                            # Attach screenshot to the final response part
                            if idx == len(name_result_safety_triples) - 1:
                                fr_kwargs["parts"] = [
                                    types.FunctionResponsePart(
                                        inline_data=types.FunctionResponseBlob(
                                            mime_type="image/png",
                                            data=post_action_bytes,
                                        )
                                    )
                                ]

                            fr = types.FunctionResponse(**fr_kwargs)
                            fr_parts.append(types.Part(function_response=fr))

                        self.history_manager.add_content(
                            types.Content(role="user", parts=fr_parts)
                        )
                else:
                    # Fallback for synthetic/golden path turns which might already be sequential
                    self.logger.warning(
                        "History Linearization skipped: Last turn was not a model turn."
                    )

                # --- Runtime Hooks ---
                if self.hooks and "after_step" in self.hooks:
                    hook_fn = self.hooks["after_step"]
                    import inspect

                    if inspect.iscoroutinefunction(hook_fn):
                        await hook_fn(step, self.history_manager.get_full_history())
                    else:
                        hook_fn(step, self.history_manager.get_full_history())

            return self._build_result(
                success=False,
                step=max_steps,
                step_details=self.telemetry.step_details,
                error="Max steps reached.",
            )

        except Exception as e:
            self.logger.exception("Agent execution failed due to an unexpected error.")

            return self._build_result(
                success=False,
                step=step,
                step_details=self.telemetry.step_details,
                error=str(e),
            )
        finally:
            self.cleanup_cache()
