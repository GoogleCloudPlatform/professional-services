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

"""Schema models, exceptions, loading/validation, and pure diff/merge helpers."""

from __future__ import annotations

import copy
import json
import os
from collections.abc import Mapping
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Union

SchemaSource = Union[Mapping, str, bytes, "os.PathLike[str]"]
SchemaKey = Optional[Union[str, Sequence[str]]]

BOOLEAN_ANNOTATIONS = frozenset(
    {"retrievable", "indexable", "searchable", "dynamicFacetable", "completable"}
)
KEY_PROPERTY = "keyPropertyMapping"
KEY_PROPERTY_FORBIDDEN_ANNOTATIONS = ("searchable", "indexable")
JSON_SCHEMA_VERSION = "https://json-schema.org/draft/2020-12/schema"

ROOT_IGNORED_KEYS = frozenset({"$schema", "type", "properties"})
ROOT_BOOLEAN_KEYS = frozenset({"datetime_detection", "geolocation_detection"})
_STRUCTURAL_KEYS = ("properties", "items")
_TYPE_KEYS = ("type", "format")


# ------------------------------------------------------------------ exceptions
class SchemaEvolutionError(Exception):
    """Base class for all schema_evolution errors."""


class InvalidSchemaError(SchemaEvolutionError):
    """The desired (local) schema is malformed, incomplete or could not be loaded."""


class ConfigError(SchemaEvolutionError):
    """The run configuration (projects / datastores / schema files) is invalid."""


class SchemaFetchError(SchemaEvolutionError):
    """The live schema could not be read (permissions, auth, network, bad payload)."""


class DatastoreNotFoundError(SchemaEvolutionError):
    """The target datastore does not exist (or is not visible to the caller)."""


class SchemaApplyError(SchemaEvolutionError):
    """Creating, updating or recreating the schema failed."""


class BreakingSchemaChangeError(SchemaEvolutionError):
    """The desired schema contains changes Vertex AI Search cannot apply in place."""

    def __init__(self, changes: Sequence["SchemaChange"]):
        self.changes = list(changes)
        details = "; ".join(str(c) for c in self.changes)
        super().__init__(
            f"{len(self.changes)} breaking schema change(s) detected: {details}. "
            "Vertex AI Search cannot change a field type in place. Options: "
            "on_breaking='skip' (apply only the safe changes), "
            "recreate_if_empty=True (only if the datastore has no documents), "
            "or migrate to a new datastore."
        )


# ---------------------------------------------------------------------- models
class ChangeType(str, Enum):
    FIELD_ADDED = "FIELD_ADDED"
    ATTRIBUTE_CHANGED = "ATTRIBUTE_CHANGED"
    KEY_PROPERTY_MAPPING_CHANGED = "KEY_PROPERTY_MAPPING_CHANGED"
    TYPE_CHANGED = "TYPE_CHANGED"


BREAKING_CHANGE_TYPES = frozenset({ChangeType.TYPE_CHANGED})


@dataclass(frozen=True)
class SchemaChange:
    path: str
    change_type: ChangeType
    old: Any = None
    new: Any = None

    @property
    def breaking(self) -> bool:
        return self.change_type in BREAKING_CHANGE_TYPES

    def __str__(self) -> str:
        if self.change_type is ChangeType.FIELD_ADDED:
            return f"+ {self.path}"
        old = "(unset)" if self.old is None else repr(self.old)
        new = "(removed)" if self.new is None else repr(self.new)
        flag = ", BREAKING" if self.breaking else ""
        return f"~ {self.path}: {old} -> {new} ({self.change_type.value}{flag})"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "path": self.path,
            "change_type": self.change_type.value,
            "old": self.old,
            "new": self.new,
            "breaking": self.breaking,
        }


class Action(str, Enum):
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    RECREATED = "RECREATED"
    NO_CHANGE = "NO_CHANGE"
    DRY_RUN = "DRY_RUN"


