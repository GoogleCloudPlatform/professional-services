"""Storage Backend Abstraction for Trace Continuum (Local, GCS, BigQuery).

Provides an agnostic interface for persisting evaluation traces (AgentData) and summaries
across Day 0 (Local Filesystem), Day 1 (Google Cloud Storage), and Day 2 (BigQuery Agent Analytics).
"""

from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from agent_eval.core.schema import AgentData

logger = logging.getLogger(__name__)


class StorageBackend(ABC):
    """Abstract base class / Protocol for evaluation artifact and trace persistence."""

    @abstractmethod
    def save_trace(self, run_id: str, trace: AgentData) -> str:
        """Persist a single canonical AgentData trajectory.

        Args:
            run_id: Unique identifier for the evaluation run (e.g. 'v38_test').
            trace: Pydantic AgentData instance representing the conversation trace.

        Returns:
            A string URI or filepath pointing to the persisted trace.
        """
        ...

    @abstractmethod
    def save_summary(self, run_id: str, summary: dict[str, Any]) -> str:
        """Persist an evaluation summary (e.g. eval_summary.json).

        Args:
            run_id: Unique identifier for the evaluation run.
            summary: Dictionary containing aggregated metrics and metadata.

        Returns:
            A string URI or filepath pointing to the persisted summary.
        """
        ...

    @abstractmethod
    def load_summary(self, run_id: str) -> dict[str, Any] | None:
        """Load an evaluation summary for a given run_id.

        Args:
            run_id: Unique identifier for the evaluation run.

        Returns:
            The parsed summary dictionary, or None if not found.
        """
        ...


