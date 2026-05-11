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
"""agent-eval simulate — run ADK User Sim and convert traces in one step."""

import json
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import click
from rich.console import Console
from rich.panel import Panel
from rich.rule import Rule

from agent_eval.cli._pacing import _continue, _pauses_disabled

console = Console()

# Base args for running ADK commands in the agent's project context.
# --with ensures google-adk[eval] is available even if the agent's own
# pyproject.toml only depends on google-adk (without the eval extra).
_UV_RUN_ADK = ["uv", "run", "--with", "google-adk[eval]"]


def _clean_env(project_root: Path) -> dict[str, str]:
    """Return a clean environment for running ADK commands.

    1. Strips VIRTUAL_ENV so uv resolves the agent's project venv (not root's)
    2. Loads the agent project's .env file so GCP vars are available
    3. Prepends project_root to PYTHONPATH so the agent's top-level package
       imports resolve in the subprocess. ADK's ``adk eval`` runs as an
       installed console script, which means cwd is NOT automatically on
       sys.path. Without this, any agent whose ``agent.py`` does
       ``import app.foo`` (the ASP-standard layout) dies with
       ``ModuleNotFoundError: No module named 'app'`` — exactly the
       failure that killed Phase 1 of the 2026-04-23 customer demo.
    """
    env = os.environ.copy()
    env.pop("VIRTUAL_ENV", None)

    project_root_str = str(project_root)
    existing_pp = env.get("PYTHONPATH", "")
    if existing_pp:
        env["PYTHONPATH"] = project_root_str + os.pathsep + existing_pp
    else:
        env["PYTHONPATH"] = project_root_str

    # Load .env from the agent's project root (where pyproject.toml lives)
    dotenv_path = project_root / ".env"
    if dotenv_path.is_file():
        for line in dotenv_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip("\"'")
                # Don't override vars already set in the shell
                if key not in env:
                    env[key] = value

    return env


# Files ADK expects inside the agent module directory
_ADK_REQUIRED_FILES = ["session_input.json", "conversation_scenarios.json", "eval_config.json"]

# Default eval_config — empty criteria so ADK skips its built-in per-interaction
# LLM scoring (hallucination, safety). These are slow because ADK scores each
# interaction individually. agent-eval runs its own evaluation in batch via
# Vertex AI Evaluation, which is faster and more configurable.
_DEFAULT_EVAL_CONFIG = {
    "criteria": {}
}

TOTAL_STEPS = 5


def _step_header(n: int, title: str, description: str) -> None:
    """Print a formatted step header."""
    console.print()
    console.print(Rule(f"  Step {n}/{TOTAL_STEPS}: {title}  ", style="bold blue"))
    console.print(f"  [dim]{description}[/]")
    console.print()


def _find_eval_dir(agent_dir: Path) -> Path | None:
    """Find the eval/ directory — check inside agent_dir first, then parent."""
    if (agent_dir / "eval").is_dir():
        return agent_dir / "eval"
    if (agent_dir.parent / "eval").is_dir():
        return agent_dir.parent / "eval"
    return None


def _count_scenarios(scenarios_file: Path) -> int:
    """Count the number of scenarios in a scenarios JSON file."""
    try:
        data = json.loads(scenarios_file.read_text())
        return len(data.get("scenarios", []))
    except (json.JSONDecodeError, FileNotFoundError):
        return 0


