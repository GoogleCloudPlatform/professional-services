from kfp import dsl
from kfp.v2 import compiler
from kfp.v2.dsl import (Artifact, Dataset, Input, Model, Output,
                        OutputPath, ClassificationMetrics, Metrics, 
                        component)

from google.cloud import aiplatform
from google.cloud.aiplatform import hyperparameter_tuning as hpt

from google_cloud_pipeline_components.v1.endpoint import EndpointCreateOp
from google_cloud_pipeline_components.aiplatform import ModelDeployOp
from google_cloud_pipeline_components.v1.custom_job import create_custom_training_job_from_component
from google_cloud_pipeline_components.v1.model import ModelUploadOp
from google_cloud_pipeline_components.experimental.evaluation import GetVertexModelOp

from sklearn.metrics import accuracy_score, confusion_matrix, roc_curve
from sklearn.model_selection import train_test_split

import logging
from datetime import datetime

import pandas as pd
import xgboost as xgb
import numpy as np
from hypertune import HyperTune

import pickle
import argparse
import sys

from config import MY_STAGING_BUCKET, PIPELINE_ROOT, PIPELINE_NAME, BQ_INPUT_DATA, PARENT_MODEL
from train import xgb_train, PROJECT_ID, REGION, IMAGE, TRAIN_COMPONENT_IMAGE

PRED_CONTAINER='europe-docker.pkg.dev/vertex-ai/prediction/xgboost-cpu.1-6:latest'

ENDPOINT_NAME='xgboost-creditcards-3'

hptune = False
caching = True

#########################
### Download BigQuery and convert to CSV
#########################

@component(
    packages_to_install=["google-cloud-bigquery", "pandas", "db-dtypes", "pyarrow"],
    base_image=IMAGE
)
def get_dataframe(
    bq_table: str,
    output_data_path: OutputPath("Dataset"),
    project_id: str
):
    from google.cloud import bigquery

    bqclient = bigquery.Client(project=project_id)
    table = bigquery.TableReference.from_string(bq_table)
    rows = bqclient.list_rows(table)
    dataframe = rows.to_dataframe(create_bqstorage_client=True)

    # sample
    dataframe = dataframe.sample(frac=1, random_state=2)

    dataframe.to_csv(output_data_path)


@component(
    packages_to_install=["google-cloud-aiplatform"],
    base_image=IMAGE
)
def get_unmanaged_model(model: Input[Model], unmanaged_model: Output[Artifact]):
  unmanaged_model.metadata = model.metadata
  unmanaged_model.uri = '/'.join(model.uri.split('/')[:-1]) # remove filename after last / - send dir rather than file

@component(
    packages_to_install=["google-cloud-aiplatform"],
    base_image=IMAGE
)
def get_vertex_model(model: str, unmanaged_model: Output[Artifact]):
  unmanaged_model.metadata = model.metadata
  unmanaged_model.uri = '/'.join(model.uri.split('/')[:-1]) # remove filename after last / - send dir rather than file


#########################
### Define pipeline
#########################

@dsl.pipeline(
    # Default pipeline root. You can override it when submitting the pipeline.
    pipeline_root=PIPELINE_ROOT,
    # A name for the pipeline.
    name=template_path,
)
def pipeline(
    bq_table: str = "",
    xgboost_param_max_depth: int=10,
    xgboost_param_learning_rate: float=0.1,
    xgboost_param_n_estimators: int=200,
    serving_container_image_uri: str = PRED_CONTAINER,    
):
    
    from kfp.v2.components import importer_node
    from google_cloud_pipeline_components.types import artifact_types

    dataset_task = get_dataframe(bq_table=bq_table, project_id=PROJECT_ID)

    model_task = xgb_train(
        dataset = dataset_task.outputs['output_data_path'],
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

    #get_parent_model_op = GetVertexModelOp(model_resource_name=PARENT_MODEL)
            
    upload_op = ModelUploadOp(
            unmanaged_container_model=converter_op.outputs['unmanaged_model'],
            project=PROJECT_ID,
            location=REGION,
            display_name="xgb_model" #,
            #parent_model=get_parent_model_op.outputs["model"]
    )

    deploy_op = ModelDeployOp(
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

TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M")

if hptune:
    logging.info("Running hyperparameter tuning")

    worker_pool_specs = [
            {
                "machine_spec": {
                    "machine_type": "n1-standard-4",
                },
                "replica_count": 1,
                "container_spec": {
                    "image_uri": TRAIN_COMPONENT_IMAGE,
                    "command": ["python", "train.py"],
                    "args": [
                        '--dataset_path', f'/gcs/{MY_STAGING_BUCKET}/custom_job/creditcards.csv',
                        '--xgboost_param_max_depth', '10',
                        '--xgboost_param_learning_rate', '0.1',
                        "--xgboost_param_n_estimators", "100",
                        "--model_output_path", f'/gcs/{MY_STAGING_BUCKET}/custom_job/model'],
                            },
            }
        ]

    custom_job = aiplatform.CustomJob(
        display_name='xgb-custom-job',
        worker_pool_specs=worker_pool_specs,
        staging_bucket=f'gs://{MY_STAGING_BUCKET}/custom_job/staging'
    )

    # To test it:
    #custom_job.submit()

    hp_job = aiplatform.HyperparameterTuningJob(
        display_name=f'hptune-xgb',
        custom_job=custom_job,  
        metric_spec={ 'f1': 'maximize' },
        parameter_spec={
            'xgboost_param_max_depth': hpt.IntegerParameterSpec(min=4, max=20, scale='linear'),
            'xgboost_param_learning_rate': hpt.DoubleParameterSpec(min=0.01, max=0.2, scale='log'),
            'xgboost_param_n_estimators': hpt.IntegerParameterSpec(min=50, max=200, scale='linear')
        },
        max_trial_count=16,
        parallel_trial_count=4,
        project=PROJECT_ID,
        location=REGION
    )

    hp_job.run()

else:

    compiler.Compiler().compile(
        pipeline_func=pipeline, 
        package_path=PIPELINE_NAME + ".json"
    )

    run = aiplatform.PipelineJob(
        display_name=PIPELINE_NAME,
        template_path=PIPELINE_NAME + ".json",
        job_id=f"{PIPELINE_NAME}-{TIMESTAMP}",
        parameter_values={"bq_table": BQ_INPUT_DATA},
        enable_caching=caching,
    )

    run.submit()

# This can be used to test the online endpoint:
#
# {
#    "instances": [ 
#      [116637.0,76703.0,1.20320629791387,0.26233592978648995,0.6359187027695921,0.545478758520757,-0.451151056772099,-0.7660908590449581,0.017753034426238,-0.11701180265442,-0.349562123099209,0.079312104026033,1.8017744780655802,1.55001158288635,0.993015580548685,0.289311650670353,0.22887624943926502,0.402186964272225,-0.645076755082675,-0.211551970047169,0.0881255281943872,-0.0372741158140063,-0.183011608546713,-0.5290269160204111,0.139546897884277,0.552221761782282,0.187018174104142,0.0617699068799748,-0.0274233787548244,0.0126608742456446,1.98]
# ]
# }