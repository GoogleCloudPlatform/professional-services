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

import json

import pytest

from schema_evolution import (
    ChangeType,
    InvalidSchemaError,
    check_key_properties,
    diff_schemas,
    load_schema,
    merge_schemas,
)

S = {"type": "object", "properties": {"a": {"type": "string"}}}

LIVE = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
        "title": {"type": "string", "retrievable": True, "keyPropertyMapping": "title"},
        "year": {"type": "number", "indexable": True},
        "auto_detected": {"type": "string"},
        "published": {"type": "datetime", "retrievable": True},
        "authors": {"type": "array", "items": {"type": "object", "properties": {"name": {"type": "string"}}}},
        "tags": {"type": "array"},
        "kind": {"type": ["string", "null"]},
    },
}


def paths(changes):
    return {c.path: c.change_type for c in changes}


# ======================================================================= loader
def test_load_wrapper_with_key(tmp_path):
    f = tmp_path / "schema.json"
    f.write_text(json.dumps({"journals_schema": {"struct_schema": S}}))
    assert load_schema(str(f), schema_key="journals_schema") == S


def test_fallback_keys_tried_in_order():
    wrapper = {"fallback_schema": {"struct_schema": S}}
    assert load_schema(wrapper, schema_key=["journals_schema", "fallback_schema"]) == S


def test_missing_keys_lists_available():
    with pytest.raises(InvalidSchemaError, match="Available keys"):
        load_schema({"x_schema": S}, schema_key="journals_schema")


def test_wrapper_without_key_gives_hint():
    with pytest.raises(InvalidSchemaError, match="schema_key"):
        load_schema({"journals_schema": {"struct_schema": S}})


def test_json_schema_string_and_dict_wrappers():
    assert load_schema({"json_schema": json.dumps(S)}) == S
    assert load_schema({"json_schema": S}) == S
    assert load_schema(json.dumps(S)) == S


def test_bytes_bom_and_path_sources(tmp_path):
    assert load_schema(b"\xef\xbb\xbf" + json.dumps(S).encode()) == S
    f = tmp_path / "bom.json"
    f.write_bytes(b"\xef\xbb\xbf" + json.dumps(S).encode())
    assert load_schema(f) == S  # pathlib.Path


def test_load_does_not_mutate_input_and_defaults_type():
    src = {"properties": {"a": {"type": "string"}}}
    out = load_schema(src)
    out["properties"]["a"]["x"] = 1
    assert out["type"] == "object"
    assert src == {"properties": {"a": {"type": "string"}}}


def test_accepts_vais_specific_types_and_array_annotations():
    schema = {
        "properties": {
            "published": {"type": "datetime", "indexable": True},
            "tags": {"type": "array", "items": {"type": "string", "retrievable": True, "keyPropertyMapping": "category"}},
        }
    }
    out = load_schema(schema)
    assert out["properties"]["tags"]["items"]["keyPropertyMapping"] == "category"


def test_key_property_on_array_items_cannot_be_searchable():
    schema = {"properties": {"tags": {"type": "array", "items": {"type": "string", "searchable": True, "keyPropertyMapping": "category"}}}}
    with pytest.raises(InvalidSchemaError, match="cannot be searchable"):
        load_schema(schema)


@pytest.mark.parametrize(
    "bad, msg",
    [
        ("[]", "JSON object"),
        ([], "Unsupported schema source type"),
        ({"no_props": 1}, "properties"),
        ({"type": "array", "properties": {}}, "Root 'type'"),
        ({"properties": {"a": "string"}}, "must be an object"),
        ({"properties": {"a": {"type": 5}}}, "invalid 'type'"),
        ({"properties": {"a": {"type": None}}}, "invalid 'type'"),
        ({"properties": {"a": {"type": "string", "retrievable": "true"}}}, "true/false"),
        ({"properties": {"": {"type": "string"}}}, "Empty field name"),
        ({"properties": {"a": {"type": "string", "keyPropertyMapping": ""}}}, "non-empty"),
        ({"properties": {"a": {"type": "object", "properties": []}}}, "'properties' must be"),
        ({"properties": {"a": {"type": "array", "items": "string"}}}, "'items' must be"),
        (
            {"properties": {"a": {"type": "string", "keyPropertyMapping": "title"},
                            "b": {"type": "string", "keyPropertyMapping": "title"}}},
            "unique",
        ),
        ({"properties": {"a": {"type": "number", "maximum": float("nan")}}}, "JSON-serialisable"),
        ({"properties": {"a": {"type": "string", "enum": {1, 2}}}}, "JSON-serialisable"),
    ],
)
def test_invalid_schemas(bad, msg):
    with pytest.raises(InvalidSchemaError, match=msg):
        load_schema(bad)


