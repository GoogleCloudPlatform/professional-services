# Copyright 2019 Google LLC.
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

"""Utilities module to interact with BigQuery.

Example use:
  # Create a BigQuery client
  bq_client = bigquery.BqClient()

  # Create the fully qualified name of a BigQuery table
  bq_client.build_table_uri('my_project', 'my_dataset', 'my_table')

  # Run a query
  rows = bq_client.run_query('SELECT ...')

  # Export the content of a BigQuery table in CSV format
  bq_client.export_table_as_csv('my_project.my_dataset.my_table')

  # Delete a table
  bq_client.delete_table('my_project.my_dataset.my_table')

  # Count the number of rows in a table
  num_rows = bq_client.count_lines_in_table('my_project', 'my_dataset', 'my_table')

"""

from __future__ import absolute_import
from __future__ import print_function

import logging
from google.cloud import bigquery


class BqClient:
    """Helper class to run BigQuery queries and export BigQuery tables.

    Attributes:
       _bq_client: Client of the BigQuery API.
    """

    def __init__(self, key_file=None):
        """Create a BigQuery client."""
        if key_file is None:
            self._bq_client = bigquery.Client()
        else:
            self._bq_client = bigquery.Client.from_service_account_json(key_file)

    @staticmethod
    def build_table_uri(project, dataset, table):
        """Create the fully qualified name of a BigQuery table.

        The fully qualified table name has the format [PROJECT_ID].[DATASET].[TABLE_NAME].

        Args:
            project: A string containing the GCP project id in which resides the dataset containg
            the table.
            dataset: A string containing the BigQuery dataset in which resides the table.
            table: A string containing the table name.

        Returns:
            A string containig the fully qualified name of a BigQuery table.
        """
        return '{}.{}.{}'.format(project, dataset, table)

    def run_query(self, query):
        """Run a SQL query against the BigQuery engine.

        Args:
            query: A string containing the SQL query to run.

        Returns:
            A list containing the rows returned by the query execution.
        """
        logging.debug('Running the query')
        logging.debug(query)
        query_job = self._bq_client.query(query)
        rows = query_job.result()
        return rows

    def export_table_as_csv(self, project, dataset, table, destination_uri):
        """Export a BigQuery table to Google Cloud Storage.

        Args:
            project: A string containing the Google Cloud project where the BigQuery dataset
            containing the table is located.
            dataset: A string containing the BigQuery dataset in which the table is located.
            table: A string containing the name of the table to export.
            destination_uri: A string containing the Google Cloud Stiorage path where to export the
            table.
        """
        dataset_ref = self._bq_client.dataset(dataset, project=project)
        table_ref = dataset_ref.table(table)
        job_config = bigquery.job.ExtractJobConfig()
        job_config.print_header = False
        extract_job = self._bq_client.extract_table(table_ref,
                                                    destination_uri,
                                                    job_config=job_config)
        extract_job.result()  # Waits for job to complete.

    def delete_table(self, table):
        """Delete a BigQuery table.

        Args:
            table: A string containing the fully qualified BigQuery name of the table to delete.
        """
        self._bq_client.delete_table(table)

    def count_lines_in_table(self, project, dataset, table):
        """Count the total number of lines in a table.

        Args:
            project: A string containing the Google Cloud project where the BigQuery dataset
            containing the table is located.
            dataset: A string containing the name of the BigQuery dataset containing the table.
            table: A string containing the name of the BigQuery table.
        """
        dataset_ref = self._bq_client.dataset(dataset, project=project)
        table_ref = dataset_ref.table(table)
        bq_table = self._bq_client.get_table(table_ref)
        return bq_table.num_rows
