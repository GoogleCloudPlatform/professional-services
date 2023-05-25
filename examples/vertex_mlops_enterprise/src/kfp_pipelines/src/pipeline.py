from kfp import dsl
from kfp.v2 import compiler
from kfp.v2.dsl import (Artifact, Dataset, Input, Model, Output,
                        OutputPath, ClassificationMetrics, Metrics, 
                        component)

from google.cloud import aiplatform

from google_cloud_pipeline_components.v1.endpoint import EndpointCreateOp
from google_cloud_pipeline_components.aiplatform import ModelDeployOp
from google_cloud_pipeline_components.v1.custom_job import create_custom_training_job_from_component
from google_cloud_pipeline_components.v1.model import ModelUploadOp
from google_cloud_pipeline_components.experimental.evaluation import GetVertexModelOp

import logging
from datetime import datetime

import pickle
import argparse
import sys

from config import PIPELINE_ROOT, PIPELINE_NAME, BQ_INPUT_DATA
from train import xgb_train, PROJECT_ID, REGION, IMAGE

PRED_CONTAINER='europe-docker.pkg.dev/vertex-ai/prediction/xgboost-cpu.1-6:latest'

ENDPOINT_NAME='xgboost-creditcards'

COLUMN_NAMES = ["Time", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19", "V20", "V21", "V22", "V23", "V24", "V25", "V26", "V27", "V28", "Amount", "Class"]
CLASS_NAMES = ['OK', 'Fraud']


caching = True

# Load data from BigQuery and save to CSV
@component(
    packages_to_install=['seaborn==0.12.2'],
    base_image=IMAGE
)
def get_dataframe(
    project_id: str,
    bq_table: str,
    train_data_path: OutputPath("Dataset"),
    test_data_path: OutputPath("Dataset"),
    val_data_path: OutputPath("Dataset"),
    stats: Output[Artifact],
    class_names: list
):
    from google.cloud import bigquery
    from model_card_toolkit.utils.graphics import figure_to_base64str
    from sklearn.model_selection import train_test_split
    import pickle
    import seaborn as sns
    import logging

    bqclient = bigquery.Client(project=project_id)
    logging.info(f"Pulling data from {bq_table}")
    table = bigquery.TableReference.from_string(bq_table)
    rows = bqclient.list_rows(table)
    dataframe = rows.to_dataframe(create_bqstorage_client=True)
    logging.info("Data loaded, writing splits")

    # 60 / 20 / 20
    df_train, df_test = train_test_split(dataframe, test_size=0.4)
    df_test, df_val = train_test_split(dataframe, test_size=0.5)

    df_train.to_csv(train_data_path)
    df_test.to_csv(test_data_path)
    df_val.to_csv(val_data_path)

    def get_fig(df):
        n_fraud = (df.Class == 1).sum()
        n_ok = len(df) - n_fraud

        xs = ['OK', 'Fraud']
        ys = [n_ok, n_fraud]

        g = sns.barplot(x=xs, y=ys)
        g.set_yscale('log')
        return g.get_figure()
    
    logging.info("Generating stats")
    stats_dict = {
      "train": figure_to_base64str(get_fig(df_train)),
      "test": figure_to_base64str(get_fig(df_test)),
      "val": figure_to_base64str(get_fig(df_val))
    }

    logging.info(f"Writing stats to {stats.path}")
    with open(stats.path, 'wb') as f:
        pickle.dump(stats_dict, f)



# Import model and convert to Artifact
@component(
    packages_to_install=["google-cloud-aiplatform"],
    base_image=IMAGE
)
def get_unmanaged_model(model: Input[Model], unmanaged_model: Output[Artifact]):
  unmanaged_model.metadata = model.metadata
  unmanaged_model.uri = '/'.join(model.uri.split('/')[:-1]) # remove filename after last / - send dir rather than file


#########################
### Define pipeline
#########################

@dsl.pipeline(
    # Default pipeline root. You can override it when submitting the pipeline.
    pipeline_root=PIPELINE_ROOT,
    # A name for the pipeline.
    name=PIPELINE_NAME,
)
def pipeline(
    bq_table: str = "",
    xgboost_param_max_depth: int=10,
    xgboost_param_learning_rate: float=0.1,
    xgboost_param_n_estimators: int=200,
    serving_container_image_uri: str = PRED_CONTAINER,    
):
    
    #from kfp.v2.components import importer_node
    #from google_cloud_pipeline_components.types import artifact_types

    dataset_task = get_dataframe(
        bq_table=bq_table, 
        project_id=PROJECT_ID,
        class_names=CLASS_NAMES)

    model_task = xgb_train(
        train_data = dataset_task.outputs['train_data_path'],
        test_data = dataset_task.outputs['test_data_path'],
        xgboost_param_max_depth = xgboost_param_max_depth,
        xgboost_param_learning_rate = xgboost_param_learning_rate,
        xgboost_param_n_estimators = xgboost_param_n_estimators,
        serving_container_image_uri=serving_container_image_uri
    )

    create_endpoint_op = EndpointCreateOp(
        project=PROJECT_ID,
        location=REGION,
        display_name=ENDPOINT_NAME
    )

    converter_op = get_unmanaged_model(
        model=model_task.outputs['model']
    )
            
    upload_op = ModelUploadOp(
            unmanaged_container_model=converter_op.outputs['unmanaged_model'],
            project=PROJECT_ID,
            location=REGION,
            display_name="xgb_model"
    )

    _ = ModelDeployOp(
            model=upload_op.outputs['model'],
            endpoint=create_endpoint_op.outputs['endpoint'],
            dedicated_resources_machine_type = 'n1-standard-8',
            dedicated_resources_min_replica_count = 1,
            dedicated_resources_max_replica_count = 1,
            enable_access_logging = True
            
    )


# Compile and run the pipeline
aiplatform.init(project=PROJECT_ID, location=REGION)

logging.getLogger().setLevel(logging.INFO)
logging.info(f"Init with project {PROJECT_ID} in region {REGION}. Pipeline root: {PIPELINE_ROOT}")

TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M")


compiler.Compiler().compile(
    pipeline_func=pipeline, 
    package_path=PIPELINE_NAME + ".json"
)

run = aiplatform.PipelineJob(
    project=PROJECT_ID,
    location=REGION,
    display_name=PIPELINE_NAME,
    template_path=PIPELINE_NAME + ".json",
    job_id=f"{PIPELINE_NAME}-{TIMESTAMP}",
    pipeline_root=PIPELINE_ROOT,
    parameter_values={"bq_table": BQ_INPUT_DATA},
    enable_caching=caching
)

run.submit()

# This can be used to test the online endpoint:
#
# {
#    "instances": [ 
#      [116637.0,76703.0,1.20320629791387,0.26233592978648995,0.6359187027695921,0.545478758520757,-0.451151056772099,-0.7660908590449581,0.017753034426238,-0.11701180265442,-0.349562123099209,0.079312104026033,1.8017744780655802,1.55001158288635,0.993015580548685,0.289311650670353,0.22887624943926502,0.402186964272225,-0.645076755082675,-0.211551970047169,0.0881255281943872,-0.0372741158140063,-0.183011608546713,-0.5290269160204111,0.139546897884277,0.552221761782282,0.187018174104142,0.0617699068799748,-0.0274233787548244,0.0126608742456446,1.98]
# ]
# }