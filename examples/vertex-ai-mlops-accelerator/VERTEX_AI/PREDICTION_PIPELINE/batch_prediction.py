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

@dsl.component(base_image='python:3.9', packages_to_install=['google-cloud-aiplatform'])
def batch_prediction_op(mlops_pipeline_version:str,bq_destination_prediction_uri:str):
    import google.cloud.aiplatform as aip
    model=aip.Model.list()[0]
    model.batch_predict(machine_type="e2-highmem-2",
                        job_display_name="batch-prediction_{0}".format(mlops_pipeline_version),
                        bigquery_source="bq://{0}.{1}".format(bq_destination_prediction_uri,mlops_pipeline_version),
                        bigquery_destination_prefix="bq://{0}".format(bq_destination_prediction_uri),
                        instances_format="bigquery",
                        predictions_format="bigquery")
    