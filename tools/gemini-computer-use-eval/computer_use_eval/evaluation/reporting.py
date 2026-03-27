# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import logging
import json
from computer_use_eval.config import settings

logger = logging.getLogger(__name__)


class BigQueryReporter:
    def __init__(self):
        self.enabled = settings.ENABLE_BIGQUERY
        self.client = None
        self.table_id = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}.{settings.BIGQUERY_TABLE}"

        if self.enabled:
            try:
                from google.cloud import bigquery

                self._bigquery = bigquery
                self.client = bigquery.Client(project=settings.PROJECT_ID)
                self._ensure_table_exists()
            except ImportError:
                logger.error(
                    "google-cloud-bigquery is not installed. Install it with: "
                    "pip install google-cloud-bigquery"
                )
                self.enabled = False
            except Exception as e:
                logger.error(f"Failed to initialize BigQuery client: {e}")
                self.enabled = False

    def _ensure_table_exists(self):
        """Creates the dataset and table if they don't exist."""
        try:
            # Create Dataset
            dataset_id = f"{settings.PROJECT_ID}.{settings.BIGQUERY_DATASET}"
            dataset = self._bigquery.Dataset(dataset_id)
            dataset.location = settings.REGION
            try:
                self.client.create_dataset(dataset, exists_ok=True)
            except Exception:
                pass  # Ignore if exists

            # Create Table Schema
            schema = [
                self._bigquery.SchemaField("run_id", "STRING", mode="REQUIRED"),
                self._bigquery.SchemaField("timestamp", "TIMESTAMP", mode="REQUIRED"),
                self._bigquery.SchemaField("batch_id", "STRING", mode="NULLABLE"),
                self._bigquery.SchemaField("benchmark", "STRING", mode="REQUIRED"),
                self._bigquery.SchemaField("model", "STRING", mode="REQUIRED"),
                self._bigquery.SchemaField(
                    "global_success", "BOOLEAN", mode="REQUIRED"
                ),
                self._bigquery.SchemaField("aggregates", "JSON", mode="NULLABLE"),
                self._bigquery.SchemaField("resolutions", "JSON", mode="NULLABLE"),
                self._bigquery.SchemaField("config", "JSON", mode="NULLABLE"),
                self._bigquery.SchemaField(
                    "total_input_tokens", "INTEGER", mode="NULLABLE"
                ),
                self._bigquery.SchemaField(
                    "total_output_tokens", "INTEGER", mode="NULLABLE"
                ),
                self._bigquery.SchemaField(
                    "safety_trigger_count", "INTEGER", mode="NULLABLE"
                ),
                self._bigquery.SchemaField(
                    "intervention_count", "INTEGER", mode="NULLABLE"
                ),
                self._bigquery.SchemaField("autonomy_score", "FLOAT", mode="NULLABLE"),
            ]

            table = self._bigquery.Table(self.table_id, schema=schema)
            self.client.create_table(table, exists_ok=True)

        except Exception as e:
            logger.error(f"BigQuery setup failed: {e}")
            self.enabled = False

    def report(self, result: dict):
        """Streams the result dict to BigQuery."""
        if not self.enabled or not self.client:
            return

        # Flatten/Map result to schema
        row = {
            "run_id": result.get("run_id"),
            "timestamp": result.get("timestamp"),
            "batch_id": result.get("batch_id"),
            "benchmark": result.get("benchmark"),
            "model": settings.MODEL_NAME,
            "global_success": result.get("global_success"),
            "aggregates": json.dumps(result.get("aggregates", {})),
            "resolutions": json.dumps(result.get("resolutions", {})),
            "config": json.dumps(result.get("config_snapshot", {})),
            "total_input_tokens": result.get("total_input_tokens"),
            "total_output_tokens": result.get("total_output_tokens"),
            "safety_trigger_count": result.get("safety_trigger_count"),
            "intervention_count": result.get("intervention_count"),
            "autonomy_score": result.get("autonomy_score"),
        }

        try:
            errors = self.client.insert_rows_json(self.table_id, [row])
            if errors:
                logger.error(f"BigQuery insert errors: {errors}")
            else:
                logger.info(f"Successfully exported run {row['run_id']} to BigQuery.")
        except Exception as e:
            logger.error(f"Failed to export to BigQuery: {e}")
