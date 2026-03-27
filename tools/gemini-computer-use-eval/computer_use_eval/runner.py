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

import asyncio
import argparse
import logging
import json
import datetime
import os
import shutil
import re
from typing import TYPE_CHECKING, Optional

from computer_use_eval.config import settings

if TYPE_CHECKING:
    from computer_use_eval.browser.playwright_env import PlaywrightEnv
    from computer_use_eval.safety import SafetyPolicy
from computer_use_eval.evaluation.judge import AssertionJudge, LLMLogJudge, VideoJudge
from computer_use_eval.utils import (
    template_value,
    parse_resolutions,
    load_custom_function,
)
from computer_use_eval.core.session_factory import SessionFactory
from computer_use_eval.evaluation.reporting import BigQueryReporter
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


def _serialize_history(history):
    """Helper to serialize history for result.json."""
    serialized = []
    for turn in history:
        try:
            # Helper to recursively handle bytes in dictionaries
            def sanitize(obj):
                if isinstance(obj, bytes):
                    return "<bytes omitted>"
                if isinstance(obj, dict):
                    return {k: sanitize(v) for k, v in obj.items()}
                if isinstance(obj, list):
                    return [sanitize(i) for i in obj]
                return obj

            if hasattr(turn, "model_dump"):
                data = turn.model_dump(exclude_none=True)
                serialized.append(sanitize(data))
            else:
                serialized.append(str(turn))
        except Exception:
            serialized.append(str(turn))
    return serialized


async def _evaluate_run(env, result, config, agent_client) -> tuple:
    """Helper to run all evaluation judges and return their results."""
    # Assertion Judge
    judge = AssertionJudge()
    criteria = config.get("criteria", {})
    # Inject goal into criteria for context-aware judging
    criteria["task_goal"] = config.get("task", {}).get("goal",
                                                       "Start operation.")

    judge_result = await judge.evaluate(env, criteria)

    score = judge_result.get("score", 0.0)
    reasoning = judge_result.get("reasoning", "")

    # LLM Judge (Analysis)
    llm_analysis = {}
    video_path = None

    try:
        llm_judge = LLMLogJudge(agent_client)
        llm_analysis = await llm_judge.evaluate(env,
                                                criteria,
                                                history=result.history,
                                                metadata=result.metadata)
    except Exception as e:
        logger.exception("LLM Judge evaluation failed.")
        llm_analysis = {"error": str(e)}

    # Video Judge (Visual Analysis)
    video_result = {"score": 0.0, "reasoning": "N/A"}
    try:
        # Collect ALL video paths from ALL tabs
        video_paths = await env.get_all_video_paths()

        # STOP environment to flush video to disk
        await env.stop()

        if video_paths:
            v_judge = VideoJudge(agent_client)
            v_out = await v_judge.evaluate(None,
                                           criteria,
                                           video_paths=video_paths)
            video_result = {
                "score": v_out.get("score", 0.0),
                "reasoning": v_out.get("reasoning", "No reasoning"),
                "feedback": v_out.get("ux", ""),
            }
            video_path = video_paths[0]
        else:
            video_path = None
            logger.warning("No video paths found for this run.")
    except Exception as e:
        logger.warning("Video Judge skipped or failed.", exc_info=True)
        video_result = {"score": 0.0, "reasoning": f"Error: {str(e)}"}

    trace_result = (llm_analysis if isinstance(llm_analysis, dict) else {
        "error": str(llm_analysis)
    })

    det_result = {"score": score, "reasoning": reasoning, "details": criteria}

    return det_result, trace_result, video_result, video_path