class LocalStorageBackend(StorageBackend):
    """Day 0: Local filesystem persistence using atomic .tmp staging."""

    def __init__(self, base_dir: Path | str = "tests/eval/results"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_trace(self, run_id: str, trace: AgentData) -> str:
        run_dir = self.base_dir / run_id
        run_dir.mkdir(parents=True, exist_ok=True)
        target_file = run_dir / "traces.jsonl"

        # Atomic append pattern using temporary file to prevent partial write corruption
        tmp_file = run_dir / f".traces_{trace.session_id}.tmp"
        with tmp_file.open("w", encoding="utf-8") as f:
            f.write(trace.model_dump_json() + "\n")

        with target_file.open("a", encoding="utf-8") as f:
            f.write(tmp_file.read_text(encoding="utf-8"))
        tmp_file.unlink(missing_ok=True)
        return str(target_file)

    def save_summary(self, run_id: str, summary: dict[str, Any]) -> str:
        run_dir = self.base_dir / run_id
        run_dir.mkdir(parents=True, exist_ok=True)
        target_file = run_dir / "eval_summary.json"

        tmp_file = run_dir / ".eval_summary.json.tmp"
        with tmp_file.open("w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)

        tmp_file.replace(target_file)
        return str(target_file)

    def load_summary(self, run_id: str) -> dict[str, Any] | None:
        target_file = self.base_dir / run_id / "eval_summary.json"
        if not target_file.exists():
            return None
        with target_file.open("r", encoding="utf-8") as f:
            return json.load(f)


class GCSStorageBackend(StorageBackend):
    """Day 1: Google Cloud Storage bucket persistence for CI/CD artifact sharing."""

    def __init__(self, bucket_name: str, prefix: str = "eval_runs"):
        try:
            from google.cloud import (
                storage,  # type: ignore[import-untyped,import-not-found]
            )
        except ImportError as e:
            raise RuntimeError(
                "Install 'google-cloud-storage' to use GCSStorageBackend."
            ) from e

        if bucket_name.startswith("gs://"):
            bucket_name = bucket_name[5:].rstrip("/")
        self.bucket_name = bucket_name
        self.prefix = prefix.strip("/")
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)

    def save_trace(self, run_id: str, trace: AgentData) -> str:
        blob_path = f"{self.prefix}/{run_id}/traces/{trace.session_id}.json"
        blob = self.bucket.blob(blob_path)
        blob.upload_from_string(
            trace.model_dump_json(indent=2),
            content_type="application/json",
            timeout=30.0,
        )
        return f"gs://{self.bucket_name}/{blob_path}"

    def save_summary(self, run_id: str, summary: dict[str, Any]) -> str:
        blob_path = f"{self.prefix}/{run_id}/eval_summary.json"
        blob = self.bucket.blob(blob_path)
        blob.upload_from_string(
            json.dumps(summary, indent=2, ensure_ascii=False),
            content_type="application/json",
            timeout=30.0,
        )
        return f"gs://{self.bucket_name}/{blob_path}"

    def load_summary(self, run_id: str) -> dict[str, Any] | None:
        blob_path = f"{self.prefix}/{run_id}/eval_summary.json"
        blob = self.bucket.blob(blob_path)
        if not blob.exists():
            return None
        data = blob.download_as_text(timeout=30.0)
        return json.loads(data)


class BigQueryStorageBackend(StorageBackend):
    """Day 2: BigQuery OLAP telemetry streaming for SQL analytics and Looker dashboarding."""

    def __init__(self, dataset_id: str, table_id: str = "agent_runs"):
        try:
            from google.cloud import (
                bigquery,  # type: ignore[import-untyped,import-not-found]
            )
        except ImportError as e:
            raise RuntimeError(
                "Install 'google-cloud-bigquery' to use BigQueryStorageBackend."
            ) from e

        self.client = bigquery.Client()
        self.table_ref = f"{self.client.project}.{dataset_id}.{table_id}"

    def save_trace(self, run_id: str, trace: AgentData) -> str:
        row_data = trace.model_dump(mode="json")
        row_data["run_id"] = run_id
        errors = self.client.insert_rows_json(self.table_ref, [row_data])
        if errors:
            raise RuntimeError(f"BigQuery insert failed for {self.table_ref}: {errors}")
        return self.table_ref

    def save_summary(self, run_id: str, summary: dict[str, Any]) -> str:
        summary_table = f"{self.table_ref}_summary"
        row_data = {"run_id": run_id, "summary": json.dumps(summary)}
        errors = self.client.insert_rows_json(summary_table, [row_data])
        if errors:
            raise RuntimeError(
                f"BigQuery summary insert failed for {summary_table}: {errors}"
            )
        return summary_table

    def load_summary(self, run_id: str) -> dict[str, Any] | None:
        summary_table = f"{self.table_ref}_summary"
        query = f"""
            SELECT summary FROM `{summary_table}`
            WHERE run_id = @run_id
            ORDER BY _PARTITIONTIME DESC
            LIMIT 1
        """
        try:
            from google.cloud import bigquery
        except ImportError:
            return None

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("run_id", "STRING", run_id),
            ]
        )
        try:
            query_job = self.client.query(query, job_config=job_config)
            rows = list(query_job.result())
            if not rows:
                return None
            return json.loads(rows[0]["summary"])
        except Exception as e:
            logger.warning(f"Failed to load BQ summary for run_id={run_id}: {e}")
            return None


def get_storage_backend(storage_type: str = "local", **kwargs: Any) -> StorageBackend:
    """Factory method for creating configured StorageBackend instances.

    Args:
        storage_type: Backend type ('local', 'gcs', or 'bigquery').
        **kwargs: Additional backend-specific keyword arguments.

    Returns:
        Configured StorageBackend instance.
    """
    storage_type_lower = storage_type.lower().strip()
    if storage_type_lower == "local":
        return LocalStorageBackend(
            base_dir=kwargs.get("results_dir", "tests/eval/results")
        )
    elif storage_type_lower == "gcs":
        bucket_name = kwargs.get("bucket_name") or kwargs.get("bucket")
        if not bucket_name:
            raise ValueError("GCSStorageBackend requires 'bucket_name' parameter.")
        return GCSStorageBackend(
            bucket_name=bucket_name, prefix=kwargs.get("prefix", "eval_runs")
        )
    elif storage_type_lower in ("bigquery", "bq"):
        dataset_id = kwargs.get("dataset_id") or kwargs.get("dataset")
        if not dataset_id:
            raise ValueError("BigQueryStorageBackend requires 'dataset_id' parameter.")
        return BigQueryStorageBackend(
            dataset_id=dataset_id, table_id=kwargs.get("table_id", "agent_runs")
        )
    else:
        raise ValueError(
            f"Unsupported storage backend type: '{storage_type}'. "
            f"Valid options are: 'local', 'gcs', 'bigquery'."
        )
