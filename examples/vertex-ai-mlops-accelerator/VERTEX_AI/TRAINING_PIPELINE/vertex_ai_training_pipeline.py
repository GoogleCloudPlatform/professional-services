from kfp.v2 import compiler, dsl
import kfp
import configparser
import argparse
from google_cloud_pipeline_components import aiplatform as gcc_aip
import json

from fetch_feature_values_to_gcs import load_features_batch_to_gcs
from tfdv_validation import generate_statistics
from parse_hyper_parameter_param import parse_hyper_parameter_param
from model_validation import model_validation
from update_mlops_metadata_to_BQ import update_mlops_metadata_to_BQ
from worker_pool_specs import worker_pool_specs_op
from trigger_batch_prediction_pipeline import trigger_batch_prediction_pipeline
from google_cloud_pipeline_components.v1.hyperparameter_tuning_job import HyperparameterTuningJobRunOp
from google_cloud_pipeline_components.experimental import hyperparameter_tuning_job
import google.cloud.aiplatform as aip
from google_cloud_pipeline_components.experimental.dataflow import DataflowPythonJobOp
from google_cloud_pipeline_components.experimental.wait_gcp_resources import \
        WaitGcpResourcesOp


# Parse arguments
parser=argparse.ArgumentParser()
parser.add_argument("--mlops_pipeline_version", help="MLOps Pipeline version.")
parser.add_argument("--project_id", help="MLOps Project ID.")
parser.add_argument("--location", help="MLOps Project Location.")
parser.add_argument("--mlops_bucket_name", help="MLOps Bucket Location.")
parser.add_argument("--service_account", help="Service Account to be used by Vertex AI.")
parser.add_argument("--training_container_uri", help="Dataflow Requirements file path.")
parser.add_argument("--prediction_container_uri", help="Dataflow Requirements file path.")
parser.add_argument("--training_bq_source", help="Training big query source url.")
parser.add_argument("--training_bq_temp_destination", help="Training big query temporary destination url.")
parser.add_argument("--is_preprocessing", help="is preprocessing is needs to be triggered.")
parser.add_argument("--read_instances_csv", help="Read instances from Feature Store.")
parser.add_argument("--feature_store_id", help="Feature Store ID.")
parser.add_argument("--vertex_ai_training_dataset_bq", help="Vertex AI training dataset BQ")
parser.add_argument("--hyper_parameter_container_uri", help="Vertex AI Hyper Parameter Tunning container url.")
parser.add_argument("--e2e_test", help="E2E Test")
parser.add_argument("--model_name", help="ML Model name")
parser.add_argument("--f1_score_threshold", help="F1 Score to validate")
parser.add_argument("--vertex_ai_end_point", help="Vertex AI endpoint")
parser.add_argument("--mlops_metadata_table", help="MLOps metadata table")
parser.add_argument("--experiment_name", help="MLOps Experiment name")
parser.add_argument("--bq_destination_prediction_uri", help="BQ Prediction Destination URI")
parser.add_argument("--dataflow_container_uri", help="Data flow container URI")



args=parser.parse_args()
mlops_pipeline_version=args.mlops_pipeline_version
project_id=args.project_id
location=args.location
mlops_bucket_name=args.mlops_bucket_name
service_account=args.service_account
training_container_uri=args.training_container_uri
prediction_container_uri=args.prediction_container_uri
training_bq_source=args.training_bq_source
training_bq_temp_destination=args.training_bq_temp_destination
is_preprocessing=args.is_preprocessing
read_instances_csv=args.read_instances_csv
feature_store_id=args.feature_store_id
vertex_ai_training_dataset_bq=args.vertex_ai_training_dataset_bq
hyper_parameter_container_uri=args.hyper_parameter_container_uri
e2e_test=args.e2e_test
model_name=args.model_name
f1_score_threshold=args.f1_score_threshold
vertex_ai_end_point=args.vertex_ai_end_point
mlops_metadata_table=args.mlops_metadata_table
experiment_name=args.experiment_name
bq_destination_prediction_uri=args.bq_destination_prediction_uri
dataflow_container_uri=args.dataflow_container_uri