async def run_single_resolution(
    width: int,
    height: int,
    config: dict,
    run_id: str,
    run_dir: str,
    model_name: Optional[str] = None,
    safety_policy: Optional["SafetyPolicy"] = None,
) -> dict:
    """
    Executes a benchmark run for a specific screen resolution.

    Args:
        width: Screen width
        height: Screen height
        config: The benchmark configuration dict
        run_id: Unique ID for this evaluation session
        run_dir: Directory to store artifacts (videos)
        model_name: Optional override for the model name
        safety_policy: Optional SafetyPolicy instance

    Returns:
        dict: Result object containing success status, scores, and analysis.
    """
    res_key = f"{width}x{height}"
    logger.info(f"Starting run for resolution: {res_key}")

    agent_config = config.get("agent", {})
    task_config = config.get("task", {})
    custom_actions = agent_config.get("custom_actions", None)

    # --- Runtime Hooks (before_run) ---
    hooks_config = config.get("hooks", {})
    loaded_hooks = {}

    for hook_name, hook_str in hooks_config.items():
        if isinstance(hook_str, str):
            try:
                loaded_hooks[hook_name] = load_custom_function(hook_str)
            except Exception:
                logger.exception(
                    f"Failed to load hook '{hook_name}' ({hook_str}).")

    if "before_run" in loaded_hooks:
        import inspect

        hook_fn = loaded_hooks["before_run"]
        if inspect.iscoroutinefunction(hook_fn):
            await hook_fn(config)
        else:
            hook_fn(config)

    env: Optional["PlaywrightEnv"] = None
    try:
        # Construct video path
        video_output_path = os.path.join(run_dir, "videos", res_key) + "/"

        # 1. Use SessionFactory to wire everything
        env, agent, cm = SessionFactory.create_session(
            (width, height),
            config,
            run_id,
            video_output_path,
            model_name=model_name,
            safety_policy=safety_policy,
        )

        from contextlib import AsyncExitStack

        async with AsyncExitStack() as stack:
            # Enter the session manager (Sandbox) and the environment (Browser)
            await stack.enter_async_context(cm)
            await stack.enter_async_context(env)

            await env.start()

            # Pre-navigation if defined
            start_url = task_config.get("start_url")
            if start_url:
                logger.info(f"Navigating to start URL: {start_url}")
                await env.page.goto(start_url,
                                    wait_until="networkidle",
                                    timeout=60000)
                await env.page.wait_for_timeout(500)

            # Determine User Message (Goal)
            user_message = task_config.get("goal", "Start operation.")

            # Run Agent
            import time

            agent_start_time = time.time()
            result = await agent.run_task(user_message,
                                          env,
                                          custom_actions=custom_actions)
            agent_latency = time.time() - agent_start_time

            # Clean up noise and add precise timing
            if "step_details" in result.metadata:
                del result.metadata["step_details"]
            result.metadata["agent_latency_seconds"] = round(agent_latency, 2)

            det_result, trace_result, video_result, video_path = await _evaluate_run(
                env, result, config, agent.client)
            # The env might have been stopped during evaluate_run, so we ensure no double stop
            env = None

            result_dict = {
                "success": result.success,
                "judges": {
                    "assertion": det_result,
                    "visual": video_result,
                    "trace": trace_result,
                },
                "steps": result.steps,
                "retries": result.retries,
                "history": _serialize_history(result.history),
                "video_path": video_path,
                "metadata": result.metadata,
            }

            if "after_run" in loaded_hooks:
                hook_fn = loaded_hooks["after_run"]
                if inspect.iscoroutinefunction(hook_fn):
                    await hook_fn(result_dict)
                else:
                    hook_fn(result_dict)

            return result_dict

    except Exception as e:
        logger.exception(f"Error running resolution {res_key}.")
        return {"success": False, "error": str(e)}


def _mask_secrets(data: dict) -> dict:
    masked = {}
    for k, v in data.items():
        if isinstance(v, dict):
            masked[k] = _mask_secrets(v)
        elif isinstance(v, list):
            masked[k] = [
                _mask_secrets(i) if isinstance(i, dict) else i for i in v
            ]
        elif isinstance(v, str) and any(
                secret_word in k.lower() for secret_word in
            ["password", "token", "secret", "key", "credential"]):
            masked[k] = "********"
        else:
            masked[k] = v
    return masked


