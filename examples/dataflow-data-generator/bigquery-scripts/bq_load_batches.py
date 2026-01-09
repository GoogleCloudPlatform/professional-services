# Copyright 2018 Google Inc.
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

import argparse
import json
import os
from math import floor
import pandas as pd
from google.cloud import bigquery as bq
"""
This script is meant to orchestrate BigQuery load jobs of many
json files on Google Cloud Storage. It ensures that each load
stays under the 15 TB per load job limit. It operates on the
output of gcloud storage ls --long.

Args:
    --project: GCP project ID
    --dataset: BigQuery datset ID containing the table your wish
        to populate.
    --table: BigQuery table ID of the table you wish to populate
    --sources_file: This is the output of gcloud storage ls --long with the URI of
        each file that you would like to load
    --create_table: Boolean specifying if this script should create
        the destination table.
    --schema_file: Path to a json file defining the destination BigQuery
        table schema.
    --partitioning_column: name of the field for date partitioning.
    --max_bad_records: Number of permissible bad records per load job.

Example Usage:

gcloud storage ls --long gs://<bucket>/path/to/json/<file prefix>-*.json >> ./files2load.txt

# This is for an existing bigquery table.
python file_15TB_batcher.py --project=<project> \
--dataset=<dataset_id> \
--table=<table_id> \
--partitioning_column=date \
--sources_file=files_to_load.txt

"""


def create_bq_table(bq_cli,
                    dataset_id,
                    table_id,
                    schema_file,
                    partition_column=None):
    """
    This function creates a BigQuery Table with the schema, and optionally
    partioning on teh specified column.

    Args:
        bq_cli: (bigquery.Client)
        table_id: (str) The name for the BigQuery table to create.
        schema: (str) path to a json file defining the BigQuery schema.
        partition_column: (str) the field name for date partitioning.
    Retruns:
        table: (bigquery.table.Table)
    """
    # Initialize the Table object.
    dataset = bq_cli.dataset(dataset_id)
    table_ref = dataset.table(table_id)

    # Read the schema file.
    with open(schema_file, 'rb') as sf:
        schema_dict = json.load(sf)
    parsed_schema = [
        bq.schema.SchemaField.from_api_repr(field) for field in schema_dict
    ]

    table = bq.table.Table(table_ref, schema=parsed_schema)
    # Specify the partioning logic.
    partitioning = bq.table.TimePartitioning()
    partitioning.field = partition_column
    table.time_partitioning = partitioning

    # API call to create the empty table.
    bq_cli.create_table(table)

    return table


def parse_gsutil_long_output_file(filename):
    """
    This function reads the specified file (which should be the output of
    gcloud storage ls --long) and batches the URI's up into batches <= 15TB

    Args:
        filename: (str) path to input file.

    Returns:
        batches: (Array of list of str) Each list in this array
            contains GCS URIs to be loaded in a single job.
    """

    # 15TB per BQ load job.
    MAX_BATCH_BYTES = 15 * 10**12
    # read output of gcloud storage ls --long
    df = pd.read_csv(filename,
                     delim_whitespace=True,
                     header=None,
                     skipfooter=1,
                     usecols=[0, 2],
                     names=['bytes', 'filename'],
                     engine='python')
    # df = df.rename({0:'bytes', 2:'filename'}, axis='columns')

    # sort files by size
    df.sort_values(by='bytes', inplace=True)

    df['cum_sum_bytes'] = df['bytes'].cumsum()

    df['batch_num'] = df['cum_sum_bytes'] // MAX_BATCH_BYTES

    batches = []
    total_batches = int(df['batch_num'].max() + 1)
    for i in range(total_batches):
        batches.append(list(df[df['batch_num'] == i]['filename']))
    return batches


def submit_jobs(bq_cli, job_config, dataset_id, table_id, batches):
    """
    Helper function to submit a single load job for each batch.
    These jobs will run in parallel.

    Args:
        bq_cli: (bigquery.Client) the client to use for loading.
        job_config: (bigquery.job.LoadConfig) specifies file type
            write disposition etc.
        dataset_id: (str) destination BigQuery dataset id.
        table_id: (str) destination BigQuery table id.
        batches: (Array of list of str) Each list in this array
            contains GCS URIs to be loaded in a single job.
    """

    dataset = bq_cli.dataset(dataset_id)
    table_ref = dataset.table(table_id)
    for (i, batch) in enumerate(batches):
        print(('running load job {} of {}.'.format(i, len(batches))))
        # API call.
        bq_cli.load_table_from_uri(source_uris=batch,
                                   destination=table_ref,
                                   job_config=job_config)


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--project',
                        dest='project',
                        required=True,
                        help='GCP Project ID.')
    parser.add_argument('--dataset',
                        dest='dataset',
                        required=True,
                        help='BigQuery Dataset ID.')
    parser.add_argument('--table',
                        dest='table',
                        required=True,
                        help='BigQuery Table ID.')
    parser.add_argument('--sources_file',
                        dest='sources_file',
                        required=True,
                        help='A local file containing the'
                        'output of gcloud storage ls --long.')
    parser.add_argument('--create_table',
                        dest='create_table',
                        action='store_true')
    parser.add_argument('--schema_file',
                        dest='schema_file',
                        required=False,
                        default=None)
    parser.add_argument('--partition_column',
                        dest='partition_column',
                        required=False,
                        default=None)
    parser.add_argument('--max_bad_records',
                        dest='max_bad_records',
                        required=False,
                        default=1)
    parser.add_argument('--source_format',
                        dest='source_format',
                        required=False,
                        default='AVRO')

    known_args, _ = parser.parse_known_args(argv)

    bq_cli = bq.Client(project=known_args.project)
    job_config = bq.job.LoadJobConfig()
    job_config.write_disposition = bq.WriteDisposition.WRITE_APPEND
    job_config.source_format = known_args.source_format
    job_config.max_bad_records = known_args.max_bad_records

    if known_args.create_table:
        if known_args.schema_file:
            create_bq_table(bq_cli,
                            known_args.dataset,
                            known_args.table,
                            known_args.schema_file,
                            partition_column=known_args.partition_column)
        else:
            raise argparse.ArgumentError('Cannot create table without schema.')

    batches = parse_gsutil_long_output_file(filename=known_args.sources_file)

    submit_jobs(bq_cli=bq_cli,
                job_config=job_config,
                dataset_id=known_args.dataset,
                table_id=known_args.table,
                batches=batches)


if __name__ == "__main__":
    main()
