"""Helper functions for BigQuery."""
# Copyright 2019 Google LLC
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
#
#    This script is a proof of concept and is not meant to be fully functional
#    nor feature-complete. Error checking and log reporting should be adjusted
#    based on the user's needs. Script invocation is still in its infancy.
#
#    Please, refer to README.md file for instructions.

import datetime
import logging

from retrying import retry

from google.cloud import bigquery

logger = logging.getLogger(__name__)

# Name of the dataset in BigQuery. The dataset will be automatically created.
# Change it if you already have a dataset with the same name.
DATASET_NAME = "app_scopes"
# Determines where BigQuery data is saved (US, EU)
DATASET_LOCATION = "EU"
# Maximum number of rows that can be inserted into BQ in one operation.
# Currently, the hard limit for the python client is 10000.
MAX_BQ_INSERT_SIZE = 10000


def bq_create_client(project, credentials):
    """Creates BigQuery client.

  Args:
    project: GCP project where to create the BigQuery dataset
    credentials: credentials of the service account used for access

  Returns:
    Instance of the BigQuery client.
  """
    return bigquery.Client(project=project, credentials=credentials)


def bq_create_dataset(bq_client):
    """Creates the BigQuery dataset.

  If the dataset already exists, the existing dataset will be returned.
  Dataset will be create in the location specified by DATASET_LOCATION.

  Args:
    bq_client: BigQuery client

  Returns:
    BigQuery dataset that will be used to store data.
  """
    dataset_id = "{}.{}".format(bq_client.project, DATASET_NAME)
    dataset = bigquery.Dataset(dataset_id)
    dataset.location = DATASET_LOCATION
    dataset = bq_client.create_dataset(dataset, exists_ok=True)
    return dataset


def bq_create_table(bq_client, dataset):
    """Creates a table in the supplied dataset, with a unique name based on time.

  Args:
    bq_client: BigQuery client
    dataset: BigQuery dataset where table must be created

  Returns:
    Table that will be used to store data.
  """
    schema = [
        bigquery.SchemaField("user", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("clientId", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("scope", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("displayText", "STRING", mode="REQUIRED"),
    ]

    table_id = \
        "{}.{}.{}_{}".format(
            bq_client.project, dataset.dataset_id,
            "app_scopes",
            datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f"))

    table = bigquery.Table(table_id, schema=schema)
    table = bq_client.create_table(table)
    logger.info("Created table %s", table.full_table_id)
    return table


def print_bq_insert_errors(rows, errors):
    """Prints errors that occurred during the insertions of rows.

  Parses the results of the BigQuery insert and prints a human readable
  representation of the errors, suppressing noise by removing the rows that
  were not inserted due to errors in other rows, and adding information about
  the data that generated actual errors.

  Args:
    rows: original data, used to print the data that caused an error
    errors: error dictionary as returned by the BigQuery client
  """
    logger.error("The following errors have been detected:")
    stopped_rows = 0
    for item in errors:
        index = item["index"]
        row_errors = item["errors"]
        for error in row_errors:
            if error["reason"] != "stopped":
                logger.error("Row number: %d, Row data: %s, Error: %s", index,
                             rows[index], error)
            else:
                stopped_rows += 1
    if stopped_rows:
        logger.error(
            "Also, %d rows were stopped (not inserted) due to the errors "
            "above.", stopped_rows)


@retry(wait_exponential_multiplier=1000,
       wait_exponential_max=60000,
       stop_max_attempt_number=10)
def _insert_rows(bq_client, table, rows):
    return bq_client.insert_rows(table, rows)


def _batch_insert(bq_client, table, rows):
    """Inserts rows into a BigQuery table in batches of MAX_BQ_INSERT_SIZE each.

  Args:
    bq_client: BigQuery client
    table: table where rows must be inserted
    rows: a list of rows to insert
  """
    total_rows = len(rows)
    inserted_rows = 0
    batch = 1
    logger.info("Inserting %d rows into table %s", total_rows,
                table.full_table_id)
    while inserted_rows < total_rows:
        start = (batch - 1) * MAX_BQ_INSERT_SIZE
        end = batch * MAX_BQ_INSERT_SIZE
        batch_rows = rows[start:end]
        inserted_rows += len(batch_rows)
        errors = _insert_rows(bq_client, table, batch_rows)
        if errors:
            print_bq_insert_errors(batch_rows, errors)
            logger.error(
                "The program has been terminated due to BigQuery insertion "
                "errors.")
            exit(1)
        else:
            logger.info("Batch %d: inserted rows %d to %d", batch, start + 1,
                        min(end, len(rows)))
        batch += 1
    logger.info("All rows inserted.")


def bq_insert_rows(bq_client, table, rows):
    """Inserts rows into a BigQuery table.

  Args:
    bq_client: BigQuery client
    table: table where rows must be inserted
    rows: a list of rows to insert
  """
    _batch_insert(bq_client, table, rows)
