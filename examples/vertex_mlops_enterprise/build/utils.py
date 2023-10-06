# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Utilities for deploying pipelines and models to Vertex AI."""


import argparse
import os
import sys
import logging
import json

from google.cloud import aiplatform as vertex_ai
from google.cloud import storage


SCRIPT_DIR = os.path.dirname(
    os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__)))
)
sys.path.append(os.path.normpath(os.path.join(SCRIPT_DIR, "..")))

SERVING_SPEC_FILEPATH = 'build/serving_resources_spec.json'

def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--mode', 
        type=str,
        required=True
    )

    parser.add_argument(
        '--project',  
        type=str,
    )
    
    parser.add_argument(
        '--region',  
        type=str,
    )
    
    parser.add_argument(
        '--endpoint-display-name', 
        type=str,
    )

    parser.add_argument(
        '--model-display-name', 
        type=str,
    )
    
    parser.add_argument(
        '--pipeline-name', 
        type=str,
    )
    
    parser.add_argument(
        '--pipelines-store', 
        type=str,
    )

    parser.add_argument(
        '--service-account', 
        type=str,
    )

    parser.add_argument(
        '--parameter-values', 
        type=str,
    )

    parser.add_argument(
        '--labels', 
        type=str,
    )

    return parser.parse_args()


def create_endpoint(project, region, endpoint_display_name):
    logging.info(f"Creating endpoint {endpoint_display_name}")
    vertex_ai.init(
        project=project,
        location=region
    )
    
    endpoints = vertex_ai.Endpoint.list(
        filter=f'display_name={endpoint_display_name}', 
        order_by="update_time")
    
    if len(endpoints) > 0:
        logging.info(f"Endpoint {endpoint_display_name} already exists.")
        endpoint = endpoints[-1]
    else:
        endpoint = vertex_ai.Endpoint.create(endpoint_display_name)
    logging.info(f"Endpoint is ready.")
    logging.info(endpoint.gca_resource)
    return endpoint


def deploy_model(project, region, endpoint_display_name, model_display_name, serving_resources_spec):
    logging.info(f"Deploying model {model_display_name} to endpoint {endpoint_display_name}")
    vertex_ai.init(
        project=project,
        location=region
    )
    
    model = vertex_ai.Model.list(
        filter=f'display_name={model_display_name}',
        order_by="update_time"
    )[-1]
    
    endpoint = vertex_ai.Endpoint.list(
        filter=f'display_name={endpoint_display_name}',
        order_by="update_time"
    )[-1]

    deployed_model = endpoint.deploy(model=model, **serving_resources_spec)
    logging.info(f"Model is deployed.")
    logging.info(deployed_model)
    return deployed_model


def compile_pipeline(pipeline_name):
    from src.tfx_pipelines import runner
    pipeline_definition_file = f"{pipeline_name}.json"
    pipeline_definition = runner.compile_training_pipeline(pipeline_definition_file)
    return pipeline_definition

def run_pipeline(project, region, service_account, pipelines_store, pipeline_name, parameter_values, labels_str):
    if labels_str:
        # Converting string into dictionary using dict comprehension
        labels = dict(item.split("=") for item in labels_str.split(","))
        #labels=json.loads(labels_str)

    storage_client = storage.Client()
    
    gcs_pipeline_file_location = pipelines_store if pipelines_store.endswith("/") else pipelines_store + "/"
    gcs_pipeline_file_location = gcs_pipeline_file_location + pipeline_name + ".json"
    
    path_parts = gcs_pipeline_file_location.replace("gs://", "").split("/")
    bucket_name = path_parts[0]
    blob_name = "/".join(path_parts[1:])

    bucket = storage_client.bucket(bucket_name)
    blob = storage.Blob(bucket=bucket, name=blob_name)

    if not blob.exists(storage_client):
        raise ValueError(f"{pipelines_store}/{pipeline_name} does not exist.")
    
    parameter_values_json = json.loads(parameter_values)
    print(f'Input: {parameter_values_json}')
    print(f'JSON: {parameter_values_json}')

    job = vertex_ai.PipelineJob(display_name = pipeline_name,
                             template_path = gcs_pipeline_file_location,
                             parameter_values = parameter_values_json,
                             project = project,
                             location = region,
                             labels = labels)

    response = job.submit(service_account=service_account,
           network=None)
           
    job.wait()
    print(f'Job finished with state: {job.state}')
    
    return response


def main():
    args = get_args()

    if args.mode == 'create-endpoint':
        if not args.project:
            raise ValueError("project must be supplied.")
        if not args.region:
            raise ValueError("region must be supplied.")
        if not args.endpoint_display_name:
            raise ValueError("endpoint_display_name must be supplied.")
            
        result = create_endpoint(
            args.project, 
            args.region, 
            args.endpoint_display_name
        )
        
    elif args.mode == 'deploy-model':
        if not args.project:
            raise ValueError("project must be supplied.")
        if not args.region:
            raise ValueError("region must be supplied.")
        if not args.endpoint_display_name:
            raise ValueError("endpoint-display-name must be supplied.")
        if not args.model_display_name:
            raise ValueError("model-display-name must be supplied.")
            
        with open(SERVING_SPEC_FILEPATH) as json_file:
            serving_resources_spec = json.load(json_file)
        logging.info(f"serving resources: {serving_resources_spec}")
        result = deploy_model(
            args.project, 
            args.region, 
            args.endpoint_display_name, 
            args.model_display_name,
            serving_resources_spec
        )
        
    elif args.mode == 'compile-pipeline':
        if not args.pipeline_name:
            raise ValueError("pipeline-name must be supplied.")            
        result = compile_pipeline(args.pipeline_name)
    elif args.mode == 'run-pipeline':
        if not args.project:
            raise ValueError("project must be supplied.")
        if not args.region:
            raise ValueError("region must be supplied.")
        if not args.pipelines_store:
            raise ValueError("pipelines-store must be supplied.")
        if not args.pipeline_name:
            raise ValueError("pipeline-name must be supplied.")
        if not args.service_account:
            raise ValueError("service-account must be supplied.")
        if not args.parameter_values:
            raise ValueError("parameter-values must be supplied.")

        result = run_pipeline(
            args.project,
            args.region,
            args.service_account,
            args.pipelines_store,
            args.pipeline_name,
            args.parameter_values,
            args.labels)
    else:
        raise ValueError(f"Invalid mode {args.mode}.")
        
    logging.info(result)
        
    
if __name__ == "__main__":
    main()
    