def _row_to_adk_scenario(row: dict, idx: int) -> dict:
    """Convert one unified ``dataset.jsonl`` row to ADK's ConversationScenario.

    ADK's pydantic schema (per https://adk.dev/evaluate/user-sim/) is::

        {
          "starting_prompt": "Initial user message",
          "conversation_plan": "High-level goals to accomplish"  # STRING
        }

    Our canonical row schema stores ``conversation_plan`` as a *list* of
    follow-up user turns — that's the natural way to author multi-turn
    flows. We join the list into a single goal-list string at projection
    time so ADK accepts it.

    Mapping rules:
      - ``starting_prompt`` ← row["prompt"] (or, when prompt is missing
        but history exists, the first historical user turn)
      - ``conversation_plan`` ← row["conversation_plan"] joined as a
        numbered goal list; otherwise rebuilt from row["history"] + the
        canonical prompt as the final follow-up.
    """
    def _plan_to_string(items: list) -> str:
        clean = [str(item).strip() for item in items if str(item).strip()]
        if not clean:
            return ""
        # Numbered goals — most legible to the simulated-user LLM, and
        # preserves order. Single-item plans drop the numbering for clarity.
        if len(clean) == 1:
            return clean[0]
        return "\n".join(f"{i + 1}. {goal}" for i, goal in enumerate(clean))

    plan = row.get("conversation_plan")
    if plan:
        starting = row.get("prompt") or ""
        plan_list = list(plan) if isinstance(plan, list) else [str(plan)]
        return {"starting_prompt": starting, "conversation_plan": _plan_to_string(plan_list)}

    history = row.get("history") or row.get("conversation_history") or []
    history_texts: list[str] = []
    for turn in history:
        if isinstance(turn, dict):
            parts = (turn.get("parts") or [])
            text = " ".join(p.get("text", "") for p in parts if isinstance(p, dict)).strip()
            if text:
                history_texts.append(text)

    prompt = row.get("prompt") or ""
    if history_texts:
        # First user turn opens the conversation; the rest become the plan
        # ADK feeds back to the agent, with the canonical prompt as the
        # final follow-up.
        starting = history_texts[0]
        plan_list = history_texts[1:] + ([prompt] if prompt else [])
    else:
        starting = prompt
        plan_list = []
    return {"starting_prompt": starting, "conversation_plan": _plan_to_string(plan_list)}


