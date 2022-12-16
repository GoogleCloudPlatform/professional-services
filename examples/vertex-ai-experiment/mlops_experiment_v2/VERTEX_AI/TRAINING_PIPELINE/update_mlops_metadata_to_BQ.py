import logging
from kfp.v2 import compiler, dsl
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