@dataclass
class EvolutionResult:
    action: Action
    schema_name: str
    changes: List[SchemaChange] = field(default_factory=list)
    skipped: List[SchemaChange] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    cached: bool = False

    @property
    def changed(self) -> bool:
        return self.action in (Action.CREATED, Action.UPDATED, Action.RECREATED)

    @property
    def breaking_changes(self) -> List[SchemaChange]:
        return [c for c in (*self.changes, *self.skipped) if c.breaking]

    @property
    def has_breaking(self) -> bool:
        return bool(self.breaking_changes)

    def summary(self) -> str:
        suffix = " (cached)" if self.cached else ""
        lines = [f"[{self.action.value}] {self.schema_name}{suffix}"]
        lines += [f"  {c}" for c in self.changes]
        lines += [f"  SKIPPED {c}" for c in self.skipped]
        lines += [f"  WARNING {w}" for w in self.warnings]
        return "\n".join(lines)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "action": self.action.value,
            "schema_name": self.schema_name,
            "changed": self.changed,
            "cached": self.cached,
            "changes": [c.to_dict() for c in self.changes],
            "skipped": [c.to_dict() for c in self.skipped],
            "warnings": list(self.warnings),
        }


# ------------------------------------------------------------ load & validate
def load_schema(source: SchemaSource, schema_key: SchemaKey = None) -> Dict[str, Any]:
    """Return a validated, deep-copied JSON-schema dict (never mutates the input)."""
    data = _read(source)
    if schema_key is not None:
        data = _select(data, schema_key)
    data = _unwrap(data)
    schema = _to_plain_json(data)
    validate_schema(schema)
    schema.setdefault("type", "object")
    return schema


def _read(source: SchemaSource) -> Any:
    if isinstance(source, Mapping):
        return source
    if isinstance(source, (bytes, bytearray)):
        try:
            return _parse(bytes(source).decode("utf-8-sig"), "schema bytes")
        except UnicodeDecodeError as e:
            raise InvalidSchemaError(f"Schema bytes are not valid UTF-8: {e}") from e
    if isinstance(source, str):
        stripped = source.lstrip("\ufeff \t\r\n")
        if not stripped:
            raise InvalidSchemaError("Schema source is empty.")
        if stripped.startswith(("{", "[")):
            return _parse(stripped, "schema string")
    if isinstance(source, (str, os.PathLike)):
        path = Path(source).expanduser()
        if not path.is_file():
            raise InvalidSchemaError(f"Schema file not found: {path}")
        try:
            text = path.read_text(encoding="utf-8-sig")
        except (OSError, UnicodeDecodeError) as e:
            raise InvalidSchemaError(f"Cannot read schema file {path}: {e}") from e
        return _parse(text, str(path))
    raise InvalidSchemaError(f"Unsupported schema source type: {type(source).__name__}")


def _parse(text: str, origin: str) -> Any:
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise InvalidSchemaError(f"Malformed JSON in {origin}: {e}") from e


def _select(data: Any, schema_key: SchemaKey) -> Any:
    keys = [schema_key] if isinstance(schema_key, str) else list(schema_key or [])
    if not keys or not all(isinstance(k, str) and k for k in keys):
        raise InvalidSchemaError("schema_key must be a non-empty string or a list of non-empty strings.")
    if not isinstance(data, Mapping):
        raise InvalidSchemaError("schema_key was given but the schema source is not a JSON object.")
    for key in keys:
        if key in data:
            return data[key]
    raise InvalidSchemaError(f"None of the schema keys {keys} found. Available keys: {sorted(data)}")


def _unwrap(data: Any) -> Any:
    if isinstance(data, Mapping) and "properties" not in data:
        if isinstance(data.get("struct_schema"), Mapping):
            return data["struct_schema"]
        inner = data.get("json_schema")
        if isinstance(inner, Mapping):
            return inner
        if isinstance(inner, str):
            return _parse(inner, "'json_schema'")
    return data


def _to_plain_json(data: Any) -> Any:
    try:
        return json.loads(json.dumps(data, allow_nan=False))
    except (TypeError, ValueError) as e:
        raise InvalidSchemaError(f"Schema is not JSON-serialisable: {e}") from e


def validate_schema(schema: Any) -> None:
    """Structural validation. The service performs full validation on apply."""
    if not isinstance(schema, dict):
        raise InvalidSchemaError("Schema must be a JSON object.")
    if schema.get("type", "object") != "object":
        raise InvalidSchemaError(f"Root 'type' must be 'object', got {schema.get('type')!r}.")
    props = schema.get("properties")
    if not isinstance(props, dict):
        wrappers = [k for k, v in schema.items() if isinstance(v, dict)]
        hint = f" It looks like a wrapper file; pass schema_key (one of: {sorted(wrappers)})." if wrappers else ""
        raise InvalidSchemaError("Schema must contain a 'properties' object." + hint)
    _validate_properties(props, prefix="")
    check_key_properties(schema)


