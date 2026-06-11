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
"""Tests verifying untruncated state variables, scroll wrappers, and report formatting helpers."""

from agent_eval.core.html_report import (
    _build_overview_tiles,
    _format_value,
    _is_lower_better,
    _normalize_score,
    _safe_parse,
    _short_prompt_preview,
    _truncate_for_payload,
    generate_html_report,
)


def test_truncate_for_payload_preserves_large_strings():
    """Verify that _truncate_for_payload does not clamp massive strings unless exceeding limit."""
    massive_str = "A" * 5000
    assert len(_truncate_for_payload(massive_str, limit=500000000)) == 5000


def test_is_lower_better():
    assert _is_lower_better("latency_seconds") is True
    assert _is_lower_better("token_usage.total_tokens") is True
    assert _is_lower_better("general_quality") is False


def test_format_value():
    assert _format_value(None, "latency") == "—"
    assert _format_value(1.234, "latency") == "1.23s"
    assert _format_value(0.005, "cost") == "$0.0050"
    assert _format_value(0.85, "cache_hit_rate") == "85%"
    assert _format_value(1500.0, "total_tokens") == "1,500"


def test_normalize_score():
    assert _normalize_score(4.0, {"min": 1, "max": 5}) == 0.75
    assert _normalize_score(5.0, {"min": 1, "max": 5}) == 1.0
    assert _normalize_score(1.0, {"min": 1, "max": 5}) == 0.0


def test_build_overview_tiles():
    summary = {
        "overall_summary": {
            "deterministic_metrics": {
                "token_usage.estimated_cost_usd": 0.005,
                "latency_metrics.total_latency_seconds": 2.5,
                "cache_efficiency.cache_hit_rate": 0.8,
                "token_usage.total_tokens": 1200,
            }
        }
    }
    tiles = _build_overview_tiles(summary)
    assert len(tiles) == 4
    assert tiles[0]["value"] == "$0.0050"
    assert tiles[1]["value"] == "2.5s"
    assert tiles[2]["value"] == "80%"
    assert tiles[3]["value"] == "1,200"


def test_safe_parse():
    assert _safe_parse('{"a": 1}') == {"a": 1}
    assert _safe_parse("{'a': 1}") == {"a": 1}
    assert _safe_parse(None) is None
    assert _safe_parse("") is None


def test_short_prompt_preview():
    assert _short_prompt_preview("Hello World\nLine 2") == "Hello World"
    long_txt = "Word " * 50
    assert len(_short_prompt_preview(long_txt, limit=30)) <= 35


def test_generated_report_includes_scroll_wrappers(tmp_path):
    run_dir = tmp_path / "run1"
    run_dir.mkdir()
    report_path = generate_html_report(
        run_dir=run_dir,
        summary={"experiment_id": "test"},
    )
    html_content = report_path.read_text(encoding="utf-8")
    assert "max-height: 250px; overflow-y: auto;" in html_content
    assert "length > 500" in html_content
