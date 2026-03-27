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
import os
import glob
import shutil
import argparse
from evaluate_task_prompt import run_evaluation, log_to_tsv


async def evaluate_candidate(candidate_path, num_runs, model_name):
    print(f"Evaluating candidate: {os.path.basename(candidate_path)}",
          flush=True)
    try:
        result = await run_evaluation(candidate_path, num_runs, model_name)
        return candidate_path, result
    except Exception as e:
        print(f"Candidate {os.path.basename(candidate_path)} crashed: {e}",
              flush=True)
        return candidate_path, {
            "success_rate": 0.0,
            "avg_score": 0.0,
            "avg_steps": 0.0,
            "avg_tokens": 0.0,
            "reward": 0.0,
            "error": str(e),
        }


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--population-dir", required=True)
    parser.add_argument("--target-benchmark", required=True)
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=1)
    args = parser.parse_args()

    # Clear previous failures log
    if os.path.exists("autoresearch/failures.log"):
        os.remove("autoresearch/failures.log")

    candidates = glob.glob(os.path.join(args.population_dir, "*.yaml"))
    if not candidates:
        print("No candidates found in population directory.")
        return

    # Process in batches
    all_results = []
    for i in range(0, len(candidates), args.batch_size):
        batch = candidates[i:i + args.batch_size]
        print(f"\n--- Running batch of {len(batch)} candidates ---")
        tasks = [evaluate_candidate(c, args.runs, None) for c in batch]
        batch_results = await asyncio.gather(*tasks)
        all_results.extend(batch_results)

    # Determine winner
    best_candidate = None
    best_reward = -1.0
    best_result = None

    print("\n=== TOURNAMENT RESULTS ===")
    for path, res in all_results:
        candidate_name = os.path.basename(path)
        print(
            f"{candidate_name}: Reward = {res.get('reward', 0):.6f}, Success = {res.get('success_rate', 0):.1%}, Steps = {res.get('avg_steps', 0):.1f}"
        )
        # Log each candidate to tsv
        description = f"Population Candidate: {candidate_name}"
        try:
            log_to_tsv(res, path, description)
        except Exception as e:
            print(f"Failed to log to tsv: {e}")

        reward = res.get("reward", 0)
        if reward > best_reward:
            best_reward = reward
            best_candidate = path
            best_result = res
        elif reward == best_reward and best_reward > 0:
            if res.get("avg_steps",
                       float("inf")) < best_result.get("avg_steps",
                                                       float("inf")):
                best_candidate = path
                best_result = res

    if best_candidate and best_reward > 0:
        print(
            f"\n🏆 WINNER: {os.path.basename(best_candidate)} with Reward {best_reward:.6f}"
        )
        # Overwrite the target benchmark with the winner
        shutil.copy(best_candidate, args.target_benchmark)
        print(f"Copied winner to {args.target_benchmark}")
    else:
        print("\n❌ All candidates crashed or failed to get a positive reward.")


if __name__ == "__main__":
    asyncio.run(main())
