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

"""Config loader, multi-target runner, and CLI for schema evolution."""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Sequence, Union

from schema_evolution.evolver import SchemaEvolver
from schema_evolution.schema import (
    BreakingSchemaChangeError,
    ConfigError,
    EvolutionResult,
    InvalidSchemaError,
    SchemaEvolutionError,
    load_schema,
)

logger = logging.getLogger(__name__)
EXIT_ERROR = 1

# ---------------------------------------------------------------------- config
OPTION_KEYS = frozenset(
    {
        "location",
        "collection",
        "schema_id",
        "on_breaking",
        "recreate_if_empty",
        "verify",
        "operation_timeout",
        "max_attempts",
        "retry_backoff",
        "transport",
    }
)
_ROOT_KEYS = frozenset({"defaults", "projects"})
_PROJECT_KEYS = OPTION_KEYS | {"project_id", "datastores"}
_DATASTORE_KEYS = OPTION_KEYS | {"datastore_id", "schema_file", "schema_key", "enabled"}

_TYPES: Dict[str, Any] = {
    "location": str,
    "collection": str,
    "schema_id": str,
    "on_breaking": str,
    "transport": str,
    "recreate_if_empty": bool,
    "verify": bool,
    "operation_timeout": (int, float),
    "max_attempts": int,
    "retry_backoff": (int, float),
}
_UNRESOLVED_VAR = re.compile(r"\$\{?[A-Za-z_][A-Za-z0-9_]*\}?")


@dataclass(frozen=True)
class Target:
    """One datastore whose schema must be evolved."""

    project_id: str
    datastore_id: str
    schema_file: Path
    schema_key: Optional[Union[str, List[str]]] = None
    options: Dict[str, Any] = field(default_factory=dict)

    @property
    def location(self) -> str:
        return self.options.get("location", "global")

    @property
    def label(self) -> str:
        return f"{self.project_id}/{self.location}/{self.datastore_id}"


def load_config(path: Union[str, "os.PathLike[str]"]) -> List[Target]:
    """Parse and validate a YAML or JSON config file."""
    config_path = Path(path).expanduser()
    if not config_path.is_file():
        raise ConfigError(f"Config file not found: {config_path}")
    return parse_config(_read_config_file(config_path), base_dir=config_path.resolve().parent)


