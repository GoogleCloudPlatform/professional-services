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
"""REST API and web application endpoint tests for the conversion service.

Endpoints Tested:
- GET  /api/health: Health probe endpoint.
- POST /api/convert: Workflow conversion endpoint returning generated ADK code, AST validity, and stats.
- GET  /api/samples/{name}: Sample workflow provider endpoint.
- GET  /: Static asset and UI serving endpoint.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
import httpx

from tests.conftest import assert_ast_compiles

try:
    from webapp.app import app
except ImportError:
    app = None


from starlette.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    """Provides an offline HTTP test client executing over ASGI transport."""
    if app is None:
        pytest.skip("webapp.app is not yet available (Milestone 2 implementation)")
    return TestClient(app)


class TestWebappAPI:
    """Validates web application REST API endpoints."""

    def test_health_check_endpoint(self, client: httpx.Client) -> None:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok" or "healthy" in str(data).lower()

    def test_convert_valid_linear_workflow(
        self, client: httpx.Client, valid_linear_data: dict[str, Any]
    ) -> None:
        payload = {"workflow_json": valid_linear_data}
        response = client.post("/api/convert", json=payload)
        assert response.status_code == 200, f"Convert failed: {response.text}"

        data = response.json()
        assert "generated_code" in data
        assert data.get("ast_valid") is True
        code = data["generated_code"]
        assert len(code) > 0
        assert_ast_compiles(code, filename="webapp_linear.py")

    def test_convert_valid_branching_workflow(
        self, client: httpx.Client, valid_branching_data: dict[str, Any]
    ) -> None:
        payload = {"workflow_json": valid_branching_data}
        response = client.post("/api/convert", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ast_valid") is True
        assert_ast_compiles(data["generated_code"], filename="webapp_branching.py")

    def test_convert_valid_multi_agent_workflow(
        self, client: httpx.Client, valid_multi_agent_data: dict[str, Any]
    ) -> None:
        payload = {"workflow_json": valid_multi_agent_data}
        response = client.post("/api/convert", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ast_valid") is True
        assert_ast_compiles(data["generated_code"], filename="webapp_multi_agent.py")

    def test_convert_valid_approval_workflow(
        self, client: httpx.Client, valid_approval_data: dict[str, Any]
    ) -> None:
        payload = {"workflow_json": valid_approval_data}
        response = client.post("/api/convert", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ast_valid") is True
        assert_ast_compiles(data["generated_code"], filename="webapp_approval.py")

    def test_convert_complex_trade_finance(
        self, client: httpx.Client, complex_trade_finance_data: dict[str, Any]
    ) -> None:
        payload = {"workflow_json": complex_trade_finance_data}
        response = client.post("/api/convert", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert data.get("ast_valid") is True
        assert_ast_compiles(data["generated_code"], filename="webapp_tradefin.py")

    def test_convert_malformed_json_returns_error(
        self, client: httpx.Client, malformed_missing_flow_data: dict[str, Any]
    ) -> None:
        payload = {"workflow_json": malformed_missing_flow_data}
        response = client.post("/api/convert", json=payload)
        assert response.status_code in (400, 422)

    def test_convert_empty_payload_returns_error(self, client: httpx.Client) -> None:
        response = client.post("/api/convert", json={})
        assert response.status_code in (400, 422)

    @pytest.mark.parametrize(
        "sample_slug",
        [
            "customer_support_agent",
            "travel_booking_agent",
            "document_approver_agent",
        ],
    )
    def test_sample_retrieval_bundled_workflows(
        self, client: httpx.Client, sample_slug: str
    ) -> None:
        response = client.get(f"/api/samples/{sample_slug}")
        assert response.status_code == 200
        data = response.json()
        assert "workflowAgentDefinition" in data or "displayName" in data

    def test_sample_retrieval_non_existent_returns_404(self, client: httpx.Client) -> None:
        response = client.get("/api/samples/ghost_non_existent_sample")
        assert response.status_code == 404

    def test_root_index_serves_html(self, client: httpx.Client) -> None:
        response = client.get("/")
        assert response.status_code == 200
        assert "html" in response.headers.get("content-type", "").lower()
