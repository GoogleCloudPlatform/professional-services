# Copyright 2021 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Helper functions that provide interface to BigQuery client library."""

import logging

from src.common.lib import gcp


def query(query_str):
    """Write rows to bigquery table.

    Args:
        query_str: str, the query to execute.

    Returns: list of google.cloud.bigquery.table.Row objects.
    """
    job = gcp.bigquery_client().query(query_str)
    if job.error_result:
        logging.error('Bigquery: %s', job.errors)
        return []
    # pylint:disable=unnecessary-comprehension
    return [r for r in job.result()]
    # pylint:enable=unnecessary-comprehension


def write_rows(table_id, rows):
    """Write rows to bigquery table.

    Args:
        table_id: str, BQ table id. Ex: project.dataset.table_id
        rows_to_insert: generator obj, that returns list of dicts, row data.
    """
    rows_to_insert = list(rows)
    if not rows_to_insert:
        logging.info('BigQuery: Nothing to insert, empty input passed')
        return

    errors = gcp.bigquery_client().insert_rows_json(table_id, rows_to_insert)
    if errors == []:
        logging.info('BigQuery: Total Rows - %s, Rows Written - %s',
                     len(rows_to_insert), len(rows_to_insert))
    else:
        logging.error('Bigquery: %s', errors)
        logging.error('BigQuery: Total Rows - %s, Rows failed to write - %s',
                      len(rows_to_insert), len(errors))