def _validate_properties(props: Dict[str, Any], prefix: str) -> None:
    for name, attrs in props.items():
        path = f"{prefix}{name}"
        if not name.strip():
            raise InvalidSchemaError(f"Empty field name under '{prefix.rstrip('.') or '<root>'}'.")
        if not isinstance(attrs, dict):
            raise InvalidSchemaError(f"Field '{path}' must be an object, got {type(attrs).__name__}.")
        _validate_field(path, attrs)


def _validate_field(path: str, attrs: Dict[str, Any]) -> None:
    ftype = attrs.get("type")
    valid_type = (isinstance(ftype, str) and ftype) or (
        isinstance(ftype, list) and ftype and all(isinstance(t, str) and t for t in ftype)
    )
    if "type" in attrs and not valid_type:
        raise InvalidSchemaError(f"Field '{path}' has an invalid 'type': {ftype!r}.")
    for key in BOOLEAN_ANNOTATIONS:
        value = attrs.get(key)
        if value is not None and not isinstance(value, bool):
            raise InvalidSchemaError(f"Field '{path}': '{key}' must be true/false, got {value!r}.")
    kpm = attrs.get(KEY_PROPERTY)
    if kpm is not None and not (isinstance(kpm, str) and kpm.strip()):
        raise InvalidSchemaError(f"Field '{path}': '{KEY_PROPERTY}' must be a non-empty string.")
    if "properties" in attrs:
        if not isinstance(attrs["properties"], dict):
            raise InvalidSchemaError(f"Field '{path}': 'properties' must be an object.")
        _validate_properties(attrs["properties"], prefix=f"{path}.")
    if "items" in attrs:
        if not isinstance(attrs["items"], dict):
            raise InvalidSchemaError(f"Field '{path}': 'items' must be an object.")
        _validate_field(f"{path}[]", attrs["items"])


def check_key_properties(schema: Dict[str, Any]) -> None:
    """Enforce Vertex AI Search keyPropertyMapping uniqueness and annotation rules."""
    seen: Dict[str, List[str]] = {}
    conflicts: List[str] = []

    def walk_field(path: str, attrs: Dict[str, Any]) -> None:
        kpm = attrs.get(KEY_PROPERTY)
        if isinstance(kpm, str):
            seen.setdefault(kpm, []).append(path)
            bad = [a for a in KEY_PROPERTY_FORBIDDEN_ANNOTATIONS if attrs.get(a) is True]
            if bad:
                conflicts.append(f"{path} (keyPropertyMapping={kpm!r}, {'/'.join(bad)}=true)")
        if isinstance(attrs.get("properties"), dict):
            walk_props(attrs["properties"], f"{path}.")
        if isinstance(attrs.get("items"), dict):
            walk_field(f"{path}[]", attrs["items"])

    def walk_props(props: Dict[str, Any], prefix: str) -> None:
        for name, attrs in props.items():
            if isinstance(attrs, dict):
                walk_field(f"{prefix}{name}", attrs)

    walk_props(schema.get("properties") or {}, "")
    duplicates = {k: v for k, v in seen.items() if len(v) > 1}
    if duplicates:
        details = "; ".join(f"{k!r} on {', '.join(v)}" for k, v in sorted(duplicates.items()))
        raise InvalidSchemaError(
            f"keyPropertyMapping must be unique. Duplicates: {details}. "
            "To move a mapping, set it to null on the old field."
        )
    if conflicts:
        raise InvalidSchemaError(
            "Key-property fields cannot be searchable or indexable (Vertex AI Search rule): "
            + "; ".join(conflicts)
            + ". Remove those annotations or set them to false."
        )


# --------------------------------------------------------------- diff & merge
def _as_dict(value: Any) -> Dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _normalize(key: str, value: Any, boolean_keys: Iterable[str]) -> Any:
    if value is None and key in boolean_keys:
        return False
    if key == "type" and isinstance(value, list) and all(isinstance(v, str) for v in value):
        unique = sorted(set(value))
        return unique[0] if len(unique) == 1 else unique
    return value


def _strip_none(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _strip_none(v) for k, v in value.items() if v is not None}
    if isinstance(value, list):
        return [_strip_none(v) for v in value]
    return value


def _type_conflicts(desired: Dict[str, Any], live: Dict[str, Any]) -> List[str]:
    conflicts = []
    for key in _TYPE_KEYS:
        if key not in desired:
            continue
        d_val, l_val = _normalize(key, desired[key], ()), _normalize(key, live.get(key), ())
        if d_val == l_val or (key == "type" and l_val is None):
            continue
        conflicts.append(key)
    return conflicts


