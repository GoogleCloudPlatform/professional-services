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

"""Pure functions to diff and merge a desired schema against the live schema.

Rules (aligned with Vertex AI Search schema-update constraints):
  * Only keys declared in the desired schema are compared. Fields/keys that
    exist only in the live schema (e.g. auto-detected) are kept, never removed.
  * ``null`` in the desired schema means "remove this attribute" (e.g. move a
    keyPropertyMapping to another field).
  * Absent boolean annotations are treated as ``false`` and type lists are
    order-insensitive, so equivalent schemas never trigger an update (every
    update re-indexes the whole datastore).
  * ``type`` / ``format`` changes are breaking (not supported in place).
    A field with a breaking change is reported only by its type change and is
    left untouched when breaking changes are skipped.
"""

from __future__ import annotations

import copy
from typing import Any, Dict, Iterable, List

from schema_evolution.loader import BOOLEAN_ANNOTATIONS, KEY_PROPERTY
from schema_evolution.models import ChangeType, SchemaChange

ROOT_IGNORED_KEYS = frozenset({"$schema", "type", "properties"})
ROOT_BOOLEAN_KEYS = frozenset({"datetime_detection", "geolocation_detection"})
_STRUCTURAL_KEYS = ("properties", "items")
_TYPE_KEYS = ("type", "format")


# ------------------------------------------------------------------- helpers
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
    """Return the type-ish keys whose change is breaking."""
    conflicts = []
    for key in _TYPE_KEYS:
        if key not in desired:
            continue
        d_val, l_val = _normalize(key, desired[key], ()), _normalize(key, live.get(key), ())
        if d_val == l_val:
            continue
        if key == "type" and l_val is None:
            continue  # defining a type where none existed is not a change of type
        conflicts.append(key)
    return conflicts


# ---------------------------------------------------------------------- diff
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


# --------------------------------------------------------------------- merge
def merge_schemas(desired: Dict[str, Any], live: Dict[str, Any], *, keep_live_types: bool = False) -> Dict[str, Any]:
    """Return the live schema with the desired schema applied on top.

    Additive: live-only fields are preserved. ``null`` desired values remove the
    attribute. Fields with a breaking type change are replaced by the desired
    definition, or left untouched when ``keep_live_types`` is True.
    Inputs are never mutated.
    """
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
