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
"""agent-eval generate — generate agent interaction traces via simulation or live server."""

from __future__ import annotations

import click
from rich.console import Console

from agent_eval.cli.commands.interact import interact
from agent_eval.cli.commands.simulate import simulate
from agent_eval.core.path_resolver import find_agent_dir, find_config_path

console = Console()


@click.command(help="Generate agent interaction traces via simulation or live server.")
@click.option(
    "--mode",
    type=click.Choice(["simulate", "live"], case_sensitive=False),
    default=None,
    help="Generation mode: 'simulate' (ADK UserSim) or 'live' (direct HTTP against agent).",
)
@click.option(
    "--agent-dir",
    "--app",
    "agent_dir",
    default=None,
    help="Path to the agent module directory (auto-detected from CWD if omitted).",
)
@click.option(
    "--dataset",
    "--questions-file",
    "questions_file",
    default=None,
    help="Path to dataset or questions JSONL/JSON.",
)
@click.option(
    "--base-url",
    "--url",
    "base_url",
    default=None,
    help="Base URL of running agent (e.g. http://localhost:8080) for live mode.",
)
@click.option(
    "--config",
    "--eval-config",
    "config",
    default=None,
    help="Path to declarative eval_config.yaml (Contract C2).",
)
@click.option(
    "--output-dir",
    default=None,
    help="Directory where output traces should be saved.",
)
@click.option(
    "--run-id",
    default=None,
    help="Custom run ID for output folder naming.",
)
@click.option(
    "--in-process",
    is_flag=True,
    help="Run simulation in-process rather than via subprocess.",
)
@click.option(
    "--max-turns",
    default=None,
    type=int,
    help="Maximum turns per conversation.",
)
@click.option(
    "--debug",
    is_flag=True,
    help="Show detailed logs and debug outputs.",
)
@click.pass_context
def generate(
    ctx: click.Context,
    mode: str | None,
    agent_dir: str | None,
    questions_file: str | None,
    base_url: str | None,
    config: str | None,
    output_dir: str | None,
    run_id: str | None,
    in_process: bool,
    max_turns: int | None,
    debug: bool,
):
    """Generate agent interaction traces via simulation or live server."""
    # Auto-resolve agent_dir from CWD if omitted
    if not agent_dir:
        detected_agent = find_agent_dir()
        agent_dir = str(detected_agent)

    # Auto-resolve config from CWD if omitted
    if not config:
        detected_cfg = find_config_path(agent_dir=agent_dir)
        if detected_cfg:
            config = str(detected_cfg)

    # Determine execution mode: if base_url is provided or mode == 'live', route to interact
    if mode == "live" or base_url:
        console.print("[bold blue]Generating traces via live agent server...[/]")
        ctx.invoke(
            interact,
            agent_dir=agent_dir,
            questions_file=questions_file,
            base_url=base_url,
            output_dir=output_dir,
            run_id=run_id,
            in_process=in_process,
            debug=debug,
        )
    else:
        # Default: simulate (ADK UserSim)
        console.print("[bold blue]Generating traces via multi-turn user simulation...[/]")
        ctx.invoke(
            simulate,
            agent_dir=agent_dir,
            questions_file=questions_file,
            output_dir=output_dir,
            run_id=run_id,
            in_process=in_process,
            max_turns=max_turns,
            debug=debug,
        )