def _project_dataset_to_adk_files(
    agent_dir: Path,
    project_root: Path,
) -> tuple[int, str]:
    """Project multi-turn rows from ``<project_root>/tests/eval/dataset.jsonl``
    into ADK's expected files inside ``<agent_dir>``.

    ADK requires ``conversation_scenarios.json``, ``session_input.json``,
    and ``eval_config.json`` next to ``agent.py``. Per Phase D: those files
    are derived from the unified dataset and treated as ephemeral cache —
    the user only ever edits ``dataset.jsonl``.

    Returns ``(scenario_count, source_label)`` for logging.
    """
    from agent_eval.core.dataset_io import read_dataset, is_multi_turn

    dataset_path = project_root / "tests" / "eval" / "dataset.jsonl"
    if not dataset_path.exists():
        return 0, "missing"

    rows = read_dataset(dataset_path)
    multi_turn_rows = [r for r in rows if is_multi_turn(r)]
    scenarios = [_row_to_adk_scenario(r, i) for i, r in enumerate(multi_turn_rows)]
    scenarios = [s for s in scenarios if s.get("starting_prompt")]
    if not scenarios:
        return 0, "no-multi-turn-rows"

    # Pick session_inputs from the first multi-turn row that has them.
    session_inputs = next(
        (r["session_inputs"] for r in multi_turn_rows if r.get("session_inputs")),
        {"app_name": agent_dir.name, "user_id": "eval_user", "state": {}},
    )

    # Write the three files ADK reads. Marker comment tells future devs
    # these are generated and shouldn't be hand-edited.
    scenarios_target = agent_dir / "conversation_scenarios.json"
    session_target = agent_dir / "session_input.json"
    eval_config_target = agent_dir / "eval_config.json"

    # ADK's ConversationScenarios pydantic schema is `extra="forbid"` —
    # any key beyond `scenarios` triggers a validation error. Don't add a
    # `_generated_by` marker here; the CLI prints the source-of-truth
    # reminder instead.
    scenarios_payload = {
        "scenarios": scenarios,
    }
    scenarios_target.write_text(json.dumps(scenarios_payload, indent=2) + "\n")
    session_target.write_text(json.dumps(session_inputs, indent=2) + "\n")

    # eval_config: project-level source of truth lives at
    # <project_root>/tests/eval/eval_config.json. ADK reads the agent-dir
    # copy. We deliberately keep the agent-dir copy with EMPTY criteria so
    # ADK's per-interaction scoring stays out of the way — agent-eval scores
    # in batch via Vertex AI Evaluation. Running both is slow + confusing.
    #
    # If the project source has non-empty criteria (e.g. an Agent Starter
    # Pack scaffold), back it up once and replace with the empty default —
    # then point the user at metric_definitions.json as the single rubric
    # surface. Idempotent: after the first call, criteria is {} so we no-op.
    project_eval_config = project_root / "tests" / "eval" / "eval_config.json"
    backup_path: Optional[Path] = None
    backed_up_count = 0
    backed_up_names: List[str] = []

    if project_eval_config.exists():
        try:
            existing = json.loads(project_eval_config.read_text())
            existing_criteria = (existing or {}).get("criteria") or {}
            if isinstance(existing_criteria, dict) and existing_criteria:
                from datetime import datetime as _dt
                backup_dir = project_root / "tests" / "eval" / ".backup" / _dt.now().strftime("%Y%m%d_%H%M%S")
                backup_dir.mkdir(parents=True, exist_ok=True)
                backup_path = backup_dir / "eval_config.json"
                backup_path.write_text(project_eval_config.read_text())
                backed_up_count = len(existing_criteria)
                backed_up_names = list(existing_criteria.keys())
                # Replace the source with an empty config — preserve any
                # non-criteria keys the user may have set (model defaults etc.).
                existing["criteria"] = {}
                project_eval_config.write_text(json.dumps(existing, indent=2) + "\n")
        except (json.JSONDecodeError, TypeError):
            pass
        try:
            cfg = json.loads(project_eval_config.read_text())
        except (json.JSONDecodeError, TypeError):
            cfg = dict(_DEFAULT_EVAL_CONFIG)
    else:
        project_eval_config.parent.mkdir(parents=True, exist_ok=True)
        cfg = dict(_DEFAULT_EVAL_CONFIG)
        project_eval_config.write_text(json.dumps(cfg, indent=2) + "\n")

    # Cap the user simulator's max_allowed_invocations to MAX(plan turns) + 2
    # for THIS run — the ADK default is 20, which lets the simulator keep
    # going long after our scripted plan ends, ballooning sim time when the
    # agent is slow (the crwd-legal-discovery 2026-05-03 run hit this hard
    # — 3 multi-turn scenarios, 5+ minute waits). The +2 leaves room for an
    # extra clarifying turn the simulator might need to satisfy the goal.
    # The cap is computed from the projected scenarios above so it's always
    # tied to the actual data being driven (not the dataset's other rows).
    def _plan_depth(scenario: dict) -> int:
        plan = scenario.get("conversation_plan")
        if isinstance(plan, list):
            return len(plan)
        if isinstance(plan, str) and plan:
            # Already projected to a numbered string — count "<n>." markers.
            import re
            return max(1, len(re.findall(r"^\s*\d+\.", plan, flags=re.MULTILINE)))
        return 1
    deepest_plan = max((_plan_depth(s) for s in scenarios), default=1)
    max_invocations = deepest_plan + 2  # +2 = small safety margin for clarification turns
    sim_cfg = (cfg.get("user_simulator_config") or {}).copy()
    # Only override when the user hasn't pinned a value themselves.
    if "max_allowed_invocations" not in sim_cfg:
        sim_cfg["max_allowed_invocations"] = max_invocations
        cfg["user_simulator_config"] = sim_cfg

    eval_config_target.write_text(json.dumps(cfg, indent=2) + "\n")

    console.print(
        f"    [green]+[/] Projected {len(scenarios)} multi-turn row(s) → "
        f"{agent_dir.name}/conversation_scenarios.json"
    )
    console.print(
        f"    [green]+[/] Wrote {agent_dir.name}/session_input.json from row session_inputs"
    )
    _cap_note = (
        f"capped to {max_invocations} sim turns"
        if sim_cfg.get("max_allowed_invocations") == max_invocations
        else "user-pinned max_allowed_invocations preserved"
    )
    console.print(
        f"    [green]+[/] Wrote {agent_dir.name}/eval_config.json "
        f"[dim](empty criteria + {_cap_note}; ADK default is 20 → can stall on slow agents)[/]"
    )

    # One-time message when we just relocated the user's ADK criteria.
    # This is gentler than a perpetual warning — it happens exactly once
    # per project (after that the criteria block is {} and we no-op).
    if backup_path is not None:
        names = ", ".join(backed_up_names[:3])
        more = f" (+{backed_up_count - 3} more)" if backed_up_count > 3 else ""
        rel_backup = backup_path.relative_to(project_root)
        console.print()
        console.print(
            f"    [yellow]![/] [bold]Backed up your existing ADK eval_config[/] "
            f"({backed_up_count} criterion{'s' if backed_up_count != 1 else ''}: "
            f"[cyan]{names}[/]{more})"
        )
        console.print(f"      [dim]→ {rel_backup}[/]")
        console.print(
            "      [dim]Why: ADK's per-interaction scorers + agent-eval's batch "
            "scorers would double-score every row (slow + confusing).[/]"
        )
        console.print(
            "      [dim]Want those rubrics back? Add them as `custom_llm_judge` "
            "metrics in tests/eval/metrics/metric_definitions.json — "
            "agent-eval will score them in batch via Vertex AI.[/]"
        )

    console.print(
        "    [dim]Source of truth: tests/eval/dataset.jsonl — these files are "
        "regenerated on each `simulate` run.[/]"
    )
    return len(scenarios), "dataset.jsonl"


