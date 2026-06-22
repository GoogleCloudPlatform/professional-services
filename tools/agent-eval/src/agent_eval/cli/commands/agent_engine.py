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
"""agent-eval agent-engine — streamlined Vertex AI runner for deployed Agent Engine agents.

Wraps Vertex AI's ``client.evals.create_evaluation_run`` for agents already
deployed to Reasoning Engines (Agent Starter Pack ``make backend`` flow).
This is the **streamlined** path from the docs (``evaluation-agents-client``):
inference + scoring + GCS upload happen in a single managed call.

When to use this command instead of ``agent-eval evaluate``:

- Your agent is deployed to Agent Engine (env ``AGENT_ENGINE_RESOURCE_NAME``
  is set, or ``deployment_metadata.json`` contains a real resource name).
- You want managed inference (no local FastAPI server, no traces to capture
  yourself) — Vertex calls the agent for you.
- You want a single ``dashboard_url`` to share with stakeholders.

Per the SDK-aligned plan §4.4: the dataset only needs ``prompt`` (and
optionally ``session_inputs``); no ``reference`` is required because the
managed adaptive rubrics judge quality without it.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import click
import pandas as pd
from rich.console import Console

console = Console()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _resolve_resource_name(explicit: str | None, cwd: Path) -> str | None:
    """Resolve the Agent Engine resource name from CLI arg, env, or metadata file."""
    if explicit:
        return explicit
    env_value = os.getenv("AGENT_ENGINE_RESOURCE_NAME")
    if env_value and env_value not in {"None", ""}:
        return env_value
    from agent_eval.core.path_detector import detect_execution_path

    detection = detect_execution_path(cwd)
    if detection.path == "A" and detection.agent_engine_resource:
        return detection.agent_engine_resource
    return None


def _resolve_metrics_path(metrics_path: Path) -> Path:
    """Resolve the metrics file with backward-compat fallback to legacy layouts.

    Tries the explicit/default path first, then asks ``path_resolver`` to scan
    for the canonical ``tests/eval/metrics/`` layout or any legacy ``eval/``
    folder so projects scaffolded by older versions of ``init`` keep working.
    """
    if metrics_path.exists():
        return metrics_path

    from agent_eval.core.path_resolver import find_metrics_path

    discovered = find_metrics_path(Path.cwd())
    if discovered is not None:
        return discovered
    return metrics_path


def _load_metric_definitions(metrics_path: Path) -> dict[str, dict[str, Any]]:
    """Read metric definitions JSON, returning {} if file is missing."""
    resolved = _resolve_metrics_path(metrics_path)
    if not resolved.exists():
        return {}
    if resolved != metrics_path:
        console.print(
            f"  [dim]Metrics: [/] [cyan]{resolved}[/] [dim](resolved via fallback)[/]"
        )
    try:
        data = json.loads(resolved.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        console.print(f"  [yellow]![/] Could not read {resolved}: {exc}")
        return {}
    if (
        isinstance(data, dict)
        and "metrics" in data
        and isinstance(data["metrics"], dict)
    ):
        return data["metrics"]
    return data


def _build_evaluation_run_metrics(
    metric_definitions: dict[str, dict[str, Any]],
) -> list[Any]:
    """Convert the canonical-schema metric definitions into EvaluationRunMetric objects.

    Routes EVERY entry through ``metric_factory.build_metric``, which dispatches
    on ``kind`` per ``core/metric_schema.py``. No inline construction, no
    synthetic ``{"evaluation": template}`` cargo-cult criteria — the SDK
    objects come from the same factory the local evaluator uses.

    Each built SDK metric is then wrapped via ``metric_factory.to_evaluation_run_metric``
    for ``client.evals.create_evaluation_run``:
      - LazyLoadedPrebuiltMetric (managed) → ``EvaluationRunMetric(metric=name)``
      - LLMMetric (custom_llm_judge) → ``EvaluationRunMetric(metric_config=UnifiedMetric(llm_based_metric_spec=...))``
      - Metric (computation/python_function/remote_code) → routed by the
        factory's ``to_evaluation_run_metric`` based on which custom_function
        / remote_custom_function / metric_name field is set.
    """
    from agent_eval.core import metric_factory

    run_metrics: list[Any] = []
    for name, spec in metric_definitions.items():
        if not isinstance(spec, dict):
            continue
        try:
            sdk_metric = metric_factory.build_metric(name, spec)
            run_metrics.append(metric_factory.to_evaluation_run_metric(sdk_metric))
        except Exception as exc:  # noqa: BLE001
            console.print(
                f"  [yellow]![/] Skipping [cyan]{name}[/]: failed to build SDK "
                f"metric ({type(exc).__name__}: {exc})."
            )
    return run_metrics


def _agent_info_fidelity_label(agent_info: Any, local_agent: Any) -> str:
    """Human-readable label naming which fidelity layer was used for AgentInfo.

    Layer 1 (full) — load_from_agent succeeded with full tool schemas.
    Layer 2 (manual-from-agent) — manual construction from a real local agent
        (load_from_agent failed because of the ToolContext schema bug).
    Layer 3 (minimal-from-resource) — resource_name only, no local agent.

    We can't directly tell layer 1 vs 2 from the AgentInfo object alone —
    inspect the tool_declarations field as a heuristic.
    """
    if local_agent is None:
        return "[bold yellow]layer 3[/] — minimal (resource_name only, no local introspection)"
    tool_decls = getattr(agent_info, "tool_declarations", None) or []
    if tool_decls:
        return f"[bold green]layer 1[/] — full (load_from_agent, {len(tool_decls)} tool decl(s))"
    return "[bold cyan]layer 2[/] — manual-from-agent (skipped tool schema — ADK ToolContext bug)"


def _project_for_inference(dataset: Any, vt_evals: Any) -> Any:
    """Project the dataset down to the EXACT 2-column shape the docs example uses.

    Per docs/evaluation-agents-client, ``run_inference`` accepts:

        pd.DataFrame({
            "prompt": agent_prompts,
            "session_inputs": [SessionInput(user_id=..., state=...)] * N,
        })

    Our canonical ``dataset.jsonl`` has extra columns (``kind``, ``id``,
    ``reference_data``, ``history``, ``conversation_plan``) that the autorater
    needs at scoring time but that confuse ``run_inference`` — when the full
    row was passed every inference came back as the cryptic "Failed to parse
    agent run response []" error (sessions never created).

    Also coerces ``session_inputs`` from a dict to a typed
    ``types.evals.SessionInput``. Drops ``app_name`` because the docs'
    SessionInput only has ``user_id`` + ``state`` — passing extra fields
    looks correlated with the empty-events failure.

    Logs a transparent summary of what's being sent vs held back so
    developer-users can see exactly what shape Vertex receives.
    """
    SessionInput = vt_evals.SessionInput

    rows: list = []
    dropped_si_keys: set[str] = set()
    for _, row in dataset.iterrows():
        si_raw = row.get("session_inputs")
        if isinstance(si_raw, dict):
            for k in si_raw:
                if k not in ("user_id", "state"):
                    dropped_si_keys.add(k)
            si = SessionInput(
                user_id=si_raw.get("user_id", "eval_user"),
                state=si_raw.get("state") or {},
            )
        elif si_raw is None or (
            hasattr(si_raw, "__class__") and si_raw.__class__.__name__ == "float"
        ):
            # NaN from pandas — synthesize a minimal SessionInput
            si = SessionInput(user_id="eval_user", state={})
        else:
            si = si_raw  # already a SessionInput instance
        rows.append({"prompt": row["prompt"], "session_inputs": si})

    held_back = [c for c in dataset.columns if c not in ("prompt", "session_inputs")]
    console.print(
        "  [dim]>[/] [bold]What we're sending to[/] [cyan]run_inference[/] "
        "[dim](per docs/evaluation-agents-client):[/]"
    )
    console.print(
        f"      [cyan]•[/] [bold]{len(rows)} row(s)[/] × 2 columns: "
        "[cyan]prompt[/] + [cyan]session_inputs[/] (typed [cyan]SessionInput(user_id, state)[/])"
    )
    if dropped_si_keys:
        keys = ", ".join(f"[cyan]{k}[/]" for k in sorted(dropped_si_keys))
        console.print(
            f"      [cyan]•[/] Dropped from session_inputs: {keys}  "
            "[dim](not in docs' SessionInput schema)[/]"
        )
    if held_back:
        cols = ", ".join(f"[cyan]{c}[/]" for c in held_back)
        console.print(
            f"      [cyan]•[/] Held back, merged after inference: {cols}  "
            "[dim](needed for scoring, not for invocation)[/]"
        )

    return pd.DataFrame(rows)


def _merge_inference_with_extras(inference_dataset: Any, original_df: Any) -> Any:
    """Add the extras (``reference_data``, ``id``, etc.) back onto the inference df.

    ``run_inference`` returns an ``EvaluationDataset`` (pydantic) wrapping the
    DataFrame at ``.eval_dataset_df``. We mutate that frame in place and write
    it back so ``create_evaluation_run`` still receives an EvaluationDataset.
    The autorater needs the original extras for reference-required metrics.
    Merge by row position — both DataFrames are in the same row order since we
    didn't reorder.
    """
    inference_df = getattr(inference_dataset, "eval_dataset_df", None)
    if inference_df is None:
        return inference_dataset
    extras_cols = [
        c
        for c in original_df.columns
        if c not in inference_df.columns and c not in ("prompt", "session_inputs")
    ]
    if not extras_cols:
        return inference_dataset
    extras = original_df[extras_cols].reset_index(drop=True)
    merged = pd.concat([inference_df.reset_index(drop=True), extras], axis=1)
    inference_dataset.eval_dataset_df = merged
    return inference_dataset


def _check_inference_response_health(
    inference_dataset: Any,
    *,
    abort_on_all_broken: bool = True,
) -> None:
    """Surface a clear actionable diagnostic when run_inference comes back broken.

    The dangerous failure mode: every row's ``response`` is the string
    ``"Failed to parse agent run response []"`` (Vertex's inference layer
    couldn't parse the deployed agent's events). Without this check, the user
    runs all the way through scoring + sees a "5/6 INVALID_ARGUMENT" failure
    summary that doesn't explain WHY — they'd think the metrics are broken.

    When ALL rows are broken: aborts the command (no point submitting to
    create_evaluation_run — the autorater would just score error strings).
    When SOME are broken: warns and continues so the good rows still score.

    Accepts the EvaluationDataset wrapper; reads the underlying DataFrame.
    """
    inference_df = getattr(inference_dataset, "eval_dataset_df", None)
    if inference_df is None:
        return
    response_col = None
    for candidate in ("response", "responses"):
        if candidate in getattr(inference_df, "columns", []):
            response_col = candidate
            break
    if response_col is None:
        return

    bad_marker = "Failed to parse agent run response"
    responses = inference_df[response_col].astype(str)
    n_bad = int(responses.str.contains(bad_marker, na=False).sum())
    n_total = len(responses)

    if n_bad == 0:
        return  # all good

    if n_bad < n_total:
        console.print(
            f"  [yellow]![/] {n_bad}/{n_total} row(s) came back from the deployed "
            "agent with empty events — Vertex stuffed an error in their response "
            "text. Those rows will score 0 / fail at the autorater stage."
        )
        return

    # Every row failed — abort. Continuing wastes a Vertex eval run + GCS
    # writes, and the per-item failure summary at the end will be misleading
    # (it'll blame the autorater when the real failure was upstream).
    console.print(
        f"  [red]✗[/] [bold]All {n_total} rows came back with empty events from the "
        'deployed agent.[/] [dim](Vertex captured "Failed to parse agent run response []" '
        "as the response text for every row.)[/]"
    )
    console.print()
    console.print(
        "  [bold yellow]Aborting before submission[/] — no point asking the autorater to "
        "score error strings. Fix the deployed agent first, then re-run."
    )
    console.print()
    console.print("  [bold]Most likely causes, in order:[/]")
    console.print(
        "    [cyan]1.[/] [bold]Deployment-side asyncio bug[/] — check GCP Logs Explorer for"
    )
    console.print(
        "        [cyan]Reasoning Engine[/] [dim]logs around the eval timestamp. "
        'Look for[/] [cyan]"Task ... got Future attached to a different loop"[/]'
    )
    console.print(
        '        [dim]or[/] [cyan]"Event loop is closed"[/][dim] — known ADK threading '
        "issue when tools/clients init across threads. Often fixed by re-deploying[/]"
    )
    console.print(
        "        [dim]with the latest google-adk + reinitializing clients inside async scopes.[/]"
    )
    console.print(
        "    [cyan]2.[/] [bold]Deployed agent is broken[/] — test it directly:"
    )
    console.print("        [dim]$[/] cd <agent_dir> && make playground")
    console.print(
        "    [cyan]3.[/] [bold]SDK version mismatch[/] between your deployment and agent-eval's venv —"
    )
    console.print(
        "        [dim]the deployed agent's event format doesn't match what our SDK parser expects.[/]"
    )
    console.print(
        "        [dim]Re-deploy with `make backend` to match current SDK pin.[/]"
    )
    console.print(
        "    [cyan]4.[/] [bold]Backing services unavailable[/] (Neo4j, Vector Search, etc.) —"
    )
    console.print(
        "        [dim]check the agent's logs in the Reasoning Engine console.[/]"
    )
    console.print(
        "  [dim italic]Pass --no-abort-on-broken-inference to override (rare — only if you[/]"
    )
    console.print(
        "  [dim italic]want the autorater to score the error strings explicitly).[/]"
    )
    raise click.Abort()


def _sanitize_inference_responses(inference_dataset: Any) -> Any:
    """Coerce NaN string-typed cells to empty strings.

    When the dataset contains rows with mixed schemas (e.g. some have
    ``reference`` and others don't), pandas fills the missing cells with
    ``NaN``. Vertex AI's ``CandidateResponse`` pydantic validator then
    rejects those NaN values since they aren't strings, causing
    ``create_evaluation_run`` to fail. We swap NaN → "" in the columns the
    SDK feeds into string fields.
    """
    import math

    df = getattr(inference_dataset, "eval_dataset_df", None)
    if df is None or df.empty:
        return inference_dataset

    string_columns = ("reference", "id", "response", "system_instruction")
    fixed = 0
    for col in string_columns:
        if col not in df.columns:
            continue

        def _coerce(val: Any) -> Any:
            nonlocal fixed
            if val is None:
                fixed += 1
                return ""
            if isinstance(val, float) and math.isnan(val):
                fixed += 1
                return ""
            return val

        df[col] = df[col].apply(_coerce)

    inference_dataset.eval_dataset_df = df
    if fixed:
        console.print(
            f'  [dim]Coerced {fixed} NaN/None cell(s) → "" so the SDK validator accepts them.[/]'
        )
    return inference_dataset


def _default_destination(project: str) -> str:
    """Default GCS destination for evaluation results when --dest is not given."""
    bucket = os.getenv("AGENT_EVAL_DEST_BUCKET") or f"{project}-agent-eval"
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    return f"gs://{bucket}/agent-eval/{timestamp}"


def _bucket_name_from_uri(uri: str) -> str | None:
    """Extract the bucket name from a ``gs://bucket/path`` URI."""
    if not uri.startswith("gs://"):
        return None
    rest = uri[len("gs://") :]
    return rest.split("/", 1)[0] or None


def _load_local_agent(agent_module: str | None, cwd: Path) -> Any | None:
    """Import the local ADK agent so we can build ``AgentInfo`` for the run.

    The Vertex SDK's ``create_evaluation_run`` doesn't *require* an
    ``agent_info``, but without it the managed inference path returns events
    that the SDK can't parse (the "Failed to parse agent run response []"
    error). Loading the local ``LLMAgent`` and passing
    ``AgentInfo.load_from_agent`` makes the run succeed end-to-end.

    ``agent_module`` is in ``"package.module:attribute"`` form (default
    ``"app.agent:root_agent"`` matches Agent Starter Pack). When None, we
    auto-detect via ``path_detector``: find ``agent.py``, treat its parent
    folder as the module package, add the grandparent to ``sys.path``.

    Returns ``None`` (with a warning) if loading fails — the run still goes
    through, just without the inline tool/instruction enrichment.
    """
    import importlib
    import sys

    spec = agent_module
    extra_sys_path: Path | None = None

    if spec is None:
        from agent_eval.core.path_detector import detect_execution_path

        detection = detect_execution_path(cwd)
        if not detection.local_agents:
            console.print(
                "  [yellow]![/] No local agent.py found — submitting without "
                "agent_info. Use [cyan]--agent-module pkg.module:root_agent[/] "
                "if your agent lives outside auto-detection."
            )
            return None
        agent_py = detection.local_agents[0]
        package_dir = agent_py.parent  # e.g. .../my-agent/app
        extra_sys_path = package_dir.parent  # e.g. .../my-agent
        spec = f"{package_dir.name}.{agent_py.stem}:root_agent"

    if ":" in spec:
        module_path, attr = spec.split(":", 1)
    else:
        module_path, attr = spec, "root_agent"

    if extra_sys_path is not None and str(extra_sys_path) not in sys.path:
        sys.path.insert(0, str(extra_sys_path))

    try:
        module = importlib.import_module(module_path)
        agent = getattr(module, attr)
    except ModuleNotFoundError as exc:
        # The agent's deps aren't in agent-eval's venv (common when the
        # agent has its own .venv with extras like vectorsearch / neo4j /
        # custom retrievers). Surface the dep + concrete install paths +
        # what's lost by continuing with a minimal AgentInfo.
        missing = exc.name or str(exc)
        console.print(
            f"  [yellow]![/] Couldn't import [cyan]{spec}[/] locally: "
            f"missing dependency [bold]{missing}[/]"
        )
        console.print("    [dim]Two ways to fix in your agent-eval venv:[/]")
        console.print(
            f"    [dim]  a) install just the missing dep:[/]  "
            f"[cyan]uv pip install {missing}[/]"
        )
        if extra_sys_path is not None:
            console.print(
                f"    [dim]  b) install the agent's full deps:[/]  "
                f"[cyan]uv pip install -e {extra_sys_path}[/]"
            )
        console.print(
            "    [dim]Continuing with a minimal AgentInfo "
            "(resource_name only — see below).[/]"
        )
        return None
    except ImportError as exc:
        # Top-level import worked but pulled in a sub-import that failed.
        # Same remediation as ModuleNotFoundError.
        console.print(f"  [yellow]![/] Couldn't import [cyan]{spec}[/]: {exc}")
        console.print(
            "    [dim]Looks like a transitive import error. Try installing the "
            "agent's deps in agent-eval's venv:[/]"
        )
        if extra_sys_path is not None:
            console.print(f"    [cyan]uv pip install -e {extra_sys_path}[/]")
        console.print(
            "    [dim]Continuing with a minimal AgentInfo (resource_name only).[/]"
        )
        return None
    except (AttributeError, Exception) as exc:  # noqa: BLE001
        console.print(f"  [yellow]![/] Could not load [cyan]{spec}[/]: {exc}")
        console.print(
            "    [dim]Wrong path? Override with[/] "
            "[cyan]--agent-module pkg.module:attr[/][dim]. "
            "Continuing with a minimal AgentInfo.[/]"
        )
        return None

    console.print(f"  [dim]Local agent:[/] [cyan]{spec}[/]")
    return agent


def _build_agent_info(
    vt_evals: Any, agent: Any | None, resource_name: str
) -> Any | None:
    """Build an ``AgentInfo`` for ``create_evaluation_run``.

    Three layers of fidelity:
      1. Full — ``AgentInfo.load_from_agent(agent, ...)`` walks ``agent.tools``
         and produces JSON schemas. Highest fidelity for tool-trace metrics.
      2. Manual-from-agent — ``AgentInfo(name, instruction, ...)`` from agent
         attributes, with empty ``tool_declarations`` (skipped because ADK's
         ``ToolContext`` isn't JSON-schema-serializable).
      3. Minimal-from-resource — ``AgentInfo(name="root_agent", ...)`` with
         only the resource_name. Used when ``agent`` is None (local import
         failed because the agent's deps aren't in agent-eval's venv). Tool-
         trace-based metrics may score against incomplete data, but the eval
         run still goes through with proper event parsing.

    Also handles the schema rename across SDK versions: older releases use
    ``agent_resource_name`` + ``instruction`` + ``tool_declarations``, while
    newer releases use ``agents`` + ``root_agent_id``.
    """
    AgentInfo = vt_evals.AgentInfo

    # Layer 1: Full SDK helper (only when we have a real agent)
    if agent is not None:

        def _try_load() -> Any | None:
            try:
                return AgentInfo.load_from_agent(
                    agent, agent_resource_name=resource_name
                )
            except TypeError:
                try:
                    return AgentInfo.load_from_agent(agent)
                except Exception:
                    return None
            except Exception:
                return None

        info = _try_load()
        if info is not None:
            return info

    # Layer 2 / 3: Manual construction
    fields = set(AgentInfo.model_fields.keys())
    name = (
        getattr(agent, "name", None) or "root_agent"
        if agent is not None
        else "root_agent"
    )
    common: dict[str, Any] = {"name": name}
    if "agent_resource_name" in fields:
        common["agent_resource_name"] = resource_name
    if "instruction" in fields:
        common["instruction"] = (
            (getattr(agent, "instruction", None) or "") if agent is not None else ""
        )
    if "description" in fields:
        common["description"] = (
            (getattr(agent, "description", None) or "") if agent is not None else ""
        )
    if "tool_declarations" in fields:
        common["tool_declarations"] = []
    if "root_agent_id" in fields:
        common["root_agent_id"] = name

    try:
        info = AgentInfo(**common)
        if agent is not None:
            console.print(
                "  [dim]Built AgentInfo manually (skipped tool schema — "
                "ADK ToolContext isn't JSON-schema-serializable).[/]"
            )
        else:
            console.print(
                "  [dim]> Built minimal AgentInfo from resource_name only "
                "(no local introspection).[/]"
            )
            console.print(
                "  [dim]  Vertex will call the deployed agent and parse events "
                "server-side. Custom metrics that read tool traces or sub-agent[/]"
            )
            console.print(
                "  [dim]  routing may score against incomplete data — install "
                "the agent's deps locally to fix.[/]"
            )
        return info
    except Exception as exc:  # noqa: BLE001
        console.print(
            f"  [yellow]![/] Could not construct AgentInfo: {exc}. "
            f"Submitting without agent_info."
        )
        return None


# Vertex AI eval supports `location="global"` (and may add other multi-region
# values), but GCS rejects those for STANDARD-class buckets. Map non-region
# Vertex locations to a sane GCS region. Override with `--bucket-location`.
_VERTEX_LOCATIONS_NOT_VALID_FOR_GCS = {"global"}
_DEFAULT_BUCKET_REGION = "us-central1"


def _resolve_bucket_location(vertex_location: str, override: str | None) -> str:
    """Pick a GCS-valid location for bucket creation.

    Order: explicit ``--bucket-location`` override → Vertex location if it's
    a real region → ``us-central1`` fallback for ``global``/multi-region.
    """
    if override:
        return override
    if vertex_location in _VERTEX_LOCATIONS_NOT_VALID_FOR_GCS:
        return _DEFAULT_BUCKET_REGION
    return vertex_location


def _ensure_bucket_exists(
    uri: str,
    project: str,
    vertex_location: str,
    bucket_location_override: str | None = None,
) -> None:
    """Create the destination bucket if it doesn't already exist.

    First-time users get ``BucketNotFoundException`` from
    ``create_evaluation_run`` because the SDK doesn't auto-provision the
    bucket. We do it here so the command works end-to-end on the first run.

    Bucket location is decoupled from Vertex eval location because
    ``location="global"`` (the Gemini 3+ default) is rejected by GCS for
    STANDARD-class buckets — that's the failure that hit the 2026-04-23
    customer demo on first try.
    """
    bucket_name = _bucket_name_from_uri(uri)
    if not bucket_name:
        return

    try:
        from google.api_core.exceptions import Forbidden, GoogleAPICallError
        from google.cloud import storage
    except ImportError:
        return  # storage not installed — let the SDK error speak for itself.

    storage_client = storage.Client(project=project)
    try:
        existing = storage_client.lookup_bucket(bucket_name)
    except Forbidden as exc:
        console.print(
            f"  [yellow]![/] Cannot check bucket [cyan]gs://{bucket_name}[/]: "
            f"{exc.message if hasattr(exc, 'message') else exc}. "
            f"Continuing — the SDK will fail loudly if the bucket isn't usable."
        )
        return

    if existing is not None:
        console.print(f"  [green]>[/] Using bucket [cyan]gs://{bucket_name}[/]")
        return

    bucket_location = _resolve_bucket_location(
        vertex_location, bucket_location_override
    )
    if bucket_location != vertex_location:
        console.print(
            f"  [dim]Bucket [cyan]gs://{bucket_name}[/] not found — creating in "
            f"[cyan]{bucket_location}[/] (Vertex eval location is [cyan]{vertex_location}[/], "
            f"but GCS doesn't accept that for STANDARD buckets)...[/]"
        )
    else:
        console.print(
            f"  [dim]Bucket [cyan]gs://{bucket_name}[/] not found — creating in {bucket_location}...[/]"
        )
    try:
        storage_client.create_bucket(bucket_name, location=bucket_location)
    except Forbidden as exc:
        console.print(
            f"  [red]Cannot create bucket [cyan]gs://{bucket_name}[/]:[/] {exc}\n"
            f"  [dim]Grant your account [cyan]roles/storage.admin[/] on project "
            f"[cyan]{project}[/], or pass [cyan]--dest gs://<existing-bucket>/path[/].[/]"
        )
        raise click.Abort() from None
    except GoogleAPICallError as exc:
        console.print(f"  [red]create_bucket failed:[/] {exc}")
        raise click.Abort() from None
    console.print(f"  [green]>[/] Created bucket [cyan]gs://{bucket_name}[/]")


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------


@click.command(name="agent-engine")
@click.option(
    "--dataset",
    "dataset_path",
    type=click.Path(exists=False, dir_okay=False, path_type=Path),
    default=None,
    help=(
        "Unified dataset JSONL. Default resolves relative to the nearest "
        "project root: <project>/tests/eval/dataset.jsonl. Pass explicitly "
        "to use a different file."
    ),
)
@click.option(
    "--metrics",
    "metrics_path",
    type=click.Path(exists=False, dir_okay=False, path_type=Path),
    default=None,
    help=(
        "Metric definitions file. Default resolves to "
        "<project>/tests/eval/metrics/metric_definitions.json."
    ),
)
@click.option(
    "--resource-name",
    default=None,
    help="Agent Engine resource name. Defaults to AGENT_ENGINE_RESOURCE_NAME or auto-detection.",
)
@click.option(
    "--dest",
    default=None,
    help="GCS destination URI for results. Defaults to gs://<project>-agent-eval/<timestamp>/",
)
@click.option(
    "--project",
    default=None,
    help="GCP project ID. Defaults to GOOGLE_CLOUD_PROJECT.",
)
@click.option(
    "--location",
    default=None,
    help="Vertex AI eval location. Defaults to GOOGLE_CLOUD_LOCATION or us-central1.",
)
@click.option(
    "--bucket-location",
    default=None,
    help=(
        "GCS region for the destination bucket if it needs to be created. "
        "Defaults to --location, or us-central1 if --location is 'global' "
        "(GCS doesn't accept 'global' for STANDARD-class buckets)."
    ),
)
@click.option(
    "--timeout",
    type=int,
    default=900,
    show_default=True,
    help="Seconds to wait for the run to finish before giving up (use --no-wait to skip).",
)
@click.option(
    "--no-wait",
    is_flag=True,
    help="Submit the run and exit immediately. Print the resource name + dashboard URL.",
)
@click.option(
    "--agent-module",
    default=None,
    help=(
        "Local agent import path in 'package.module:attribute' form "
        "(default: auto-detect via agent.py, attribute 'root_agent'). "
        "Required by the SDK's v1beta1 inference path to build AgentInfo."
    ),
)
@click.option(
    "--no-abort-on-broken-inference",
    is_flag=True,
    help=(
        "Don't abort when EVERY row's inference comes back with the "
        "'Failed to parse agent run response []' error (which usually means "
        "the deployed agent is broken). Default behavior is to stop before "
        "wasting a Vertex eval run on error strings — pass this to override "
        "and let the autorater score them anyway."
    ),
)
@click.option(
    "--debug",
    is_flag=True,
    help="Show full SDK logs (otherwise suppressed for clean output).",
)
def agent_engine(
    dataset_path: Path,
    metrics_path: Path,
    resource_name: str | None,
    dest: str | None,
    project: str | None,
    location: str | None,
    bucket_location: str | None,
    timeout: int,
    no_wait: bool,
    agent_module: str | None,
    no_abort_on_broken_inference: bool,
    debug: bool,
) -> None:
    """Run a streamlined evaluation against an Agent Engine deployment.

    Uses ``client.evals.create_evaluation_run()`` — Vertex handles inference,
    scoring, and GCS upload in one managed call. Prints the dashboard URL
    when complete.
    """
    from agent_eval.cli.main import _display_banner

    _display_banner()

    if not debug:
        import logging

        for noisy in ("google", "vertexai", "google.auth", "urllib3"):
            logging.getLogger(noisy).setLevel(logging.WARNING)

    project = project or os.getenv("GOOGLE_CLOUD_PROJECT")
    location = location or os.getenv("GOOGLE_CLOUD_LOCATION") or "us-central1"

    if not project:
        console.print(
            "  [red]GOOGLE_CLOUD_PROJECT is not set.[/] Run `agent-eval init` first."
        )
        raise click.Abort()

    # Resolve --dataset / --metrics relative to the nearest project root if
    # not given as an explicit cwd-relative or absolute path. Lets users run
    # `agent-eval agent-engine` from anywhere inside a project tree.
    from agent_eval.core.path_resolver import resolve_relative_to_project

    if dataset_path is None or not dataset_path.is_absolute():
        resolved_dataset = resolve_relative_to_project(
            "tests/eval/dataset.jsonl",
            explicit=dataset_path,
        )
        if resolved_dataset is None:
            shown = dataset_path or Path("tests/eval/dataset.jsonl")
            console.print(
                f"  [red]Dataset not found:[/] {shown}\n"
                f"  [dim]Looked in cwd and walked up to the nearest pyproject.toml. "
                f"Pass --dataset <path> or run from a project that has "
                f"tests/eval/dataset.jsonl.[/]"
            )
            raise click.Abort()
        dataset_path = resolved_dataset

    if metrics_path is None or not metrics_path.is_absolute():
        resolved_metrics = resolve_relative_to_project(
            "tests/eval/metrics/metric_definitions.json",
            explicit=metrics_path,
        )
        if resolved_metrics is None:
            shown = metrics_path or Path("tests/eval/metrics/metric_definitions.json")
            console.print(
                f"  [red]Metrics file not found:[/] {shown}\n"
                f"  [dim]Pass --metrics <path> or scaffold via `agent-eval init`.[/]"
            )
            raise click.Abort()
        metrics_path = resolved_metrics

    resolved = _resolve_resource_name(resource_name, Path.cwd())
    if not resolved:
        console.print(
            "  [red]No Agent Engine resource name found.[/]\n"
            "  [dim]Set AGENT_ENGINE_RESOURCE_NAME, pass --resource-name, or deploy via[/]\n"
            "  [dim]  uvx agent-starter-pack enhance --adk -d agent_engine && make backend[/]"
        )
        raise click.Abort()

    console.print()
    console.print(
        "  [bold]Agent Engine — streamlined eval against the deployed agent[/]"
    )
    console.print(f"  [dim]Resource:[/] [cyan]{resolved}[/]")
    console.print(f"  [dim]Dataset: [/] [cyan]{dataset_path}[/]")
    console.print(
        f"  [dim]Project: [/] [cyan]{project}[/] [dim](location: {location})[/]"
    )
    console.print(
        "  [yellow]⚠[/] [dim]This eval hits the[/] [bold]deployed[/] [dim]agent above — "
        "if you've changed[/] [cyan]agent.py[/] [dim]since the last[/] [cyan]make backend[/][dim], "
        "re-deploy first or you'll evaluate the stale version.[/]"
    )

    # Lazy imports — keep CLI startup snappy.
    try:
        import pandas as pd
        from google.genai.types import HttpOptions
        from vertexai import Client
        from vertexai._genai import types as vt
        from vertexai._genai.types import evals as vt_evals
    except ImportError as exc:
        console.print(f"  [red]Missing dependency:[/] {exc}")
        raise click.Abort() from None

    dataset = pd.read_json(dataset_path, lines=True)
    if "prompt" not in dataset.columns:
        console.print(
            f"  [red]Dataset {dataset_path} is missing the required `prompt` column.[/]"
        )
        raise click.Abort()

    # Agent Engine's `create_evaluation_run` is single-turn only — it can't
    # drive a multi-turn UserSim flow against the deployed agent. Filter the
    # unified dataset to single-turn rows and tell the user clearly which
    # rows we're skipping + how to score them (`agent-eval simulate`).
    #
    # Use the canonical detector from dataset_io (reads `kind` first, falls
    # back to field-presence). The pandas-mask version this replaces had a
    # latent bug: ``bool(NaN) == True`` (NaN is a non-zero float), so any
    # row missing the `conversation_plan` column was wrongly classified as
    # multi-turn. After the kind+id rollout (2026-05-02) every row has
    # explicit `kind`, but the canonical detector also handles legacy
    # rows without kind correctly via field-presence inference.
    from agent_eval.core.dataset_io import is_multi_turn as _is_mt

    row_dicts = dataset.to_dict(orient="records")
    multi_turn_mask = pd.Series([_is_mt(r) for r in row_dicts], index=dataset.index)
    n_multi = int(multi_turn_mask.sum())
    if n_multi:
        console.print(
            f"  [yellow]Skipping {n_multi} multi-turn row(s)[/] — Agent Engine "
            f"is single-turn only.\n"
            f"  [dim]Score those with: agent-eval simulate --agent-dir <local source>[/]"
        )
        dataset = dataset[~multi_turn_mask].reset_index(drop=True)
        if dataset.empty:
            console.print(
                "  [red]No single-turn rows to evaluate.[/] All rows in this "
                "dataset are multi-turn. Use `agent-eval simulate` instead."
            )
            raise click.Abort()

    metric_defs = _load_metric_definitions(metrics_path)
    run_metrics = _build_evaluation_run_metrics(metric_defs)

    if not run_metrics:
        # Fall back to the docs-recommended starter set so the command
        # always does something useful even before the user defines metrics.
        console.print(
            "  [dim]No metric_definitions.json found — falling back to GENERAL_QUALITY default.[/]"
        )
        run_metrics = [
            vt.EvaluationRunMetric(metric=vt.RubricMetric.GENERAL_QUALITY.name),
        ]

    destination = dest or _default_destination(project)
    console.print(f"  [dim]Dest:    [/] [cyan]{destination}[/]")

    _ensure_bucket_exists(destination, project, location, bucket_location)

    # The docs' evaluation-agents-client pattern requires v1beta1 — the
    # default API version returns events without `content.parts`, which the
    # SDK then filters away to an empty list and reports as
    # "Failed to parse agent run response []".
    client = Client(
        project=project,
        location=location,
        http_options=HttpOptions(api_version="v1beta1"),
    )

    # Suppress noisy [INFO] logs from the customer's agent at import time
    # (their agent_config_loader / graph_tools / retrievers all log freely).
    # The user wants a clean signal — they're not debugging the agent here.
    import logging as _logging

    _prev_disable = _logging.root.manager.disable
    _logging.disable(_logging.WARNING)
    try:
        local_agent = _load_local_agent(agent_module, Path.cwd())
    finally:
        _logging.disable(_prev_disable)

    # ALWAYS build agent_info — even with local_agent=None we get a minimal
    # AgentInfo (resource_name + name only). The docs' pattern requires
    # agent_info; submitting None makes Vertex fall back to a code path that
    # can't parse the deployed agent's events properly and emits the cryptic
    # "Failed to parse agent run response []" error.
    agent_info = _build_agent_info(vt_evals, local_agent, resolved)

    # Suppress the SDK's ExperimentalWarning noise — every create_evaluation_run
    # / create_evaluation_item / create_evaluation_set call emits one and they
    # bury actual eval output. The SDK is preview-tier; we know.
    import warnings as _warnings

    _warnings.filterwarnings(
        "ignore",
        category=Warning,
        message=".*evals\\..*module is experimental.*",
    )

    console.print()
    console.rule("[dim]Inference[/]", style="grey50", align="left")
    console.print("  [bold]Calling the deployed agent for each row...[/]")

    # Project the dataset down to the EXACT shape the docs example uses for
    # run_inference: a 2-column DataFrame with `prompt` + typed
    # `types.evals.SessionInput`. Our canonical dataset.jsonl has extra
    # columns (`kind`, `id`, `reference_data`, etc.) that the autorater
    # needs at scoring time but that confuse run_inference — when we sent
    # the full row, every inference came back as the cryptic "Failed to
    # parse agent run response []" error (sessions never created).
    inference_input = _project_for_inference(dataset, vt_evals)

    try:
        inference_df = client.evals.run_inference(agent=resolved, src=inference_input)
    except Exception as exc:  # noqa: BLE001
        console.print(f"  [red]run_inference failed:[/] {exc}")
        raise click.Abort() from None

    # The SDK's CandidateResponse pydantic model rejects rows whose response
    # text isn't a string (None / non-text content like raw tool calls).
    # Coerce to empty string so create_evaluation_run can still score them.
    inference_df = _sanitize_inference_responses(inference_df)

    # Merge the extras (reference_data, id, etc.) back so create_evaluation_run
    # has what scoring metrics need.
    inference_df = _merge_inference_with_extras(inference_df, dataset)

    # If EVERY row's inference came back as the "Failed to parse agent run
    # response []" error, the autorater will just score those error strings
    # (uselessly). Surface a clear actionable diagnostic instead of letting
    # the user hit the per-item failure summary at the end with no context.
    _check_inference_response_health(inference_df)

    console.print()
    console.rule("[dim]Submission[/]", style="grey50", align="left")

    create_kwargs: dict[str, Any] = {
        "dataset": inference_df,
        "metrics": run_metrics,
        "dest": destination,
    }
    if agent_info is not None:
        create_kwargs["agent_info"] = agent_info
        # Newer SDK (>= 1.143) requires a separate ``agent`` kwarg to link
        # the run back to the deployed Reasoning Engine. Older releases
        # carry that on ``agent_info.agent_resource_name`` instead — pass
        # ``agent`` only if the SDK accepts it.
        import inspect as _inspect

        run_sig = _inspect.signature(client.evals.create_evaluation_run)
        if "agent" in run_sig.parameters:
            create_kwargs["agent"] = resolved

    # Transparent summary of what create_evaluation_run is about to receive,
    # so developer-users can confirm metrics + agent_info fidelity + dest
    # without inferring it from kwargs.
    n_managed = sum(
        1
        for m in run_metrics
        if type(m).__name__ == "EvaluationRunMetric"
        and getattr(m, "metric", None)
        and not getattr(m, "metric_config", None)
    )
    n_custom = len(run_metrics) - n_managed
    agent_info_layer = (
        "none — submitting without agent_info"
        if agent_info is None
        else _agent_info_fidelity_label(agent_info, local_agent)
    )
    console.print(
        "  [dim]>[/] [bold]What we're submitting to[/] [cyan]create_evaluation_run[/]:"
    )
    _inf_df = getattr(inference_df, "eval_dataset_df", inference_df)
    console.print(
        f"      [cyan]•[/] [bold]dataset[/]: {len(_inf_df)} row(s) "
        f"({len(_inf_df.columns)} column(s) — inference outputs + extras merged back)"
    )
    console.print(
        f"      [cyan]•[/] [bold]metrics[/]: {len(run_metrics)} "
        f"([bold]{n_managed}[/] managed + [bold]{n_custom}[/] custom_llm_judge)"
    )
    console.print(f"      [cyan]•[/] [bold]agent_info[/]: {agent_info_layer}")
    console.print(f"      [cyan]•[/] [bold]dest[/]: [cyan]{destination}[/]")

    console.print()
    console.print("  [bold]Submitting evaluation run...[/]")
    try:
        run = client.evals.create_evaluation_run(**create_kwargs)
    except Exception as exc:  # noqa: BLE001 — surface SDK errors with context
        console.print(f"  [red]create_evaluation_run failed:[/] {exc}")
        raise click.Abort() from None

    console.print("  [green]✓[/] Evaluation run submitted.")
    run_name = getattr(run, "name", None)
    if run_name:
        console.print(f"  [dim]Run:[/]      [cyan]{run_name}[/]")

    if no_wait:
        _print_dashboard_url(run, project, location)
        console.print(f"  [dim]GCS:[/]      [cyan]{destination}[/]")
        return

    console.print()
    console.rule("[dim]Scoring[/]", style="grey50", align="left")
    final_run = _wait_for_run(client, run, timeout=timeout)
    state = getattr(final_run, "state", None)
    state_value = getattr(state, "value", state)

    console.print()
    console.rule("[dim]Result[/]", style="grey50", align="left")
    if str(state_value).upper() == "SUCCEEDED":
        console.print("  [green]✓[/] Run [bold]SUCCEEDED[/].")
    elif str(state_value).upper() in {"FAILED", "CANCELLED"}:
        console.print(f"  [red]✗[/] Run finished with state [bold]{state_value}[/].")
        error = getattr(final_run, "error", None)
        if error:
            _summarize_run_errors(error)
    else:
        console.print(
            f"  [yellow]![/] Timed out after {timeout}s — last state: [bold]{state_value}[/]. "
            f"Re-run with [cyan]--timeout <seconds>[/] or check the dashboard."
        )

    console.print()
    _print_dashboard_url(final_run, project, location)
    console.print(f"  [dim]GCS:[/]      [cyan]{destination}[/]")


def _summarize_run_errors(error: Any) -> None:
    """Parse Vertex's per-item error blob and surface a structured summary.

    The raw error message is a single string with `Item <id>: <code>: <msg>`
    entries comma-separated. Bucket them by error class so the user sees
    "4 INTERNAL + 1 INVALID_ARGUMENT" instead of a wall of opaque IDs.
    Also surfaces a one-line debug suggestion per known class.
    """
    import re

    msg = str(getattr(error, "message", error))
    # Each item entry looks like: "Item <id>: <CODE>: <details>" — split on
    # the leading "Item <digits>:" boundary to get one record per row.
    items = re.findall(
        r"Item\s+\d+:\s+([A-Z_]+):\s*(.*?)(?=,\s*\\?n?Item\s+\d+:|,?\s*cause=null$|$)",
        msg,
    )
    if not items:
        # Couldn't parse — fall back to the raw message
        console.print(f"  [dim]Error:[/] {msg[:600]}{'…' if len(msg) > 600 else ''}")
        return

    from collections import Counter

    by_code: Counter = Counter(code for code, _ in items)
    sample_by_code: dict[str, str] = {}
    for code, detail in items:
        if code not in sample_by_code:
            sample_by_code[code] = detail.strip()

    n_total = len(items)
    console.print(
        f"  [bold]Per-item error summary[/] [dim]({n_total} item(s) failed):[/]"
    )
    for code, count in by_code.most_common():
        bar = f"  [red]{count}/{n_total}[/]"
        sample = sample_by_code[code]
        if code == "INTERNAL":
            console.print(
                f"{bar}  [bold]INTERNAL[/] — Vertex server-side error, opaque to us. "
                "[dim]Often transient (retry) or autorater rate-limit / content-filter.[/]"
            )
        elif code == "INVALID_ARGUMENT" and "Error parsing JSON" in sample:
            console.print(
                f"{bar}  [bold]INVALID_ARGUMENT[/] — autorater wrote Markdown instead of JSON, "
                "[dim]Vertex's score-extractor failed.[/]"
            )
            console.print(
                "        [dim]Known SDK quirk: custom_llm_judge prompts don't always force JSON. "
                "If persistent, decompose the metric or switch to a managed rubric.[/]"
            )
        elif code == "INVALID_ARGUMENT":
            console.print(
                f"{bar}  [bold]INVALID_ARGUMENT[/] — [dim]{sample[:200]}{'…' if len(sample) > 200 else ''}[/]"
            )
        elif code == "FAILED_PRECONDITION":
            console.print(
                f"{bar}  [bold]FAILED_PRECONDITION[/] — [dim]{sample[:200]}{'…' if len(sample) > 200 else ''}[/]"
            )
        else:
            console.print(
                f"{bar}  [bold]{code}[/] — [dim]{sample[:200]}{'…' if len(sample) > 200 else ''}[/]"
            )

    console.print(
        "  [dim italic]Open the dashboard URL below for per-row trace + the autorater's full output.[/]"
    )


def _print_dashboard_url(run: Any, project: str, location: str) -> None:
    """Print the dashboard URL, falling back to a constructed console URL."""
    dashboard_url = getattr(run, "dashboard_url", None)
    if not dashboard_url:
        run_name = getattr(run, "name", None)
        if run_name:
            short = run_name.split("/")[-1]
            dashboard_url = (
                f"https://console.cloud.google.com/vertex-ai/evaluations/"
                f"evaluation-runs/{short};location={location}?project={project}"
            )
    if dashboard_url:
        console.print(f"  [bold]View results:[/] [cyan]{dashboard_url}[/]")


def _wait_for_run(client: Any, run: Any, *, timeout: int) -> Any:
    """Poll get_evaluation_run until terminal state or timeout."""
    import time

    from vertexai._genai.types import EvaluationRunState

    terminal = {
        EvaluationRunState.SUCCEEDED,
        EvaluationRunState.FAILED,
        EvaluationRunState.CANCELLED,
    }
    name = getattr(run, "name", None)
    if not name:
        return run

    console.print(
        f"  [bold]Waiting for evaluation to finish[/] [dim](timeout {timeout}s)...[/]"
    )
    deadline = time.time() + timeout
    last_state: Any = None
    while time.time() < deadline:
        try:
            run = client.evals.get_evaluation_run(name=name)
        except Exception as exc:  # noqa: BLE001
            console.print(
                f"  [yellow]![/] get_evaluation_run failed (will retry): {exc}"
            )
            time.sleep(10)
            continue

        state = getattr(run, "state", None)
        if state != last_state:
            console.print(f"  [dim]state = {getattr(state, 'value', state)}[/]")
            last_state = state
        if state in terminal:
            return run
        time.sleep(10)
    return run
