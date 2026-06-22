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
"""agent-eval CLI — evaluate your ADK agents with confidence."""

import importlib.metadata

import click
from rich.console import Console
from rich.panel import Panel

console = Console()


def _get_version() -> str:
    try:
        return importlib.metadata.version("agent-eval")
    except importlib.metadata.PackageNotFoundError:
        return "dev"


def _display_banner() -> None:
    version = _get_version()
    panel = Panel(
        "[cyan]▄▀▄ █▀▀ █▀▀ █▄ █ ▀█▀   █▀▀ █ █ ▄▀▄ █  [/]\n"
        "[cyan]█▀█ █ █ █▀▀ █ ▀█  █    █▀▀ ▀▄▀ █▀█ █  [/]\n"
        "[cyan]▀ ▀ ▀▀▀ ▀▀▀ ▀  ▀  ▀    ▀▀▀  ▀  ▀ ▀ ▀▀▀[/]\n"
        "\n"
        "Hypothesize. Test. Validate.\n"
        "[dim]Systematic evaluation for ADK agents.[/]",
        title=f"[bold]agent-eval[/] v{version}",
        border_style="blue",
        padding=(1, 2),
    )
    console.print(panel)


def print_version(ctx: click.Context, param: click.Parameter, value: bool) -> None:
    if not value or ctx.resilient_parsing:
        return
    console.print(f"agent-eval v{_get_version()}")
    ctx.exit()


class _OrderedGroup(click.Group):
    """Click group that lists commands in registration order, not alphabetically.

    The default ``Group.list_commands`` sorts alphabetically — that hides our
    intended workflow ordering (init → import → simulate → ...). Overriding
    here makes ``agent-eval --help`` read top-down as the docs do.
    """

    def list_commands(self, ctx: click.Context) -> list[str]:
        return list(self.commands.keys())


@click.group(cls=_OrderedGroup, help="Evaluation CLI for ADK agents.")
@click.option(
    "--version",
    "-v",
    is_flag=True,
    callback=print_version,
    expose_value=False,
    is_eager=True,
    help="Show version and exit.",
)
def cli() -> None:
    pass


# --- Register commands ---

from agent_eval.cli.commands.analyze import analyze  # noqa: E402
from agent_eval.cli.commands.convert import convert  # noqa: E402
from agent_eval.cli.commands.create_dataset import create_dataset  # noqa: E402
from agent_eval.cli.commands.dashboard import dashboard  # noqa: E402
from agent_eval.cli.commands.evaluate import evaluate  # noqa: E402
from agent_eval.cli.commands.import_adk import import_adk  # noqa: E402
from agent_eval.cli.commands.init import init  # noqa: E402
from agent_eval.cli.commands.interact import interact  # noqa: E402
from agent_eval.cli.commands.migrate import migrate  # noqa: E402
from agent_eval.cli.commands.report import report  # noqa: E402
from agent_eval.cli.commands.run import run  # noqa: E402
from agent_eval.cli.commands.setup import setup  # noqa: E402
from agent_eval.cli.commands.simulate import simulate  # noqa: E402
from agent_eval.cli.commands.stories import stories  # noqa: E402

# Order matches the Vertex AI eval docs sidebar workflow so `agent-eval --help`
# reads top-down as: set up → bring in data → generate traces → score →
# (Agent Engine streamlined shortcut) → view → orchestrate → utilities.
cli.add_command(setup)  # One-time GCP env preparation
cli.add_command(init)  # Tutorial / first-run scaffold
cli.add_command(migrate)  # Convert legacy eval/ → tests/eval/
cli.add_command(
    import_adk, name="import"
)  # Prepare dataset (from existing ADK evalsets)
cli.add_command(simulate)  # Generate traces (multi-turn)
cli.add_command(interact)  # Generate traces (single-turn)
cli.add_command(evaluate)  # Run evaluation
# `agent-engine` (streamlined Agent Engine pass via create_evaluation_run)
# is intentionally NOT registered here while it's being re-validated. The
# command implementation is still in agent_eval.cli.commands.agent_engine
# and the import above stays so it doesn't bit-rot. To re-enable, uncomment
# the cli.add_command(agent_engine, name="agent-engine") line below. See
# docs/FUTURE_WORK.md for the investigation context.
# cli.add_command(agent_engine, name="agent-engine")
cli.add_command(analyze)  # View / interpret results
cli.add_command(report)  # Open the HTML report in a browser
cli.add_command(dashboard)  # View / interpret results (interactive)
cli.add_command(run)  # Full pipeline shortcut
cli.add_command(convert)  # Utility: ADK traces → JSONL
cli.add_command(
    create_dataset, name="create-dataset"
)  # Utility: legacy dataset converter
cli.add_command(stories)  # Utility: browse the wait-time story library


def main():
    """Entry point for the agent-eval CLI (used by pyproject.toml scripts)."""
    cli()


if __name__ == "__main__":
    main()
