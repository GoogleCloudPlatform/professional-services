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
from typing import NamedTuple


@dsl.component(
    base_image='python:3.9', packages_to_install=["google-cloud-bigquery","db-dtypes",])
def update_mlops_metadata_to_BQ(mlops_metadata_table:str,mlops_pipeline_version:str,is_model_valid:str,best_hyper_parameters:str,is_preprocessing:str,f1_score_value:str)-> NamedTuple('Outputs', [('is_updated_to_bq', str)]):
    
    from google.cloud import bigquery
    client = bigquery.Client(project="mlops-experiment-v2")
    is_updated_to_bq="TRUE"
    try:
        rows_to_insert = [
            {
                "mlops_pipeline_version": mlops_pipeline_version, 
                "is_model_valid": is_model_valid,
                "is_preprocessing":is_preprocessing,
                "best_hyper_parameters":best_hyper_parameters,
                "f1_score_value":float(f1_score_value)
            }
        ]
        table_id=mlops_metadata_table
        errors = client.insert_rows_json(
            table_id, rows_to_insert
        )
        if errors == []:
            is_updated_to_bq="FALSE" 
    except Exception as e:
        print(e)
        is_updated_to_bq="FALSE" 
    
    from collections import namedtuple
    stats_output = namedtuple('Outputs', ['is_updated_to_bq'])

    return stats_output(is_updated_to_bq)
