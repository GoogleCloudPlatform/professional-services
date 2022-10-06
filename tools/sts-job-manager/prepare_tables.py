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
Creates the dataset and tables if they do not exist.
Loads the job table with a list of prefixes.
"""

import argparse
import json
import logging
import os
from datetime import datetime

from constants import schemas
from constants.status import STATUS
from lib.options import PrepareTableOptions
from lib.services import Services
from lib.table_util import create_dataset, create_table, get_table_ref

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(os.environ.get("LOGLEVEL", "INFO").upper())


def create_job_table(client: Services.bigquery, options: PrepareTableOptions):
    """
    Creates the job table.
    """
    table_name = options.bigquery_options.table_name['job']

    create_table(client, options.bigquery_options, table_name, schemas.JOB)


def create_job_history_table(client: Services.bigquery,
                             options: PrepareTableOptions):
    """
    Creates the job history table.
    """
    table_name = options.bigquery_options.table_name['job_history']

    create_table(client, options.bigquery_options,
                 table_name, schemas.JOB_HISTORY)


def load_job_table(client: Services.bigquery, options: PrepareTableOptions):
    """
    Loads a job table with data from a JSON file.
    This JSON data is simply an array of prefixes (`Array<string>`).
    """

    if not options.job_prefix_source_file:
        return

    table_name = options.bigquery_options.table_name['job']

    logger.info(
        f"Loading '{table_name}' with prefixes from \
            '{options.job_prefix_source_file}'...")

    rows = []

    with open(options.job_prefix_source_file) as j:
        data = json.load(j)

        for prefix in data:
            rows.append({
                "prefix": prefix,
                "status": STATUS.WAITING,
                "last_updated": datetime.now()
            })

    table_ref = get_table_ref(client, options.bigquery_options, table_name)

    errors = client.insert_rows(table_ref, rows, selected_fields=schemas.JOB)

    if errors:
        logger.error('errors were found:')
        for row in errors:
            logger.error(row)

        raise Exception('Error inserting one or more rows')

    logger.info('...done.')


def main(options: PrepareTableOptions):
    """
    The main function.
    """
    services = Services()

    create_dataset(services.bigquery, options.bigquery_options)
    create_job_table(services.bigquery, options)
    create_job_history_table(services.bigquery, options)
    load_job_table(services.bigquery, options)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)

    options = PrepareTableOptions()
    options.setup_arg_parser(parser)

    args = parser.parse_args()
    options.assign_from_parsed_args(args)

    main(options)