def _build_final_report(
    run_id: str,
    batch_id: str,
    benchmark_path: str,
    task_name: str,
    config: dict,
    matrix_results: dict,
    aggregated_success: int,
    total_scores: dict,
    total_input_tokens: int,
    total_cached_tokens: int,
    total_output_tokens: int,
    total_safety_triggers: int,
    total_interventions: int,
    run_dir: str,
    model_name: Optional[str],
):
    """Aggregates telemetry, prints the summary, saves artifacts, and reports to BigQuery."""
    num_resolutions = len(matrix_results)
    adaptability_score = ((aggregated_success /
                           num_resolutions) if num_resolutions > 0 else 0.0)

    aggregates = {
        "assertion": (total_scores["assertion"] /
                      num_resolutions) if num_resolutions > 0 else 0.0,
        "visual": (total_scores["visual"] /
                   num_resolutions) if num_resolutions > 0 else 0.0,
    }

    global_success = aggregated_success == num_resolutions

    # Final Autonomy Score
    total_steps = sum(res.get("steps", 0) for res in matrix_results.values())
    global_autonomy_score = 1.0
    if total_steps > 0:
        global_autonomy_score = 1.0 - (total_interventions / total_steps)

    # Extract histories to separate them from the main result summary
    full_histories = {}
    total_agent_latency = 0.0
    for res_key, res_data in matrix_results.items():
        if "history" in res_data:
            full_histories[res_key] = res_data.pop("history")
        total_agent_latency += res_data.get("metadata",
                                            {}).get("agent_latency_seconds",
                                                    0.0)

    # Output Data Construction (Summary)
    output = {
        "run_id":
            run_id,
        "batch_id":
            batch_id,
        "timestamp":
            datetime.datetime.now().isoformat(),
        "benchmark":
            benchmark_path,
        "name":
            task_name,
        "config_snapshot":
            _mask_secrets(config) if isinstance(config, dict) else config,
        "global_success":
            global_success,
        "adaptability_score":
            adaptability_score,
        "aggregates":
            aggregates,
        "resolutions":
            matrix_results,
        "total_input_tokens":
            total_input_tokens,
        "total_cached_tokens":
            total_cached_tokens,
        "total_output_tokens":
            total_output_tokens,
        "safety_trigger_count":
            total_safety_triggers,
        "intervention_count":
            total_interventions,
        "autonomy_score":
            max(0.0, global_autonomy_score),
        "agent_latency_seconds":
            round(total_agent_latency, 2),
    }

    print(json.dumps(output, indent=2))

    # Save summary artifact
    result_path = os.path.join(run_dir, "result.json")
    with open(result_path, "w") as f:
        json.dump(output, f, indent=2)
    logger.info(f"Results summary saved to {result_path}")

    # Save detailed history artifact
    history_path = os.path.join(run_dir, "history.json")
    with open(history_path, "w") as f:
        json.dump(full_histories, f, indent=2)
    logger.info(f"Detailed history saved to {history_path}")

    # --- Batch Handling ---
    if batch_id:
        batch_dir = os.path.join(settings.OUTPUT_DIR, "batches", batch_id)
        os.makedirs(batch_dir, exist_ok=True)

        # Copy result.json to batch folder with task name
        batch_file_path = os.path.join(batch_dir, f"{task_name}.json")
        shutil.copy(result_path, batch_file_path)
        logger.info(f"Result copied to batch folder: {batch_file_path}")

    # Export to BigQuery
    if model_name:
        settings.MODEL_NAME = model_name

    reporter = BigQueryReporter()
    reporter.report(output)


