from typing import Optional
from uuid import uuid4

from airflow.decorators import task
from google.cloud.dlp_v2 import DlpServiceClient
from pendulum import datetime

from configs.dlp_config import DLP_INFO_TYPES
from utils.globals import DagsGlobals


@task
def create_dlp_scan(
        table_id: str,
        dataset_id: str,
        excluded_columns: Optional[list[str]] = None,
        rows_limit_percent: int | None = 1,
        data_interval_start: Optional[datetime] = None,  # populated automatically by Airflow
        data_interval_end: Optional[datetime] = None,  # populated automatically by Airflow
):
    if excluded_columns is None:
        excluded_columns = []
    dlp_client = DlpServiceClient()
    response = dlp_client.create_dlp_job(
        request={
            "job_id": f"{dataset_id}__{table_id}__{data_interval_end.strftime('%Y-%m-%dT%H%M%SZ')}_{str(uuid4())[:6]}",
            "parent": f"projects/{DagsGlobals.governance_project_id}/locations/{DagsGlobals.location}",
            "inspect_job": {
                "actions": [
                    {
                        "save_findings": {
                            "output_config": {
                                "table": {
                                    "project_id": DagsGlobals.governance_project_id,
                                    "dataset_id": "data_governance_outputs",
                                    "table_id": "dlp_outputs",
                                }
                            }
                        }
                    },
                ],
                "inspect_config": {
                    "info_types": DLP_INFO_TYPES,
                    "limits": {},
                    "rule_set": [],
                    "include_quote": True,
                },
                "storage_config": {
                    "big_query_options": {
                        "table_reference": {
                            "project_id": DagsGlobals.bq_project_id,
                            "dataset_id": dataset_id,
                            "table_id": table_id,
                        },
                        "rows_limit_percent": rows_limit_percent,
                        "sample_method": "TOP",
                        "identifying_fields": [],
                        "excluded_fields": [{"name": col} for col in excluded_columns],
                        "included_fields": [],
                    },
                    "timespan_config": {
                        "start_time": data_interval_start.strftime(
                            "%Y-%m-%dT%H:%M:%SZ"
                        ),
                        "end_time": data_interval_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "timestamp_field": {"name": "processing_dttm"},
                    },
                },
            },
        }
    )
    return response.name
