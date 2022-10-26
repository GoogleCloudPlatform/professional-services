#!/usr/bin/env python3
# Copyright 2020 Google LLC
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

"""
The file contains a list of table-related operations.
"""

import logging
import os
from typing import List

from google.cloud import bigquery

from lib.options import BigQueryOptions
from lib.services import Services

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(os.environ.get("LOGLEVEL", "INFO").upper())


def create_table(client: Services.bigquery, options: BigQueryOptions,
                 table_name: str, schema: List[bigquery.SchemaField]):
    """
    Creates tables. Does not throw if it exists.
    """

    logger.debug(f"Creating `{table_name}` table if it does not exists...")

    table_ref = get_table_ref(client, options, table_name)
    table = bigquery.Table(table_ref, schema=schema)

    client.create_table(table, exists_ok=True)

    logger.debug("...done.")


def create_dataset(client: Services.bigquery, options: BigQueryOptions):
    """
    Creates a dataset.
    """
    dataset_ref = get_dataset_ref(client, options)

    logger.info(
        f"Creating dataset '{dataset_ref.dataset_id}' if it does not exist...")

    dataset = bigquery.Dataset(dataset_ref)
    dataset.location = options.dataset_location
    dataset = client.create_dataset(dataset, exists_ok=True)

    logger.info("...done.")


def get_dataset_ref(client: Services.bigquery, options: BigQueryOptions):
    """
    Determine a dataset reference based on given parameters
    """

    return bigquery.dataset.DatasetReference(client.project,
                                             options.dataset_name)


def get_table_identifier(services: Services, options: BigQueryOptions,
                         table_name: str) -> str:
    """
    Generates a table identifier in `PROJECT.DATASET.TABLE` format
    """

    table_ref = get_table_ref(services.bigquery, options, table_name)

    return '.'.join([table_ref.project, table_ref.dataset_id,
                     table_ref.table_id])


def get_table_ref(client: Services.bigquery, options: BigQueryOptions,
                  table_name: str):
    """
    Determine a table reference based on given parameters
    """

    dataset_ref = get_dataset_ref(client, options)
    table_ref = bigquery.table.TableReference(dataset_ref, table_name)

    return table_ref