async def main():
    load_dotenv()
    from computer_use_eval.logger import setup_logging

    setup_logging()
    parser = argparse.ArgumentParser(description="Computer Use Eval Runner")

    # Add subcommands
    subparsers = parser.add_subparsers(dest="command",
                                       help="Command to execute")

    # Run command
    run_parser = subparsers.add_parser("run", help="Run a benchmark")
    run_parser.add_argument("--benchmark",
                            help="Path to Benchmark YAML",
                            required=True)
    run_parser.add_argument(
        "-m",
        "--model",
        help="Override the model name (e.g., gemini-3.0-flash)")
    run_parser.add_argument(
        "--resolutions",
        help="Comma-separated list of resolutions (e.g., 1920x1080,1280x720)",
        default=None,
    )
    run_parser.add_argument(
        "--safety-mode",
        help="Safety Confirmation Mode",
        choices=["interactive", "auto-approve", "auto-deny", "auto"],
        default=None,
    )
    run_parser.add_argument(
        "--batch-id",
        help="Logical ID for grouping runs (alphanumeric, -, _)",
        default=None,
    )
    run_parser.add_argument(
        "--max-steps",
        type=int,
        help="Maximum steps for the agent (overrides config)",
        default=None,
    )
    run_parser.add_argument(
        "--script",
        help=
        "Optional Python script to load dynamic configuration (format: path/to/script.py:load_config)",
        default=None,
    )

    # Create command
    create_parser = subparsers.add_parser(
        "create", help="Create a new benchmark template")
    create_parser.add_argument("name",
                               help="Human-readable name of the benchmark")
    create_parser.add_argument(
        "--template",
        choices=["basic", "standard"],
        default="standard",
        help=
        "Template to use (basic=single file, standard=enterprise directory structure)",
    )

    # BACKWARD COMPATIBILITY HACK:
    # If the user didn't specify a command (e.g. they just used --benchmark),
    # we inject 'run' as the default command so legacy scripts don't break.
    import sys

    argv = sys.argv[1:]
    if argv and argv[0] not in ["run", "create", "-h", "--help"]:
        argv = ["run"] + argv

    args = parser.parse_args(argv)

    if args.command == "create":
        from computer_use_eval.cli.scaffold import create_benchmark

        create_benchmark(args.name, template=args.template)
        return

    # --- Run Logic ---
    # Validate Batch ID
    if args.batch_id and not re.match(r"^[a-zA-Z0-9_-]+$", args.batch_id):
        raise ValueError(
            "Batch ID must only contain alphanumeric characters, hyphens, and underscores."
        )

    resolution_list = parse_resolutions(args.resolutions)
    logger.info(f"Running benchmark with resolutions: {resolution_list}")

    from computer_use_eval.safety import (
        get_safety_policy,)

    # Initialize Safety Policy
    safety_policy = get_safety_policy(args.safety_mode or settings.SAFETY_MODE,
                                      settings.HEADLESS_MODE)
    logger.info(
        f"Using Safety Policy Mode: {args.safety_mode or settings.SAFETY_MODE} (Instance: {type(safety_policy).__name__})"
    )

    # Load Benchmark Config
    logger.info(f"--- SCRIPT STARTED: {args.benchmark} ---")
    with open(args.benchmark, "r") as f:
        import yaml

        config = yaml.safe_load(f)

    # Resolve external configuration files (e.g. system_prompt_file)
    # This must happen before templating or any other processing
    from computer_use_eval.utils import resolve_config_files

    benchmark_dir = os.path.dirname(os.path.abspath(args.benchmark))
    logger.info(
        f"Resolving external configuration files relative to: {benchmark_dir}")
    config = resolve_config_files(config, benchmark_dir)

    # Handle Config Loader Script
    config_script = args.script or config.get("script")
    if config_script:
        logger.info(f"Loading dynamic config from script: {config_script}")
        try:
            loader_fn = load_custom_function(config_script)
            dynamic_config = loader_fn(config)
            if dynamic_config and isinstance(dynamic_config, dict):
                for k, v in dynamic_config.items():
                    if isinstance(v, dict) and isinstance(config.get(k), dict):
                        config[k].update(v)
                    else:
                        config[k] = v
                logger.info("Successfully applied dynamic configuration.")
        except Exception:
            logger.exception(
                f"Failed to load or execute config script '{config_script}'.")
            raise

    # Consolidate Model Name Resolution (Single Source of Truth)
    # Priority: CLI Override > YAML Config > Global Settings (.env)
    agent_config = config.get("agent", {})
    final_model_name = args.model or agent_config.get(
        "model") or settings.MODEL_NAME
    agent_config["model"] = final_model_name
    config["agent"] = agent_config

    logger.info(f"Target Model Resolved: {final_model_name}")

    # Generate a unique ID for this run to use in templates (e.g. for unique item names)
    # Format: timestamp_shortrandom (e.g. 0112_a1b2) to keep it typing-friendly but unique
    import uuid

    unique_id = datetime.datetime.now().strftime(
        "%m%d") + "_" + uuid.uuid4().hex[:4]
    os.environ["UNIQUE_ID"] = unique_id

    # Apply templating to the entire config
    config = template_value(config)

    # Create a clean task name for directory storage (alphanumeric and underscores only)
    raw_name = config.get("name", "unknown_task")
    task_name = re.sub(r"[^a-zA-Z0-9]+", "_", raw_name).strip("_").lower()

    logger.info(f"Initializing Runner for benchmark: {task_name}")

    # --- Directory Setup ---
    run_id = "run_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    from computer_use_eval.logger import set_run_id

    set_run_id(run_id)

    # Task-Centric Storage: artifacts/<task_name>/<run_id>/
    run_dir = os.path.join(settings.OUTPUT_DIR, task_name, run_id)
    os.makedirs(run_dir, exist_ok=True)
    os.environ["RUN_DIR"] = run_dir

    from computer_use_eval.logger import setup_logging

    setup_logging()

    logger.info(f"Run Directory created at: {run_dir}")

    matrix_results = {}
    aggregated_success = 0
    total_scores = {"assertion": 0.0, "visual": 0.0}

    # Telemetry Aggregates
    total_input_tokens = 0
    total_cached_tokens = 0
    total_output_tokens = 0
    total_safety_triggers = 0
    total_interventions = 0

    # Main Loop
    for width, height in resolution_list:
        res_key = f"{width}x{height}"
        result_data = await run_single_resolution(width, height, config, run_id,
                                                  run_dir, final_model_name,
                                                  safety_policy)
        matrix_results[res_key] = result_data

        judges = result_data.get("judges", {})
        det_score = judges.get("assertion", {}).get("score", 0.0)
        vis_score = judges.get("visual", {}).get("score", 0.0)
        trace_score = float(judges.get("trace", {}).get("score", 0.0) or 0.0)

        run_success = (det_score == 1.0) and (vis_score >= 0.8) and (trace_score
                                                                     >= 0.8)
        result_data["success"] = run_success

        if run_success:
            aggregated_success += 1

        total_scores["assertion"] += det_score
        total_scores["visual"] += judges.get("visual", {}).get("score", 0.0)

        # Accumulate telemetry from metadata
        metadata = result_data.get("metadata", {})
        total_input_tokens += metadata.get("total_input_tokens", 0)
        total_cached_tokens += metadata.get("total_cached_tokens", 0)
        total_output_tokens += metadata.get("total_output_tokens", 0)
        total_safety_triggers += metadata.get("safety_trigger_count", 0)
        total_interventions += metadata.get("intervention_count", 0)

    # Output Data Construction and Reporting
    _build_final_report(
        run_id=run_id,
        batch_id=args.batch_id,
        benchmark_path=args.benchmark,
        task_name=task_name,
        config=config,
        matrix_results=matrix_results,
        aggregated_success=aggregated_success,
        total_scores=total_scores,
        total_input_tokens=total_input_tokens,
        total_cached_tokens=total_cached_tokens,
        total_output_tokens=total_output_tokens,
        total_safety_triggers=total_safety_triggers,
        total_interventions=total_interventions,
        run_dir=run_dir,
        model_name=final_model_name,
    )


if __name__ == "__main__":
    asyncio.run(main())


def cli_main():
    asyncio.run(main())