def _step_symlinks(agent_dir: Path, eval_dir: Path) -> None:
    """Step 1: Make ADK's required scenario files available next to ``agent.py``.

    Two paths:

    1. **Unified dataset present** (post-rescue): project multi-turn rows
       from ``<project_root>/tests/eval/dataset.jsonl`` into
       ``<agent_dir>/conversation_scenarios.json`` etc. Files are
       regenerated each run; users edit only ``dataset.jsonl``.

    2. **Legacy layout only** (pre-rescue): symlink from
       ``<agent_dir>/eval/scenarios/*.json`` (the old hand-edited
       location). Print a one-liner suggesting ``agent-eval migrate``.
    """
    from agent_eval.core.path_resolver import agent_project_root

    _step_header(
        1,
        "Stage scenario files",
        "ADK needs scenario files next to agent.py. We project them from\n"
        "  tests/eval/dataset.jsonl on each run, or fall back to symlinking\n"
        "  legacy eval/scenarios/ for projects that haven't migrated yet.",
    )

    project_root = agent_project_root(agent_dir)
    n_scenarios, source = _project_dataset_to_adk_files(agent_dir, project_root)

    if source == "dataset.jsonl":
        return

    # ── Legacy fallback ────────────────────────────────────────────────
    if source == "no-multi-turn-rows":
        console.print(
            "    [yellow]![/] Found tests/eval/dataset.jsonl but no multi-turn rows. "
            "simulate has nothing to drive — add rows with `history` or "
            "`conversation_plan`, or only use `interact` for single-turn evals."
        )
        return

    # source == "missing": no unified dataset, look for legacy symlink source
    scenarios_dir = eval_dir / "scenarios"
    if not scenarios_dir.exists():
        console.print(
            f"    [yellow]![/] Neither {project_root.name}/tests/eval/dataset.jsonl "
            f"nor {agent_dir.name}/eval/scenarios/ found. Run `agent-eval init` "
            f"first to scaffold a dataset."
        )
        return

    console.print(
        "    [dim]Using legacy eval/scenarios/ — run `agent-eval migrate` "
        "to fold these into the unified dataset.jsonl.[/]"
    )
    for filename in _ADK_REQUIRED_FILES:
        target = agent_dir / filename
        source_file = scenarios_dir / filename

        if filename == "eval_config.json" and not source_file.exists():
            source_file.parent.mkdir(parents=True, exist_ok=True)
            source_file.write_text(json.dumps(_DEFAULT_EVAL_CONFIG, indent=2) + "\n")
            console.print(f"    [green]+[/] Created {source_file}")

        if not source_file.exists():
            console.print(f"    [yellow]![/] Skipping {filename} — not in {scenarios_dir}")
            continue

        action = "updated" if (target.is_symlink() or target.exists()) else "created"
        if target.is_symlink() or target.exists():
            target.unlink()

        rel_path = os.path.relpath(source_file, agent_dir)
        target.symlink_to(rel_path)
        console.print(
            f"    [green]+[/] {action.capitalize()} symlink: "
            f"{agent_dir.name}/{filename} → {rel_path}"
        )


