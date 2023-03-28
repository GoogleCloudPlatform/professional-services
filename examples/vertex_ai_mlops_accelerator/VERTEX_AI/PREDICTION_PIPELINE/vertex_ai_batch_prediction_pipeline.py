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

from kfp.v2 import compiler
import kfp
from google.cloud import storage
from load_features_batch_to_bq import load_features_batch_to_bq
from tfdv_validation import generate_statistics
from batch_prediction import batch_prediction_op
import configparser
import argparse

# Read configurations
config = configparser.ConfigParser()
config.read('./VERTEX_AI/PREDICTION_PIPELINE/config.ini')
BATCH_PREDICTION_PIPELINE_NAME=config.get('VERTEX_AI','BATCH_PREDICTION_PIPELINE_NAME')

# Parse arguments
parser=argparse.ArgumentParser()
parser.add_argument("--mlops_bucket_name", help="MLOps Bucket Name.")
parser.add_argument("--mlops_pipeline_version", help="MLOps Pipeline template path")

args=parser.parse_args()
mlops_bucket_name=args.mlops_bucket_name
mlops_pipeline_version=args.mlops_pipeline_version

pipeline_root_path="gs://{0}/vertex-ai".format(mlops_bucket_name)
pipeline_template_root_path="gs://{0}/batch_prediction/prediction_pipeline".format(mlops_bucket_name)

# Vertex AI pipeline
@kfp.dsl.pipeline(name=BATCH_PREDICTION_PIPELINE_NAME,pipeline_root=pipeline_root_path)
def pipeline(read_instances_csv_test_set:str,feature_store_id:str,mlops_pipeline_version:str,bq_destination_prediction_uri:str,project:str):
    load_features_batch_to_bq_task=load_features_batch_to_bq(read_instances_csv=read_instances_csv_test_set,
                                                             feature_store_id=feature_store_id,
                                                             mlops_pipeline_version=mlops_pipeline_version,
                                                             bq_destination_prediction_uri=bq_destination_prediction_uri)
    generate_statistics_task=generate_statistics(output_gcs_path=pipeline_root_path,
                                                 project=project,
                                                 mlops_pipeline_version=mlops_pipeline_version,
                                                 bq_destination_prediction_uri=bq_destination_prediction_uri).after(load_features_batch_to_bq_task)
    batch_prediction_op(mlops_pipeline_version=mlops_pipeline_version,bq_destination_prediction_uri=bq_destination_prediction_uri).after(generate_statistics_task)
    


def compile_pipeline():
    pipeline_name=mlops_pipeline_version+'.json'
    compiler.Compiler().compile(pipeline_func=pipeline,package_path=pipeline_name)
    
    # Upload JSON template to GCS
    storage_client = storage.Client(project="mlops-experiment-v2")
    blob = storage.blob.Blob.from_string(pipeline_template_root_path+'/{0}.json'.format(mlops_pipeline_version), client=storage_client)
    blob.upload_from_filename(pipeline_name)
    print(" Uploaded Batch Prediction Pipeline JSON to GCS")


if __name__ == "__main__":
    compile_pipeline()
