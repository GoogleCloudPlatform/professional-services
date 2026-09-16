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

"""BigQuery schema compatibility tests for terraform/schema.json and UDF.

Verifies:
  1. Exact 20 top-level columns and 44 total fields in terraform/schema.json.
  2. Every column and nested subfield has mode='NULLABLE' and description.
  3. Transformed output from udf/process_cloud_logs.js strictly conforms to
     the types and structure defined in terraform/schema.json.
"""

import json
from pathlib import Path
from typing import Any, Dict, List

from cli.log_pipeline_tool import build_synthetic_log_entry
from tests.test_smt_udf import run_js_udf

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = PROJECT_ROOT / "terraform" / "schema.json"


def load_schema() -> List[Dict[str, Any]]:
    """Loads and parses terraform/schema.json."""
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def count_total_fields(fields: List[Dict[str, Any]]) -> int:
    """Recursively counts all top-level and nested RECORD subfields."""
    total = 0
    for field in fields:
        total += 1
        if field.get("type") == "RECORD" and "fields" in field:
            total += count_total_fields(field["fields"])
    return total


def test_schema_has_exact_20_top_level_and_44_total_fields() -> None:
    """Verifies 20 top-level columns and 44 total fields in schema.json."""
    schema = load_schema()
    assert len(schema) == 20, f"Expected 20 top-level cols, got {len(schema)}"
    total = count_total_fields(schema)
    assert total == 44, f"Expected 44 total fields, got {total}"


def test_schema_field_modes_and_descriptions() -> None:
    """Verifies every field and subfield has mode NULLABLE and description."""
    schema = load_schema()

    def _verify_fields(fields: List[Dict[str, Any]], prefix: str = "") -> None:
        for field in fields:
            name = f"{prefix}{field['name']}"
            mode = field.get("mode")
            assert mode == "NULLABLE", f"{name} must be NULLABLE"
            assert field.get("description"), f"{name} needs description"
            if field.get("type") == "RECORD":
                assert "fields" in field, f"RECORD {name} needs fields"
                _verify_fields(field["fields"], prefix=f"{name}.")

    _verify_fields(schema)


def test_schema_json_types_for_dynamic_fields() -> None:
    """Verifies dynamic fields are typed as JSON and structs as RECORD."""
    schema = load_schema()
    field_map = {col["name"]: col for col in schema}

    for json_col in ["attributes", "jsonPayload", "protoPayload", "labels"]:
        assert field_map[json_col]["type"] == "JSON"

    for rec_col in ["resource", "httpRequest", "operation", "sourceLocation"]:
        assert field_map[rec_col]["type"] == "RECORD"

    res_fields = field_map["resource"]["fields"]
    resource_subfields = {f["name"]: f for f in res_fields}
    assert resource_subfields["type"]["type"] == "STRING"
    assert resource_subfields["labels"]["type"] == "JSON"


def test_udf_transformed_output_conforms_to_schema_json() -> None:
    """Verifies synthetic logs transformed by UDF conform to schema.json."""
    schema = load_schema()
    schema_map = {col["name"]: col for col in schema}
    proj = "test-schema-proj"

    for ptype in ["json", "proto", "http"]:
        raw_line = build_synthetic_log_entry(0, ptype, project_id=proj)
        msg = {"data": raw_line, "attributes": {"env": "test"}}
        transformed_msg = run_js_udf(msg)

        assert "udf_error" not in transformed_msg.get("attributes", {})
        row = json.loads(transformed_msg["data"])

        for key, val in row.items():
            assert key in schema_map, f"Unknown top-level field '{key}'"
            col_def = schema_map[key]
            col_type = col_def["type"]

            if val is None:
                continue

            if col_type == "JSON":
                assert isinstance(val, str), f"Field {key} expected JSON str"
                json.loads(val)
            elif col_type == "STRING":
                assert isinstance(val, str)
            elif col_type == "BOOLEAN":
                assert isinstance(val, bool)
            elif col_type == "RECORD":
                assert isinstance(val, dict)
                sub_map = {f["name"]: f for f in col_def["fields"]}
                for sub_k, sub_v in val.items():
                    assert sub_k in sub_map, f"Unknown subfield {key}.{sub_k}"
                    if sub_v is not None and sub_map[sub_k]["type"] == "JSON":
                        assert isinstance(sub_v, str)
                        json.loads(sub_v)