def _step_clear_history(agent_dir: Path) -> None:
    """Step 2: Clear ADK eval_history to avoid stale traces."""
    _step_header(2, "Clear eval history",
                 "Removing previous ADK traces so this run starts fresh.\n"
                 "  Stale traces would mix with new results and corrupt metrics.")

    eval_history = agent_dir / ".adk" / "eval_history"
    if eval_history.exists():
        n_files = sum(1 for _ in eval_history.rglob("*") if _.is_file())
        shutil.rmtree(eval_history)
        console.print(f"    [green]+[/] Cleared {n_files} file{'s' if n_files != 1 else ''} from {eval_history}")
    else:
        console.print(f"    [dim]Nothing to clear — no previous eval_history found.[/]")


def _step_create_eval_set(agent_name: str, agent_dir: Path) -> bool:
    """Step 3: Create a fresh eval_set and add scenarios."""
    _step_header(3, "Create eval set",
                 "Creating a fresh ADK eval_set and loading your scenarios.\n"
                 "  The eval_set is recreated from scratch each time to avoid\n"
                 "  duplicate scenarios (adk add_eval_case appends, not replaces).")

    eval_set_name = "eval_set"
    project_root = agent_dir.parent

    # Remove existing eval_set — ADK stores it in two places:
    # 1. <agent_dir>/<name>.evalset.json (the main file ADK checks)
    # 2. <agent_dir>/.adk/eval_sets/<name>/ (eval case data)
    removed = False
    evalset_file = agent_dir / f"{eval_set_name}.evalset.json"
    if evalset_file.exists():
        evalset_file.unlink()
        removed = True
    eval_set_dir = agent_dir / ".adk" / "eval_sets" / eval_set_name
    if eval_set_dir.exists():
        shutil.rmtree(eval_set_dir)
        removed = True
    if removed:
        console.print(f"    [green]+[/] Removed existing eval_set (prevents duplicates)")
    else:
        console.print(f"    [dim]No existing eval_set to remove.[/]")

    # Create eval_set
    cmd = f"uv run adk eval_set create {agent_name} {eval_set_name}"
    console.print(f"    [dim]$ {cmd}[/]")
    result = subprocess.run(
        [*_UV_RUN_ADK, "adk", "eval_set", "create", agent_name, eval_set_name],
        cwd=str(project_root),
        env=_clean_env(project_root),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        console.print(f"    [red]Failed to create eval_set[/]")
        if result.stderr.strip():
            console.print(f"    [red]{result.stderr.strip()}[/]")
        return False
    console.print(f"    [green]+[/] Created eval_set: {eval_set_name}")

    # Add eval cases from scenarios
    scenarios_file = agent_dir / "conversation_scenarios.json"
    session_file = agent_dir / "session_input.json"
    n_scenarios = _count_scenarios(scenarios_file)

    cmd = f"uv run adk eval_set add_eval_case {agent_name} {eval_set_name} --scenarios_file ... --session_input_file ..."
    console.print(f"    [dim]$ {cmd}[/]")
    result = subprocess.run(
        [
            *_UV_RUN_ADK, "adk", "eval_set", "add_eval_case",
            agent_name, eval_set_name,
            "--scenarios_file", str(scenarios_file),
            "--session_input_file", str(session_file),
        ],
        cwd=str(project_root),
        env=_clean_env(project_root),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        console.print(f"    [red]Failed to add eval cases[/]")
        if result.stderr.strip():
            console.print(f"    [red]{result.stderr.strip()}[/]")
        return False
    console.print(f"    [green]+[/] Added [cyan]{n_scenarios}[/] scenario{'s' if n_scenarios != 1 else ''} to eval_set")

    return True


def _step_run_sim(agent_name: str, agent_dir: Path, debug: bool = False) -> bool:
    """Step 4: Run adk eval (the actual User Sim)."""
    _step_header(4, "Run ADK User Sim",
                 "An LLM will now play the role of a user, following each scenario.\n"
                 "  This generates OpenTelemetry traces that capture every tool call,\n"
                 "  response, and token count. This step may take a few minutes.\n\n"
                 "  After the simulation, ADK runs its own built-in evaluation\n"
                 "  (hallucination + safety checks). These are a useful starting point,\n"
                 "  but agent-eval's evaluate command adds much deeper analysis:\n"
                 "  deterministic metrics (latency, tokens, cost, cache efficiency)\n"
                 "  and your custom LLM-as-judge metrics via Vertex AI.")

    eval_set_name = "eval_set"
    project_root = agent_dir.parent
    eval_config = agent_dir / "eval_config.json"

    cmd = f"uv run adk eval {agent_name} --config_file_path {agent_name}/eval_config.json {eval_set_name}"
    console.print(f"    [dim]$ {cmd}[/]")
    console.print()

    adk_cmd = [*_UV_RUN_ADK, "adk", "eval", agent_name]
    if eval_config.exists():
        adk_cmd += ["--config_file_path", str(eval_config)]
    adk_cmd.append(eval_set_name)

    # In debug mode, stream ADK output so the user sees everything.
    # In normal mode, capture it — ADK's "Tests passed/failed" summary refers
    # to its built-in scoring, not the simulation quality, which confuses users.
    if debug:
        console.print(f"    [dim]Debug: streaming ADK output...[/]")
        result = subprocess.run(
            adk_cmd,
            cwd=str(project_root),
            env=_clean_env(project_root),
            text=True,
        )
    else:
        result = subprocess.run(
            adk_cmd,
            cwd=str(project_root),
            env=_clean_env(project_root),
            capture_output=True,
            text=True,
        )

    # Check if traces were generated, regardless of exit code.
    # ADK's built-in scoring can fail (e.g., missing expected_invocations)
    # even when the simulations ran fine and traces were captured.
    eval_history = agent_dir / ".adk" / "eval_history"
    has_traces = eval_history.exists() and any(eval_history.rglob("*.json"))

    if result.returncode != 0 and has_traces:
        console.print(f"\n    [yellow]![/] ADK simulation completed, but ADK's built-in scoring had errors.")
        console.print(f"    [dim]This is expected — agent-eval runs its own evaluation separately.[/]")
        return True

    if result.returncode != 0:
        # Show captured output only on real failures
        if result.stderr:
            console.print(f"\n    [dim]{result.stderr.strip()}[/]")
        console.print(f"\n    [red]ADK eval failed with exit code {result.returncode}[/]")
        console.print(f"    [dim]No traces were generated. Common issues:[/]")
        console.print(f"    [dim]  - Missing GOOGLE_CLOUD_PROJECT or GOOGLE_CLOUD_LOCATION[/]")
        console.print(f"    [dim]  - Agent module not found (app_name mismatch)[/]")
        console.print(f"    [dim]  - Missing dependencies (run uv sync in agent project)[/]")
        return False

    console.print(f"\n    [green]+[/] ADK User Sim completed successfully")
    return True


def _step_convert(agent_dir: Path, eval_dir: Path, run_id: str | None = None) -> str | None:
    """Step 5: Convert ADK traces to evaluation format."""
    _step_header(5, "Convert traces",
                 "Converting ADK's OpenTelemetry traces into agent-eval's JSONL format.\n"
                 "  This extracts tool calls, responses, token counts, and timing data\n"
                 "  so they can be scored by the evaluate command.")

    from agent_eval.core.converters import AdkHistoryConverter, write_jsonl

    try:
        converter = AdkHistoryConverter(str(agent_dir), None)
        records = converter.run()

        if not records:
            console.print("    [yellow]![/] No traces found to convert.")
            console.print("    [dim]This usually means ADK eval didn't produce any output.[/]")
            console.print("    [dim]Check that eval_history exists in {agent_dir}/.adk/[/]")
            return None

        folder_name = run_id if run_id else datetime.now().strftime("%Y%m%d_%H%M%S")
        results_dir = eval_dir / "results"
        run_dir = results_dir / folder_name
        raw_dir = run_dir / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)

        output_path = raw_dir / "processed_interaction_sim.jsonl"
        write_jsonl(records, str(output_path))

        console.print(f"    [green]+[/] Converted [cyan]{len(records)}[/] interaction{'s' if len(records) != 1 else ''}")
        console.print(f"    [green]+[/] Output: {output_path}")
        console.print(f"    [green]+[/] Run directory: {run_dir}")

        return str(run_dir)

    except Exception as e:
        console.print(f"    [red]Error converting traces:[/] {e}")
        return None


@click.command()
@click.option("--agent-dir", required=True,
              help="Path to the agent module directory (containing agent.py).")
@click.option("--eval-dir", default=None,
              help="Path to eval/ directory (auto-detected if omitted).")
@click.option("--run-id", default=None,
              help="Name for the results folder (e.g., 'baseline', 'tool-hardening'). "
                   "Defaults to a timestamp like 20260319_060430. Use meaningful names "
                   "to keep track of optimization iterations.")
@click.option("--debug", is_flag=True, help="Show detailed logs from ADK, Vertex AI SDK, and other services.")
def simulate(agent_dir, eval_dir, run_id, debug):
    """Run ADK User Sim scenarios and convert traces to evaluation format.

    This command wraps the full ADK User Sim workflow into a single step:

    \b
    1. Creates symlinks so ADK can find scenario files
    2. Clears previous eval_history to avoid stale traces
    3. Creates a fresh eval_set (avoids duplicate scenarios)
    4. Runs adk eval with your scenarios
    5. Converts the resulting traces to agent-eval format

    After this, run `agent-eval evaluate` on the output.

    \b
    Note: ADK's built-in eval runs a limited set of metrics (hallucination,
    safety). agent-eval adds deterministic metrics (latency, tokens, cost)
    and custom LLM-as-judge metrics via the Vertex AI Evaluation service.
    This also means agent-eval is not locked to ADK — you can run evaluate
    and analyze on traces from any agent framework.
    """
    from agent_eval.cli.main import _display_banner
    from agent_eval.core.evaluator import configure_logging
    _display_banner()
    configure_logging(debug=debug)

    agent_path = Path(agent_dir).resolve()

    # ── Validation ──────────────────────────────────────────────────────────

    if not (agent_path / "agent.py").exists():
        console.print(f"\n  [red]Error:[/] No agent.py found in {agent_path}")
        console.print(f"  [dim]The --agent-dir should point to the folder containing agent.py[/]")
        sys.exit(1)

    agent_name = agent_path.name

    # Find eval directory
    if eval_dir:
        eval_path = Path(eval_dir).resolve()
    else:
        eval_path = _find_eval_dir(agent_path)
        if not eval_path:
            console.print(f"\n  [red]Error:[/] No eval/ directory found near {agent_path}")
            console.print(f"  [dim]Run `agent-eval init` first to scaffold one.[/]")
            sys.exit(1)

    from agent_eval.core.config import find_eval_files
    discovered = find_eval_files(eval_path)
    if discovered["scenarios"]:
        scenarios_file = discovered["scenarios"][0]
    else:
        console.print(f"\n  [red]Error:[/] No scenario files found in {eval_path / 'scenarios'}")
        console.print(f"  [dim]Add multi-turn rows (with history or conversation_plan) to tests/eval/dataset.jsonl[/]")
        sys.exit(1)

    session_file = eval_path / "scenarios" / "session_input.json"
    if not session_file.exists():
        console.print(f"\n  [red]Error:[/] No session input file at {session_file}")
        console.print(f"  [dim]Create session_input.json with your app_name and user_id[/]")
        sys.exit(1)

    n_scenarios = _count_scenarios(scenarios_file)

    # ── Run ID ─────────────────────────────────────────────────────────────

    if not run_id:
        default_ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        if _pauses_disabled():
            run_id = default_ts
        else:
            from rich.prompt import Prompt
            console.print()
            console.print(Panel(
                "[bold]Give this run a name[/] so you can easily find it later.\n\n"
                "Examples: [cyan]baseline[/], [cyan]v2-tool-hardening[/], [cyan]cache-optimization[/]\n\n"
                "[dim]Results will be saved to tests/eval/results/<run-id>/.\n"
                "Press Enter to use an auto-generated timestamp instead.[/]",
                title="[bold]Run ID[/]",
                border_style="blue",
                padding=(1, 2),
            ))
            run_id = Prompt.ask(
                "  Run ID",
                default=default_ts,
            ).strip()
        # Sanitize: replace spaces with hyphens, remove problematic chars
        run_id = run_id.replace(" ", "-")

    # ── Overview ────────────────────────────────────────────────────────────

    console.print(Panel(
        f"[bold]Agent:[/]      [cyan]{agent_name}[/]  [dim]({agent_path})[/]\n"
        f"[bold]Eval dir:[/]   {eval_path}\n"
        f"[bold]Scenarios:[/]  [cyan]{n_scenarios}[/] scenario{'s' if n_scenarios != 1 else ''}"
        f" in conversation_scenarios.json\n"
        f"[bold]Run ID:[/]     [cyan]{run_id}[/]"
        f"  [dim](results saved to tests/eval/results/{run_id}/)[/]\n\n"
        f"[bold]What will happen:[/]\n"
        f"  [dim]1.[/] Symlink scenario files into agent directory (for ADK)\n"
        f"  [dim]2.[/] Clear previous eval_history (avoid stale traces)\n"
        f"  [dim]3.[/] Create fresh eval_set + load scenarios (avoid duplicates)\n"
        f"  [dim]4.[/] Run ADK User Sim (LLM simulates users from your scenarios)\n"
        f"  [dim]5.[/] Convert traces to agent-eval JSONL format",
        title="[bold]Simulate[/]",
        border_style="blue",
        padding=(1, 2),
    ))
    _continue("Press Enter to start the simulation →", console=console)

    # ── Execute steps ───────────────────────────────────────────────────────

    _step_symlinks(agent_path, eval_path)

    _step_clear_history(agent_path)

    if not _step_create_eval_set(agent_name, agent_path):
        sys.exit(1)

    if not _step_run_sim(agent_name, agent_path, debug=debug):
        sys.exit(1)

    run_dir = _step_convert(agent_path, eval_path, run_id)
    if not run_dir:
        sys.exit(1)

    # ── Done ────────────────────────────────────────────────────────────────

    # Use relative paths for clean copy-pasteable commands
    cwd = Path.cwd()
    rel_run = os.path.relpath(run_dir, cwd)
    rel_metrics = os.path.relpath(eval_path / "metrics" / "metric_definitions.json", cwd)
    rel_agent = os.path.relpath(agent_path, cwd)

    console.print()
    console.print(Panel(
        f"[bold green]Simulation complete![/]\n\n"
        f"[bold]Results:[/]  {rel_run}/\n\n"
        "[dim]ADK's built-in eval covers hallucination + safety checks.\n"
        "agent-eval evaluate adds: latency, tokens, cost, cache efficiency,\n"
        "and your custom LLM-as-judge metrics from metric_definitions.json.[/]",
        title="[bold]Done[/]",
        border_style="green",
        padding=(1, 2),
    ))

    console.print()
    console.print("[bold]Next steps — copy and paste:[/]")
    console.print()
    console.print("[bold]1.[/] Run deterministic + LLM-as-judge metrics:")
    console.print()
    console.print(f"agent-eval evaluate \\")
    console.print(f"  --interaction-file {rel_run}/raw/processed_interaction_sim.jsonl \\")
    console.print(f"  --metrics-files {rel_metrics} \\")
    console.print(f"  --results-dir {rel_run}")
    console.print()
    console.print("[bold]2.[/] Generate AI-powered analysis:")
    console.print()
    console.print(f"agent-eval analyze \\")
    console.print(f"  --results-dir {rel_run} \\")
    console.print(f"  --agent-dir {rel_agent}")
    console.print()
