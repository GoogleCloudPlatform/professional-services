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
"""agent-eval setup — one-time Google Cloud env preparation.

Run this BEFORE `agent-starter-pack create`, `agent-eval init`, or any other
command that talks to Vertex AI / Cloud Build. It walks through six numbered
steps, each one idempotent — re-running on a fully-set-up project skips work
that's already done.

Steps:
  1. Active gcloud account (must be a personal account, not gce-sa@…)
  2. Application Default Credentials (the file at ~/.config/gcloud/…)
  3. Project + location + .env
  4. Foundation APIs (Service Usage, Resource Manager, Vertex AI, IAM)
  5. Autorater IAM binding (offers to run it for you)
  6. Agent Starter Pack APIs (Cloud Build, Cloud Run, Artifact Registry — opt-in)
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple

import click
import questionary
from rich.console import Console
from rich.rule import Rule

from agent_eval.cli.commands.init import _PAUSE_LONG, _pause

console = Console()

# ── Step definitions ────────────────────────────────────────────────────────

_FOUNDATION_APIS: List[Tuple[str, str]] = [
    (
        "serviceusage.googleapis.com",
        "Required to enable any other API on the project — must come first.",
    ),
    (
        "cloudresourcemanager.googleapis.com",
        "Project IAM, metadata reads, and the autorater binding in Step 5.",
    ),
    (
        "aiplatform.googleapis.com",
        "Where the eval metrics and Gemini analysis actually run.",
    ),
    (
        "iam.googleapis.com",
        "Required for the autorater service-account binding in Step 5.",
    ),
]

_ASP_APIS: List[Tuple[str, str]] = [
    (
        "cloudbuild.googleapis.com",
        "ASP CI/CD pipelines (the `google_cloud_build` runner choice).",
    ),
    ("run.googleapis.com", "ASP `-d cloud_run` deployment target."),
    (
        "artifactregistry.googleapis.com",
        "Where ASP pushes the container images Cloud Build produces.",
    ),
]

# ── Small helpers ───────────────────────────────────────────────────────────


def _step(number: int, title: str, *subtitles: str) -> None:
    """Print a clean, numbered step header."""
    console.print()
    console.print(Rule(style="dim"))
    console.print()
    console.print(f"  [bold]Step {number} — {title}[/]")
    for sub in subtitles:
        console.print(f"  [dim]{sub}[/]")
    _pause()


def _ok(message: str) -> None:
    console.print(f"  [green]>[/] {message}")


def _warn(message: str) -> None:
    console.print(f"  [yellow]![/] {message}")


def _hint(message: str) -> None:
    console.print(f"  [dim]{message}[/]")


def _after_failure(action_label: str) -> str:
    """Ask the user whether to retry, skip, or exit after a step failure.

    Returns one of: 'retry' | 'skip' | 'exit'. Falls back to 'exit' if the user
    cancels the prompt (Ctrl-C → questionary returns None) so we never silently
    blunder forward with broken auth state.
    """
    console.print()
    answer = questionary.select(
        f"  {action_label} failed. What now?",
        choices=[
            questionary.Choice("Try again", value="retry"),
            questionary.Choice(
                "Skip this step (I'll fix it manually before re-running)", value="skip"
            ),
            questionary.Choice("Exit setup", value="exit"),
        ],
        default="retry",  # matches the Choice value, not the label
    ).ask()
    return answer or "exit"


def _abort_setup() -> None:
    """Print a clean exit banner and abort the click command."""
    console.print()
    _hint("Setup aborted. Re-run `agent-eval setup` after fixing the issue above.")
    raise click.Abort()


def _adc_file_path() -> Path:
    """Return the canonical path to the ADC file for the current OS."""
    # NOTE: walrus operators (`:=`) avoided here because the upstream
    # PSO CI's pyflakes can't parse them and crashes the lint.
    path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if path:
        return Path(path)
    config_dir = os.environ.get("CLOUDSDK_CONFIG")
    if config_dir:
        return Path(config_dir) / "application_default_credentials.json"
    if os.name == "nt":
        return (
            Path(os.environ.get("APPDATA", ""))
            / "gcloud"
            / "application_default_credentials.json"
        )
    return Path.home() / ".config" / "gcloud" / "application_default_credentials.json"


def _adc_account(path: Path) -> Optional[str]:
    """Identifier for the ADC file, or None if unreadable / unknown structure.

    Modern user ADC files (`type: "authorized_user"`) are just a refresh token —
    they do NOT carry an email. Returns "" in that case so the caller can tell
    "valid user creds, nothing to compare against" apart from "couldn't parse
    the file" (which returns None and triggers re-login).

    Service-account JSON keys (`type: "service_account"`) do carry `client_email`.
    """
    try:
        with path.open("r") as fh:
            data = json.load(fh)
    except (OSError, ValueError):
        return None
    cred_type = data.get("type", "")
    if cred_type == "service_account":
        return data.get("client_email") or ""
    if cred_type == "authorized_user":
        # Older gcloud versions sometimes populated `account`; modern ones don't.
        return data.get("account") or ""
    # Unknown structure — treat as unreadable unless something email-shaped is there.
    return data.get("account") or data.get("client_email") or None


def _active_account() -> str:
    """Return the currently active gcloud account email (or empty string)."""
    try:
        result = subprocess.run(
            ["gcloud", "config", "get-value", "account"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        account = (result.stdout or "").strip()
        return "" if account in ("", "(unset)") else account
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return ""


def _is_service_account(account: str) -> bool:
    return account.endswith(".gserviceaccount.com") or account.startswith("gce-sa@")


# Sentinel returned by gcloud helpers to tell the caller *why* a check failed,
# so the caller can either prompt the user to re-auth or surface the real error.
class _GcloudFailure:
    __slots__ = ("kind", "message")

    def __init__(self, kind: str, message: str = "") -> None:
        # kind: "missing" | "reauth" | "permission" | "timeout" | "other"
        self.kind = kind
        self.message = message


_REAUTH_PATTERNS = (
    "reauthentication failed",
    "reauthentication required",
    "there was a problem refreshing your current auth tokens",
    "credentials are no longer valid",
    "invalid_grant",
    "your credentials are invalid",
)


def _classify_stderr(err: str) -> str:
    """Decide whether a gcloud stderr blob is reauth, permission, or generic."""
    lower = (err or "").lower()
    if any(p in lower for p in _REAUTH_PATTERNS):
        return "reauth"
    if "permission_denied" in lower or "does not have permission" in lower:
        return "permission"
    return "other"


def _token_valid() -> bool:
    """True if `gcloud auth print-access-token` succeeds.

    Cheaper than any API call and produces an unambiguous reauth error when
    the cached refresh token has expired.
    """
    try:
        result = subprocess.run(
            ["gcloud", "auth", "print-access-token"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _ensure_session(account: str, *, auto_approve: bool) -> None:
    """Catch expired-token state right after Step 1 and offer to re-auth.

    Step 1 only looks at `gcloud config get-value account` (a local read);
    it doesn't notice that the cached OAuth refresh token has expired. The
    next API call (Step 4) was the one that surfaced the failure — and only
    as a misleading "gcloud not available" skip. We pre-flight here so the
    user gets prompted *before* the per-step work fans out.
    """
    if not account or _token_valid():
        return

    _warn("Your gcloud session has expired (cached token can't refresh).")
    _hint("Every API check below would fail until you re-auth.")

    if auto_approve:
        _hint("Run:  gcloud auth login --update-adc")
        return

    if not questionary.confirm(
        "  Run `gcloud auth login --update-adc` now?",
        default=True,
    ).ask():
        return

    while True:
        try:
            subprocess.run(["gcloud", "auth", "login", "--update-adc"], check=True)
            if _token_valid():
                _ok("Session refreshed.")
                return
            _warn("Login completed but token check still fails.")
        except subprocess.CalledProcessError as e:
            _warn("gcloud auth login failed.")
            err = (e.stderr or b"").decode().strip() if e.stderr else ""
            if err:
                _hint(err.splitlines()[-1][:300])
        except FileNotFoundError:
            _warn("gcloud not on PATH — install the SDK before continuing.")
            return

        choice = _after_failure("gcloud auth login")
        if choice == "retry":
            continue
        if choice == "exit":
            _abort_setup()
        return  # skip


def _check_api_enabled(project: str, api: str):
    """Return True/False if known, otherwise a `_GcloudFailure` describing why.

    Distinguishing "gcloud isn't on PATH" from "gcloud ran but the call
    failed" matters: the first means abort the step, the second usually
    means re-auth or grant a permission.
    """
    try:
        result = subprocess.run(
            [
                "gcloud",
                "services",
                "list",
                "--enabled",
                f"--project={project}",
                "--format=value(config.name)",
                f"--filter=config.name:{api}",
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
    except FileNotFoundError:
        return _GcloudFailure("missing")
    except subprocess.TimeoutExpired:
        return _GcloudFailure("timeout")

    if result.returncode == 0:
        return api in result.stdout

    err = (result.stderr or "").strip()
    return _GcloudFailure(_classify_stderr(err), err)


def _enable_api(project: str, api: str) -> Tuple[bool, str]:
    """Enable an API. Returns (success, error_message)."""
    try:
        with console.status(f"  [bold blue]Enabling {api}…[/]", spinner="dots"):
            subprocess.run(
                ["gcloud", "services", "enable", api, f"--project={project}"],
                check=True,
                capture_output=True,
            )
        return True, ""
    except subprocess.CalledProcessError as e:
        return False, (e.stderr or b"").decode().strip()
    except FileNotFoundError:
        return False, "gcloud not on PATH"


def _ensure_quota_project(project: str) -> None:
    """Best-effort: bind the ADC quota project to the given project ID.

    Idempotent — re-running on an already-set quota project is a no-op. Skipped
    silently if gcloud isn't on PATH (already warned earlier in the flow).
    Called from the ADC step *after* ADC is confirmed valid; this way it works
    whether ADC was already present or was just re-created.
    """
    if not project:
        return
    try:
        result = subprocess.run(
            ["gcloud", "auth", "application-default", "set-quota-project", project],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            _ok(
                f"Quota project bound to [cyan]{project}[/] [dim](so API calls bill correctly)[/]"
            )
            return
        _warn(
            "Could not bind quota project — Vertex API calls may bill the wrong project."
        )
        err = (result.stderr or "").strip()
        if err:
            _hint(err.splitlines()[-1][:300])
        _hint(
            f"Run manually: gcloud auth application-default set-quota-project {project}"
        )
    except FileNotFoundError:
        return
    except subprocess.TimeoutExpired:
        _warn("gcloud timed out while binding quota project.")


# ── Step implementations ────────────────────────────────────────────────────


def _step_1_account(auto_approve: bool) -> str:
    """Make sure gcloud is authenticated as a personal account, not a service one."""
    _step(
        1,
        "Active gcloud account",
        "We need a personal account — service accounts (gce-sa@…, *-compute@…)",
        "usually can't enable APIs or grant IAM bindings.",
    )

    account = _active_account()
    console.print()

    if not account:
        _warn("No active gcloud account.")
    elif _is_service_account(account):
        _warn(f"Active account: [cyan]{account}[/] [dim](service account)[/]")
    else:
        _ok(f"Active account: [cyan]{account}[/] [dim](personal — good)[/]")
        return account

    if auto_approve:
        _hint("Run:  gcloud auth login")
        _hint("Then: gcloud config set account YOUR_EMAIL")
        return account

    if not questionary.confirm(
        "  Run `gcloud auth login` now? (opens a browser flow)",
        default=True,
    ).ask():
        return account

    while True:
        try:
            subprocess.run(["gcloud", "auth", "login", "--update-adc"], check=True)
            new_account = _active_account()
            if new_account and not _is_service_account(new_account):
                _ok(f"Now logged in as: [cyan]{new_account}[/]")
                _hint(
                    "Note: --update-adc also refreshed your Application Default Credentials."
                )
                return new_account
            _warn(f"After login, active account is still: {new_account or 'none'}")
            _hint(
                f"Switch with: gcloud config set account {new_account or 'YOUR_EMAIL'}"
            )
        except subprocess.CalledProcessError as e:
            _warn("gcloud auth login failed.")
            err = (e.stderr or b"").decode().strip() if e.stderr else ""
            if err:
                _hint(err.splitlines()[-1][:300])
        except FileNotFoundError:
            _warn("gcloud not on PATH — install the SDK before continuing.")
            return account

        choice = _after_failure("gcloud auth login")
        if choice == "retry":
            continue
        if choice == "exit":
            _abort_setup()
        return account  # skip


def _step_3_adc(
    auto_approve: bool, active_account: str = "", project: str = ""
) -> bool:
    """Verify the ADC file exists AND matches the active gcloud account.

    Two reasons we don't just trust file existence:
      1. On GCE VMs / Cloud Workstations, gcloud's print-access-token check
         falls back to the metadata service and lies.
      2. The on-disk file may be stale — e.g. a service-account JSON dropped
         in earlier, or ADC for a different user the dev was last logged in as.
         A `gcloud auth application-default revoke` may also leave artifacts
         behind. The reliable check is: read the file, compare its `account`
         (user creds) or `client_email` (service-account creds) to whoever
         step 1 says is currently active in gcloud.

    On mismatch we *force* a re-run of `application-default login` rather than
    skipping — picking the wrong identity here propagates to every later call.

    `project` is required so that re-logins can pass `--billing-project=<project>`
    (binding the quota project at ADC creation time) and any pre-existing valid
    ADC file gets `set-quota-project` called on it as a no-op-friendly safety.
    """
    _step(
        3,
        "Application Default Credentials (ADC)",
        "ADC is what the Vertex AI Python SDK reads to know who's calling.",
        "Without a real ADC file (or with a stale one), the SDK silently uses",
        "the GCE service account on a VM — which fails later with permission errors.",
    )

    adc_file = _adc_file_path()
    console.print()

    reason = ""

    if not adc_file.exists():
        _warn(f"No ADC file at [cyan]{adc_file}[/]")
        _hint(
            "On a VM, gcloud may fall back to metadata creds — that's not what we want."
        )
        reason = "missing"
    else:
        adc_email = _adc_account(adc_file)
        if adc_email is None:
            _warn(f"ADC file at [cyan]{adc_file}[/] is present but unreadable.")
            _hint("It may be a leftover from `gcloud auth application-default revoke`.")
            reason = "unreadable"
        elif adc_email == "":
            # Valid user ADC file (modern gcloud doesn't store an email in it).
            # The active gcloud account from Step 1 is the closest display name we have.
            label = active_account or "user credentials"
            _ok(f"ADC file present at [cyan]{adc_file}[/]  [dim]({label})[/]")
            _ensure_quota_project(project)
            return True
        elif active_account and adc_email.lower() != active_account.lower():
            _warn(
                f"ADC file is for [cyan]{adc_email}[/] but you're logged in as "
                f"[cyan]{active_account}[/]."
            )
            _hint(
                "These need to match — otherwise the Python SDK will use the wrong identity."
            )
            reason = "mismatch"
        else:
            _ok(
                f"ADC file present at [cyan]{adc_file}[/]  [dim](account: {adc_email})[/]"
            )
            _ensure_quota_project(project)
            return True

    if auto_approve:
        _hint(
            "Run:  gcloud auth application-default login"
            + (f" --billing-project={project}" if project else "")
        )
        return False

    prompt_text = {
        "missing": "  Run `gcloud auth application-default login` now?",
        "unreadable": "  Re-run `gcloud auth application-default login` to fix the ADC file?",
        "mismatch": "  Re-run `gcloud auth application-default login` so ADC matches your gcloud account?",
    }[reason]

    if not questionary.confirm(prompt_text, default=True).ask():
        return False

    while True:
        try:
            login_cmd = ["gcloud", "auth", "application-default", "login"]
            if project:
                # Bind the quota project at ADC creation time so the next gcloud
                # call doesn't have to fix it up after the fact.
                login_cmd.extend(["--billing-project", project])
            subprocess.run(login_cmd, check=True)
            if adc_file.exists():
                new_email = _adc_account(adc_file)
                if new_email:
                    _ok(f"ADC file created.  [dim](account: {new_email})[/]")
                else:
                    _ok("ADC file created.")
                _ensure_quota_project(project)
                return True
            _warn("Login completed but ADC file still missing — check gcloud version.")
        except subprocess.CalledProcessError as e:
            _warn("gcloud auth application-default login failed.")
            err = (e.stderr or b"").decode().strip() if e.stderr else ""
            if err:
                _hint(err.splitlines()[-1][:300])
        except FileNotFoundError:
            _warn("gcloud not on PATH — install the SDK before continuing.")
            return False

        choice = _after_failure("ADC login")
        if choice == "retry":
            continue
        if choice == "exit":
            _abort_setup()
        return False  # skip


def _step_2_project(auto_approve: bool) -> Tuple[Optional[str], Optional[str]]:
    """Resolve project + location, save to .env, point gcloud config at it.

    Runs BEFORE Step 3 (ADC) so the ADC login can pass `--billing-project=<project>`
    — that binds the quota project at creation time, instead of having to fix
    it up afterwards with `set-quota-project`.
    """
    from dotenv import load_dotenv

    load_dotenv(override=True)

    _step(
        2,
        "Project + location",
        "Saved to .env so future commands (and the SDK) pick them up automatically.",
        "Also runs `gcloud config set project` so Step 3 can bind the quota project at",
        "ADC creation time (avoids the awkward set-quota-project-after-the-fact dance).",
    )

    project = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("PROJECT_ID")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION")
    env_changed = False

    console.print()
    if project:
        _ok(f"GOOGLE_CLOUD_PROJECT = [cyan]{project}[/]")
    else:
        if auto_approve:
            console.print("  [red]Cannot continue without a project ID.[/]")
            console.print(
                "  [dim]Set it with:[/]  export GOOGLE_CLOUD_PROJECT=your-project-id"
            )
            raise click.Abort()
        # Try to suggest the gcloud config project
        try:
            result = subprocess.run(
                ["gcloud", "config", "get-value", "project"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            suggested = (result.stdout or "").strip()
            suggested = "" if suggested in ("", "(unset)") else suggested
        except (FileNotFoundError, subprocess.TimeoutExpired):
            suggested = ""
        project = questionary.text(
            "    GCP project ID:",
            default=suggested,
            instruction=f"(your gcloud default: {suggested or 'unset'})"
            if suggested
            else "(e.g., my-project-123)",
        ).ask()
        if not project or not project.strip():
            raise click.Abort()
        project = project.strip()
        os.environ["GOOGLE_CLOUD_PROJECT"] = project
        env_changed = True
        _ok(f"GOOGLE_CLOUD_PROJECT = [cyan]{project}[/]")

    if location:
        _ok(f"GOOGLE_CLOUD_LOCATION = [cyan]{location}[/]")
    else:
        location = "us-central1"
        os.environ["GOOGLE_CLOUD_LOCATION"] = location
        env_changed = True
        _ok(
            f"GOOGLE_CLOUD_LOCATION = [cyan]{location}[/] [dim](default — change in .env if you need a different region)[/]"
        )

    if env_changed:
        _write_env(project, location)
        _ok("Saved to [cyan].env[/] for future runs.")

    # Make sure `gcloud config get-value project` returns this project too —
    # subsequent gcloud subcommands (services list, projects describe, etc.)
    # all default to the gcloud config project unless we pass --project.
    try:
        result = subprocess.run(
            ["gcloud", "config", "set", "project", project],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            _ok(f"gcloud config: project = [cyan]{project}[/]")
        else:
            err = (result.stderr or "").strip()
            _warn(
                "Could not update gcloud config — later steps will fall back to --project flags."
            )
            if err:
                _hint(err.splitlines()[-1][:300])
    except FileNotFoundError:
        _hint("Skipped gcloud config set (gcloud not on PATH).")
    except subprocess.TimeoutExpired:
        _warn("gcloud timed out while setting config project.")

    return project, location


def _step_4_foundation_apis(project: str, auto_approve: bool) -> None:
    _step(
        4,
        "Foundation APIs",
        "Four APIs every agent-eval flow depends on. Order matters — Service Usage",
        "must be enabled first, otherwise the others can't be enabled at all.",
    )
    _enable_apis(project, _FOUNDATION_APIS, auto_approve=auto_approve)


def _step_5_autorater_iam(project: str, auto_approve: bool) -> None:
    """Bind roles/aiplatform.serviceAgent to the AI Platform service agent."""
    _step(
        5,
        "Autorater IAM binding",
        "Vertex AI's LLM-as-judge runs as a service agent in your project.",
        "It needs roles/aiplatform.serviceAgent to read traces and write scores.",
        "(Once per project — re-running is a no-op.)",
    )

    # First we need the project number. Distinguish "gcloud missing" vs.
    # "gcloud ran but errored" so the user knows whether to install the SDK,
    # re-auth, or grant a permission.
    project_number = ""
    failure_reason = ""
    try:
        result = subprocess.run(
            [
                "gcloud",
                "projects",
                "describe",
                project,
                "--format=value(projectNumber)",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            project_number = (result.stdout or "").strip()
        else:
            err = (result.stderr or "").strip()
            kind = _classify_stderr(err)
            failure_reason = (
                "gcloud session expired"
                if kind == "reauth"
                else "permission denied"
                if kind == "permission"
                else (err.splitlines()[-1][:200] if err else "unknown gcloud error")
            )
    except FileNotFoundError:
        failure_reason = "gcloud not on PATH"
    except subprocess.TimeoutExpired:
        failure_reason = "gcloud timed out"

    console.print()
    if not project_number:
        _warn(f"Could not look up the project number ({failure_reason}).")
        if "session expired" in failure_reason:
            _hint("Run:  gcloud auth login --update-adc")
            _hint("Then re-run `agent-eval setup`.")
        else:
            _hint("Run manually:")
            _hint(
                f"  PN=$(gcloud projects describe {project} --format='value(projectNumber)')"
            )
            _hint(f"  gcloud projects add-iam-policy-binding {project} \\")
            _hint(
                '    --member="serviceAccount:service-$PN@gcp-sa-aiplatform.iam.gserviceaccount.com" \\'
            )
            _hint('    --role="roles/aiplatform.serviceAgent"')
        return

    member = f"serviceAccount:service-{project_number}@gcp-sa-aiplatform.iam.gserviceaccount.com"
    role = "roles/aiplatform.serviceAgent"
    _hint(f"Member: {member}")
    _hint(f"Role:   {role}")

    if not auto_approve:
        if not questionary.confirm(
            f"  Apply this binding to {project} now?",
            default=True,
        ).ask():
            _hint("Skipped — eval runs will fail until this binding exists.")
            return

    while True:
        try:
            with console.status("  [bold blue]Adding IAM binding…[/]", spinner="dots"):
                result = subprocess.run(
                    [
                        "gcloud",
                        "projects",
                        "add-iam-policy-binding",
                        project,
                        f"--member={member}",
                        f"--role={role}",
                        "--condition=None",
                    ],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
            if result.returncode == 0:
                _ok("Binding applied.")
                return
            _warn("gcloud could not apply the binding.")
            err = (result.stderr or "").strip()
            if err:
                _hint(err.splitlines()[-1][:300])
            if "PERMISSION_DENIED" in err or "does not have permission" in err.lower():
                _hint(
                    "Looks like you don't have IAM admin on this project — ask a project owner "
                    "to run the command shown above, then re-run `agent-eval setup`."
                )
        except subprocess.TimeoutExpired:
            _warn("gcloud timed out while applying the IAM binding.")
        except FileNotFoundError:
            _warn("gcloud not on PATH — apply the binding manually before continuing.")
            return

        if auto_approve:
            return
        choice = _after_failure("Autorater IAM binding")
        if choice == "retry":
            continue
        if choice == "exit":
            _abort_setup()
        return  # skip


def _step_6_asp_apis(project: str, *, asp: Optional[bool], auto_approve: bool) -> None:
    """Enable Cloud Build / Cloud Run / Artifact Registry for ASP deployments."""
    if asp is None and not auto_approve:
        asp = questionary.confirm(
            "  Will you deploy with Agent Starter Pack? (Cloud Build / Cloud Run / Agent Engine)",
            default=True,
        ).ask()
    if not asp:
        return

    _step(
        6,
        "Agent Starter Pack APIs (optional)",
        "Required if you'll run `uvx agent-starter-pack create … -d cloud_run` later",
        "or pick the `google_cloud_build` CI/CD runner during ASP setup.",
    )
    _enable_apis(project, _ASP_APIS, auto_approve=auto_approve)


def _enable_apis(
    project: str,
    apis: List[Tuple[str, str]],
    *,
    auto_approve: bool,
) -> None:
    for api, purpose in apis:
        console.print()
        console.print(f"  [cyan]{api}[/]")
        console.print(f"    [dim]{purpose}[/]")

        already = _check_api_enabled(project, api)
        if isinstance(already, _GcloudFailure):
            if already.kind == "missing":
                console.print("    [dim]skip[/]   gcloud not on PATH — can't check.")
                continue
            if already.kind == "timeout":
                _warn("    gcloud check timed out — skipping.")
                continue
            if already.kind == "reauth":
                _warn("    gcloud session expired — can't check API state.")
                _hint("    Run:  gcloud auth login --update-adc")
                _hint("    Then re-run `agent-eval setup`.")
                if (
                    not auto_approve
                    and questionary.confirm(
                        "    Run `gcloud auth login --update-adc` now?",
                        default=True,
                    ).ask()
                ):
                    try:
                        subprocess.run(
                            ["gcloud", "auth", "login", "--update-adc"], check=True
                        )
                        already = _check_api_enabled(project, api)
                    except subprocess.CalledProcessError:
                        _warn("    Login failed — skipping the rest of this step.")
                        return
                    except FileNotFoundError:
                        return
                else:
                    continue
            else:
                _warn(
                    f"    gcloud check failed: {already.message.splitlines()[-1][:300] if already.message else 'unknown error'}"
                )
                continue
        if isinstance(already, _GcloudFailure):
            # Re-auth attempt above could still leave us in a failure state.
            continue
        if already:
            _ok("    already enabled")
            continue

        if not (
            auto_approve
            or questionary.confirm(
                f"    Enable on {project}?",
                default=True,
            ).ask()
        ):
            _hint(
                f"    skipped — enable later with: gcloud services enable {api} --project={project}"
            )
            continue

        # Enable, with retry/skip/exit on failure. Many users don't have the
        # serviceusage.services.enable permission — when that's the case, skip
        # is the right choice (they'll ask an admin and re-run).
        while True:
            success, err = _enable_api(project, api)
            if success:
                _ok("    enabled")
                break

            _warn("    could not enable")
            if err:
                console.print(f"      [dim]{err.splitlines()[-1][:300]}[/]")
            if "PERMISSION_DENIED" in err or "does not have permission" in err.lower():
                _hint(
                    "      You don't seem to have permission to enable APIs on this project."
                )
                _hint(
                    "      Ask a project owner to run:  "
                    f"gcloud services enable {api} --project={project}"
                )
            else:
                _hint(
                    f"      Run manually: gcloud services enable {api} --project={project}"
                )

            if auto_approve:
                break
            choice = _after_failure(f"Enable {api}")
            if choice == "retry":
                continue
            if choice == "exit":
                _abort_setup()
            break  # skip
    _pause(_PAUSE_LONG)


def _write_env(project: str, location: str) -> None:
    env_path = Path(".env")
    lines = env_path.read_text().splitlines() if env_path.exists() else []
    keys_written: set[str] = set()
    updated: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("GOOGLE_CLOUD_PROJECT="):
            updated.append(f"GOOGLE_CLOUD_PROJECT={project}")
            keys_written.add("GOOGLE_CLOUD_PROJECT")
        elif stripped.startswith("GOOGLE_CLOUD_LOCATION="):
            updated.append(f"GOOGLE_CLOUD_LOCATION={location}")
            keys_written.add("GOOGLE_CLOUD_LOCATION")
        else:
            updated.append(line)
    if "GOOGLE_CLOUD_PROJECT" not in keys_written:
        updated.append(f"GOOGLE_CLOUD_PROJECT={project}")
    if "GOOGLE_CLOUD_LOCATION" not in keys_written:
        updated.append(f"GOOGLE_CLOUD_LOCATION={location}")
    env_path.write_text("\n".join(updated) + "\n")


# ── Click command ──────────────────────────────────────────────────────────


@click.command()
@click.option(
    "--asp/--no-asp",
    default=None,
    help="Also enable Cloud Build / Cloud Run / Artifact Registry "
    "(needed for Agent Starter Pack deployments). Prompts if omitted.",
)
@click.option(
    "--auto-approve",
    "-y",
    is_flag=True,
    help="Skip interactive prompts; assume yes to everything.",
)
def setup(asp: bool, auto_approve: bool) -> None:
    """Prepare your Google Cloud environment for agent-eval (and Agent Starter Pack).

    Six numbered steps, each one idempotent — re-running on a fully-set-up project
    skips work that's already done. Run this whenever you start a fresh shell,
    switch projects, or your gcloud token has expired.

    \b
    Steps walked through:
      1. Active gcloud account (must be personal, not gce-sa@…)
      2. Project + location + .env (also sets `gcloud config project`)
      3. Application Default Credentials (the file at ~/.config/gcloud/…)
         — created with `--billing-project=<project>` so quota project is bound at login time
      4. Foundation APIs (Service Usage, Resource Manager, Vertex AI, IAM)
      5. Autorater IAM binding (offers to run it for you)
      6. Agent Starter Pack APIs (optional — Cloud Build, Cloud Run, Artifact Registry)
    """
    from agent_eval.cli.main import _display_banner

    _display_banner()

    console.print()
    console.print(
        "  [bold]agent-eval setup[/] — preparing your Google Cloud environment."
    )
    console.print(
        "  [dim]Six steps. Already-done work is detected and skipped, so re-running is cheap.[/]"
    )
    _pause(_PAUSE_LONG)

    # 1. Active account
    account = _step_1_account(auto_approve=auto_approve)

    # 1b. Pre-flight: if the cached refresh token has expired, every later
    # subprocess call fails non-interactively with "Reauthentication failed".
    # Prompt now so steps 4/5 don't silently degrade to "skip".
    _ensure_session(account, auto_approve=auto_approve)

    # 2. Project + location + .env  (must come BEFORE ADC so we can pass
    #    --billing-project on the ADC login — binds the quota project at
    #    creation time instead of fixing it up after.)
    project, _location = _step_2_project(auto_approve=auto_approve)
    if not project:
        return

    # 3. Application Default Credentials (validated against the active account
    #    from step 1 — file existence alone is not enough, see _step_3_adc).
    _step_3_adc(auto_approve=auto_approve, active_account=account, project=project)

    # 4. Foundation APIs
    _step_4_foundation_apis(project, auto_approve=auto_approve)

    # 5. Autorater IAM binding
    _step_5_autorater_iam(project, auto_approve=auto_approve)

    # 6. ASP APIs (opt-in)
    _step_6_asp_apis(project, asp=asp, auto_approve=auto_approve)

    # Done
    console.print()
    console.print(Rule(style="dim"))
    console.print()
    console.print("  [bold green]Setup complete.[/]")
    if account and _is_service_account(account):
        _warn("Heads-up: your active gcloud account is still a service account.")
        _hint("If you skipped Step 1, run `gcloud auth login` before continuing.")
    console.print(
        "  [dim]Next:[/] [cyan]uvx agent-starter-pack create my-agent -a adk -d agent_engine[/]   [dim](if you need an agent)[/]"
    )
    console.print(
        "        [dim]or[/] [cyan]agent-eval init[/]   [dim](to scaffold eval/ for an existing agent)[/]"
    )
    console.print()