def parse_config(data: Any, base_dir: Union[str, "os.PathLike[str]"] = ".") -> List[Target]:
    base = Path(base_dir)
    errors: List[str] = []
    data = _expand_env(data)

    if not isinstance(data, dict):
        raise ConfigError("Config must be a mapping with a 'projects' list.")
    _check_keys(data, _ROOT_KEYS, "config root", errors)
    defaults = data.get("defaults") or {}
    if not isinstance(defaults, dict):
        errors.append("'defaults' must be a mapping.")
        defaults = {}
    _check_keys(defaults, OPTION_KEYS, "defaults", errors)
    _check_types(defaults, "defaults", errors)

    projects = data.get("projects")
    if not isinstance(projects, list) or not projects:
        errors.append("'projects' must be a non-empty list.")
        projects = []

    targets: List[Target] = []
    seen: Dict[tuple, str] = {}
    for p_idx, project in enumerate(projects):
        p_where = f"projects[{p_idx}]"
        if not isinstance(project, dict):
            errors.append(f"{p_where} must be a mapping.")
            continue
        _check_keys(project, _PROJECT_KEYS, p_where, errors)
        _check_types(project, p_where, errors)
        project_id = project.get("project_id")
        if not _non_empty_str(project_id):
            errors.append(f"{p_where}.project_id is required.")
            continue
        p_where = f"projects[{project_id}]"
        datastores = project.get("datastores")
        if not isinstance(datastores, list) or not datastores:
            errors.append(f"{p_where}.datastores must be a non-empty list.")
            continue

        for d_idx, ds in enumerate(datastores):
            d_where = f"{p_where}.datastores[{d_idx}]"
            if not isinstance(ds, dict):
                errors.append(f"{d_where} must be a mapping.")
                continue
            _check_keys(ds, _DATASTORE_KEYS, d_where, errors)
            _check_types(ds, d_where, errors)
            datastore_id = ds.get("datastore_id")
            if not _non_empty_str(datastore_id):
                errors.append(f"{d_where}.datastore_id is required.")
                continue
            d_where = f"{p_where}.datastores[{datastore_id}]"
            enabled = ds.get("enabled", True)
            if not isinstance(enabled, bool):
                errors.append(f"{d_where}.enabled must be true/false.")
                continue
            if not enabled:
                continue

            schema_file = ds.get("schema_file")
            if not _non_empty_str(schema_file):
                errors.append(f"{d_where}.schema_file is required.")
                continue
            schema_path = Path(schema_file).expanduser()
            if not schema_path.is_absolute():
                schema_path = base / schema_path
            if not schema_path.is_file():
                errors.append(f"{d_where}.schema_file not found: {schema_path}")
                continue

            schema_key = ds.get("schema_key")
            if schema_key is not None and not (
                _non_empty_str(schema_key)
                or (isinstance(schema_key, list) and schema_key and all(_non_empty_str(k) for k in schema_key))
            ):
                errors.append(f"{d_where}.schema_key must be a string or a list of strings.")
                continue

            options = {k: v for k, v in defaults.items()}
            options.update({k: v for k, v in project.items() if k in OPTION_KEYS})
            options.update({k: v for k, v in ds.items() if k in OPTION_KEYS})
            options.setdefault("location", "global")

            identity = (
                project_id.strip(),
                options["location"],
                options.get("collection", "default_collection"),
                datastore_id.strip(),
            )
            if identity in seen:
                errors.append(f"{d_where} duplicates {seen[identity]}.")
                continue
            seen[identity] = d_where

            targets.append(
                Target(
                    project_id=project_id.strip(),
                    datastore_id=datastore_id.strip(),
                    schema_file=schema_path,
                    schema_key=schema_key,
                    options=options,
                )
            )

    if errors:
        raise ConfigError("Invalid config:\n  - " + "\n  - ".join(errors))
    if not targets:
        raise ConfigError("Config has no enabled datastores.")
    return targets


def filter_targets(
    targets: Sequence[Target],
    projects: Optional[Sequence[str]] = None,
    datastores: Optional[Sequence[str]] = None,
) -> List[Target]:
    """Keep only the given project ids / datastore ids (None = no filter)."""
    selected = [
        t for t in targets
        if (not projects or t.project_id in projects) and (not datastores or t.datastore_id in datastores)
    ]
    if not selected:
        raise ConfigError(f"No datastores match the filters (projects={projects}, datastores={datastores}).")
    return selected


def _read_config_file(path: Path) -> Any:
    try:
        text = path.read_text(encoding="utf-8-sig")
    except (OSError, UnicodeDecodeError) as e:
        raise ConfigError(f"Cannot read config {path}: {e}") from e
    if path.suffix.lower() == ".json":
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise ConfigError(f"Malformed JSON in {path}: {e}") from e
    try:
        import yaml
    except ImportError as e:  # pragma: no cover
        raise ConfigError("PyYAML is required for YAML configs (pip install pyyaml), or use a .json config.") from e
    try:
        return yaml.safe_load(text)
    except yaml.YAMLError as e:
        raise ConfigError(f"Malformed YAML in {path}: {e}") from e


def _expand_env(value: Any) -> Any:
    if isinstance(value, str):
        return os.path.expandvars(value)
    if isinstance(value, list):
        return [_expand_env(v) for v in value]
    if isinstance(value, dict):
        return {k: _expand_env(v) for k, v in value.items()}
    return value


