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
"""agent-eval skills — manage and install bundled agent skills for AI pair programmers."""

from __future__ import annotations

import os
from pathlib import Path

import click
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.table import Table

console = Console()


def _get_bundled_skills_dir() -> Path:
    """Find the bundled skills directory inside the agent-eval package or repository root."""
    # Check repo root skills/ directory (skills.py -> commands -> cli -> agent_eval -> src -> repo_root)
    repo_root = Path(__file__).resolve().parent.parent.parent.parent.parent
    candidate = repo_root / "skills"
    if candidate.exists():
        return candidate
    # Fallback to src/../skills
    src_candidate = Path(
        __file__).resolve().parent.parent.parent.parent / "skills"
    if src_candidate.exists():
        return src_candidate
    return candidate


def _get_global_skills_dir() -> Path:
    """Get the standard global CLI skills directory (~/.gemini/config/skills)."""
    custom = os.environ.get("GEMINI_SKILLS_DIR")
    if custom:
        return Path(custom).expanduser()
    return Path.home() / ".gemini" / "config" / "skills"


@click.group(
    help=
    "Manage and install bundled agent skills for AI pair programmers (Jetski, Gemini CLI)."
)
def skills() -> None:
    pass


@skills.command("list", help="List all available bundled agent skills.")
def list_skills() -> None:
    bundled_dir = _get_bundled_skills_dir()
    global_dir = _get_global_skills_dir()

    if not bundled_dir.exists():
        console.print(f"[yellow]No bundled skills found at {bundled_dir}[/]")
        return

    table = Table(title="Bundled agent-eval Skills", border_style="blue")
    table.add_column("Skill Name", style="bold cyan")
    table.add_column("Global Status", style="green")
    table.add_column("Path", style="dim")

    for item in sorted(bundled_dir.iterdir()):
        if item.is_dir() and (item / "SKILL.md").exists():
            target_link = global_dir / item.name
            is_installed = target_link.exists()
            status = "[green]✓ Installed (Active)[/]" if is_installed else "[dim]Not installed[/]"
            table.add_row(item.name, status, str(item))

    console.print(table)
    console.print(
        "\n[dim]Run [bold]agent-eval skills install[/bold] to register all bundled skills into your global AI CLI.[/]\n"
    )


@skills.command(
    "install",
    help=
    "Install / symlink bundled skills to global AI CLI config (~/.gemini/config/skills)."
)
@click.option("--copy",
              is_flag=True,
              help="Copy files instead of creating symbolic links.")
def install_skills(copy: bool) -> None:
    bundled_dir = _get_bundled_skills_dir()
    global_dir = _get_global_skills_dir()

    if not bundled_dir.exists():
        console.print(
            f"[red]Error: Bundled skills directory not found at {bundled_dir}[/]"
        )
        return

    global_dir.mkdir(parents=True, exist_ok=True)
    installed_count = 0

    for item in bundled_dir.iterdir():
        if item.is_dir() and (item / "SKILL.md").exists():
            dest = global_dir / item.name
            if dest.is_symlink() or dest.exists():
                if dest.is_symlink():
                    dest.unlink()
                elif dest.is_dir():
                    import shutil
                    shutil.rmtree(dest)
                else:
                    dest.unlink()

            if copy:
                import shutil
                shutil.copytree(item, dest)
                console.print(
                    f"  [green]✓[/] Copied [bold]{item.name}[/] → {dest}")
            else:
                dest.symlink_to(item.resolve())
                console.print(
                    f"  [green]✓[/] Symlinked [bold]{item.name}[/] → {dest}")
            installed_count += 1

    panel = Panel(
        f"[bold green]Successfully installed {installed_count} skill(s) into {global_dir}![/]\n\n"
        "AI coding agents (Jetski, Gemini CLI) will now automatically recognize:\n"
        "  • [cyan]/agent-eval[/] — Automated benchmark runs, GCS publishing, and radar delta comparisons\n"
        "  • [cyan]/agent-eval-workflow[/] — Hypothesis-driven evaluation methodology & metric design",
        title="[bold]agent-eval Skills Installed[/]",
        border_style="green",
    )
    console.print(panel)


@skills.command("show", help="Display the full markdown content of a skill.")
@click.argument("skill_name")
def show_skill(skill_name: str) -> None:
    bundled_dir = _get_bundled_skills_dir()
    skill_file = bundled_dir / skill_name / "SKILL.md"

    if not skill_file.exists():
        console.print(
            f"[red]Skill '{skill_name}' not found in {bundled_dir}[/]")
        return

    content = skill_file.read_text()
    console.print(Markdown(content))
