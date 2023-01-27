#  Copyright 2023 Google LLC

#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at

#      http://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

from kfp.v2 import  dsl

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