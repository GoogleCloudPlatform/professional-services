# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import json
import re
import time

from google.cloud import bigquery as bq


def bq_key_column_histogram(key_cols, input_table, min_date="2000-01-01"):
    """
    Args:
        key_cols: list of key cols to collect hashes from.

    Returns:
        sql: A sql query to be run against a BigQuery input_table.
    """
    hashes = [
        'FARM_FINGERPRINT(CAST({field_name} AS STRING)) AS {field_name}'.
        format(field_name=key) for key in key_cols
    ]

    sql = """
      SELECT
        COUNT(*) AS frequency,
        {hashes}
      FROM
        `{input_table}`
      WHERE
        date >= "{min_date}"
      GROUP BY
        {group_by}
    """.format(hashes=', '.join(hashes),
               input_table=input_table,
               min_date=min_date,
               group_by=', '.join(key_cols))

    return sql


def profile_distribution(input_table, output_table, key_cols):
    """
    Args:
        input_table: (str) A BigQuery project.dataset.input_table reference.
        key_cols: (str) A comma separated list of field names for which joins
            will be benchmarked on. We will collect hashes of these values.
    """
    input_project, input_dataset, input_table_id = input_table.split('.')

    bq_cli = bq.Client(project=input_project)
    dataset_ref = bq_cli.dataset(input_dataset)
    input_table_ref = dataset_ref.table(input_table_id)

    print(input_table)
    output_project, output_dataset, output_table_id = output_table.split('.')

    bq_cli = bq.Client(project=output_project)
    dataset_ref = bq_cli.dataset(output_dataset)
    output_table_ref = dataset_ref.table(output_table_id)

    # Validate input_table exists.
    bq_input_table = bq_cli.get_table(input_table_ref)

    # Get fields in a list of dicts.
    schema = [field.to_api_repr() for field in bq_input_table.schema]

    sql = bq_key_column_histogram(key_cols=key_cols, input_table=input_table)

    # Define query job config.
    query_job_config = bq.job.QueryJobConfig(
        allow_large_results=True,
        create_disposition=bq.job.CreateDisposition.CREATE_IF_NEEDED,
        write_disposition=bq.job.WriteDisposition.WRITE_TRUNCATE,
        destination=output_table_ref,
        use_legacy_sql=False)

    # Define query API request.
    query_job = bq_cli.query(sql, job_config=query_job_config)

    print(('running query: \n {}'.format(sql)))
    t0 = time.time()
    # Synchronous API call to execute query.
    res = query_job.result()
    t1 = time.time()
    print(('query ran in {} seconds.'.format(t1 - t0)))

    count = res.num_results
    print(('resulting histogrram table has {} results.'.format(count)))


def bq_standard_sql_table_ref_type(
    input_table,
    pattern=re.compile(r'[a-zA-Z0-9\-]+.[a-zA-Z0-9\-]+.[a-zA-Z0-9\-]+')):
    """"
    This function checks the format of the user entered BigQuery input_table.
    """
    if not pattern.match(input_table):
        raise argparse.ArgumentTypeError
    return input_table


def main(argv=None):
    parser = argparse.ArgumentParser()

    parser.add_argument('--input_table',
                        dest='input_table',
                        required=True,
                        help='Table in BigQuery to query against in '
                        '<project>.<dataset>.<input_table> form.')
    parser.add_argument('--output_table',
                        dest='output_table',
                        required=True,
                        help='Table in BigQuery to query against in '
                        '<project>.<dataset>.<input_table> form.')
    parser.add_argument('--key_cols',
                        dest='key_cols',
                        required=True,
                        help='A comma separated list of the column names '
                        'of key columns.')

    known_args = parser.parse_args(argv)

    known_args.key_cols = known_args.key_cols.split(',')

    if len(known_args.key_cols) > 3:
        raise argparse.ArgumentError('Currently only 3 key columns supported. '
                                     'Found {} key columns.'.format(
                                         len(key_cols)))

    profile_distribution(input_table=known_args.input_table,
                         output_table=known_args.output_table,
                         key_cols=known_args.key_cols)


if __name__ == "__main__":
    start = time.time()
    main()
    end = time.time()
    print(('input_table profiled in {} seconds.'.format(end - start)))
