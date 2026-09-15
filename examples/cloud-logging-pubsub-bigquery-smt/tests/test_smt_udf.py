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

"""Offline unit test suite for udf/process_cloud_logs.js via Node.js.

Covers 12 distinct payload edge cases including object stringification,
top-level scalar/RECORD preservation, already-stringified strings, null fields,
missing optional fields, malformed non-JSON inputs, root array/primitive
rejection, missing message.attributes initialization, and envelope unwrapping.
"""

import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent
UDF_PATH = PROJECT_ROOT / "udf" / "process_cloud_logs.js"


def _find_node_binary() -> str:
    """Locates the Node.js executable binary."""
    preferred = "/usr/local/google/home/kasin/.local/bin/node"
    if os.path.isfile(preferred) and os.access(preferred, os.X_OK):
        return preferred
    fallback = shutil.which("node")
    if fallback:
        return fallback
    raise RuntimeError("Node.js binary not found in PATH or ~/.local/bin/node")


def run_js_udf(
    message: Any, metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Executes processCloudLogs(message, metadata) via Node.js subprocess."""
    node_bin = _find_node_binary()
    js_harness = f"""
    const fs = require('fs');
    const {{ processCloudLogs }} = require({json.dumps(str(UDF_PATH))});
    const payload = JSON.parse(fs.readFileSync(0, 'utf-8'));
    const result = processCloudLogs(payload.message, payload.metadata);
    process.stdout.write(JSON.stringify(result));
    """
    input_str = json.dumps({"message": message, "metadata": metadata or {}})
    proc = subprocess.run(
        [node_bin, "-e", js_harness],
        input=input_str,
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(proc.stdout)


def test_edge_case_01_json_payload_object_stringification() -> None:
    """Verifies standard nested jsonPayload object is stringified cleanly."""
    payload = {
        "insertId": "test-01",
        "logName": "projects/test-proj/logs/app",
        "timestamp": "2026-09-15T00:00:00Z",
        "severity": "INFO",
        "jsonPayload": {
            "user": "alice",
            "action": "transfer",
            "amount": 250.75,
            "nested": {"status": "approved", "codes": [10, 20]},
        },
    }
    msg = {"data": json.dumps(payload), "attributes": {"source": "gke"}}
    res = run_js_udf(msg)

    assert "udf_error" not in res.get("attributes", {})
    out_data = json.loads(res["data"])
    assert isinstance(out_data["jsonPayload"], str)
    assert json.loads(out_data["jsonPayload"]) == payload["jsonPayload"]


def test_edge_case_02_proto_payload_object_stringification() -> None:
    """Verifies AuditLog protoPayload object is stringified to JSON string."""
    log_name = "projects/test-proj/logs/cloudaudit.googleapis.com%2Factivity"
    payload = {
        "insertId": "test-02",
        "logName": log_name,
        "timestamp": "2026-09-15T00:01:00Z",
        "severity": "NOTICE",
        "protoPayload": {
            "@type": "type.googleapis.com/google.cloud.audit.AuditLog",
            "serviceName": "bigquery.googleapis.com",
            "methodName": "InsertJob",
            "authenticationInfo": {"principalEmail": "user@example.com"},
        },
    }
    msg = {"data": json.dumps(payload), "attributes": {}}
    res = run_js_udf(msg)

    assert "udf_error" not in res.get("attributes", {})
    out_data = json.loads(res["data"])
    assert isinstance(out_data["protoPayload"], str)
    assert json.loads(out_data["protoPayload"]) == payload["protoPayload"]


def test_edge_case_03_labels_and_resource_labels_stringification() -> None:
    """Verifies top-level labels and nested resource.labels are stringified."""
    payload = {
        "insertId": "test-03",
        "logName": "projects/test-proj/logs/sys",
        "timestamp": "2026-09-15T00:02:00Z",
        "severity": "WARNING",
        "labels": {"env": "production", "tier": "backend"},
        "resource": {
            "type": "gce_instance",
            "labels": {"instance_id": "987654321", "zone": "us-central1-a"},
        },
    }
    msg = {"data": json.dumps(payload), "attributes": {}}
    res = run_js_udf(msg)

    out_data = json.loads(res["data"])
    assert isinstance(out_data["labels"], str)
    assert json.loads(out_data["labels"]) == payload["labels"]
    assert out_data["resource"]["type"] == "gce_instance"
    assert isinstance(out_data["resource"]["labels"], str)
    res_labels = json.loads(out_data["resource"]["labels"])
    assert res_labels == payload["resource"]["labels"]


def test_edge_case_04_preservation_of_top_level_scalars_and_records() -> None:
    """Verifies scalar fields and RECORD structs remain native objects."""
    payload = {
        "insertId": "test-04",
        "logName": "projects/test-proj/logs/http",
        "timestamp": "2026-09-15T00:03:00Z",
        "receiveTimestamp": "2026-09-15T00:03:01Z",
        "severity": "ERROR",
        "textPayload": "Upstream timeout",
        "trace": "projects/test-proj/traces/abcdef123456",
        "spanId": "11223344",
        "traceSampled": True,
        "httpRequest": {
            "requestMethod": "GET",
            "requestUrl": "https://example.com/healthz",
            "status": 504,
            "latency": "0.502s",
        },
        "operation": {
            "id": "op-999",
            "producer": "ingress",
            "first": True,
            "last": False,
        },
        "sourceLocation": {
            "file": "proxy.go",
            "line": 88,
            "function": "handleRequest",
        },
    }
    msg = {"data": json.dumps(payload), "attributes": {}}
    res = run_js_udf(msg)

    out_data = json.loads(res["data"])
    assert out_data["insertId"] == "test-04"
    assert out_data["traceSampled"] is True
    assert isinstance(out_data["httpRequest"], dict)
    assert out_data["httpRequest"]["status"] == 504
    assert isinstance(out_data["operation"], dict)
    assert out_data["operation"]["id"] == "op-999"
    assert isinstance(out_data["sourceLocation"], dict)
    assert out_data["sourceLocation"]["line"] == 88


def test_edge_case_05_already_stringified_payloads_not_escaped() -> None:
    """Verifies fields that are already strings are not double-stringified."""
    pre_serialized = '{"pre_serialized_key": "value_123"}'
    payload = {
        "insertId": "test-05",
        "logName": "projects/test-proj/logs/app",
        "timestamp": "2026-09-15T00:04:00Z",
        "severity": "INFO",
        "jsonPayload": pre_serialized,
        "labels": '{"env": "staging"}',
    }
    msg = {"data": json.dumps(payload), "attributes": {}}
    res = run_js_udf(msg)

    out_data = json.loads(res["data"])
    assert out_data["jsonPayload"] == pre_serialized
    assert out_data["labels"] == '{"env": "staging"}'


def test_edge_case_06_null_fields_remain_null() -> None:
    """Verifies null values in jsonPayload/protoPayload/labels stay null."""
    payload = {
        "insertId": "test-06",
        "logName": "projects/test-proj/logs/app",
        "timestamp": "2026-09-15T00:05:00Z",
        "severity": "DEBUG",
        "jsonPayload": None,
        "protoPayload": None,
        "labels": None,
        "resource": {"type": "global", "labels": None},
    }
    msg = {"data": json.dumps(payload), "attributes": {}}
    res = run_js_udf(msg)

    out_data = json.loads(res["data"])
    assert out_data["jsonPayload"] is None
    assert out_data["protoPayload"] is None
    assert out_data["labels"] is None
    assert out_data["resource"]["labels"] is None


def test_edge_case_07_minimal_text_payload_missing_optional_fields() -> None:
    """Verifies minimal payload with only textPayload executes cleanly."""
    payload = {
        "insertId": "test-07",
        "logName": "projects/test-proj/logs/minimal",
        "timestamp": "2026-09-15T00:06:00Z",
        "severity": "INFO",
        "textPayload": "Simple startup message",
    }
    msg = {"data": json.dumps(payload), "attributes": {}}
    res = run_js_udf(msg)

    assert "udf_error" not in res.get("attributes", {})
    out_data = json.loads(res["data"])
    assert out_data["textPayload"] == "Simple startup message"


def test_edge_case_08_malformed_non_json_input_populates_udf_error() -> None:
    """Verifies corrupted non-JSON string sets udf_error and preserves raw."""
    corrupted_raw = "CORRUPTED_SYSLOG_LINE_{not_valid_json_at_all"
    msg = {"data": corrupted_raw, "attributes": {"origin": "syslog"}}
    res = run_js_udf(msg)

    assert res["data"] == corrupted_raw
    assert "udf_error" in res["attributes"]
    assert "SyntaxError" in res["attributes"]["udf_error"]
    assert res["attributes"]["origin"] == "syslog"


def test_edge_case_09_array_inside_json_payload_stringified() -> None:
    """Verifies array inside jsonPayload is serialized to JSON string."""
    payload = {
        "insertId": "test-09",
        "logName": "projects/test-proj/logs/batch",
        "timestamp": "2026-09-15T00:08:00Z",
        "severity": "INFO",
        "jsonPayload": [{"batch_item": 1}, {"batch_item": 2}],
    }
    msg = {"data": json.dumps(payload), "attributes": {}}
    res = run_js_udf(msg)

    out_data = json.loads(res["data"])
    assert isinstance(out_data["jsonPayload"], str)
    expected = [{"batch_item": 1}, {"batch_item": 2}]
    assert json.loads(out_data["jsonPayload"]) == expected


def test_edge_case_10_missing_attributes_initialized_on_error() -> None:
    """Verifies missing message.attributes dictionary is safely initialized."""
    msg = {"data": "INVALID_JSON_NO_ATTRIBUTES_KEY"}
    res = run_js_udf(msg)

    assert isinstance(res.get("attributes"), dict)
    assert "udf_error" in res["attributes"]


def test_edge_case_11_root_array_and_primitive_rejection() -> None:
    """Verifies root JSON array or primitive is rejected with udf_error."""
    msg_array = {"data": '["root_array_is_invalid"]', "attributes": {}}
    res_arr = run_js_udf(msg_array)
    assert "udf_error" in res_arr["attributes"]
    assert "non-null JSON object" in res_arr["attributes"]["udf_error"]

    msg_num = {"data": "12345", "attributes": {}}
    res_num = run_js_udf(msg_num)
    assert "udf_error" in res_num["attributes"]
    assert "non-null JSON object" in res_num["attributes"]["udf_error"]


def test_edge_case_12_null_message_envelope_handling() -> None:
    """Verifies passing null message envelope returns error envelope."""
    res = run_js_udf(None)
    assert "udf_error" in res.get("attributes", {})
