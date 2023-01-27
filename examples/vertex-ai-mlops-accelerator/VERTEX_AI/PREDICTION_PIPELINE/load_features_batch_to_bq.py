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

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['google-cloud-aiplatform',"google-cloud-bigquery","db-dtypes","google-cloud-storage"],)
def load_features_batch_to_bq(read_instances_csv:str,feature_store_id:str,mlops_pipeline_version:str,bq_destination_prediction_uri:str):
    
    from google.cloud import aiplatform  
    
    # Load Values
    fs = aiplatform.featurestore.Featurestore(featurestore_name=feature_store_id)
    SERVING_FEATURE_IDS = {
        "graph": ["feature_1_score", "feature_2_score", "feature_3_score","feature_4_score", "feature_5_score", "feature_6_score","feature_7_score", "feature_8_score", "feature_9_score", "feature_10_score"]
    }
    # BQ
    fs.batch_serve_to_bq(
         bq_destination_output_uri="bq://{0}.{1}".format(bq_destination_prediction_uri,mlops_pipeline_version),
         serving_feature_ids=SERVING_FEATURE_IDS,
         read_instances_uri=read_instances_csv
    )
