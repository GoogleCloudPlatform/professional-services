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
"""agent-eval stage — modular stage execution for pipeline orchestration."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import click
from rich.console import Console

from agent_eval.core.stages import run_stage

console = Console()


@click.command()
@click.option(
    "--only",
    default=None,
    help=
    "Name of the stage to execute (e.g. 'rubrics', 'metric_selection', 'calibration').",
)
@click.option(
    "--output",
    default="json",
    type=click.Choice(["json", "yaml"]),
    help="Output format for structured stage events.",
)
@click.option(
    "--config",
    default=None,
    help="Optional path to declarative eval_config.yaml.",
)
def stage(only: str | None, output: str, config: str | None):
    """Execute modular evaluation CLI stages and emit structured events."""
    config_data: dict[str, Any] | None = None
    if config:
        import yaml

        cfg_path = Path(config).resolve()
        if not cfg_path.exists():
            console.print(f"[red]Error:[/] Config file not found: {cfg_path}",
                          err=True)
            sys.exit(1)
        config_data = yaml.safe_load(cfg_path.read_text(encoding="utf-8"))

    target_stage = (only or "rubrics").strip().lower()

    try:
        res = run_stage(target_stage, config_data=config_data)
    except Exception as exc:
        console.print(f"[red]Error executing stage '{target_stage}':[/] {exc}",
                      err=True)
        sys.exit(1)

    if output == "yaml":
        click.echo(res.to_yaml())
    else:
        click.echo(res.to_json(indent=2))
