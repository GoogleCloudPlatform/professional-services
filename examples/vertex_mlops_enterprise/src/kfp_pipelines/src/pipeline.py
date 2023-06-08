from kfp import dsl
from kfp import compiler
from kfp.dsl import Artifact, Input, Model, Output, OutputPath

from google.cloud import aiplatform

from google_cloud_pipeline_components.v1.endpoint import EndpointCreateOp
from google_cloud_pipeline_components.aiplatform import ModelDeployOp

import logging
from datetime import datetime

from config import PIPELINE_ROOT, PIPELINE_NAME, BQ_INPUT_DATA, MODEL_CARD_CONFIG, MODEL_DISPLAY_NAME, PRED_CONTAINER, ENDPOINT_NAME, PARENT_MODEL
from train import xgb_train, PROJECT_ID, REGION, IMAGE, CLASS_NAMES, TARGET_COLUMN
from eval import evaluate_model
from model_card import plot_model_card

caching = True

# Load data from BigQuery and save to CSV
@dsl.component(base_image=IMAGE)
def get_dataframe(
    project_id: str,
    bq_table: str,
    train_data: OutputPath("Dataset"),
    test_data: OutputPath("Dataset"),
    val_data: OutputPath("Dataset"),
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
    # Drop the Time column, otherwise the model will just memorize when the fraud cases happened
    dataframe.drop(columns=['Time'], inplace=True) 
    logging.info("Data loaded, writing splits")

    # 60 / 20 / 20
    df_train, df_test = train_test_split(dataframe, test_size=0.4)
    df_test, df_val = train_test_split(df_test, test_size=0.5)

    df_train.to_csv(train_data, index=False)
    df_test.to_csv(test_data, index=False)
    df_val.to_csv(val_data, index=False)

    def get_fig(df, title):
        n_fraud = (df.Class == '1').sum()
        n_ok = len(df) - n_fraud

        logging.info(f"Stats for {title}: {n_ok=} {n_fraud=}")

        ys = [n_ok, n_fraud]

        g = sns.barplot(x=class_names, y=ys)
        g.set_yscale('log')
        g.set_ylim(1, n_ok*2)
        fig = g.get_figure()
        fig.suptitle(title)
        return fig

    logging.info("Generating stats")
    stats_dict = {} 
    fig = get_fig(df_train, "Training data")
    stats_dict['train'] = figure_to_base64str(fig)
    fig.clf()

    fig = get_fig(df_test, "Test data")
    stats_dict['test'] = figure_to_base64str(fig)
    fig.clf()
    
    fig = get_fig(df_val, "Validation data")
    stats_dict['val'] = figure_to_base64str(fig)
    fig.clf()
    
    logging.info(f"Writing stats to {stats.path}")
    with open(stats.path, 'wb') as f:
        pickle.dump(stats_dict, f)


# Import model and convert to Artifact
@dsl.component(base_image=IMAGE)
def get_unmanaged_model(model: Input[Model], unmanaged_model: Output[Artifact]):
  unmanaged_model.metadata = model.metadata
  unmanaged_model.uri = '/'.join(model.uri.split('/')[:-1]) # remove filename after last / - send dir rather than file


@dsl.component(base_image=IMAGE)
def upload_model(
    project_id: str,
    region: str,
    model: Input[Model],
    display_name: str,
    serving_image: str,
    parent_model: str,
    uploaded_model: Output[Artifact]
):
    from google.cloud import aiplatform
    vertex_model = aiplatform.Model.upload(
        project=project_id,
        location=region,
        display_name=display_name,
        artifact_uri='/'.join(model.uri.split('/')[:-1]), # remove filename after last / - send dir rather than file,
        serving_container_image_uri=serving_image,
        parent_model=parent_model
    )

    uploaded_model.metadata['resourceName'] = vertex_model.resource_name
    uploaded_model.uri = f'https://{region}-aiplatform.googleapis.com/v1/{vertex_model.resource_name}'




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
    ).set_display_name("Evaluate Model")


    create_endpoint_op = EndpointCreateOp(
        project = PROJECT_ID,
        location = REGION,
        display_name = ENDPOINT_NAME
    ).set_display_name("Create Vertex AI Endpoint")


    upload_op = upload_model(
        project_id = PROJECT_ID,
        region = REGION,
        model = train_op.outputs['model'],
        display_name = MODEL_DISPLAY_NAME,
        serving_image = PRED_CONTAINER,
        parent_model = PARENT_MODEL
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


    _ = ModelDeployOp(
            model=upload_op.outputs['uploaded_model'],
            endpoint=create_endpoint_op.outputs['endpoint'],
            dedicated_resources_machine_type = 'n1-standard-8',
            dedicated_resources_min_replica_count = 1,
            dedicated_resources_max_replica_count = 1,
            enable_access_logging = True
    ).set_display_name("Deploy Model To Endpoint")



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