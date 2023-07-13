from google_cloud_pipeline_components.types.artifact_types import BQTable
from kfp import dsl
from typing import NamedTuple

from train import IMAGE


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
def reformat_predictions_json(
    #input_predictions_dir: dsl.Input[dsl.Artifact],
    predictions: dsl.OutputPath("Dataset")):

    import glob
    import json
    import os
    import logging

    reformatted_data = []

    gs_uri = 'gs://pbalm-bpi-eu-w4/pipeline_root/xgb-creditcards/353425840351/xgb-creditcards-20230707-1617/artifact-to-uris_-6918721997757218816/gcs_dataset/prediction-creditcards_xgb-2023_07_07T09_47_04_838Z' 
    # input_predictions_dir.uri # gs://...
    dirpath = '/gcs' + '/'.join(gs_uri.split('/')[1:]) # /gcs/bucket/a/b/c

    os.chdir(dirpath)

    i = 0

    for filename in glob.glob("prediction.results-*"):
        with open(filename, 'r') as f:
            for el in f:
                parsed_el = json.loads(el)
                pred = parsed_el['prediction']
                format_pred = f'[{1.0-float(pred)}, {pred}]'
                if i < 5:
                    logging.info(f'{pred} --> {format_pred}')
                    i += 1
                parsed_el['prediction'] = format_pred
                reformatted_data.append(parsed_el)

    os.mkdir(predictions)
    with open(predictions + "/prediction.results-001", 'w') as f:
        for el in reformatted_data:
            f.write(json.dumps(el) + '\n')

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

@dsl.component(base_image=IMAGE, packages_to_install=['pandas_gbq'])
def upload_to_bq(
    project: str,
    location: str,
    dest_dataset_id: str,
    dest_table_id: str, 
    csv_data: dsl.Input[dsl.Dataset], 
    bq_table: dsl.Output[BQTable]) -> NamedTuple('outputs', [('bq_table_uri', str)]):

    from collections import namedtuple
    import logging
    import pandas as pd

    bq_table.metadata["projectId"] = project
    bq_table.metadata["datasetId"] = dest_dataset_id
    bq_table.metadata["tableId"] = dest_table_id
    logging.info(f"BQ table: {bq_table}\nmetadata: {bq_table.metadata}")

    logging.info(f"Reading {csv_data.path}")
    dest_table = f'{dest_dataset_id}.{dest_table_id}'
    logging.info(f"Writing to {dest_table}")

    df = pd.read_csv(csv_data.path)
    df.to_gbq(
        destination_table=f"{dest_table}", 
        project_id=project, 
        location=location)

    t = namedtuple('outputs', ['bq_table_uri'])
    return t(f'bq://{project}.{dest_dataset_id}.{dest_table_id}')
    