# Read configurations
config = configparser.ConfigParser()
config.read('./VERTEX_AI/TRAINING_PIPELINE/config.ini')
TRAINING_PIPELINE_NAME=config.get('VERTEX_AI','TRAINING_PIPELINE_NAME')
pipeline_template_root_path="gs://{0}/training_pipeline/training_pipeline".format(mlops_bucket_name)


dataflow_python_file='gs://{0}/dataflow/pre_processing.py'.format(mlops_bucket_name)
dataflow_requirements_file='gs://{0}/dataflow/requirements.txt'.format(mlops_bucket_name)

pipeline_root_path="gs://{0}/vertex-ai".format(mlops_bucket_name)
dataflow_root_path="gs://{0}/dataflow".format(mlops_bucket_name)
dataflow_root_path_temp="gs://{0}/dataflow_temp".format(mlops_bucket_name)
tfdv_root_path_temp="gs://{0}/tfdv".format(mlops_bucket_name)
model_validation_root_path_temp="vertex-ai/model"
batch_prediction_pipeline_template_root_path="gs://{0}/batch_prediction/prediction_pipeline".format(mlops_bucket_name)


# Vertex AI pipeline
@kfp.dsl.pipeline(name=TRAINING_PIPELINE_NAME,pipeline_root=pipeline_root_path)
def pipeline(project_id: str,location: str,training_container_uri: str,prediction_container_uri: str,
             training_bq_source:str,training_bq_temp_destination:str,pipeline_root_path:str,dataflow_python_file:str,
             dataflow_requirements_file:str,dataflow_root_path:str,is_preprocessing:str,dataflow_root_path_temp:str,
             read_instances_csv:str,feature_store_id:str,tfdv_root_path_temp:str,mlops_pipeline_version:str,
             vertex_ai_training_dataset_bq:str,hyper_parameter_container_uri:str,model_name:str,f1_score_threshold:str,
             mlops_bucket_name:str,vertex_ai_end_point:str,mlops_metadata_table:str,experiment_name:str,bq_destination_prediction_uri:str
             ,dataflow_container_uri:str):
    

    #1. [FLAG] Trigger DataFlow Preprocessing Pipeline  
    dataflow_python_op = DataflowPythonJobOp(
                                project=project_id,
                                location=location, 
                                python_module_path=dataflow_python_file,
                                temp_location = dataflow_root_path_temp,
                                requirements_file_path = dataflow_requirements_file,
                                args=json.dumps(["--dataflow_container_uri={0}".format(dataflow_container_uri)])
        )
        
    dataflow_wait_op =  WaitGcpResourcesOp(
                                gcp_resources = dataflow_python_op.outputs["gcp_resources"]
        )
    

               
    load_features_batch_to_bq_op=load_features_batch_to_gcs(
                                    read_instances_csv=read_instances_csv,
                                    feature_store_id=feature_store_id,
                                    mlops_pipeline_version=mlops_pipeline_version
                                    ).after(dataflow_wait_op)
            
    generate_statistics_task=generate_statistics(
                                    output_gcs_path=tfdv_root_path_temp,
                                    project=project_id,
                                    gcs_source =load_features_batch_to_bq_op.outputs["gcs_destination_output_uri_paths"]
                                    ).after(load_features_batch_to_bq_op)
    #Create Dataset from GCS        
    dataset_create_op = gcc_aip.TabularDatasetCreateOp(
                                    project=project_id, 
                                    display_name=mlops_pipeline_version, 
                                    gcs_source =load_features_batch_to_bq_op.outputs["gcs_destination_dataset_list_of_csv_files"],
                                    location=location
                ).after(generate_statistics_task)
        
    #hyper parameter tunning
    worker_pool_specs_task=worker_pool_specs_op(
                                    gcs_destination_output_uri_paths=load_features_batch_to_bq_op.outputs["gcs_destination_output_uri_paths"]
                ).after(dataset_create_op)
    metric_spec=hyperparameter_tuning_job.serialize_metrics({'accuracy': 'maximize'})
    parameter_spec = hyperparameter_tuning_job.serialize_parameters({
                                    "min_samples_leaf": aip.hyperparameter_tuning.DiscreteParameterSpec(values=[2, 3], scale=None),
                                    "max_leaves": aip.hyperparameter_tuning.DiscreteParameterSpec(values=[3,4], scale=None)
        })
        
    hp_tuning_task = HyperparameterTuningJobRunOp(
                                    display_name=mlops_pipeline_version,
                                    project=project_id,
                                    location=location,
                                    worker_pool_specs=worker_pool_specs_task.outputs['worker_pool_specs'],
                                    study_spec_metrics=metric_spec,
                                    study_spec_parameters=parameter_spec,
                                    max_trial_count=1,
                                    parallel_trial_count=1,
                                    base_output_directory=pipeline_root_path
        ).after(worker_pool_specs_task)
        
    trials_task = hyperparameter_tuning_job.GetTrialsOp(
            gcp_resources=hp_tuning_task.outputs['gcp_resources'])

    best_trial_task = hyperparameter_tuning_job.GetBestTrialOp(
                                    trials=trials_task.output, 
                                    study_spec_metrics=metric_spec)
    
    parse_hyper_parameters_task=parse_hyper_parameter_param(
                                    best_trial_task=best_trial_task.output,
                                    model_name=model_name,
                                    model_validation_root_path_temp=model_validation_root_path_temp,
                                    bucket_name=mlops_bucket_name,
                                    gcs_source =load_features_batch_to_bq_op.outputs["gcs_destination_output_uri_paths"]
                                ).after(best_trial_task)
    
    # Create Custom Training Job
    training_op = gcc_aip.CustomContainerTrainingJobRunOp(
                                    display_name=mlops_pipeline_version,
                                    container_uri=training_container_uri,
                                    project=project_id,
                                    command=json.dumps(["python3", "train.py"]),
                                    location=location,
                                    dataset=dataset_create_op.outputs["dataset"],
                                    staging_bucket=pipeline_root_path,
                                    training_fraction_split=0.9,
                                    validation_fraction_split=0,
                                    test_fraction_split=0.1,
                                    model_serving_container_image_uri=prediction_container_uri,
                                    model_serving_container_predict_route='/predict',
                                    model_serving_container_health_route='/health',
                                    model_serving_container_ports=[8080],
                                    model_display_name=mlops_pipeline_version,
                                    machine_type="e2-highmem-2",
                                    service_account=service_account,
                                    base_output_dir=pipeline_root_path, 
                                    environment_variables=parse_hyper_parameters_task.outputs['hyper_parameter_dict'],
                                    model_serving_container_environment_variables=parse_hyper_parameters_task.outputs['hyper_parameter_dict']
                                    ).after(parse_hyper_parameters_task)
        
    model_validation_op=model_validation(
                                    bucket_name=mlops_bucket_name,
                                    model_validation_root_path_temp=model_validation_root_path_temp,
                                    f1_score_threshold=f1_score_threshold,
                                    project_id=project_id,
                                    location=location,
                                    mlops_version=mlops_pipeline_version,
                                    experiment_name=experiment_name,
                                    gcs_source =load_features_batch_to_bq_op.outputs["gcs_destination_output_uri_paths"]
                                    ).after(training_op)
    
    with dsl.Condition(model_validation_op.outputs['is_model_valid'] == "TRUE"):
            create_endpoint_op = gcc_aip.EndpointCreateOp(
                                    project=project_id,
                                    display_name = 'online-prediction-v1',
                                    location=location 
                                    )
            
            gcc_aip.ModelDeployOp(
                                    model=training_op.outputs["model"],
                                    endpoint=create_endpoint_op.outputs['endpoint'],
                                    dedicated_resources_machine_type="e2-highmem-2",
                                    dedicated_resources_min_replica_count=1,
                                    dedicated_resources_max_replica_count=1,
                                    service_account=service_account,
                                    traffic_split={'0': 100},
                                    enable_access_logging=True
                                    ) 
            # Trigger Batch Prediction Pipeline
            trigger_batch_prediction_pipeline_task=trigger_batch_prediction_pipeline(
                                        project_id=project_id,
                                        location=location,
                                        mlops_pipeline_version=mlops_pipeline_version,
                                        batch_prediction_pipeline_root=batch_prediction_pipeline_template_root_path,
                                        read_instances_csv_test_set=read_instances_csv,
                                        feature_store_id=feature_store_id,
                                        bq_destination_prediction_uri=bq_destination_prediction_uri
                                        )
    
    update_mlops_metadata_to_BQ(
                                mlops_metadata_table=mlops_metadata_table, 
                                mlops_pipeline_version=mlops_pipeline_version,
                                is_model_valid=model_validation_op.outputs['is_model_valid'],
                                best_hyper_parameters=parse_hyper_parameters_task.outputs['hyper_parameter_dict'],
                                is_preprocessing=is_preprocessing,
                                f1_score_value=model_validation_op.outputs['f1_score_value']                                 
                                ).after(trigger_batch_prediction_pipeline_task)

        