def test_bad_sources(tmp_path):
    for source, msg in [
        ("", "empty"),
        ("   ", "empty"),
        (str(tmp_path / "nope.json"), "not found"),
        (str(tmp_path), "not found"),
        ("{bad json", "Malformed JSON"),
        (123, "Unsupported"),
    ]:
        with pytest.raises(InvalidSchemaError, match=msg):
            load_schema(source)
    for key in ["", [], [""]]:
        with pytest.raises(InvalidSchemaError, match="schema_key"):
            load_schema({"x": S}, schema_key=key)


# ========================================================================= diff
def test_no_changes_ignores_live_only_fields_and_root_metadata():
    desired = {"$schema": "http://json-schema.org/draft-07/schema#", "type": "object",
               "properties": {"title": {"type": "string", "retrievable": True}}}
    assert diff_schemas(desired, LIVE) == []


def test_absent_boolean_annotation_equals_false():
    desired = {"properties": {"auto_detected": {"type": "string", "retrievable": False, "searchable": False}}}
    assert diff_schemas(desired, LIVE) == []


def test_type_lists_are_order_insensitive():
    assert diff_schemas({"properties": {"kind": {"type": ["null", "string"]}}}, LIVE) == []
    assert diff_schemas({"properties": {"title": {"type": ["string"]}}}, LIVE) == []


def test_root_options_are_diffed():
    changes = diff_schemas({"datetime_detection": True, "properties": {}}, LIVE)
    assert paths(changes) == {"$.datetime_detection": ChangeType.ATTRIBUTE_CHANGED}
    assert diff_schemas({"datetime_detection": False, "properties": {}}, LIVE) == []


def test_safe_changes():
    desired = {"properties": {"year": {"type": "number", "retrievable": True}, "new_field": {"type": "string"}}}
    changes = diff_schemas(desired, LIVE)
    assert paths(changes) == {"year.retrievable": ChangeType.ATTRIBUTE_CHANGED, "new_field": ChangeType.FIELD_ADDED}
    assert not any(c.breaking for c in changes)


def test_key_property_change_is_not_breaking():
    [change] = diff_schemas({"properties": {"title": {"keyPropertyMapping": "description"}}}, LIVE)
    assert change.change_type is ChangeType.KEY_PROPERTY_MAPPING_CHANGED and not change.breaking


def test_type_and_format_changes_are_breaking_and_short_circuit():
    changes = diff_schemas({"properties": {"year": {"type": "string", "retrievable": True}}}, LIVE)
    assert paths(changes) == {"year.type": ChangeType.TYPE_CHANGED}  # retrievable not reported
    assert changes[0].breaking
    changes = diff_schemas({"properties": {"published": {"type": "datetime", "format": "date"}}}, LIVE)
    assert paths(changes) == {"published.format": ChangeType.TYPE_CHANGED}


def test_items_added_when_live_array_has_none():
    changes = diff_schemas({"properties": {"tags": {"type": "array", "items": {"type": "string"}}}}, LIVE)
    assert paths(changes) == {"tags[]": ChangeType.FIELD_ADDED}


def test_nested_array_object_field_added():
    desired = {"properties": {"authors": {"type": "array", "items": {"type": "object", "properties": {"email": {"type": "string"}}}}}}
    assert paths(diff_schemas(desired, LIVE)) == {"authors[].email": ChangeType.FIELD_ADDED}


