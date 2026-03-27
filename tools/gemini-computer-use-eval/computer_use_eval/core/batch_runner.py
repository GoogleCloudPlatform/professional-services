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
import glob
import os
import datetime
from typing import List
from computer_use_eval.runner import main as run_benchmark_main
from unittest.mock import patch

logger = logging.getLogger(__name__)


async def run_batch(patterns: List[str],
                    model: str = None,
                    batch_id: str = None):
    """
    Finds all benchmark files matching the patterns and runs them sequentially.
    """
    # Auto-generate batch_id if not provided
    if not batch_id:
        batch_id = "batch_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        logger.info(f"No batch-id provided. Auto-generating: {batch_id}")

    from computer_use_eval.logger import set_batch_id

    set_batch_id(batch_id)

    benchmark_files = []
    for pattern in patterns:
        # Resolve path relative to CWD
        full_pattern = os.path.abspath(pattern)
        matches = glob.glob(full_pattern, recursive=True)
        benchmark_files.extend(matches)

    # Remove duplicates
    benchmark_files = sorted(list(set(benchmark_files)))

    if not benchmark_files:
        logger.error(f"No benchmark files found matching patterns: {patterns}")
        return

    logger.info(
        f"Starting batch '{batch_id}' with {len(benchmark_files)} benchmarks.")

    results = []

    for benchmark_path in benchmark_files:
        logger.info(
            f"=== Starting Benchmark: {os.path.basename(benchmark_path)} ===")

        cli_args = ["--benchmark", benchmark_path, "--batch-id", batch_id]
        if model:
            cli_args.extend(["--model", model])

        try:
            # We patch sys.argv so argparse in runner.py reads our args
            with patch("sys.argv", ["runner.py"] + cli_args):
                await run_benchmark_main()

            results.append({"path": benchmark_path, "status": "completed"})

        except Exception as e:
            logger.error(f"Failed to run {benchmark_path}: {e}")
            results.append({
                "path": benchmark_path,
                "status": "failed",
                "error": str(e)
            })

    # Summary
    print(f"\n=== Batch Execution Summary: {batch_id} ===")
    for res in results:
        status_icon = "✅" if res["status"] == "completed" else "❌"
        print(f"{status_icon} {os.path.basename(res['path'])}")


def main():
    from computer_use_eval.logger import setup_logging

    setup_logging()
    parser = argparse.ArgumentParser(description="Batch Benchmark Runner")
    parser.add_argument(
        "patterns",
        nargs="+",
        help=
        "Glob patterns for benchmark YAML files (e.g., config/benchmarks/*.yaml)",
    )
    parser.add_argument("-m", "--model", help="Override model name")
    parser.add_argument("--batch-id", help="Logical ID for grouping runs")

    args = parser.parse_args()

    asyncio.run(run_batch(args.patterns, args.model, args.batch_id))


if __name__ == "__main__":
    main()