# Compile pipeline 
def compile_pipeline():
    compiler.Compiler().compile(pipeline_func=pipeline,package_path=mlops_pipeline_version+'.json')
    
    # Upload JSON template to GCS
    from google.cloud import storage
    storage_client = storage.Client(project="mlops-experiment-v2")
    blob = storage.blob.Blob.from_string(pipeline_template_root_path+'/{0}.json'.format(mlops_pipeline_version), client=storage_client)
    blob.upload_from_filename(mlops_pipeline_version+'.json')
    print(" Uploaded Training Pipeline JSON to GCS")

# Run Vertex AI pipeline

def run_pipeline():
    job = aip.PipelineJob(
        display_name=mlops_pipeline_version,
        template_path=mlops_pipeline_version+'.json',
        job_id=mlops_pipeline_version,
        pipeline_root=pipeline_root_path,
        location=location,
        parameter_values={
            'project_id': project_id,'location': location,'training_container_uri': training_container_uri,
            'prediction_container_uri': prediction_container_uri,'training_bq_source':training_bq_source,
            'training_bq_temp_destination':training_bq_temp_destination,'pipeline_root_path':pipeline_root_path,
            'dataflow_python_file':dataflow_python_file,'dataflow_requirements_file':dataflow_requirements_file,
            'dataflow_root_path':dataflow_root_path,'is_preprocessing':is_preprocessing,'dataflow_root_path_temp':dataflow_root_path_temp,
            'read_instances_csv':read_instances_csv,'feature_store_id':feature_store_id,'tfdv_root_path_temp':tfdv_root_path_temp,
            'mlops_pipeline_version':mlops_pipeline_version,'vertex_ai_training_dataset_bq':vertex_ai_training_dataset_bq,
            'hyper_parameter_container_uri':hyper_parameter_container_uri,'model_name':model_name,'f1_score_threshold':f1_score_threshold,
            'mlops_bucket_name':mlops_bucket_name,'vertex_ai_end_point':vertex_ai_end_point,'mlops_metadata_table':mlops_metadata_table,
            'experiment_name':experiment_name,'bq_destination_prediction_uri':bq_destination_prediction_uri,'dataflow_container_uri':dataflow_container_uri
        },
        enable_caching=False,
    )

    if e2e_test=='TRUE':
        # Incase of E2E Test wait for vertex AI pipeline to be complete.
        job.run(service_account=service_account)
    else:
        job.submit(service_account=service_account)

if __name__ == "__main__":
    print("Vertex AI Pipeline.. Started.")
    print("service account :"+service_account)
    compile_pipeline()
    run_pipeline()