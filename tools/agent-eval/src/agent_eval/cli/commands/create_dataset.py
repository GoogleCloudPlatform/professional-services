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
"""agent-eval create-dataset — convert test files to Golden Dataset format."""

import sys

import click
from rich.console import Console

from agent_eval.core.converters import TestToGoldenConverter

console = Console()


@click.command("create-dataset")
@click.option("--input", "input_path", required=True, help="Path to raw JSON input (list of turns).")
@click.option("--output", "output_path", required=True, help="Path to output Golden Dataset JSON.")
@click.option("--agent-name", required=True, help="Name of the agent.")
@click.option("--metadata", multiple=True, help="Metadata tags (key:value).")
@click.option("--prefix", default="q", help="Question ID prefix.")
def create_dataset(input_path, output_path, agent_name, metadata, prefix):
    """Convert raw test turns (JSON) to Golden Dataset format."""
    console.print("\n[bold blue]Creating Golden Dataset[/]")

    try:
        converter = TestToGoldenConverter()
        converter.convert(
            input_path=input_path,
            output_path=output_path,
            agent_name=agent_name,
            metadata_pairs=list(metadata) if metadata else None,
            id_prefix=prefix,
        )
        console.print(f"\n[bold green]SUCCESS:[/] Dataset created at: {output_path}")
    except Exception as e:
        console.print(f"[bold red]Error creating dataset:[/] {e}")
        sys.exit(1)
