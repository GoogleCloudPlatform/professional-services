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

"""Opaque-Box Requirement-Driven End-to-End (E2E) Test Suite (Tiers 1-4).

Exercises the Cloud Logging at Scale to BigQuery via Pub/Sub Single Message
Transform (SMT) solution across Documentation, Terraform IaC, Node.js SMT UDF,
and Python Operational CLI.
"""

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
NODE_FALLBACK = "/usr/local/google/home/kasin/.local/bin/node"
NODE_BIN = shutil.which("node") or NODE_FALLBACK
UDF_PATH = PROJECT_ROOT / "udf" / "process_cloud_logs.js"
CLI_PATH = PROJECT_ROOT / "cli" / "log_pipeline_tool.py"
SCHEMA_PATH = PROJECT_ROOT / "terraform" / "schema.json"
README_PATH = PROJECT_ROOT / "README.md"


def run_udf_node(message_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Executes udf/process_cloud_logs.js in an isolated Node.js subprocess."""
    script = f"""
    const fs = require('fs');
    const {{ processCloudLogs }} = require({json.dumps(str(UDF_PATH))});
    const input = JSON.parse(fs.readFileSync(0, 'utf-8'));
    const result = processCloudLogs(input, {{}});
    console.log(JSON.stringify(result));
    """
    proc = subprocess.run(
        [NODE_BIN, "-e", script],
        input=json.dumps(message_dict),
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(proc.stdout.strip())


def run_cli(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    """Executes cli/log_pipeline_tool.py in an isolated Python subprocess."""
    return subprocess.run(
        [sys.executable, str(CLI_PATH), *args],
        capture_output=True,
        text=True,
        check=check,
    )


def validate_record_against_schema(
    record: Dict[str, Any], schema_fields: List[Dict[str, Any]]
) -> None:
    """Validates that a transformed log dict conforms to BigQuery schema."""
    field_map = {col["name"]: col for col in schema_fields}
    for key, value in record.items():
        assert key in field_map, f"Unknown field '{key}' not in BQ schema"
        if value is None:
            continue
        col_def = field_map[key]
        col_type = col_def["type"]
        if col_type == "JSON":
            assert isinstance(
                value, str
            ), f"Field '{key}' must be JSON string, got {type(value)}"
            parsed = json.loads(value)
            assert parsed is not None or value == "null"
        elif col_type == "STRING":
            assert isinstance(value, str), f"Field '{key}' must be str"
        elif col_type == "TIMESTAMP":
            assert isinstance(value, str), f"Field '{key}' must be str"
        elif col_type == "INTEGER":
            assert isinstance(value, int) and not isinstance(
                value, bool
            ), f"Field '{key}' must be int"
        elif col_type == "BOOLEAN":
            assert isinstance(value, bool), f"Field '{key}' must be bool"
        elif col_type == "RECORD":
            assert isinstance(value, dict), f"Field '{key}' must be dict"
            validate_record_against_schema(value, col_def.get("fields", []))


# ============================================================================
# TIER 1: FEATURE COVERAGE (>= 5 Tests per Feature Area)
# ============================================================================

# --- Feature Area A: De-Identification & Enterprise PSO Documentation ---


def test_tier1_area_a_readme_exists_and_non_empty() -> None:
    """Verifies README.md exists at root and contains rich documentation."""
    assert README_PATH.exists(), "README.md must exist at project root"
    content = README_PATH.read_text(encoding="utf-8")
    assert len(content) > 2500, "README.md must be comprehensive (>2500 bytes)"


def test_tier1_area_a_zero_client_identifiers() -> None:
    """Verifies zero occurrences of client/demo identifiers in README.md."""
    content = README_PATH.read_text(encoding="utf-8")
    p_client = r"\b" + "k" + "tb" + r"\b"
    p_demo = "cloud-logging-" + "bq-demo"
    p_region = "asia-" + "southeast3"
    for pattern in [p_client, p_demo, p_region]:
        matches = re.findall(pattern, content, flags=re.IGNORECASE)
        assert not matches, f"Forbidden identifier '{pattern}' in README.md"


def test_tier1_area_a_screenshot_excluded() -> None:
    """Verifies binary screenshot01.png with visual leaks is excluded."""
    screenshot_files = list(PROJECT_ROOT.rglob("screenshot01.png"))
    assert not screenshot_files, "screenshot01.png must not exist in repo"


def test_tier1_area_a_mermaid_diagrams_present() -> None:
    """Verifies README.md contains architecture & sequence Mermaid diagrams."""
    content = README_PATH.read_text(encoding="utf-8")
    assert "```mermaid" in content, "README.md must contain Mermaid diagrams"
    has_arch = "flowchart" in content or "graph " in content
    has_seq = "sequenceDiagram" in content
    assert has_arch, "README.md must include a Mermaid architecture diagram"
    assert has_seq, "README.md must include a Mermaid sequence diagram"


def test_tier1_area_a_operational_monitoring_metrics_documented() -> None:
    """Verifies all 4 required Cloud Monitoring metrics are documented."""
    content = README_PATH.read_text(encoding="utf-8")
    required_metrics = [
        "logging.googleapis.com/billing/bytes_ingested",
        "logging.googleapis.com/exports/byte_count",
        "pubsub.googleapis.com/subscription/num_undelivered_messages",
        "pubsub.googleapis.com/subscription/message_transform_latencies",
    ]
    for metric in required_metrics:
        assert metric in content, f"Metric '{metric}' missing from README.md"


def test_tier1_area_a_finops_rationale_documented() -> None:
    """Verifies README.md explains FinOps exclusion & SMT rationale."""
    content = README_PATH.read_text(encoding="utf-8")
    assert "_Default" in content
    assert "processCloudLogs" in content
    assert "PARTITION BY" in content or "partition" in content.lower()


# --- Feature Area B: Turnkey Terraform IaC & BigQuery Schema ---


def test_tier1_area_b_terraform_files_exist() -> None:
    """Verifies all 5 required Terraform IaC and schema files exist."""
    tf_dir = PROJECT_ROOT / "terraform"
    for filename in [
        "main.tf",
        "variables.tf",
        "outputs.tf",
        "versions.tf",
        "schema.json",
    ]:
        path = tf_dir / filename
        assert path.exists(), f"Missing required Terraform file: {filename}"


def test_tier1_area_b_schema_json_structure() -> None:
    """Verifies schema.json defines 20 top-level columns & 44 total fields."""
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    assert isinstance(schema, list)
    assert len(schema) == 20, f"Expected 20 top columns, got {len(schema)}"

    def count_fields(fields_list: List[Dict[str, Any]]) -> int:
        total = 0
        for field in fields_list:
            total += 1
            if "fields" in field:
                total += count_fields(field["fields"])
        return total

    total_fields = count_fields(schema)
    assert total_fields == 44, f"Expected 44 total fields, got {total_fields}"


def test_tier1_area_b_schema_json_types() -> None:
    """Verifies JSON and RECORD column type mappings in schema.json."""
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    col_map = {col["name"]: col for col in schema}
    for json_col in ["attributes", "jsonPayload", "protoPayload", "labels"]:
        assert col_map[json_col]["type"] == "JSON"
    for rec_col in ["resource", "httpRequest", "operation", "sourceLocation"]:
        assert col_map[rec_col]["type"] == "RECORD"
    resource_fields = {f["name"]: f for f in col_map["resource"]["fields"]}
    assert resource_fields["labels"]["type"] == "JSON"
    assert len(col_map["httpRequest"]["fields"]) == 15
    assert len(col_map["operation"]["fields"]) == 4
    assert len(col_map["sourceLocation"]["fields"]) == 3


def test_tier1_area_b_hcl_core_resources() -> None:
    """Verifies main.tf defines dataset/table, Pub/Sub topics/subs, and SMT."""
    main_tf_path = PROJECT_ROOT / "terraform" / "main.tf"
    main_tf = main_tf_path.read_text(encoding="utf-8")
    required_snippets = [
        'resource "google_bigquery_dataset"',
        'resource "google_bigquery_table"',
        "cloud-logs-ingestion-topic",
        "cloud-logs-dlq-topic",
        "cloud-logs-dlq-sub",
        "cloud-logs-bq-sub",
        "use_table_schema",
        "write_metadata",
        "max_delivery_attempts",
        "javascript_udf",
        "processCloudLogs",
    ]
    for snippet in required_snippets:
        assert snippet in main_tf, f"Missing '{snippet}' in terraform/main.tf"


def test_tier1_area_b_hcl_sink_exclusion_iam_alerts() -> None:
    """Verifies main.tf defines Log Sink, Exclusion, IAM, and Alerts."""
    main_tf_path = PROJECT_ROOT / "terraform" / "main.tf"
    main_tf = main_tf_path.read_text(encoding="utf-8")
    required_snippets = [
        'resource "google_logging_project_sink"',
        'resource "google_logging_project_exclusion"',
        "roles/bigquery.dataEditor",
        "roles/pubsub.publisher",
        "roles/pubsub.subscriber",
        'resource "google_monitoring_alert_policy"',
        "num_undelivered_messages",
        "message_transform_latencies",
    ]
    for snippet in required_snippets:
        assert snippet in main_tf, f"Missing '{snippet}' in terraform/main.tf"


# --- Feature Area C: Inline JavaScript SMT UDF ---


def test_tier1_area_c_udf_stringifies_json_payload() -> None:
    """Verifies processCloudLogs stringifies jsonPayload object."""
    payload = {
        "insertId": "id-001",
        "logName": "projects/p/logs/app",
        "timestamp": "2026-09-15T03:00:00Z",
        "severity": "INFO",
        "jsonPayload": {"event": "login", "status": "ok", "latency_ms": 14},
    }
    msg = {"data": json.dumps(payload), "attributes": {}}
    res = run_udf_node(msg)
    assert "udf_error" not in res.get("attributes", {})
    data_out = json.loads(res["data"])
    assert isinstance(data_out["jsonPayload"], str)
    assert json.loads(data_out["jsonPayload"]) == payload["jsonPayload"]


def test_tier1_area_c_udf_stringifies_proto_payload() -> None:
    """Verifies processCloudLogs stringifies protoPayload audit object."""
    payload = {
        "insertId": "id-002",
        "severity": "NOTICE",
        "protoPayload": {
            "@type": "type.googleapis.com/google.cloud.audit.AuditLog",
            "methodName": "google.iam.admin.v1.CreateServiceAccount",
            "authenticationInfo": {"principalEmail": "admin@example.com"},
        },
    }
    res = run_udf_node({"data": json.dumps(payload)})
    data_out = json.loads(res["data"])
    assert isinstance(data_out["protoPayload"], str)
    parsed_proto = json.loads(data_out["protoPayload"])
    assert parsed_proto["methodName"].endswith("CreateServiceAccount")


def test_tier1_area_c_udf_stringifies_labels_and_resource_labels() -> None:
    """Verifies labels and resource.labels are stringified while type stays."""
    payload = {
        "insertId": "id-003",
        "labels": {"env": "prod", "team": "secops"},
        "resource": {
            "type": "k8s_container",
            "labels": {"cluster_name": "prod-us-central1", "pod": "api-7f"},
        },
    }
    res = run_udf_node({"data": json.dumps(payload)})
    data_out = json.loads(res["data"])
    assert isinstance(data_out["labels"], str)
    assert isinstance(data_out["resource"]["labels"], str)
    assert data_out["resource"]["type"] == "k8s_container"


def test_tier1_area_c_udf_preserves_top_level_scalars_and_records() -> None:
    """Verifies top-level scalars and RECORD objects remain un-stringified."""
    payload = {
        "insertId": "id-004",
        "logName": "projects/p/logs/lb",
        "timestamp": "2026-09-15T03:00:00Z",
        "severity": "WARNING",
        "trace": "projects/p/traces/12345",
        "spanId": "abcde",
        "traceSampled": True,
        "httpRequest": {
            "requestMethod": "GET",
            "status": 200,
            "cacheHit": True,
        },
        "operation": {
            "id": "op-1",
            "producer": "svc",
            "first": True,
            "last": False,
        },
        "sourceLocation": {
            "file": "auth.py",
            "line": 42,
            "function": "verify",
        },
    }
    res = run_udf_node({"data": json.dumps(payload)})
    data_out = json.loads(res["data"])
    assert isinstance(data_out["httpRequest"], dict)
    assert data_out["httpRequest"]["status"] == 200
    assert isinstance(data_out["operation"], dict)
    assert isinstance(data_out["sourceLocation"], dict)
    assert data_out["traceSampled"] is True


def test_tier1_area_c_udf_handles_text_payload_entry() -> None:
    """Verifies simple textPayload log entry transforms cleanly."""
    payload = {
        "insertId": "id-005",
        "severity": "ERROR",
        "textPayload": "Connection refused to database replica",
    }
    res = run_udf_node({"data": json.dumps(payload)})
    assert "udf_error" not in res.get("attributes", {})
    data_out = json.loads(res["data"])
    assert data_out["textPayload"] == "Connection refused to database replica"


# --- Feature Area D: Python Operational CLI ---


def test_tier1_area_d_cli_generate_logs_json(tmp_path: Path) -> None:
    """Verifies generate-logs subcommand outputs valid JSON log entries."""
    out_file = tmp_path / "gen_json.jsonl"
    proc = run_cli(
        "generate-logs",
        "--mode",
        "local",
        "--payload-type",
        "json",
        "--count",
        "5",
        "--output-file",
        str(out_file),
    )
    assert proc.returncode == 0
    raw_text = out_file.read_text(encoding="utf-8")
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
    assert len(lines) == 5
    for line in lines:
        entry = json.loads(line)
        assert "jsonPayload" in entry


def test_tier1_area_d_cli_generate_logs_proto_and_http() -> None:
    """Verifies generate-logs supports proto and http payload types."""
    proc_proto = run_cli(
        "generate-logs",
        "--mode",
        "local",
        "--payload-type",
        "proto",
        "--count",
        "2",
    )
    assert proc_proto.returncode == 0
    for line in proc_proto.stdout.strip().splitlines():
        assert "protoPayload" in json.loads(line)

    proc_http = run_cli(
        "generate-logs",
        "--mode",
        "local",
        "--payload-type",
        "http",
        "--count",
        "2",
    )
    assert proc_http.returncode == 0
    for line in proc_http.stdout.strip().splitlines():
        assert "httpRequest" in json.loads(line)


def test_tier1_area_d_cli_inspect_dlq_mock_file(tmp_path: Path) -> None:
    """Verifies inspect-dlq reads failed messages from --mock-file."""
    dlq_messages = [
        {
            "message_id": "msg-101",
            "publish_time": "2026-09-15T03:10:00Z",
            "data": "RAW_CORRUPTED_JSON_{",
            "attributes": {"udf_error": "SyntaxError: Unexpected token"},
        }
    ]
    mock_file = tmp_path / "dlq_mock.json"
    mock_file.write_text(json.dumps(dlq_messages), encoding="utf-8")

    mock_path = str(mock_file)
    proc = run_cli("inspect-dlq", "--mock-file", mock_path, "--format", "json")
    assert proc.returncode == 0
    report = json.loads(proc.stdout.strip())
    assert len(report) == 1
    assert "SyntaxError" in report[0]["udf_error"]


def test_tier1_area_d_cli_replay_dlq_auto_repair(tmp_path: Path) -> None:
    """Verifies replay-dlq --auto-repair wraps raw strings into LogEntry."""
    dlq_messages = [
        {
            "message_id": "msg-102",
            "data": "UNPARSABLE_SYSLOG_LINE",
            "attributes": {"udf_error": "SyntaxError: Unexpected token U"},
        }
    ]
    mock_file = tmp_path / "dlq_in.json"
    out_file = tmp_path / "dlq_repaired.jsonl"
    mock_file.write_text(json.dumps(dlq_messages), encoding="utf-8")

    proc = run_cli(
        "replay-dlq",
        "--mock-file",
        str(mock_file),
        "--output-file",
        str(out_file),
        "--auto-repair",
    )
    assert proc.returncode == 0
    repaired_lines = out_file.read_text(encoding="utf-8").strip().splitlines()
    assert len(repaired_lines) == 1
    repaired_msg = json.loads(repaired_lines[0])
    assert "udf_error" not in repaired_msg.get("attributes", {})
    inner_data = (
        json.loads(repaired_msg["data"])
        if isinstance(repaired_msg.get("data"), str)
        else repaired_msg
    )
    assert "textPayload" in inner_data


def test_tier1_area_d_cli_analyze_savings_table_and_json() -> None:
    """Verifies analyze-savings returns complete FinOps cost breakdown."""
    proc = run_cli(
        "analyze-savings",
        "--daily-gb",
        "50",
        "--retention-days",
        "90",
        "--format",
        "json",
    )
    assert proc.returncode == 0
    data = json.loads(proc.stdout.strip())
    required_keys = [
        "monthly_volume_gb",
        "baseline_monthly_cost_usd",
        "optimized_monthly_cost_usd",
        "monthly_savings_usd",
        "annual_savings_usd",
        "savings_percentage",
    ]
    for key in required_keys:
        assert key in data, f"Missing key '{key}' in analyze-savings output"
    assert data["monthly_volume_gb"] == 1500.0
    assert data["baseline_monthly_cost_usd"] == 750.0
    assert data["monthly_savings_usd"] > 0


# ============================================================================
# TIER 2: BOUNDARY & CORNER CASES (>= 5 Tests per Feature Area)
# ============================================================================

# --- Feature Area A Boundaries ---


def test_tier2_area_a_case_insensitive_client_id_variants() -> None:
    """Scans deliverable code/docs in repository for client ID leaks."""
    p_client = r"\b" + "k" + "tb" + r"\b"
    p_demo = "cloud-logging-" + "bq-demo"
    p_region = "asia-" + "southeast3"
    target_paths = [
        README_PATH,
        *list((PROJECT_ROOT / "udf").rglob("*")),
        *list((PROJECT_ROOT / "terraform").rglob("*")),
        *list((PROJECT_ROOT / "cli").rglob("*")),
        *list((PROJECT_ROOT / "tests").rglob("*")),
    ]
    for path in target_paths:
        if path.is_dir() or path.suffix in {".png", ".jpg", ".pyc", ".whl"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        rel = path.relative_to(PROJECT_ROOT)
        assert not re.search(p_client, text, re.IGNORECASE), f"Leak in {rel}"
        assert p_demo not in text.lower(), f"Demo project leak in {rel}"
        assert p_region not in text.lower(), f"Region leak in {rel}"


def test_tier2_area_a_no_unparameterized_project_placeholders() -> None:
    """Verifies README.md does not use legacy 'your_project:' strings."""
    content = README_PATH.read_text(encoding="utf-8")
    assert "your_project:" not in content
    assert "your_project." not in content


def test_tier2_area_a_bates_stamp_wrapper_integrity() -> None:
    """Verifies README.md includes Bates stamp B03.051 start and end tags."""
    content = README_PATH.read_text(encoding="utf-8").strip()
    assert content.startswith("<!-- BATES_START: B03.051 -->")
    assert content.endswith("<!-- BATES_END: B03.051 -->")


def test_tier2_area_a_markdown_code_blocks_balanced() -> None:
    """Verifies all fenced code blocks in README.md are properly closed."""
    content = README_PATH.read_text(encoding="utf-8")
    fence_count = len(re.findall(r"^```", content, flags=re.MULTILINE))
    assert fence_count % 2 == 0, f"Unbalanced fences: count={fence_count}"


def test_tier2_area_a_apache_header_in_readme() -> None:
    """Verifies README.md contains Google LLC Apache 2.0 license header."""
    content = README_PATH.read_text(encoding="utf-8")
    assert "Copyright 2026 Google LLC" in content
    assert "apache.org/licenses/LICENSE-2.0" in content


# --- Feature Area B Boundaries ---


def test_tier2_area_b_schema_all_44_fields_nullable_and_described() -> None:
    """Verifies all 44 fields in schema.json are NULLABLE with description."""
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))

    def verify_fields(fields: List[Dict[str, Any]]) -> None:
        for f in fields:
            name = f.get("name")
            assert f.get("mode") == "NULLABLE", f"Field {name} not NULLABLE"
            assert f.get("description") and len(f["description"].strip()) > 5
            if "fields" in f:
                verify_fields(f["fields"])

    verify_fields(schema)


def test_tier2_area_b_schema_no_duplicate_column_names() -> None:
    """Verifies zero duplicate column names at top level or inside RECORDs."""
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    top_names = [col["name"] for col in schema]
    assert len(top_names) == len(set(top_names))
    for col in schema:
        if "fields" in col:
            sub_names = [sub["name"] for sub in col["fields"]]
            assert len(sub_names) == len(set(sub_names))


def test_tier2_area_b_terraform_variables_defaults_and_types() -> None:
    """Verifies variables.tf defines expected defaults and variable blocks."""
    vars_path = PROJECT_ROOT / "terraform" / "variables.tf"
    vars_tf = vars_path.read_text(encoding="utf-8")
    for var_name in [
        "project_id",
        "region",
        "dataset_id",
        "table_id",
        "log_filter",
        "enable_log_exclusion",
    ]:
        assert f'variable "{var_name}"' in vars_tf
    assert '"us-central1"' in vars_tf
    assert '"unified_cloud_logs"' in vars_tf


def test_tier2_area_b_terraform_versions_constraints() -> None:
    """Verifies versions.tf specifies Terraform >= 1.3.0 & google >= 5.20.0."""
    ver_path = PROJECT_ROOT / "terraform" / "versions.tf"
    versions_tf = ver_path.read_text(encoding="utf-8")
    assert ">= 1.3.0" in versions_tf
    assert "hashicorp/google" in versions_tf
    assert ">= 5.20.0" in versions_tf or ">= 5.16.0" in versions_tf


def test_tier2_area_b_terraform_outputs_completeness() -> None:
    """Verifies outputs.tf exports dataset, table, topics, subs, and sink."""
    out_path = PROJECT_ROOT / "terraform" / "outputs.tf"
    outputs_tf = out_path.read_text(encoding="utf-8")
    for out_name in [
        "bigquery_table_id",
        "ingestion_topic_name",
        "dlq_topic_name",
        "dlq_subscription_name",
        "bq_subscription_name",
        "log_sink_writer_identity",
    ]:
        assert f'output "{out_name}"' in outputs_tf


# --- Feature Area C Boundaries ---


def test_tier2_area_c_udf_empty_json_object() -> None:
    """Verifies empty JSON object {} transforms cleanly without error."""
    res = run_udf_node({"data": "{}"})
    assert "udf_error" not in res.get("attributes", {})
    assert json.loads(res["data"]) == {}


def test_tier2_area_c_udf_deeply_nested_objects_5_levels() -> None:
    """Verifies 6-level deeply nested object in jsonPayload is stringified."""
    deep_obj = {"l1": {"l2": {"l3": {"l4": {"l5": {"l6": "bottom_value"}}}}}}
    res = run_udf_node({"data": json.dumps({"jsonPayload": deep_obj})})
    assert "udf_error" not in res.get("attributes", {})
    out = json.loads(res["data"])
    assert isinstance(out["jsonPayload"], str)
    parsed = json.loads(out["jsonPayload"])
    assert parsed["l1"]["l2"]["l3"]["l4"]["l5"]["l6"] == "bottom_value"


def test_tier2_area_c_udf_null_and_primitive_fields() -> None:
    """Verifies null values stay null and primitives do not crash."""
    payload = {
        "jsonPayload": None,
        "protoPayload": None,
        "labels": None,
        "resource": {"type": "gce_instance", "labels": None},
    }
    res = run_udf_node({"data": json.dumps(payload)})
    assert "udf_error" not in res.get("attributes", {})
    out = json.loads(res["data"])
    assert out["jsonPayload"] is None
    assert out["labels"] is None
    assert out["resource"]["labels"] is None


def test_tier2_area_c_udf_rejects_root_array_and_primitives() -> None:
    """Verifies root JSON arrays, numbers, booleans, and null are rejected."""
    invalid_roots = ["[1, 2, 3]", "42", '"just_a_string"', "true", "null"]
    for root_str in invalid_roots:
        res = run_udf_node({"data": root_str})
        attrs = res.get("attributes", {})
        assert "udf_error" in attrs, f"Root '{root_str}' should fail"
        assert res["data"] == root_str


def test_tier2_area_c_udf_pre_stringified_json_no_double_escape() -> None:
    """Verifies already-stringified jsonPayload is not double-stringified."""
    pre_str = '{"already":"stringified"}'
    res = run_udf_node({"data": json.dumps({"jsonPayload": pre_str})})
    out = json.loads(res["data"])
    assert out["jsonPayload"] == pre_str


def test_tier2_area_c_udf_missing_attributes_on_malformed_input() -> None:
    """Verifies missing message.attributes is initialized safely on error."""
    res = run_udf_node({"data": "MALFORMED_JSON_{{"})
    assert isinstance(res.get("attributes"), dict)
    assert "udf_error" in res["attributes"]


# --- Feature Area D Boundaries ---


def test_tier2_area_d_cli_analyze_savings_zero_daily_gb_exits_2() -> None:
    """Verifies analyze-savings --daily-gb 0 exits with code 2."""
    proc = run_cli(
        "analyze-savings",
        "--daily-gb",
        "0",
        "--retention-days",
        "30",
        check=False,
    )
    assert proc.returncode == 2


def test_tier2_area_d_cli_analyze_savings_negative_daily_gb_exits_2() -> None:
    """Verifies analyze-savings --daily-gb -10 exits with code 2."""
    proc = run_cli(
        "analyze-savings",
        "--daily-gb",
        "-10",
        "--retention-days",
        "30",
        check=False,
    )
    assert proc.returncode == 2


def test_tier2_area_d_cli_analyze_savings_zero_retention_exits_2() -> None:
    """Verifies analyze-savings --retention-days 0 exits with code 2."""
    proc = run_cli(
        "analyze-savings",
        "--daily-gb",
        "10",
        "--retention-days",
        "0",
        check=False,
    )
    assert proc.returncode == 2


def test_tier2_area_d_cli_inspect_dlq_empty_mock_file(tmp_path: Path) -> None:
    """Verifies inspect-dlq handles an empty JSON array in mock file."""
    empty_mock = tmp_path / "empty_dlq.json"
    empty_mock.write_text("[]", encoding="utf-8")
    mock_str = str(empty_mock)
    proc = run_cli("inspect-dlq", "--mock-file", mock_str, "--format", "json")
    assert proc.returncode == 0
    assert json.loads(proc.stdout.strip()) == []


def test_tier2_area_d_cli_generate_logs_single_entry(tmp_path: Path) -> None:
    """Verifies generate-logs --count 1 writes exactly one valid JSON line."""
    out_file = tmp_path / "single.jsonl"
    proc = run_cli(
        "generate-logs",
        "--mode",
        "local",
        "--payload-type",
        "json",
        "--count",
        "1",
        "--output-file",
        str(out_file),
    )
    assert proc.returncode == 0
    lines = out_file.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1


# ============================================================================
# TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Integration Chains)
# ============================================================================


def test_tier3_chain1_happy_path_cli_to_udf_to_schema_validation(
    tmp_path: Path,
) -> None:
    """Chain 1: CLI generate-logs -> Node.js UDF -> BQ Schema Validation."""
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    for ptype in ["json", "proto", "http"]:
        out_file = tmp_path / f"logs_{ptype}.jsonl"
        run_cli(
            "generate-logs",
            "--mode",
            "local",
            "--payload-type",
            ptype,
            "--count",
            "5",
            "--output-file",
            str(out_file),
        )
        lines = out_file.read_text(encoding="utf-8").strip().splitlines()
        assert len(lines) == 5
        for raw_line in lines:
            pubsub_msg = {"data": raw_line, "attributes": {}}
            transformed = run_udf_node(pubsub_msg)
            assert "udf_error" not in transformed.get("attributes", {})
            bq_row = json.loads(transformed["data"])
            validate_record_against_schema(bq_row, schema)


def test_tier3_chain2_dlq_capture_inspect_and_auto_repair_replay(
    tmp_path: Path,
) -> None:
    """Chain 2: CLI malformed logs -> UDF failure -> DLQ inspect & replay."""
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    malformed_file = tmp_path / "malformed.jsonl"
    run_cli(
        "generate-logs",
        "--mode",
        "local",
        "--payload-type",
        "malformed",
        "--count",
        "6",
        "--output-file",
        str(malformed_file),
    )
    raw_lines = malformed_file.read_text(encoding="utf-8").strip().splitlines()
    assert len(raw_lines) == 6

    dlq_records = []
    for idx, raw_line in enumerate(raw_lines):
        res = run_udf_node({"data": raw_line, "attributes": {}})
        assert "udf_error" in res.get("attributes", {})
        dlq_records.append(
            {
                "message_id": f"dlq-msg-{idx}",
                "publish_time": "2026-09-15T03:30:00Z",
                "data": res["data"],
                "attributes": res["attributes"],
            }
        )

    dlq_mock_path = tmp_path / "captured_dlq.json"
    dlq_mock_path.write_text(json.dumps(dlq_records), encoding="utf-8")

    inspect_proc = run_cli(
        "inspect-dlq", "--mock-file", str(dlq_mock_path), "--format", "json"
    )
    assert inspect_proc.returncode == 0
    inspected_list = json.loads(inspect_proc.stdout.strip())
    assert len(inspected_list) == 6

    repaired_out_path = tmp_path / "repaired_output.jsonl"
    replay_proc = run_cli(
        "replay-dlq",
        "--mock-file",
        str(dlq_mock_path),
        "--output-file",
        str(repaired_out_path),
        "--auto-repair",
    )
    assert replay_proc.returncode == 0

    repaired_txt = repaired_out_path.read_text(encoding="utf-8").strip()
    repaired_lines = repaired_txt.splitlines()
    assert len(repaired_lines) == 6

    for rep_line in repaired_lines:
        item = json.loads(rep_line)
        data_str = (
            item["data"]
            if "data" in item and isinstance(item["data"], str)
            else rep_line
        )
        re_transformed = run_udf_node({"data": data_str, "attributes": {}})
        assert "udf_error" not in re_transformed.get("attributes", {})
        bq_row = json.loads(re_transformed["data"])
        validate_record_against_schema(bq_row, schema)


def test_tier3_chain3_mixed_stream_segregation_and_selective_replay(
    tmp_path: Path,
) -> None:
    """Chain 3: Mixed batch -> segregate -> repair DLQ -> 100% BQ valid."""
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    mixed_file = tmp_path / "mixed_batch.jsonl"
    run_cli(
        "generate-logs",
        "--mode",
        "local",
        "--payload-type",
        "mixed",
        "--count",
        "15",
        "--output-file",
        str(mixed_file),
    )
    lines = mixed_file.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 15

    valid_bq_rows = []
    dlq_items = []
    for idx, line in enumerate(lines):
        res = run_udf_node({"data": line, "attributes": {}})
        if "udf_error" in res.get("attributes", {}):
            dlq_items.append(
                {
                    "message_id": f"mix-dlq-{idx}",
                    "data": res["data"],
                    "attributes": res["attributes"],
                }
            )
        else:
            row = json.loads(res["data"])
            validate_record_against_schema(row, schema)
            valid_bq_rows.append(row)

    if dlq_items:
        dlq_file = tmp_path / "mix_dlq.json"
        repaired_file = tmp_path / "mix_repaired.jsonl"
        dlq_file.write_text(json.dumps(dlq_items), encoding="utf-8")
        run_cli(
            "replay-dlq",
            "--mock-file",
            str(dlq_file),
            "--output-file",
            str(repaired_file),
            "--auto-repair",
        )
        rep_txt = repaired_file.read_text(encoding="utf-8").strip()
        for rep_line in rep_txt.splitlines():
            item = json.loads(rep_line)
            data_str = (
                item["data"]
                if "data" in item and isinstance(item["data"], str)
                else rep_line
            )
            res2 = run_udf_node({"data": data_str, "attributes": {}})
            assert "udf_error" not in res2.get("attributes", {})
            row = json.loads(res2["data"])
            validate_record_against_schema(row, schema)
            valid_bq_rows.append(row)

    assert len(valid_bq_rows) == 15


def test_tier3_chain4_terraform_udf_path_and_schema_cross_check() -> None:
    """Chain 4: Cross-checks Terraform main.tf references with UDF & Schema."""
    main_tf_path = PROJECT_ROOT / "terraform" / "main.tf"
    main_tf = main_tf_path.read_text(encoding="utf-8")
    assert "processCloudLogs" in main_tf
    assert "../udf/process_cloud_logs.js" in main_tf
    assert "schema.json" in main_tf

    res = run_udf_node({"data": json.dumps({"severity": "INFO"})})
    assert json.loads(res["data"])["severity"] == "INFO"


# ============================================================================
# TIER 4: REAL-WORLD APPLICATION SCENARIOS (Enterprise FinOps & SecOps)
# ============================================================================


def test_tier4_scenario1_enterprise_finops_audit_100gb_365days() -> None:
    """Scenario 1: Enterprise FinOps Audit (100 GB/day, 365d, 80% excl)."""
    proc = run_cli(
        "analyze-savings",
        "--daily-gb",
        "100",
        "--retention-days",
        "365",
        "--default-exclusion-pct",
        "80",
        "--format",
        "json",
    )
    assert proc.returncode == 0
    report = json.loads(proc.stdout.strip())
    assert report["monthly_volume_gb"] == 3000.0
    assert report["baseline_monthly_cost_usd"] == 1500.0
    assert report["optimized_monthly_cost_usd"] < 600.0
    assert report["monthly_savings_usd"] > 900.0
    assert report["savings_percentage"] > 60.0


def test_tier4_scenario2_high_scale_multi_service_telemetry_batch() -> None:
    """Scenario 2: Multi-service batch (GKE, Cloud LB, Audit, Syslog)."""
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    batch = [
        json.dumps(
            {
                "insertId": "gke-991",
                "logName": "projects/ent-prod/logs/stdout",
                "timestamp": "2026-09-15T03:45:00Z",
                "severity": "INFO",
                "resource": {
                    "type": "k8s_container",
                    "labels": {
                        "cluster_name": "finops-cluster",
                        "namespace_name": "payments",
                        "pod_name": "ledger-svc-6d4f",
                    },
                },
                "jsonPayload": {
                    "transaction_id": "tx-884920",
                    "amount_usd": 4920.50,
                    "flags": ["pci_dss", "verified"],
                },
                "labels": {"k8s-pod/app": "ledger"},
            }
        ),
        json.dumps(
            {
                "insertId": "lb-992",
                "logName": "projects/ent-prod/logs/requests",
                "timestamp": "2026-09-15T03:45:01Z",
                "severity": "INFO",
                "resource": {
                    "type": "http_load_balancer",
                    "labels": {"forwarding_rule_name": "fr-global-https"},
                },
                "httpRequest": {
                    "requestMethod": "POST",
                    "requestUrl": "https://api.enterprise.example.com/v1/pay",
                    "requestSize": 1024,
                    "status": 200,
                    "responseSize": 512,
                    "userAgent": "Mozilla/5.0",
                    "remoteIp": "203.0.113.45",
                    "serverIp": "10.128.0.12",
                    "latency": "0.038s",
                    "cacheLookup": True,
                    "cacheHit": False,
                    "protocol": "HTTP/2",
                },
            }
        ),
        json.dumps(
            {
                "insertId": "aud-993",
                "logName": "projects/ent-prod/logs/cloudaudit.activity",
                "timestamp": "2026-09-15T03:45:02Z",
                "severity": "NOTICE",
                "protoPayload": {
                    "@type": "type.googleapis.com/google.cloud.audit.AuditLog",
                    "serviceName": "iam.googleapis.com",
                    "methodName": "SetIamPolicy",
                    "authenticationInfo": {
                        "principalEmail": "secops@example.com",
                        "authoritySelector": "admin",
                    },
                },
            }
        ),
        "<134>1 2026-09-15T03:45:03Z fw-edge-01 kernel - - [INVALID_SYSLOG",
    ]

    success_rows = []
    failed_dlq = []
    for raw in batch:
        res = run_udf_node({"data": raw, "attributes": {}})
        if "udf_error" in res.get("attributes", {}):
            failed_dlq.append(res)
        else:
            row = json.loads(res["data"])
            validate_record_against_schema(row, schema)
            success_rows.append(row)

    assert len(success_rows) == 3
    assert len(failed_dlq) == 1
    assert "SyntaxError" in failed_dlq[0]["attributes"]["udf_error"]


def test_tier4_scenario3_end_to_end_secops_incident_replay_recovery(
    tmp_path: Path,
) -> None:
    """Scenario 3: SecOps unquoted stack trace storm -> DLQ -> Replay."""
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    unquoted_traces = [
        "java.lang.NullPointerException: Null object at AuthFilter.java:88",
        "FATAL: database connection pool exhausted (max=200) [host=10.4.0.19]",
    ]
    dlq_batch = []
    for idx, trace_str in enumerate(unquoted_traces):
        msg_in = {"data": trace_str, "attributes": {"source": "jvm"}}
        udf_out = run_udf_node(msg_in)
        assert "udf_error" in udf_out["attributes"]
        dlq_batch.append(
            {
                "message_id": f"secops-{idx}",
                "data": udf_out["data"],
                "attributes": udf_out["attributes"],
            }
        )

    dlq_file = tmp_path / "secops_dlq.json"
    repaired_file = tmp_path / "secops_repaired.jsonl"
    dlq_file.write_text(json.dumps(dlq_batch), encoding="utf-8")

    proc = run_cli(
        "replay-dlq",
        "--mock-file",
        str(dlq_file),
        "--output-file",
        str(repaired_file),
        "--auto-repair",
    )
    assert proc.returncode == 0
    rep_txt = repaired_file.read_text(encoding="utf-8").strip()
    repaired_lines = rep_txt.splitlines()
    assert len(repaired_lines) == 2

    for line in repaired_lines:
        obj = json.loads(line)
        has_str_data = "data" in obj and isinstance(obj["data"], str)
        data_str = obj["data"] if has_str_data else line
        final_res = run_udf_node({"data": data_str, "attributes": {}})
        assert "udf_error" not in final_res.get("attributes", {})
        row = json.loads(final_res["data"])
        validate_record_against_schema(row, schema)
        txt = row["textPayload"]
        assert "NullPointerException" in txt or "FATAL" in txt