def diff_schemas(desired: Dict[str, Any], live: Dict[str, Any]) -> List[SchemaChange]:
    live = _as_dict(live)
    out: List[SchemaChange] = []
    for key, d_val in desired.items():
        if key in ROOT_IGNORED_KEYS:
            continue
        l_val = live.get(key)
        if _normalize(key, d_val, ROOT_BOOLEAN_KEYS) != _normalize(key, l_val, ROOT_BOOLEAN_KEYS):
            out.append(SchemaChange(f"$.{key}", ChangeType.ATTRIBUTE_CHANGED, l_val, d_val))
    _diff_properties(_as_dict(desired.get("properties")), _as_dict(live.get("properties")), "", out)
    return out


def _diff_properties(desired: Dict[str, Any], live: Dict[str, Any], prefix: str, out: List[SchemaChange]) -> None:
    for name, d_attrs in desired.items():
        path = f"{prefix}{name}"
        l_attrs = live.get(name)
        if isinstance(l_attrs, dict):
            _diff_field(path, d_attrs, l_attrs, out)
        else:
            out.append(SchemaChange(path, ChangeType.FIELD_ADDED, None, d_attrs))


def _diff_field(path: str, desired: Dict[str, Any], live: Dict[str, Any], out: List[SchemaChange]) -> None:
    conflicts = _type_conflicts(desired, live)
    if conflicts:
        for key in conflicts:
            out.append(SchemaChange(f"{path}.{key}", ChangeType.TYPE_CHANGED, live.get(key), desired[key]))
        return

    for key, d_val in desired.items():
        if key in _STRUCTURAL_KEYS:
            continue
        l_val = live.get(key)
        if _normalize(key, d_val, BOOLEAN_ANNOTATIONS) == _normalize(key, l_val, BOOLEAN_ANNOTATIONS):
            continue
        ctype = ChangeType.KEY_PROPERTY_MAPPING_CHANGED if key == KEY_PROPERTY else ChangeType.ATTRIBUTE_CHANGED
        out.append(SchemaChange(f"{path}.{key}", ctype, l_val, d_val))

    if isinstance(desired.get("properties"), dict):
        _diff_properties(desired["properties"], _as_dict(live.get("properties")), f"{path}.", out)
    if isinstance(desired.get("items"), dict):
        l_items = live.get("items")
        if isinstance(l_items, dict):
            _diff_field(f"{path}[]", desired["items"], l_items, out)
        else:
            out.append(SchemaChange(f"{path}[]", ChangeType.FIELD_ADDED, None, desired["items"]))


def merge_schemas(desired: Dict[str, Any], live: Dict[str, Any], *, keep_live_types: bool = False) -> Dict[str, Any]:
    """Return the live schema with the desired schema applied additively on top."""
    merged = copy.deepcopy(live) if isinstance(live, dict) else {}
    for key, value in desired.items():
        if key == "properties":
            merged["properties"] = _merge_properties(_as_dict(value), _as_dict(merged.get("properties")), keep_live_types)
        elif value is None:
            merged.pop(key, None)
        else:
            merged[key] = copy.deepcopy(value)
    return merged


def _merge_properties(desired: Dict[str, Any], live: Dict[str, Any], keep: bool) -> Dict[str, Any]:
    result = dict(live)
    for name, d_attrs in desired.items():
        l_attrs = live.get(name)
        result[name] = _merge_field(d_attrs, l_attrs, keep) if isinstance(l_attrs, dict) else _strip_none(d_attrs)
    return result


def _merge_field(desired: Dict[str, Any], live: Dict[str, Any], keep: bool) -> Dict[str, Any]:
    if _type_conflicts(desired, live):
        return copy.deepcopy(live) if keep else _strip_none(desired)
    result = copy.deepcopy(live)
    for key, value in desired.items():
        if key == "properties" and isinstance(value, dict):
            result["properties"] = _merge_properties(value, _as_dict(result.get("properties")), keep)
        elif key == "items" and isinstance(value, dict):
            l_items = result.get("items")
            result["items"] = _merge_field(value, l_items, keep) if isinstance(l_items, dict) else _strip_none(value)
        elif value is None:
            result.pop(key, None)
        else:
            result[key] = copy.deepcopy(value)
    return result
