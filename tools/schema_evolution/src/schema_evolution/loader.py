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

"""Load, normalise and validate a desired schema.

Accepted sources: dict, JSON string, bytes, or a path to a ``.json`` file.
Wrapper formats are unwrapped:
  * ``{"journals_schema": {"struct_schema": {...}}, "fallback_schema": {...}}``
    (select with ``schema_key="journals_schema"`` or a list of keys to try in order)
  * ``{"struct_schema": {...}}`` / ``{"json_schema": "<json string>" | {...}}``
"""

from __future__ import annotations

import json
import os
from collections.abc import Mapping
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Union

from schema_evolution.exceptions import InvalidSchemaError

SchemaSource = Union[Mapping, str, bytes, "os.PathLike[str]"]
SchemaKey = Optional[Union[str, Sequence[str]]]

# Field annotations that are booleans and default to false when absent.
BOOLEAN_ANNOTATIONS = frozenset(
    {"retrievable", "indexable", "searchable", "dynamicFacetable", "completable"}
)
KEY_PROPERTY = "keyPropertyMapping"
JSON_SCHEMA_VERSION = "https://json-schema.org/draft/2020-12/schema"


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


# --------------------------------------------------------------------- reading
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
            text = path.read_text(encoding="utf-8-sig")  # tolerate a UTF-8 BOM
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
    """Deep copy via JSON round trip; rejects NaN/Infinity and non-JSON values."""
    try:
        return json.loads(json.dumps(data, allow_nan=False))
    except (TypeError, ValueError) as e:
        raise InvalidSchemaError(f"Schema is not JSON-serialisable: {e}") from e


# ------------------------------------------------------------------ validation
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


KEY_PROPERTY_FORBIDDEN_ANNOTATIONS = ("searchable", "indexable")


def check_key_properties(schema: Dict[str, Any]) -> None:
    """Key-property rules enforced by Vertex AI Search:

    * each keyPropertyMapping value (title, uri, ...) may be used by one field only;
    * a key-property field must not be ``searchable`` or ``indexable``
      (service error: "Key property title should not contain searchable or
      indexable annotation"). Key properties are handled by the service itself.
    """
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
