from typing import Literal

from airflow.providers.google.cloud.operators.dataflow import (
    DataflowStartFlexTemplateOperator,
)

from utils.globals import DagsGlobals

TEMP_BUCKET = "gs://dev-processing-dataflow-temp"
DB_TYPE = Literal["oracle", "teradata"]


def get_connection_properties(database_type: DB_TYPE):
    if database_type == "oracle":
        return {"connectionProperties": "oracle.jdbc.timezoneAsRegion=false"}
    return {}


def get_db_ingestion_dataflow_operator(
    database_type: DB_TYPE,
    db_dataset: str,
    query: str,
    destination_bq_uri: str,
    table_name: str = "",
):
    if database_type not in ("oracle", "teradata"):
        raise ValueError(
            'variable database_type has to be one of ("oracle", "teradata")'
        )
    driver_class = {
        "oracle": "oracle.jdbc.driver.OracleDriver",
        "teradata": "com.teradata.jdbc.TeraDriver",
    }
    driver_jars = {
        "oracle": "gs://dev-processing-dataflow-artifacts/jars/ojdbc11-23.5.0.24.07.jar",
        "teradata": "gs://dev-processing-dataflow-artifacts/jars/terajdbc-20.00.00.34.jar",
    }
    return DataflowStartFlexTemplateOperator(
        task_id=f"ingest_{table_name}_db_to_bq_with_dataflow",
        project_id="dev-processing",
        body={
            "launchParameter": {
                "jobName": f"ingest-{database_type}-to-bq",
                "parameters": {
                    "driverJars": driver_jars[database_type],
                    "driverClassName": driver_class[database_type],
                    "connectionURL": f"{{{{ var.value.{database_type}_jdbc_{db_dataset} }}}}",
                    "outputTable": destination_bq_uri,
                    "bigQueryLoadingTemporaryDirectory": "gs://dev-processing-dataflow-temp/bq_load_temp",
                    "username": f"{{{{ var.value.{database_type}_user}}}}",
                    "password": f"{{{{ var.value.{database_type}_password }}}}",
                    "query": query,
                    **get_connection_properties(database_type),
                },
                "environment": {
                    "ipConfiguration": "WORKER_IP_PRIVATE",
                    "tempLocation": f"{TEMP_BUCKET}/temp",
                    "serviceAccountEmail": "dataflow-worker@dev-processing.iam.gserviceaccount.com",
                    "stagingLocation": f"{TEMP_BUCKET}/staging",
                    "subnetwork": f"https://www.googleapis.com/compute/v1/projects/oq-infra-nw-dev/regions/me-central1/subnetworks/sb-data-lake-dev",
                },
                "containerSpecGcsPath": "gs://dataflow-templates-me-central1/2024-09-10-00_RC01/flex/Jdbc_to_BigQuery_Flex",
            }
        },
        location=DagsGlobals.location,
        append_job_name=True,
        retries=0,
        cancel_timeout=60 * 60,
        deferrable=True,
        poll_sleep=60,
    )
