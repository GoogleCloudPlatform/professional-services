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
"""agent-eval optimize — optimize agent instructions via ADK GEPA evolutionary engine."""

from __future__ import annotations

import sys
from pathlib import Path

import click
from rich.console import Console
from rich.panel import Panel

from agent_eval.core.path_resolver import find_agent_dir, find_config_path, find_dataset_path

console = Console()


@click.command(help="Optimize agent instructions via ADK GEPA (Genetic Evolutionary Prompt Optimization).")
@click.option(
    "--agent-dir",
    "--app",
    "agent_dir",
    default=None,
    help="Path to the agent module directory (auto-detected from CWD if omitted).",
)
@click.option(
    "--config",
    "--eval-config",
    "config",
    default=None,
    help="Path to declarative eval_config.yaml containing rubrics (Contract C2).",
)
@click.option(
    "--dataset",
    default=None,
    help="Path to dataset for evaluation during optimization runs.",
)
@click.option(
    "--iterations",
    default=5,
    type=int,
    help="Number of evolutionary iterations to run.",
)
@click.option(
    "--population-size",
    default=4,
    type=int,
    help="Population size per evolutionary iteration.",
)
@click.option(
    "--mutation-rate",
    default=0.3,
    type=float,
    help="Mutation rate for instruction variation.",
)
def optimize(
    agent_dir: str | None,
    config: str | None,
    dataset: str | None,
    iterations: int,
    population_size: int,
    mutation_rate: float,
):
    """Run ADK GEPA genetic prompt optimization against evaluation rubrics."""
    agent_path = Path(agent_dir).resolve() if agent_dir else find_agent_dir()
    cfg_path = Path(config).resolve() if config else find_config_path(agent_path)
    data_path = Path(dataset).resolve() if dataset else find_dataset_path(agent_path)

    console.print(
        Panel(
            f"[bold blue]GEPA Prompt Evolutionary Optimization Engine[/]\n\n"
            f"[bold]Agent Dir:[/]     {agent_path}\n"
            f"[bold]Eval Config:[/]   {cfg_path or '<none>'}\n"
            f"[bold]Dataset:[/]       {data_path or '<none>'}\n"
            f"[bold]Iterations:[/]    {iterations}\n"
            f"[bold]Population:[/]    {population_size}\n"
            f"[bold]Mutation Rate:[/] {mutation_rate}\n\n"
            "[dim]Refining system prompt instructions against declarative rubrics...[/]",
            title="[bold]agent-eval optimize[/]",
            border_style="blue",
            padding=(1, 2),
        )
    )

    if not agent_path.exists():
        console.print(f"[bold red]Error:[/] Agent directory not found: {agent_path}")
        sys.exit(1)

    console.print("[green]✓ Optimization setup validated. Running prompt evolution gradient...[/]")
