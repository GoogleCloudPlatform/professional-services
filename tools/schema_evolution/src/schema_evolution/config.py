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

"""Load the run configuration: projects -> datastores -> schema.json.

Example ``config.yaml``::

    defaults:                      # optional, applied to every datastore
      location: us
      on_breaking: raise

    projects:
      - project_id: my-dev-project
        datastores:
          - datastore_id: journals-ds
            schema_file: schemas/journals.json
          - datastore_id: abstracts-ds
            schema_file: schemas/abstracts.json
            schema_key: abstracts_schema
            on_breaking: skip

Precedence: datastore entry > project entry > defaults > built-in defaults.
Relative ``schema_file`` paths are resolved against the config file's folder.
``${VAR}`` / ``$VAR`` in string values are replaced with environment variables.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Union

from schema_evolution.exceptions import ConfigError

# Options that can be set in defaults / project / datastore entries.
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
    options: Dict[str, Any] = field(default_factory=dict)  # SchemaEvolver kwargs incl. location

    @property
    def location(self) -> str:
        return self.options.get("location", "global")

    @property
    def label(self) -> str:
        return f"{self.project_id}/{self.location}/{self.datastore_id}"


def load_config(path: Union[str, "os.PathLike[str]"]) -> List[Target]:
    """Parse and fully validate the config. Raises ConfigError with every problem found."""
    config_path = Path(path).expanduser()
    if not config_path.is_file():
        raise ConfigError(f"Config file not found: {config_path}")
    data = _read(config_path)
    return parse_config(data, base_dir=config_path.resolve().parent)


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


# ------------------------------------------------------------------- helpers
def _read(path: Path) -> Any:
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
        import yaml  # PyYAML
    except ImportError as e:  # pragma: no cover - dependency is declared
        raise ConfigError("PyYAML is required for YAML configs (pip install pyyaml), or use a .json config.") from e
    try:
        return yaml.safe_load(text)  # safe_load: no arbitrary object construction
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
        bad_bool = isinstance(value, bool) and expected is not bool  # bool is a subclass of int
        if bad_bool or not isinstance(value, expected):
            errors.append(f"{where}.{key} has an invalid value: {value!r}.")
        elif isinstance(value, str) and _UNRESOLVED_VAR.search(value):
            errors.append(f"{where}.{key} references an unset environment variable: {value!r}.")
    for key in ("project_id", "datastore_id"):
        value = entry.get(key)
        if isinstance(value, str) and _UNRESOLVED_VAR.search(value):
            errors.append(f"{where}.{key} references an unset environment variable: {value!r}.")