def _non_empty_str(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _check_keys(entry: Dict[str, Any], allowed: frozenset, where: str, errors: List[str]) -> None:
    unknown = sorted(str(k) for k in entry if k not in allowed)
    if unknown:
        errors.append(f"{where}: unknown key(s) {unknown}. Allowed: {sorted(allowed)}.")


def _check_types(entry: Dict[str, Any], where: str, errors: List[str]) -> None:
    for key, expected in _TYPES.items():
        if key not in entry:
            continue
        value = entry[key]
        bad_bool = isinstance(value, bool) and expected is not bool
        if bad_bool or not isinstance(value, expected):
            errors.append(f"{where}.{key} has an invalid value: {value!r}.")
        elif isinstance(value, str) and _UNRESOLVED_VAR.search(value):
            errors.append(f"{where}.{key} references an unset environment variable: {value!r}.")
    for key in ("project_id", "datastore_id"):
        value = entry.get(key)
        if isinstance(value, str) and _UNRESOLVED_VAR.search(value):
            errors.append(f"{where}.{key} references an unset environment variable: {value!r}.")


# ---------------------------------------------------------------------- runner
class Status(str, Enum):
    OK = "OK"
    BLOCKED = "BLOCKED"
    ERROR = "ERROR"
    NOT_RUN = "NOT_RUN"


@dataclass
class TargetOutcome:
    target: Target
    status: Status
    result: Optional[EvolutionResult] = None
    error: Optional[str] = None
    seconds: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "project_id": self.target.project_id,
            "location": self.target.location,
            "datastore_id": self.target.datastore_id,
            "schema_file": str(self.target.schema_file),
            "status": self.status.value,
            "action": self.result.action.value if self.result else None,
            "error": self.error,
            "seconds": round(self.seconds, 2),
            "result": self.result.to_dict() if self.result else None,
        }


@dataclass
class RunReport:
    outcomes: List[TargetOutcome] = field(default_factory=list)
    dry_run: bool = False

    def count(self, status: Status) -> int:
        return sum(1 for o in self.outcomes if o.status is status)

    @property
    def ok(self) -> bool:
        return all(o.status is Status.OK for o in self.outcomes)

    @property
    def exit_code(self) -> int:
        """0 = all OK, 1 = any error, 2 = only breaking-change blocks."""
        if any(o.status in (Status.ERROR, Status.NOT_RUN) for o in self.outcomes):
            return 1
        if any(o.status is Status.BLOCKED for o in self.outcomes):
            return 2
        return 0

    def summary(self) -> str:
        mode = " (dry run)" if self.dry_run else ""
        lines = [f"Schema evolution report{mode}", "=" * 60]
        for o in self.outcomes:
            action = o.result.action.value if o.result else "-"
            lines.append(f"[{o.status.value:<7}] {o.target.label}  action={action}  ({o.seconds:.1f}s)")
            if o.result:
                lines += [f"            {c}" for c in o.result.changes]
                lines += [f"            SKIPPED {c}" for c in o.result.skipped]
                lines += [f"            WARNING {w}" for w in o.result.warnings]
            if o.error:
                lines += [f"            {line}" for line in o.error.splitlines()]
        lines.append("=" * 60)
        lines.append(
            f"Total {len(self.outcomes)} | OK {self.count(Status.OK)} | BLOCKED {self.count(Status.BLOCKED)} | "
            f"ERROR {self.count(Status.ERROR)} | NOT_RUN {self.count(Status.NOT_RUN)}"
        )
        return "\n".join(lines)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dry_run": self.dry_run,
            "exit_code": self.exit_code,
            "totals": {s.value: self.count(s) for s in Status},
            "datastores": [o.to_dict() for o in self.outcomes],
        }


EvolverFactory = Callable[[Target], SchemaEvolver]


def _default_factory(target: Target, **overrides: Any) -> SchemaEvolver:
    options = dict(target.options)
    location = options.pop("location")
    options.update(overrides)
    return SchemaEvolver(target.project_id, location, target.datastore_id, **options)


