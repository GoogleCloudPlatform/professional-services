from kfp import dsl
from kfp import compiler
from kfp.dsl import Artifact, Input, Model, Output

import argparse

from google.cloud import aiplatform

from google_cloud_pipeline_components.v1.batch_predict_job import ModelBatchPredictOp
from google_cloud_pipeline_components.v1.endpoint import EndpointCreateOp, ModelDeployOp
from google_cloud_pipeline_components.experimental.evaluation import (
    ModelEvaluationClassificationOp, ModelImportEvaluationOp)

import logging
from datetime import datetime

from config import (PIPELINE_ROOT, PIPELINE_NAME, BQ_INPUT_DATA, MODEL_CARD_CONFIG, 
                    MODEL_DISPLAY_NAME, PRED_CONTAINER, ENDPOINT_NAME, PARENT_MODEL,
                    SERVICE_ACCOUNT, NETWORK, KEY_ID,
                    PROJECT_ID, REGION, IMAGE, CLASS_NAMES, TARGET_COLUMN,
                    DATAFLOW_NETWORK, DATAFLOW_PUBLIC_IPS, DATAFLOW_SA, 
                    BQ_OUTPUT_DATASET_ID)
from train import xgb_train
from eval import evaluate_model
from load import get_dataframe, upload_to_bq
from model_card import plot_model_card
from model_upload import upload_model
from reformat_preds import reformat_predictions_bq

caching = True

TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M")

parser = argparse.ArgumentParser()

parser.add_argument(
    '--compile-only', 
    action='store_true' # default: False
)

args = parser.parse_args()


# Import model and convert to Artifact
@dsl.component(base_image=IMAGE)
def get_unmanaged_model(model: Input[Model], unmanaged_model: Output[Artifact]):
  unmanaged_model.metadata = model.metadata
  unmanaged_model.uri = '/'.join(model.uri.split('/')[:-1]) # remove filename after last / - send dir rather than file


#########################
### Define pipeline
#########################
@dsl.pipeline(
    pipeline_root=PIPELINE_ROOT,
    name=PIPELINE_NAME
)
def pipeline(
    bq_table: str = "",
    xgboost_param_max_depth: int=10,
    xgboost_param_learning_rate: float=0.1,
    xgboost_param_n_estimators: int=200,
    serving_container_image_uri: str = PRED_CONTAINER,    
):
    
    load_data_op = get_dataframe(
        bq_table=bq_table, 
        project_id=PROJECT_ID,
        class_names=CLASS_NAMES).set_display_name("Load And Split Data")


    train_op = xgb_train(
        train_data = load_data_op.outputs['train_data'],
        test_data = load_data_op.outputs['test_data'],
        xgboost_param_max_depth = xgboost_param_max_depth,
        xgboost_param_learning_rate = xgboost_param_learning_rate,
        xgboost_param_n_estimators = xgboost_param_n_estimators,
        serving_container_image_uri=serving_container_image_uri
    ).set_display_name("Train Model")


    evaluate_model_op = evaluate_model(
        test_data=load_data_op.outputs['val_data'],
        trained_model=train_op.outputs['model'],
        class_names=CLASS_NAMES,
        target_column=TARGET_COLUMN
    ).set_display_name("Model Card Graphics")


    upload_op = upload_model(
        project_id = PROJECT_ID,
        region = REGION,
        model = train_op.outputs['model'],
        display_name = MODEL_DISPLAY_NAME,
        serving_image = PRED_CONTAINER,
        parent_model = PARENT_MODEL,
        run = dsl.PIPELINE_JOB_NAME_PLACEHOLDER,
        run_id = dsl.PIPELINE_JOB_ID_PLACEHOLDER
    ).set_display_name("Upload Model")


    with open(MODEL_CARD_CONFIG, 'r') as f:
        model_card_config = ' '.join([x.strip() for x in f.readlines()])
    
    _ = plot_model_card(
        project_id = PROJECT_ID,
        region = REGION,
        model = upload_op.outputs['uploaded_model'],
        train_data = load_data_op.outputs['train_data'],
        test_data = load_data_op.outputs['test_data'],
        val_data = load_data_op.outputs['val_data'],
        stats = load_data_op.outputs['stats'],
        reports = evaluate_model_op.outputs['reports'],
        model_card_config = model_card_config
    ).set_display_name("Generate Model Card")

    #
    # Online Endpoint
    #

    create_endpoint_op = EndpointCreateOp(
        project = PROJECT_ID,
        location = REGION,
        display_name = ENDPOINT_NAME
    ).set_display_name("Create Vertex AI Endpoint")

    _ = ModelDeployOp(
            model=upload_op.outputs['uploaded_model'],
            endpoint=create_endpoint_op.outputs['endpoint'],
            dedicated_resources_machine_type = 'n1-standard-8',
            dedicated_resources_min_replica_count = 1,
            dedicated_resources_max_replica_count = 1,
            enable_access_logging = True
    ).set_display_name("Deploy Model To Endpoint")

    # Start Model Monitoring job. 
    # Fails intermittently. Enable after bugfix: https://github.com/googleapis/python-aiplatform/issues/2361
    # _ = model_monitoring(
    #     project_id=PROJECT_ID,
    #     region=REGION,
    #     endpoint=create_endpoint_op.outputs['endpoint'],
    #     pipeline_id=dsl.PIPELINE_JOB_NAME_PLACEHOLDER,
    #     bq_train_data=bq_table,
    #     skew_threshold=0.5,
    #     sampling_rate=1.0,
    #     monitoring_interval_hours=1,
    #     user_emails=EMAILS
    # ).set_display_name("Enable Model Montoring")

    #
    # Evaluation Pipeline
    #
    
    upload_to_bq_op = upload_to_bq(
       project=PROJECT_ID, 
       location=REGION, 
       csv_data=load_data_op.outputs['val_data'],
       dest_dataset_id=BQ_OUTPUT_DATASET_ID,
       dest_table_id=f'{PIPELINE_NAME}-val-{TIMESTAMP}'
    ).set_display_name("Upload to BigQuery")

    # Run the batch prediction task
    batch_predict_op = ModelBatchPredictOp(
        project=PROJECT_ID,
        location=REGION,
        model=upload_op.outputs['uploaded_model'],
        job_display_name=f"bp-{PIPELINE_NAME}-{TIMESTAMP}",
        bigquery_source_input_uri=upload_to_bq_op.outputs['bq_table_uri'],
        instances_format="bigquery",
        predictions_format="bigquery",
        bigquery_destination_output_uri=f"bq://{PROJECT_ID}.{BQ_OUTPUT_DATASET_ID}.{PIPELINE_NAME}-bp-{TIMESTAMP}",
        excluded_fields=[TARGET_COLUMN],
        machine_type="n1-standard-8",
        starting_replica_count=2,
        max_replica_count=8,
    ).set_display_name("Batch Prediction")

    # Format the predictions column from "0.1" that xgboost produces to "[0.9, 0.1]" that sklearn produces
    reformat_predictions_op = reformat_predictions_bq(
       project=PROJECT_ID,
       location=REGION,
       input_predictions=batch_predict_op.outputs['bigquery_output_table']
    ).set_display_name("Reformat Predictions")

    # Run the evaluation based on prediction type
    eval_task = ModelEvaluationClassificationOp(
        project=PROJECT_ID,
        location=REGION,
        class_labels=CLASS_NAMES,
        prediction_score_column= "prediction",
        target_field_name=TARGET_COLUMN,
        ground_truth_format="bigquery",
        ground_truth_bigquery_source=upload_to_bq_op.outputs['bq_table_uri'],
        predictions_format="bigquery",
        predictions_bigquery_source=reformat_predictions_op.outputs['predictions'],
        dataflow_service_account=DATAFLOW_SA,
        dataflow_subnetwork=DATAFLOW_NETWORK,
        dataflow_use_public_ips=DATAFLOW_PUBLIC_IPS,
        force_runner_mode='Dataflow'
    ).set_display_name("Model Evaluation")

    # Import the model evaluations to the Vertex AI model in Model Registry
    ModelImportEvaluationOp(
        classification_metrics=eval_task.outputs["evaluation_metrics"],
        model=upload_op.outputs['uploaded_model'],
        dataset_type="bigquery",
    ).set_display_name("Import Model Evaluation")

