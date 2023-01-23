from kfp.v2 import compiler, dsl
import kfp

@dsl.component(base_image='python:3.9', packages_to_install=["google-cloud-aiplatform"])
def trigger_batch_prediction_pipeline(project_id:str,location:str,mlops_pipeline_version:str,batch_prediction_pipeline_root:str,read_instances_csv_test_set:str,feature_store_id:str,bq_destination_prediction_uri:str):
    from google.cloud import aiplatform
    aiplatform.init(
        project=project_id,
        location=location
    )
    job = aiplatform.PipelineJob(
        display_name="batch-predition-"+mlops_pipeline_version,
        template_path=batch_prediction_pipeline_root+'/{0}.json'.format(mlops_pipeline_version),
        pipeline_root=batch_prediction_pipeline_root,
        enable_caching=False,
        job_id="batch-predition-"+mlops_pipeline_version,
        parameter_values={'read_instances_csv_test_set':read_instances_csv_test_set,
                          'feature_store_id':feature_store_id,
                          'mlops_pipeline_version':mlops_pipeline_version,
                          'bq_destination_prediction_uri':bq_destination_prediction_uri,
                          'project':project_id}
    )
    # Submit the PipelineJob
    job.run()