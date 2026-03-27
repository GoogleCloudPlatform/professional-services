# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import logging
import os
import time
from typing import Tuple, Optional, Dict, Any
from contextlib import AbstractContextManager, nullcontext

from computer_use_eval.browser.playwright_env import PlaywrightEnv
from computer_use_eval.browser.perception import PerceptionService
from computer_use_eval.core.gemini_agent import GeminiAgent
from computer_use_eval.config import settings, ContextConfig
from computer_use_eval.core.context.factory import ContextPipelineFactory
from computer_use_eval.utils import load_custom_function
from computer_use_eval.browser.sandbox_manager import SandboxManager
from google import genai

logger = logging.getLogger(__name__)


class SessionFactory:
    """
    Factory for wiring together all components of an agent session:
    Environment, Perception, and the Agent itself.
    """

    @staticmethod
    def create_session(
        resolution: Tuple[int, int],
        config: Dict[str, Any],
        run_id: str,
        video_output_path: str,
        model_name: Optional[str] = None,
        safety_policy: Any = None,
    ) -> Tuple[PlaywrightEnv, GeminiAgent, AbstractContextManager]:
        """
        Creates and wires all components for a session.
        Returns (env, agent, context_manager).
        """
        agent_config = config.get("agent", {})
        env_config = config.get("environment", {})
        hooks_config = config.get("hooks", {})

        # Parse ContextConfig early to configure Perception
        context_dict = agent_config.get("context", {})

        # FIX: step_delay and disable_fast_typing_bundles are sometimes placed under agent: directly
        if "step_delay" in agent_config and "step_delay" not in context_dict:
            context_dict["step_delay"] = agent_config["step_delay"]
        if (
            "disable_fast_typing_bundles" in agent_config
            and "disable_fast_typing_bundles" not in context_dict
        ):
            context_dict["disable_fast_typing_bundles"] = agent_config[
                "disable_fast_typing_bundles"
            ]

        try:
            context_config = ContextConfig(**context_dict)
        except Exception:
            logger.warning(
                "Invalid context config, falling back to defaults.", exc_info=True
            )
            context_config = ContextConfig()

        # Determine Image Quality Override
        img_qual = getattr(context_config, "image_quality", None)
        if not img_qual and context_config.preset.upper() == "AGGRESSIVE":
            img_qual = "medium"

        # 1. Create Perception Service
        enable_perception = (
            os.environ.get("ENABLE_PERCEPTION_ENGINE", "false").lower() == "true"
        )
        perception_service = PerceptionService(
            enable_screen_buffer=enable_perception, image_quality=img_qual
        )

        # 2. Create Environment
        width, height = resolution
        headless = env_config.get("headless", settings.HEADLESS_MODE)
        slow_mo = env_config.get("slow_mo", 0)
        enable_video = env_config.get("enable_video", True)
        enable_tracing = env_config.get("enable_tracing", settings.ENABLE_TRACING)
        final_video_path = video_output_path if enable_video else None

        env: PlaywrightEnv
        cm: AbstractContextManager

        if settings.USE_SANDBOX:
            sandbox_project = settings.SANDBOX_PROJECT_ID or settings.PROJECT_ID
            sandbox_location = settings.SANDBOX_LOCATION or settings.REGION
            if not sandbox_project:
                raise ValueError(
                    "GCP_SANDBOX_PROJECT_ID or GCP_PROJECT_ID is required for sandbox mode."
                )
            manager = SandboxManager(
                project_id=sandbox_project,
                location=sandbox_location,
            )
            session_id = f"eval-{int(time.time())}"
            ws_url, headers = manager.setup_session(session_id)
            env = PlaywrightEnv(
                headless=headless,
                slow_mo=slow_mo,
                resolution=(width, height),
                cdp_url=ws_url,
                cdp_headers=headers,
                video_dir=final_video_path,
                enable_tracing=enable_tracing,
                block_heavy_resources=settings.BLOCK_HEAVY_RESOURCES,
                enable_mutation_observer=settings.ENABLE_MUTATION_OBSERVER,
                perception_service=perception_service,
            )
            cm = manager
        else:
            env = PlaywrightEnv(
                headless=headless,
                slow_mo=slow_mo,
                resolution=(width, height),
                video_dir=final_video_path,
                enable_tracing=enable_tracing,
                block_heavy_resources=settings.BLOCK_HEAVY_RESOURCES,
                enable_mutation_observer=settings.ENABLE_MUTATION_OBSERVER,
                perception_service=perception_service,
            )
            cm = nullcontext()

        # 3. Load Agent Components

        # Load tools
        custom_tools_str = agent_config.get("custom_tools", [])
        custom_tools_list = []
        for tool_str in custom_tools_str:
            custom_tools_list.append(load_custom_function(tool_str))

        # Load hooks
        loaded_hooks = {}
        for hook_name, hook_str in hooks_config.items():
            if isinstance(hook_str, str):
                try:
                    loaded_hooks[hook_name] = load_custom_function(hook_str)
                except Exception:
                    logger.exception(f"Failed to load hook '{hook_name}'.")

        # Initialize Client based on Auth method
        override_vertex = agent_config.get("use_vertexai", False)
        override_project = agent_config.get("project_id", settings.PROJECT_ID)
        override_location = agent_config.get("location", settings.REGION)

        if override_vertex or (not settings.API_KEY):
            logger.info("--- AUTH DEBUG ---")
            logger.info("   Method: Vertex AI")
            logger.info(f"   Project: {override_project}")
            logger.info(f"   Location: {override_location}")
            client = genai.Client(
                vertexai=True, project=override_project, location=override_location
            )
        else:
            logger.info("Initializing Gemini Client using AI Studio (API Key)")
            client = genai.Client(api_key=settings.API_KEY)

        max_history_turns = (
            agent_config.get("max_history_turns") or settings.MAX_HISTORY_TURNS
        )
        context_pipeline = ContextPipelineFactory.build(
            context_config, client, max_history_turns
        )

        # Determine Effective System Prompt
        custom_prompt = agent_config.get("system_prompt", None)
        from computer_use_eval.prompts import DEFAULT_SYSTEM_PROMPT

        if custom_prompt:
            full_system_prompt = (
                custom_prompt.replace("{{DEFAULT}}", DEFAULT_SYSTEM_PROMPT)
                if "{{DEFAULT}}" in custom_prompt
                else custom_prompt
            )
        else:
            full_system_prompt = DEFAULT_SYSTEM_PROMPT

        # 4. Create Agent
        agent = GeminiAgent(
            system_prompt=full_system_prompt,
            model_name=model_name,
            client=client,
            safety_policy=safety_policy,
            max_history_turns=max_history_turns,
            max_steps=agent_config.get("max_steps"),
            context_pipeline=context_pipeline,
            reflection_strategy=context_config.reflection_strategy
            if hasattr(context_config, "reflection_strategy")
            else "NUDGE",
            context_config=context_config,
            excluded_functions=agent_config.get("excluded_functions"),
            custom_tools=custom_tools_list,
            hooks=loaded_hooks,
        )

        return env, agent, cm
