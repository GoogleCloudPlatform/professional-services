from kfp import dsl
from typing import NamedTuple
from google_cloud_pipeline_components.types.artifact_types import BQTable

from config import IMAGE


# Format the predictions column from "0.1" that xgboost produces to "[0.9, 0.1]" that sklearn produces
@dsl.component(base_image=IMAGE)
def reformat_predictions_bq(
    project: str,
    location: str,
    input_predictions: dsl.Input[BQTable],
    predictions: dsl.Output[BQTable]
):
    
    from google.cloud.bigquery import Client
    import logging

    bq = Client(project=project, location=location)
    table_project = input_predictions.metadata['projectId']
    table_dataset = input_predictions.metadata['datasetId']
    table_table = input_predictions.metadata['tableId']
    table_ref = f"{table_project}.{table_dataset}.{table_table}"
    
    sql = f"""
        CREATE OR REPLACE TABLE `{table_ref}_reformat` AS
        SELECT * EXCEPT(prediction), 
            '[' || CAST(1.0-CAST(prediction AS FLOAT64) AS STRING) || ',' || prediction || ']' as prediction
        FROM `{table_ref}`"""

    logging.info(f"Processing data in table {table_ref}")
    logging.info(f"Query: {sql}")
    job = bq.query(sql)
    
    job.result() # wait for completion

    predictions.metadata['projectId'] = table_project
    predictions.metadata['datasetId'] = table_dataset
    predictions.metadata['tableId'] = table_table + "_reformat"


@dsl.component(base_image=IMAGE)
def reformat_groundtruth_json(
    gcs_sources: list,
    gcs_groundtruth: dsl.OutputPath("Dataset")) -> NamedTuple('outputs', [('gcs_output_uris', list)]):
   
    from collections import namedtuple
    import pandas as pd
    import json

    df = None
    for gcs_uri in gcs_sources:
        fname = '/gcs' + '/'.join(gcs_uri.split('/')[1:]) # /gcs/bucket/a/b/c

        if df:
            df = pd.concat(df, pd.read_csv(fname))
        else:
            df = pd.read_csv(fname)

    json_data_raw = df.to_json(orient='records', lines=True)
    json_data_raw_lines = [line for line in json_data_raw.split('\n') if len(line) > 0]

    with open(gcs_groundtruth, 'w') as f:
        for row_str in json_data_raw_lines:
            row = json.loads(row_str)
            target_col = 'Class'
            instance_data = [row[k] for k in row.keys() if k != target_col]
            row_format = {'instance': instance_data, target_col: row[target_col]}
            instance = json.dumps(row_format)
            f.write(instance + '\n')

    t = namedtuple('outputs', ['gcs_output_uris'])
    # transform from /gcs/a/b/c to gs://a/b/c
    gcs_path = 'gs://' + '/'.join(gcs_groundtruth.split('/')[2:])

    return t([gcs_path])