# Compile and run the pipeline
aiplatform.init(project=PROJECT_ID, location=REGION, encryption_spec_key_name=KEY_ID)

logging.getLogger().setLevel(logging.INFO)
logging.info(f"Init with project {PROJECT_ID} in region {REGION}. Pipeline root: {PIPELINE_ROOT}")

FORMAT = ".json"

logging.info(f"Compiling pipeline to {PIPELINE_NAME + FORMAT}")
compiler.Compiler().compile(
    pipeline_func=pipeline, 
    package_path=PIPELINE_NAME + FORMAT
)

if not args.compile_only:
    run = aiplatform.PipelineJob(
        project=PROJECT_ID,
        location=REGION,
        display_name=PIPELINE_NAME,
        template_path=PIPELINE_NAME + FORMAT,
        job_id=f"{PIPELINE_NAME}-{TIMESTAMP}",
        pipeline_root=PIPELINE_ROOT,
        parameter_values={
            "bq_table": BQ_INPUT_DATA,
            "xgboost_param_max_depth": 5,
            "xgboost_param_learning_rate": 0.1,
            "xgboost_param_n_estimators": 20},
        enable_caching=caching
    )

    run.submit(service_account=SERVICE_ACCOUNT,
            network=NETWORK)

# This can be used to test the online endpoint:
#
# {
#    "instances": [ 
#      [1.18998913145894,-0.563413492993846,0.129352538697985,-0.302175771438239,-0.927677605983222,-0.784678753251055,-0.443713590138326,-0.0956435854887243,-0.648897198590765,0.0499810894390051,0.358011190903553,-0.445067055832097,-0.0982544178676521,-1.28002825726001,0.304411501372465,0.733464325722348,1.71246876228603,-1.78636925309304,0.163898890406551,0.180489467655959,0.0091417811964457,-0.074443134391428,-0.0011569207049818,0.327529344882462,0.332585093864499,-0.298508896918417,0.0256419259293034,0.0496775221663426,80.52]
# ]
# }