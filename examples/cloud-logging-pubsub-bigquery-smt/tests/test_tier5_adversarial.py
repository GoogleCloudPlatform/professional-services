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

"""Tier 5 White-Box Adversarial Coverage & Hardening Test Suite.

Exercises extreme edge cases, prototype pollution attacks, massive payload
stress tests, control character escaping, AST compilation, and Apache 2.0
license header compliance across the entire repository.
"""

import ast
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
NODE_FALLBACK = "/usr/local/google/home/kasin/.local/bin/node"
NODE_BIN = shutil.which("node") or NODE_FALLBACK
UDF_PATH = PROJECT_ROOT / "udf" / "process_cloud_logs.js"
CLI_PATH = PROJECT_ROOT / "cli" / "log_pipeline_tool.py"


def run_udf_raw_js(js_expression: str) -> Dict[str, Any]:
    """Executes processCloudLogs with arbitrary JS expression in Node.js."""
    script = f"""
    const {{ processCloudLogs }} = require({json.dumps(str(UDF_PATH))});
    const result = processCloudLogs({js_expression}, {{}});
    console.log(JSON.stringify(result));
    """
    proc = subprocess.run(
        [NODE_BIN, "-e", script],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(proc.stdout.strip())


def run_udf_node(message_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Executes udf/process_cloud_logs.js with JSON-serialized message_dict."""
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


def run_cli(*args: str, check: bool = False) -> subprocess.CompletedProcess:
    """Executes cli/log_pipeline_tool.py via Python subprocess."""
    return subprocess.run(
        [sys.executable, str(CLI_PATH), *args],
        capture_output=True,
        text=True,
        check=check,
    )


def test_tier5_adversarial_unicode_emoji_and_zero_width_chars() -> None:
    """Tests UTF-8 emojis, CJK, RTL marks, and zero-width joiners."""
    complex_str = (
        "🔥🚀👾 Kowalski Analysis! 中文测试 العربية русский "
        "\u200d\u200b\u202eRTL_TEST"
    )
    payload = {
        "insertId": "uni-01",
        "textPayload": complex_str,
        "jsonPayload": {
            "emoji_key_🔥": complex_str,
            "nested": ["αβγδ", "אבגד", "👨‍👩‍👧‍👦"],
        },
        "labels": {"env_🚀": "prod_👾"},
    }
    res = run_udf_node({"data": json.dumps(payload, ensure_ascii=False)})
    assert "udf_error" not in res.get("attributes", {})
    out = json.loads(res["data"])
    assert out["textPayload"] == complex_str
    parsed_jp = json.loads(out["jsonPayload"])
    assert parsed_jp["emoji_key_🔥"] == complex_str
    assert parsed_jp["nested"][2] == "👨‍👩‍👧‍👦"


def test_tier5_adversarial_control_chars_and_null_bytes() -> None:
    """Tests ASCII control characters (NUL, BEL, ESC, CR, LF, TAB)."""
    ctrl_str = "Line1\r\nLine2\tTabbed\x00NullByte\x07Bell\x1b[31mRed\x1b[0m"
    payload = {
        "insertId": "ctrl-01",
        "jsonPayload": {
            "raw_terminal_output": ctrl_str,
            "backspace": "a\bb\fc",
        },
    }
    res = run_udf_node({"data": json.dumps(payload)})
    assert "udf_error" not in res.get("attributes", {})
    out = json.loads(res["data"])
    jp = json.loads(out["jsonPayload"])
    assert jp["raw_terminal_output"] == ctrl_str
    assert "\x00" in jp["raw_terminal_output"]


def test_tier5_adversarial_massive_payload_10000_keys_stress() -> None:
    """Stress-tests processCloudLogs with 10,000 keys and a 500 KB string."""
    large_dict = {f"metric_key_{i}": i * 1.5 for i in range(10000)}
    large_dict["blob_500kb"] = "X" * 500_000
    payload = {
        "insertId": "stress-10k",
        "severity": "INFO",
        "jsonPayload": large_dict,
    }
    start_time = time.monotonic()
    res = run_udf_node({"data": json.dumps(payload)})
    elapsed_ms = (time.monotonic() - start_time) * 1000.0

    assert "udf_error" not in res.get("attributes", {})
    assert elapsed_ms < 3000.0, f"UDF execution took too long: {elapsed_ms}ms"
    out = json.loads(res["data"])
    assert isinstance(out["jsonPayload"], str)
    restored = json.loads(out["jsonPayload"])
    assert len(restored) == 10001
    assert len(restored["blob_500kb"]) == 500_000


def test_tier5_adversarial_prototype_pollution_payloads() -> None:
    """Tests prototype pollution vectors (__proto__, constructor)."""
    raw_json = (
        '{"insertId": "pp-01", '
        '"jsonPayload": {"__proto__": {"polluted": true}, '
        '"constructor": {"prototype": {"isAdmin": true}}}, '
        '"labels": {"__proto__": "label_proto", "toString": "custom_str"}, '
        '"resource": {"type": "gce", "labels": {"__proto__": "res_proto"}}}'
    )
    res = run_udf_node({"data": raw_json})
    assert "udf_error" not in res.get("attributes", {})
    out = json.loads(res["data"])
    assert isinstance(out["jsonPayload"], str)
    assert isinstance(out["labels"], str)
    assert isinstance(out["resource"]["labels"], str)


def test_tier5_adversarial_hasownproperty_shadowing_attack() -> None:
    """Tests payload where hasOwnProperty is overwritten as string/null."""
    payload = {
        "hasOwnProperty": "overwrite_attack",
        "jsonPayload": {"hasOwnProperty": False, "secret": 12345},
        "resource": {
            "type": "k8s_container",
            "hasOwnProperty": 999,
            "labels": {"pod": "alpha"},
        },
    }
    res = run_udf_node({"data": json.dumps(payload)})
    assert "udf_error" not in res.get("attributes", {})
    out = json.loads(res["data"])
    assert isinstance(out["jsonPayload"], str)
    assert isinstance(out["resource"]["labels"], str)


def test_tier5_adversarial_weird_js_string_and_number_patterns() -> None:
    """Tests extreme floats, quotes, backslashes, XSS, and SQLi strings."""
    payload = {
        "insertId": "weird-01",
        "jsonPayload": {
            "max_float": 1.7976931348623157e308,
            "min_float": -1.7976931348623157e308,
            "zero_neg": -0.0,
            "quotes_and_slashes": 'He said: \\"Hello\\\\World\\"',
            "xss_vector": "<script>alert(document.cookie)</script>",
            "sqli_vector": "'; DROP TABLE unified_cloud_logs; --",
        },
    }
    res = run_udf_node({"data": json.dumps(payload)})
    assert "udf_error" not in res.get("attributes", {})
    out = json.loads(res["data"])
    jp = json.loads(out["jsonPayload"])
    assert jp["sqli_vector"] == "'; DROP TABLE unified_cloud_logs; --"
    assert jp["xss_vector"] == "<script>alert(document.cookie)</script>"


def test_tier5_adversarial_malformed_json_truncation_permutations() -> None:
    """Verifies 10 corrupted/truncated JSON strings populate udf_error."""
    corrupted_inputs = [
        '{"insertId": "1", "jsonPayload": {"unclosed": ',
        '{"insertId": "2", "textPayload": "unterminated string}',
        "{'single_quotes': 'not_valid_json'}",
        '{unquoted_key: "value"}',
        '{"trailing_comma": true,}',
        "NaN",
        "undefined",
        "{",
        "[",
        "\x80\x81\xff_RAW_BINARY_GARBAGE",
    ]
    for bad_str in corrupted_inputs:
        res = run_udf_node({"data": bad_str})
        attrs = res.get("attributes", {})
        assert "udf_error" in attrs, f"Failed to flag input: {bad_str!r}"
        assert res["data"] == bad_str


def test_tier5_adversarial_invalid_envelope_types() -> None:
    """Verifies non-object message envelopes or non-string data fail safely."""
    res_null = run_udf_raw_js("null")
    assert "udf_error" in res_null.get("attributes", {})

    res_num = run_udf_raw_js("42")
    assert "udf_error" in res_num.get("attributes", {})

    res_non_str_data = run_udf_raw_js('{"data": 12345}')
    assert "udf_error" in res_non_str_data.get("attributes", {})


def test_tier5_adversarial_cli_flag_injection_and_extreme_values(
    tmp_path: Path,
) -> None:
    """Tests CLI handling of extreme numbers, missing files, invalid args."""
    proc_extreme = run_cli(
        "analyze-savings",
        "--daily-gb",
        "1000000",
        "--retention-days",
        "3650",
        "--format",
        "json",
    )
    assert proc_extreme.returncode == 0
    report = json.loads(proc_extreme.stdout.strip())
    assert report["monthly_volume_gb"] == 30_000_000.0
    assert report["annual_savings_usd"] > 0

    missing_file = tmp_path / "does_not_exist_999.json"
    proc_missing = run_cli("inspect-dlq", "--mock-file", str(missing_file))
    assert proc_missing.returncode != 0


def test_tier5_adversarial_ast_compilation_all_python_files() -> None:
    """Compiles every .py file in repository via ast.parse and compile()."""
    excluded = {".git", ".agents", ".venv"}
    all_py = PROJECT_ROOT.rglob("*.py")
    py_files = [p for p in all_py if not excluded.intersection(p.parts)]
    assert len(py_files) >= 3, "Expected at least 3 Python files in repository"
    for py_file in py_files:
        source = py_file.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(py_file))
        assert isinstance(tree, ast.Module)
        compile(source, filename=str(py_file), mode="exec")


def test_tier5_adversarial_apache_license_headers_all_source_files() -> None:
    """Audits all source files (.py, .js, .tf, README.md) for Apache header."""
    checked_count = 0
    for path in PROJECT_ROOT.rglob("*"):
        if (
            ".git" in path.parts
            or ".agents" in path.parts
            or ".pytest_cache" in path.parts
            or "__pycache__" in path.parts
            or path.is_dir()
        ):
            continue
        if path.suffix in {".py", ".js", ".tf"} or path.name == "README.md":
            content = path.read_text(encoding="utf-8")
            rel = path.relative_to(PROJECT_ROOT)
            assert (
                "Copyright 2026 Google LLC" in content
            ), f"Missing Copyright header in {rel}"
            assert (
                "Licensed under the Apache License, Version 2.0" in content
            ), f"Missing Apache 2.0 text in {rel}"
            checked_count += 1
    assert checked_count >= 8, f"Expected >= 8 files, checked {checked_count}"


def test_tier5_adversarial_javascript_v8_syntax_check() -> None:
    """Runs node --check on udf/process_cloud_logs.js to verify V8 syntax."""
    proc = subprocess.run(
        [NODE_BIN, "--check", str(UDF_PATH)],
        capture_output=True,
        text=True,
        check=False,
    )
    assert proc.returncode == 0, f"V8 syntax check failed: {proc.stderr}"
