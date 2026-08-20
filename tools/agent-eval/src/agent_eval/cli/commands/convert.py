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

import sys
from datetime import datetime
from pathlib import Path

import click
from rich.console import Console

from agent_eval.core.converters import AdkHistoryConverter, write_jsonl
from agent_eval.core.trace_converters import get_trace_converter

console = Console()


@click.command()
@click.option(
    "--agent-dir",
    required=True,
    help=
    "Path to the agent directory (containing .adk/eval_history) or trace file/dir for non-ADK formats.",
)
@click.option(
    "--questions-file",
    default=None,
    help="Path to Golden Dataset to merge reference data.",
)
@click.option("--output-dir", default="results", help="Directory for outputs.")
@click.option("--output-file", default=None, help="Custom output filename.")
@click.option(
    "--trace-format",
    default="adk",
    help=
    "Format of the trace input ('adk', 'openinference', 'langgraph', 'crewai', 'otel', 'llamaindex', 'autogen').",
)
def convert(agent_dir, questions_file, output_dir, output_file, trace_format):
    """Convert ADK or OpenInference simulation history to evaluation JSONL format."""
    console.print(
        f"\n[bold blue]Converting Trace History (Format: {trace_format})[/]")
    try:
        format_normalized = trace_format.strip().lower(
        ) if trace_format else "adk"
        if format_normalized in ("adk", "default"):
            history_path = Path(agent_dir) / ".adk" / "eval_history"
            converter = AdkHistoryConverter(str(history_path), questions_file)
            records = converter.run()
        else:
            from agent_eval.core.data_mapper import _map_agents

            core_converter = get_trace_converter(
                trace_format, questions_file=questions_file
            )
            history_path = Path(agent_dir)
            records_agent_data = core_converter.convert_file(
                history_path, questions_file=questions_file
            )
            records = _map_agents(records_agent_data)

        if not records:
            console.print("[yellow]No history found to convert.[/]")
            return

        # Create datetime-stamped folder structure
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        run_path = Path(output_dir) / timestamp
        raw_path = run_path / "raw"
        raw_path.mkdir(parents=True, exist_ok=True)

        if not output_file:
            output_path = raw_path / "processed_interaction_sim.jsonl"
        else:
            fname = output_file
            if not fname.endswith(".jsonl"):
                fname = fname.replace(".csv", ".jsonl")
                if not fname.endswith(".jsonl"):
                    fname += ".jsonl"
            output_path = raw_path / fname

        write_jsonl(records, str(output_path))
        console.print(
            f"\n[bold green]SUCCESS:[/] Converted {len(records)} interactions to: {output_path}"
        )
        console.print(f"Run folder: {run_path}")
        console.print("\nTo evaluate, run:")
        console.print(
            f"  agent-eval grade --traces {output_path} --eval-config <metrics.json> --results-dir {run_path}"
        )

    except Exception as e:
        console.print(f"[bold red]Error converting history:[/] {e}")
        sys.exit(1)
