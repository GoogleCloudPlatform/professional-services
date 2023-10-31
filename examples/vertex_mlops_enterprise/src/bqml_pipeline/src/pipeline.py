from typing import NamedTuple
from datetime import datetime
import argparse

import google.cloud.aiplatform as vertex_ai
# kfp and cloud components
import logging
from google_cloud_pipeline_components.v1.bigquery import (
    BigqueryCreateModelJobOp, BigqueryEvaluateModelJobOp,
    BigqueryExplainPredictModelJobOp)

from kfp import dsl
from kfp.v2 import compiler
from kfp.v2.dsl import Artifact, Input, component

from config import (PIPELINE_ROOT, PIPELINE_NAME, BQ_INPUT_DATA, 
                    MODEL_DISPLAY_NAME, ENDPOINT_NAME,
                    SERVICE_ACCOUNT, NETWORK, KEY_ID,
                    PROJECT_ID, REGION, TARGET_COLUMN,
                    BQ_DATASET_NAME)

caching = True
TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M")

parser = argparse.ArgumentParser()
parser.add_argument(
    '--compile-only', 
    action='store_true' # default: False
)

args = parser.parse_args()



component(
    base_image="python:3.8-slim",
    packages_to_install=["jinja2", "pandas", "matplotlib"],
    output_component_file=f"./build_bq_evaluate_metrics.yaml",
)
def get_model_evaluation_metrics(
    metrics_in: Input[Artifact],
) -> NamedTuple("Outputs", [("accuracy", float)]):
    """
    Get the accuracy from the metrics
    Args:
        metrics_in: metrics artifact
    Returns:
        accuracy: accuracy
    """

    import pandas as pd

    def get_column_names(header):
        """
        Helper function to get the column names from the metrics table.
        Args:
            header: header
        Returns:
            column_names: column names
        """
        header_clean = header.replace("_", " ")
        header_abbrev = "".join([h[0].upper() for h in header_clean.split()])
        header_prettied = f"{header_clean} ({header_abbrev})"
        return header_prettied

    # Extract rows and schema from metrics artifact
    rows = metrics_in.metadata["rows"]
    schema = metrics_in.metadata["schema"]

    # Convert into a tabular format
    columns = [metrics["name"] for metrics in schema["fields"] if "name" in metrics]
    records = []
    for row in rows:
        records.append([dl["v"] for dl in row["f"]])

    metrics = pd.DataFrame.from_records(records, columns=columns).astype(float).round(3)

    metrics = metrics.reset_index()

    # Create metrics dictionary for the model
    accuracy = round(float(metrics.accuracy), 3)
    component_outputs = NamedTuple("Outputs", [("accuracy", float)])

    return component_outputs(accuracy)


    @component(
    base_image="python:3.8-slim",
    packages_to_install=["google-cloud-aiplatform"],
    )
    def upload_model_enpoint(
        project: str,
        location: str,
        bq_model_name: str,
    ):
        """
        Uploads the model to Vertex AI
        Args:
            project: Project ID
            location: Region
            bq_model_name: A fully-qualified model resource name or model ID.
            Example: "projects/123/locations/us-central1/models/456" or
            "456" when project and location are initialized or passed.
        Returns:
            None
        """
        from google.cloud import aiplatform as vertex_ai

        model = vertex_ai.Model(model_name={MODEL_DISPLAY_NAME})

        endpoint = vertex_ai.Endpoint.list(order_by="update_time")
        endpoint = endpoint[-1]

        model.deploy(
            endpoint=endpoint,
            min_replica_count=1,
            max_replica_count=1,
        )

        model.wait()

        return

@dsl.pipeline(
    name="creditcards-classifier-bqml-train",
    description="Trains and deploys bqml model to detect fraud",
    pipeline_root=PIPELINE_ROOT,
    )
def bqml_pipeline(
        bq_table: str = BQ_INPUT_DATA,
        model: str = MODEL_DISPLAY_NAME,
        project: str = PROJECT_ID,
        region: str = REGION,
        endpoint_name: str = ENDPOINT_NAME,
    ):

        bq_model_op = BigqueryCreateModelJobOp(
            project=project,
            location=region,
            query=f"""CREATE OR REPLACE MODEL `{BQ_DATASET_NAME}.{model}`
            OPTIONS (
                MODEL_TYPE='LOGISTIC_REG',
                INPUT_LABEL_COLS=['{TARGET_COLUMN}'],
                EARLY_STOP=TRUE,
                model_registry='vertex_ai',
                vertex_ai_model_id='{model}',
                vertex_ai_model_version_aliases=['logit', 'experimental']
            )
            AS SELECT * EXCEPT(Time,ML_use) FROM `{bq_table}`            
            """,
        )

        _ = BigqueryExplainPredictModelJobOp(
            project=project,
            location=region,
            table_name=f"{bq_table}",
            model=bq_model_op.outputs["model"],
        )
        
        _ = BigqueryEvaluateModelJobOp(
            project=project, location=region, model=bq_model_op.outputs["model"]
        ).after(bq_model_op)


# Compile and run the pipeline
vertex_ai.init(project=PROJECT_ID, location=REGION, encryption_spec_key_name=KEY_ID)

logging.getLogger().setLevel(logging.INFO)
logging.info(f"Init with project {PROJECT_ID} in region {REGION}. Pipeline root: {PIPELINE_ROOT}")

FORMAT = ".json"


logging.info(f"Compiling pipeline to {PIPELINE_NAME + FORMAT}")
compiler.Compiler().compile(
    pipeline_func=bqml_pipeline, 
    package_path=PIPELINE_NAME + FORMAT
)

if not args.compile_only:
    run = vertex_ai.PipelineJob(
        project=PROJECT_ID,
        location=REGION,
        display_name=PIPELINE_NAME,
        template_path=PIPELINE_NAME + FORMAT,
        job_id=f"{PIPELINE_NAME}-{TIMESTAMP}",
        pipeline_root=PIPELINE_ROOT,
        parameter_values={
            "bq_table": BQ_INPUT_DATA,
        },
        enable_caching=caching
    )

    run.submit(service_account=SERVICE_ACCOUNT,
            network=NETWORK)
