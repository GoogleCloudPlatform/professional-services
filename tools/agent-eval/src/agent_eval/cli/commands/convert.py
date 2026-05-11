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
"""agent-eval convert — convert ADK simulation history to evaluation format."""

import os
import sys
from datetime import datetime

import click
from rich.console import Console

from agent_eval.core.converters import AdkHistoryConverter, write_jsonl

console = Console()


@click.command()
@click.option(
    "--agent-dir",
    required=True,
    help="Path to the agent directory (containing .adk/eval_history).")
@click.option("--questions-file",
              default=None,
              help="Path to Golden Dataset to merge reference data.")
@click.option("--output-dir", default="results", help="Directory for outputs.")
@click.option("--output-file", default=None, help="Custom output filename.")
def convert(agent_dir, questions_file, output_dir, output_file):
    """Convert ADK simulation history to evaluation JSONL format."""
    console.print("\n[bold blue]Converting ADK History[/]")

    try:
        converter = AdkHistoryConverter(agent_dir, questions_file)
        records = converter.run()

        if not records:
            console.print("[yellow]No history found to convert.[/]")
            return

        # Create datetime-stamped folder structure
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        run_dir = os.path.join(output_dir, timestamp)
        raw_dir = os.path.join(run_dir, "raw")
        os.makedirs(raw_dir, exist_ok=True)

        if not output_file:
            output_path = os.path.join(raw_dir,
                                       "processed_interaction_sim.jsonl")
        else:
            fname = output_file
            if not fname.endswith(".jsonl"):
                fname = fname.replace(".csv", ".jsonl")
                if not fname.endswith(".jsonl"):
                    fname += ".jsonl"
            output_path = os.path.join(raw_dir, fname)

        write_jsonl(records, output_path)
        console.print(
            f"\n[bold green]SUCCESS:[/] Converted {len(records)} interactions to: {output_path}"
        )
        console.print(f"Run folder: {run_dir}")
        console.print(f"\nTo evaluate, run:")
        console.print(
            f"  agent-eval evaluate --interaction-file {output_path} --metrics-files <metrics.json> --results-dir {run_dir}"
        )

    except Exception as e:
        console.print(f"[bold red]Error converting history:[/] {e}")
        sys.exit(1)
