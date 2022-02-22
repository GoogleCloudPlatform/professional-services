# Copyright 2019 Google Inc. All Rights Reserved.
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
# ==============================================================================

"""BigQuery client for connection to the BigQuery service"""

from __future__ import absolute_import
from __future__ import print_function

from typing import Text
import re
import logging
from google.cloud import bigquery

BQ_TABLE_NAME_REGEX = r'^([^.]+)\.([^.]+)\.([^.]+)$'


class BqClient:
  """Create and maintain BigQuery connection, provide helper functions"""

  def __init__(self, key_file: Text = None):
    """Create a BigQuery client.

    Args:
        key_file: (string), path of the key file
    """
    if key_file is None:
      self._bq_client = bigquery.Client()
    else:
      self._bq_client = bigquery.Client.from_service_account_json(
          key_file)

  def run_query(self, query: Text):
    """Run a SQL query against the BigQuery engine.

    Args:
        query: (string), a string containing the SQL query to run.

    Returns:
        Iterator[google.cloud.bigquery.table.Row]
        A list containing the rows returned by the query execution.
    """
    logging.info('Running the query through BigQuery:')
    logging.info(query)
    query_job = self._bq_client.query(query)
    rows = query_job.result()
    return rows

  @staticmethod
  def _get_table_name_components(canonical_table_name):
    match = re.search(BQ_TABLE_NAME_REGEX, canonical_table_name)
    return match.group(1), match.group(2), match.group(3)

  def get_table_columns(self, table_name):
    """Read the schema of a BigQuery table."""
    (project, dataset, table) = self._get_table_name_components(table_name)
    dataset_ref = self._bq_client.dataset(dataset, project=project)
    table_ref = dataset_ref.table(table)
    table = self._bq_client.get_table(table_ref)
    return table.schema