def run_targets(
    targets: Sequence[Target],
    *,
    dry_run: bool = False,
    fail_fast: bool = False,
    evolver_factory: Optional[EvolverFactory] = None,
    **evolver_overrides: Any,
) -> RunReport:
    """Evolve each target in order. One failing datastore never stops the others unless fail_fast=True."""
    evolver_overrides.setdefault("use_cache", False)
    factory = evolver_factory or (lambda t: _default_factory(t, **evolver_overrides))
    report = RunReport(dry_run=dry_run)
    stop = False

    for target in targets:
        if stop:
            report.outcomes.append(TargetOutcome(target, Status.NOT_RUN, error="Not run: an earlier datastore failed."))
            continue
        logger.info("==> %s (schema: %s)", target.label, target.schema_file)
        started = time.monotonic()
        try:
            evolver = factory(target)
            result = evolver.evolve(str(target.schema_file), schema_key=target.schema_key, dry_run=dry_run)
            blocked = dry_run and result.has_breaking and target.options.get("on_breaking", "raise") == "raise"
            outcome = TargetOutcome(target, Status.BLOCKED if blocked else Status.OK, result=result)
            if blocked:
                outcome.error = "Breaking change(s) would be blocked on a real run."
        except BreakingSchemaChangeError as e:
            outcome = TargetOutcome(target, Status.BLOCKED, error=str(e))
        except (SchemaEvolutionError, ValueError) as e:
            outcome = TargetOutcome(target, Status.ERROR, error=f"{type(e).__name__}: {e}")
        except Exception as e:  # noqa: BLE001
            logger.exception("Unexpected error on %s", target.label)
            outcome = TargetOutcome(target, Status.ERROR, error=f"Unexpected {type(e).__name__}: {e}")
        outcome.seconds = time.monotonic() - started
        report.outcomes.append(outcome)
        logger.info("<== %s: %s", target.label, outcome.status.value)
        if fail_fast and outcome.status is not Status.OK:
            stop = True
    return report


# ------------------------------------------------------------------------- cli
def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="schema-evolution",
        description="Create or evolve Vertex AI Search datastore schemas from a config file "
        "listing projects, datastores and schema.json files.",
    )
    parser.add_argument("--config", "-c", required=True, help="Path to config.yaml (or .json).")
    parser.add_argument("--dry-run", action="store_true", help="Show the changes, write nothing.")
    parser.add_argument("--project", action="append", help="Only this project id (repeatable).")
    parser.add_argument("--datastore", action="append", help="Only this datastore id (repeatable).")
    parser.add_argument("--fail-fast", action="store_true", help="Stop at the first datastore that fails.")
    parser.add_argument("--validate-only", action="store_true", help="Validate config and schema files offline.")
    parser.add_argument("--json", action="store_true", help="Print the report as JSON.")
    parser.add_argument("--report-file", help="Also write the JSON report to this file.")
    parser.add_argument("-v", "--verbose", action="store_true", help="Debug logging.")
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = _parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        stream=sys.stderr,
    )
    try:
        targets = filter_targets(load_config(args.config), args.project, args.datastore)
    except ConfigError as e:
        print(f"CONFIG ERROR: {e}", file=sys.stderr)
        return EXIT_ERROR

    if args.validate_only:
        return _validate_only(targets)

    report = run_targets(targets, dry_run=args.dry_run, fail_fast=args.fail_fast)
    print(json.dumps(report.to_dict(), indent=2, default=str) if args.json else report.summary())
    if args.report_file:
        try:
            Path(args.report_file).write_text(json.dumps(report.to_dict(), indent=2, default=str), encoding="utf-8")
        except OSError as e:
            print(f"Could not write report file {args.report_file}: {e}", file=sys.stderr)
            return EXIT_ERROR
    return report.exit_code


def _validate_only(targets: Sequence[Target]) -> int:
    failed = 0
    for t in targets:
        try:
            schema = load_schema(str(t.schema_file), t.schema_key)
            print(f"[VALID  ] {t.label}  {t.schema_file} ({len(schema['properties'])} fields)")
        except InvalidSchemaError as e:
            failed += 1
            print(f"[INVALID] {t.label}  {t.schema_file}: {e}")
    return EXIT_ERROR if failed else 0


if __name__ == "__main__":
    sys.exit(main())
