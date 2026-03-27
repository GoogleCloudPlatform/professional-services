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
import os
import datetime
import yaml
import logging
from typing import List, Dict, Any
from computer_use_eval.runner import run_single_resolution, parse_resolutions
import statistics
from computer_use_eval.config import settings
from computer_use_eval.utils import resolve_config_files, template_value

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def calculate_reward(
    success_rate: float,
    avg_steps: float,
    avg_tokens: float,
    step_variance: float,
    prompt_length: int,
) -> float:
    """
    Calculates the reward for an evaluation.
    Reward uses a linear penalty model subtracted from a massive success bonus.
    """
    # 1. Primary Signal: Success (0 to 1000 points)
    success_score = (success_rate**2) * 1000.0

    if success_score == 0:
        return 0.0

    # 2. Secondary Signal: Speed / Steps Penalty
    steps_penalty = avg_steps * 10.0

    # 3. Tertiary Signal: Stability (Variance)
    variance_penalty = step_variance * 20.0

    # 4. Quaternary Signal: Token/Length Efficiency
    tokens_penalty = avg_tokens / 1000.0

    # Calculate total
    reward = success_score - steps_penalty - variance_penalty - tokens_penalty

    return max(0.0, reward)


def aggregate_results(
    runs: List[Dict[str, Any]], prompt_length: int = 0
) -> Dict[str, Any]:
    """
    Aggregates multiple benchmark runs into a single result.
    Expects each run to have 'success' (bool), 'steps' (int), and 'tokens' (int).
    """
    if not runs:
        return {"success_rate": 0.0, "avg_steps": 0.0, "avg_tokens": 0.0, "reward": 0.0}

    total_runs = len(runs)
    success_scores = [r.get("success_score", 0.0) for r in runs]

    steps_list = [r.get("steps", 0) for r in runs]
    total_steps = sum(steps_list)
    step_variance = statistics.variance(steps_list) if len(steps_list) > 1 else 0.0

    # Calculate total tokens per run
    def get_run_tokens(r):
        meta = r.get("metadata", {})
        return (
            meta.get("total_input_tokens", 0)
            + meta.get("total_cached_tokens", 0)
            + meta.get("total_output_tokens", 0)
        )

    total_tokens = sum(get_run_tokens(r) for r in runs)

    success_rate = sum(success_scores) / total_runs
    avg_steps = total_steps / total_runs
    avg_tokens = total_tokens / total_runs

    reward = calculate_reward(
        success_rate, avg_steps, avg_tokens, step_variance, prompt_length
    )

    return {
        "success_rate": success_rate,
        "avg_steps": avg_steps,
        "avg_tokens": avg_tokens,
        "reward": reward,
    }


