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
"""Regression tests for the session-trace endpoint fallback order.

Current ADK serves its debug endpoints under ``/dev`` and namespaces them by
app: ``/dev/apps/{app}/debug/trace/session/{sid}``. The two legacy URLs
agent-eval used to try now 404 on every request, which left ``extracted_data``
empty for interact rows — so every metric sourcing ``extracted_data:*`` failed
with "Response is required but missing", pointing nowhere near the real cause.
"""

import pytest

from agent_eval.core.agent_client import AgentClient

BASE_URL = "http://localhost:8501"
APP = "financial_advisor"
SID = "session_abc123"

CURRENT_ADK_URL = f"{BASE_URL}/dev/apps/{APP}/debug/trace/session/{SID}"


@pytest.fixture
def client():
    return AgentClient(base_url=BASE_URL, app_name=APP)


def _record_attempts(client, monkeypatch, responder):
    attempted: list[str] = []

    def fake_request(url):
        attempted.append(url)
        return responder(url)

    monkeypatch.setattr(client, "_make_request_with_custom_retry", fake_request)
    return attempted


def test_current_adk_url_is_tried_first(client, monkeypatch):
    attempted = _record_attempts(client, monkeypatch, lambda url: [{"name": "span"}])
    client.get_session_trace(SID)
    assert attempted[0] == CURRENT_ADK_URL


def test_legacy_urls_still_tried_when_current_returns_nothing(client, monkeypatch):
    # Older ADK builds served the trace at the root; keep working against them.
    def responder(url):
        return None if "/dev/" in url else [{"name": "span"}]

    attempted = _record_attempts(client, monkeypatch, responder)
    assert client.get_session_trace(SID) == [{"name": "span"}]
    assert len(attempted) > 1
    assert any("/dev/" not in u for u in attempted)


def test_raises_only_after_every_url_is_exhausted(client, monkeypatch):
    def responder(url):
        raise RuntimeError("404 Not Found")

    attempted = _record_attempts(client, monkeypatch, responder)
    with pytest.raises(RuntimeError, match="after trying all URLs"):
        client.get_session_trace(SID)
    assert len(attempted) == 3
