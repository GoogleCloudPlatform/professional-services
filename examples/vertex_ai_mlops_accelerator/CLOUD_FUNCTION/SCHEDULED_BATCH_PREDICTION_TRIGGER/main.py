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

import functions_framework
import os
import datetime

@functions_framework.http
def trigger_batch_prediction_pipeline(request):
    project_id=os.environ['project_id']
    location=os.environ['location']
    mlops_pipeline_version=os.environ['mlops_pipeline_version']
    read_instances_csv_test_set=os.environ['read_instances_csv_test_set']
    feature_store_id=os.environ['feature_store_id']
    bq_destination_prediction_uri=os.environ['bq_destination_prediction_uri']
    service_account=os.environ['service_account']
    mlops_bucket_name=os.environ['mlops_bucket_name']
    batch_prediction_pipeline_template_root_path="gs://{0}/batch_prediction/prediction_pipeline".format(mlops_bucket_name)
    
    
 
    presentDate = datetime.datetime.now()
    unix_timestamp = int(datetime.datetime.timestamp(presentDate)*1000)
    print(unix_timestamp)
        
    from google.cloud import aiplatform
    aiplatform.init(
        project=project_id,
        location=location
    )
    job = aiplatform.PipelineJob(
        display_name="scheduled-batch-predition-"+str(unix_timestamp)+"-"+mlops_pipeline_version,
        template_path=batch_prediction_pipeline_template_root_path+'/{0}.json'.format(mlops_pipeline_version),
        pipeline_root=batch_prediction_pipeline_template_root_path,
        enable_caching=False,
        job_id="scheduled-batch-predition-"+str(unix_timestamp)+"-"+mlops_pipeline_version,
        parameter_values={'read_instances_csv_test_set':read_instances_csv_test_set,
                          'feature_store_id':feature_store_id,
                          'mlops_pipeline_version':mlops_pipeline_version,
                          'bq_destination_prediction_uri':bq_destination_prediction_uri,
                          'project':project_id}
    )
    # Submit the PipelineJob
    job.submit(service_account=service_account)
    return 'Vertex AI Batch Prediction pipeline job is submitted.'
