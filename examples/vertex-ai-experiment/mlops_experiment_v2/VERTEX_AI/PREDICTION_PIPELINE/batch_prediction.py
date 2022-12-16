from kfp.v2 import compiler, dsl

@dsl.component(
    base_image='python:3.9', packages_to_install=['google-cloud-aiplatform'])
def batch_prediction_op(mlops_pipeline_version:str,bq_destination_prediction_uri:str):
    import google.cloud.aiplatform as aip
    model=aip.Model.list()[0]
    model.batch_predict(machine_type="e2-highmem-2",
                        job_display_name="batch-prediction_{0}".format(mlops_pipeline_version),
                        bigquery_source="bq://{0}.{1}".format(bq_destination_prediction_uri,mlops_pipeline_version),
                        bigquery_destination_prefix="bq://{0}".format(bq_destination_prediction_uri),
                        instances_format="bigquery",
                        predictions_format="bigquery")
    