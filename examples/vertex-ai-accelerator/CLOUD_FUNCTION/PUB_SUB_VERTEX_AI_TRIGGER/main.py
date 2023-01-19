import functions_framework
import os
import time
import datetime
import google.cloud.aiplatform as aip

@functions_framework.http
def trigger_training_pipeline(request):
    mlops_pipeline_version=os.environ['mlops_pipeline_version']
    project_id=os.environ['project_id']
    location=os.environ['location']
    mlops_bucket_name=os.environ['mlops_bucket_name']
    service_account=os.environ['service_account']
    training_container_uri=os.environ['training_container_uri']
    prediction_container_uri=os.environ['prediction_container_uri']
    training_bq_source=os.environ['training_bq_source']
    training_bq_temp_destination=os.environ['training_bq_temp_destination']
    is_preprocessing=os.environ['is_preprocessing']
    read_instances_csv=os.environ['read_instances_csv']
    feature_store_id=os.environ['feature_store_id']
    vertex_ai_training_dataset_bq=os.environ['vertex_ai_training_dataset_bq']
    hyper_parameter_container_uri=os.environ['hyper_parameter_container_uri']
    e2e_test=os.environ['e2e_test']
    model_name=os.environ['model_name']
    f1_score_threshold=os.environ['f1_score_threshold']
    vertex_ai_end_point=os.environ['vertex_ai_end_point']
    mlops_metadata_table=os.environ['mlops_metadata_table']
    experiment_name=os.environ['experiment_name']
    bq_destination_prediction_uri=os.environ['bq_destination_prediction_uri']
    
    pipeline_template_root_path="gs://{0}/training_pipeline/training_pipeline".format(mlops_bucket_name)


    dataflow_python_file='gs://{0}/dataflow/pre_processing.py'.format(mlops_bucket_name)
    dataflow_requirements_file='gs://{0}/dataflow/requirements.txt'.format(mlops_bucket_name)

    pipeline_root_path="gs://{0}/vertex-ai".format(mlops_bucket_name)
    dataflow_root_path="gs://{0}/dataflow".format(mlops_bucket_name)
    dataflow_root_path_temp="gs://{0}/dataflow_temp".format(mlops_bucket_name)
    tfdv_root_path_temp="gs://{0}/tfdv".format(mlops_bucket_name)

    presentDate = datetime.datetime.now()
    unix_timestamp = int(datetime.datetime.timestamp(presentDate)*1000)
    print(unix_timestamp)
    
    job = aip.PipelineJob(
        display_name="pub-sub-training-"+str(unix_timestamp)+"-"+mlops_pipeline_version,
        template_path=pipeline_template_root_path+'/{0}.json'.format(mlops_pipeline_version),
        job_id="pub-sub-training-"+str(unix_timestamp)+"-"+mlops_pipeline_version,
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
            'experiment_name':experiment_name,'bq_destination_prediction_uri':bq_destination_prediction_uri
        },
        enable_caching=False,
    )
    job.submit(service_account=service_account)
    return 'Vertex AI Training pipeline job is submitted.'