async def run_evaluation(
    benchmark_path: str, num_runs: int = 3, model_name: str = None
):
    """
    Runs the benchmark multiple times and returns the aggregated result.
    """
    # Load and resolve config
    with open(benchmark_path, "r") as f:
        config = yaml.safe_load(f)

    benchmark_dir = os.path.dirname(os.path.abspath(benchmark_path))
    config = resolve_config_files(config, benchmark_dir)
    config = template_value(config)

    # Resolve model
    agent_config = config.get("agent", {})
    final_model_name = model_name or agent_config.get("model") or settings.MODEL_NAME
    agent_config["model"] = final_model_name
    config["agent"] = agent_config

    resolutions = parse_resolutions(None)  # Use default 1920x1080
    width, height = resolutions[0]

    task_name = config.get("name", "unknown_task").replace(" ", "_").lower()
    run_id_base = "autoresearch_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    runs = []
    failures = []

    async def _run_and_eval(i):
        run_id = f"{run_id_base}_{i}"
        run_dir = os.path.join(settings.OUTPUT_DIR, task_name, run_id)
        os.makedirs(run_dir, exist_ok=True)

        logger.info(f"Starting run {i + 1}/{num_runs} for task: {task_name}")
        result = await run_single_resolution(
            width, height, config, run_id, run_dir, final_model_name
        )

        # Determine success based on judges
        judges = result.get("judges", {})
        det_score = judges.get("assertion", {}).get("score", 0.0)
        vis_score = judges.get("visual", {}).get("score", 0.0)
        trace_score = float(judges.get("trace", {}).get("score", 0.0) or 0.0)

        result["success_score"] = (det_score + vis_score + trace_score) / 3.0
        result["success"] = (
            (det_score == 1.0) and (vis_score >= 0.8) and (trace_score >= 0.8)
        )

        failure_info = None
        if not result["success"]:
            # Capture failure details
            failure_info = {
                "run": i + 1,
                "error": result.get("error", "Unknown error"),
                "assertion_reasoning": judges.get("assertion", {}).get("reasoning", ""),
                "visual_reasoning": judges.get("visual", {}).get("reasoning", ""),
                "trace_reasoning": judges.get("trace", {}).get("fail_why", ""),
                "steps": result.get("steps", 0),
                "last_action": result.get("history", [])[-1]
                if result.get("history")
                else "N/A",
            }
        return result, failure_info

    tasks = [_run_and_eval(i) for i in range(num_runs)]
    results = await asyncio.gather(*tasks)

    for result, failure_info in results:
        runs.append(result)
        if failure_info:
            failures.append(failure_info)

    system_prompt = config.get("agent", {}).get("system_prompt", "")
    task_goal = config.get("task", {}).get("goal", "")
    prompt_length = len(system_prompt) + len(task_goal)
    aggregated = aggregate_results(runs, prompt_length=prompt_length)

    # Save failures.log
    if failures:
        with open("autoresearch/failures.log", "w") as f:
            for fail in failures:
                f.write(f"--- FAILURE RUN {fail['run']} ---\n")
                f.write(f"Steps taken: {fail['steps']}\n")
                f.write(f"Assertion Reasoning: {fail['assertion_reasoning']}\n")
                f.write(f"Visual Reasoning: {fail['visual_reasoning']}\n")
                f.write(f"Trace Reasoning: {fail['trace_reasoning']}\n")
                f.write(f"Last Action: {fail['last_action']}\n\n")
    else:
        # Clear failures.log if all passed
        if os.path.exists("autoresearch/failures.log"):
            os.remove("autoresearch/failures.log")

    return aggregated


def log_to_tsv(aggregated: Dict[str, Any], benchmark_path: str, description: str):
    """
    Logs the result to results.tsv in Karpathy style.
    run_id	score	avg_steps	avg_tokens	status	description
    """
    tsv_path = "autoresearch/results.tsv"

    # Generate run_id
    run_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    header = "run_id\tscore\tavg_steps\tavg_tokens\tstatus\tdescription\n"
    if not os.path.exists(tsv_path):
        with open(tsv_path, "w") as f:
            f.write(header)

    status = "KEEP" if aggregated["reward"] > 0 else "DISCARD"
    if aggregated["success_rate"] == 0:
        status = "CRASH" if aggregated.get("error") else "DISCARD"

    line = f"{run_id}\t{aggregated['reward']:.6f}\t{aggregated['avg_steps']:.1f}\t{aggregated['avg_tokens']:.1f}\t{status}\t{description}\n"

    with open(tsv_path, "a") as f:
        f.write(line)


async def main():
    parser = argparse.ArgumentParser(
        description="Evaluate task prompt for autoresearch"
    )
    parser.add_argument("--benchmark", required=True, help="Path to the benchmark YAML")
    parser.add_argument(
        "--runs", type=int, default=3, help="Number of runs per evaluation"
    )
    parser.add_argument("--model", help="Override model name")
    parser.add_argument(
        "--description", default="no description", help="Description for results.tsv"
    )

    args = parser.parse_args()

    result = await run_evaluation(args.benchmark, args.runs, args.model)

    print("\n--- EVALUATION SUMMARY ---")
    print(f"Success Rate: {result['success_rate']:.1%}")
    print(f"Avg Steps:    {result['avg_steps']:.1f}")
    print(f"Avg Tokens:   {result['avg_tokens']:.1f}")
    print(f"Final Reward: {result['reward']:.6f}")

    log_to_tsv(result, args.benchmark, args.description)


if __name__ == "__main__":
    asyncio.run(main())
