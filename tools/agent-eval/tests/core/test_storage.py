"""Unit tests for StorageBackend abstractions (Local, GCS, BigQuery)."""

import json
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from agent_eval.core.schema import AgentData
from agent_eval.core.storage import (
    BigQueryStorageBackend,
    GCSStorageBackend,
    LocalStorageBackend,
    get_storage_backend,
)


@pytest.fixture
def sample_agent_data() -> AgentData:
    """Fixture returning a simple AgentData object for trace testing."""
    return AgentData(
        session_id="test_session_001",
        turns=[],
        events=[],
    )


class TestLocalStorageBackend:
    def test_save_trace_and_summary(self, tmp_path: Path, sample_agent_data: AgentData):
        backend = LocalStorageBackend(base_dir=tmp_path)
        run_id = "v38_test_run"

        # Save trace
        trace_path_str = backend.save_trace(run_id=run_id, trace=sample_agent_data)
        trace_path = Path(trace_path_str)
        assert trace_path.exists()
        lines = trace_path.read_text(encoding="utf-8").strip().splitlines()
        assert len(lines) == 1
        record = json.loads(lines[0])
        assert record["session_id"] == "test_session_001"

        # Append second trace
        sample_agent_data_2 = AgentData(session_id="test_session_002", turns=[], events=[])
        backend.save_trace(run_id=run_id, trace=sample_agent_data_2)
        lines = trace_path.read_text(encoding="utf-8").strip().splitlines()
        assert len(lines) == 2

        # Save and load summary
        summary_payload = {"agronomic_accuracy": 1.0, "status": "PASSED"}
        summary_path = backend.save_summary(run_id=run_id, summary=summary_payload)
        assert Path(summary_path).exists()

        loaded_summary = backend.load_summary(run_id=run_id)
        assert loaded_summary == summary_payload

    def test_load_summary_missing_returns_none(self, tmp_path: Path):
        backend = LocalStorageBackend(base_dir=tmp_path)
        assert backend.load_summary("non_existent_run") is None


class TestGCSStorageBackend:
    @patch("google.cloud.storage.Client")
    def test_gcs_save_trace(self, mock_client_cls: MagicMock, sample_agent_data: AgentData):
        mock_client = MagicMock()
        mock_bucket = MagicMock()
        mock_blob = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        mock_bucket.name = "test-bucket"

        backend = GCSStorageBackend(bucket_name="gs://test-bucket", prefix="runs")
        uri = backend.save_trace("v38_run", sample_agent_data)

        assert uri == "gs://test-bucket/runs/v38_run/traces/test_session_001.json"
        mock_bucket.blob.assert_called_once_with("runs/v38_run/traces/test_session_001.json")
        mock_blob.upload_from_string.assert_called_once()
        args, kwargs = mock_blob.upload_from_string.call_args
        assert "test_session_001" in args[0]
        assert kwargs["content_type"] == "application/json"

    @patch("google.cloud.storage.Client")
    def test_gcs_save_and_load_summary(self, mock_client_cls: MagicMock):
        mock_client = MagicMock()
        mock_bucket = MagicMock()
        mock_blob = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        mock_bucket.name = "test-bucket"

        backend = GCSStorageBackend(bucket_name="test-bucket")
        summary_data = {"score": 0.95}

        backend.save_summary("v38_run", summary_data)
        mock_blob.upload_from_string.assert_called_once()

        mock_blob.exists.return_value = True
        mock_blob.download_as_text.return_value = json.dumps(summary_data)
        loaded = backend.load_summary("v38_run")
        assert loaded == summary_data


class TestBigQueryStorageBackend:
    @patch("google.cloud.bigquery.Client")
    def test_bq_save_trace(self, mock_client_cls: MagicMock, sample_agent_data: AgentData):
        mock_client = MagicMock()
        mock_client.project = "test-gcp-project"
        mock_client.insert_rows_json.return_value = []
        mock_client_cls.return_value = mock_client

        backend = BigQueryStorageBackend(dataset_id="analytics_ds", table_id="runs_tbl")
        table_ref = backend.save_trace("v38_run", sample_agent_data)

        assert table_ref == "test-gcp-project.analytics_ds.runs_tbl"
        mock_client.insert_rows_json.assert_called_once()
        args, _ = mock_client.insert_rows_json.call_args
        assert args[0] == "test-gcp-project.analytics_ds.runs_tbl"
        assert args[1][0]["run_id"] == "v38_run"
        assert args[1][0]["session_id"] == "test_session_001"

    @patch("google.cloud.bigquery.Client")
    def test_bq_insert_failure_raises_runtime_error(self, mock_client_cls: MagicMock, sample_agent_data: AgentData):
        mock_client = MagicMock()
        mock_client.project = "test-gcp-project"
        mock_client.insert_rows_json.return_value = [{"index": 0, "errors": [{"message": "schema mismatch"}]}]
        mock_client_cls.return_value = mock_client

        backend = BigQueryStorageBackend(dataset_id="ds")
        with pytest.raises(RuntimeError, match="BigQuery insert failed"):
            backend.save_trace("v38_run", sample_agent_data)


class TestStorageBackendFactory:
    def test_factory_local(self, tmp_path: Path):
        backend = get_storage_backend("local", results_dir=tmp_path)
        assert isinstance(backend, LocalStorageBackend)
        assert backend.base_dir == tmp_path

    @patch("google.cloud.storage.Client")
    def test_factory_gcs(self, mock_client_cls: MagicMock):
        backend = get_storage_backend("gcs", bucket="my-bucket")
        assert isinstance(backend, GCSStorageBackend)

    def test_factory_gcs_missing_bucket_raises(self):
        with pytest.raises(ValueError, match="requires 'bucket_name' parameter"):
            get_storage_backend("gcs")

    @patch("google.cloud.bigquery.Client")
    def test_factory_bigquery(self, mock_client_cls: MagicMock):
        mock_client_cls.return_value.project = "test-project"
        backend = get_storage_backend("bigquery", dataset="my_dataset")
        assert isinstance(backend, BigQueryStorageBackend)

    def test_factory_bq_missing_dataset_raises(self):
        with pytest.raises(ValueError, match="requires 'dataset_id' parameter"):
            get_storage_backend("bq")

    def test_factory_unsupported_raises(self):
        with pytest.raises(ValueError, match="Unsupported storage backend type"):
            get_storage_backend("ftp")