def test_defining_missing_type_is_not_breaking():
    live = {"properties": {"x": {"retrievable": True}}}
    [change] = diff_schemas({"properties": {"x": {"type": "string"}}}, live)
    assert change.change_type is ChangeType.ATTRIBUTE_CHANGED and not change.breaking


def test_null_means_remove():
    [change] = diff_schemas({"properties": {"title": {"keyPropertyMapping": None}}}, LIVE)
    assert (change.old, change.new) == ("title", None)
    assert diff_schemas({"properties": {"year": {"keyPropertyMapping": None}}}, LIVE) == []


def test_garbage_live_field_treated_as_new():
    assert paths(diff_schemas(S, {"properties": {"a": "oops"}})) == {"a": ChangeType.FIELD_ADDED}


# ======================================================================== merge
def test_merge_is_additive_and_does_not_mutate():
    desired = {
        "properties": {
            "year": {"retrievable": True},
            "new_field": {"type": "string"},
            "authors": {"items": {"properties": {"email": {"type": "string"}}}},
        }
    }
    snapshot = json.dumps(LIVE, sort_keys=True)
    merged = merge_schemas(desired, LIVE)
    props = merged["properties"]
    assert props["auto_detected"] == {"type": "string"}
    assert props["year"] == {"type": "number", "indexable": True, "retrievable": True}
    assert props["new_field"] == {"type": "string"}
    assert set(props["authors"]["items"]["properties"]) == {"name", "email"}
    assert json.dumps(LIVE, sort_keys=True) == snapshot


def test_merge_type_conflict_replaces_field_or_keeps_live():
    desired = {"properties": {"year": {"type": "string", "searchable": True}, "title": {"searchable": True}}}
    assert merge_schemas(desired, LIVE)["properties"]["year"] == {"type": "string", "searchable": True}
    kept = merge_schemas(desired, LIVE, keep_live_types=True)["properties"]
    assert kept["year"] == LIVE["properties"]["year"]
    assert kept["title"]["searchable"] is True  # safe change still applied


def test_merge_null_removes_and_root_overrides():
    live = dict(LIVE, geolocation_detection=True)
    desired = {"datetime_detection": True, "geolocation_detection": None,
               "properties": {"title": {"keyPropertyMapping": None}, "new": {"type": "string", "retrievable": None}}}
    merged = merge_schemas(desired, live)
    assert merged["datetime_detection"] is True and "geolocation_detection" not in merged
    assert "keyPropertyMapping" not in merged["properties"]["title"]
    assert merged["properties"]["new"] == {"type": "string"}


def test_duplicate_key_property_in_merged_schema():
    merged = merge_schemas({"properties": {"headline": {"type": "string", "keyPropertyMapping": "title"}}}, LIVE)
    with pytest.raises(InvalidSchemaError, match="unique"):
        check_key_properties(merged)


# ============================================ key-property service rules (found in live E2E)
@pytest.mark.parametrize("annotation", ["searchable", "indexable"])
def test_key_property_field_cannot_be_searchable_or_indexable(annotation):
    bad = {"properties": {"title": {"type": "string", "keyPropertyMapping": "title", annotation: True}}}
    with pytest.raises(InvalidSchemaError, match="cannot be searchable or indexable"):
        load_schema(bad)


def test_key_property_with_false_annotations_is_ok():
    ok = {"properties": {"title": {"type": "string", "keyPropertyMapping": "title",
                                   "searchable": False, "indexable": False, "retrievable": True}}}
    assert load_schema(ok)["properties"]["title"]["retrievable"] is True


def test_key_property_rule_checked_on_merged_schema():
    live = {"properties": {"category": {"type": "string", "indexable": True}}}
    merged = merge_schemas({"properties": {"category": {"keyPropertyMapping": "description"}}}, live)
    with pytest.raises(InvalidSchemaError, match="category"):
        check_key_properties(merged)
