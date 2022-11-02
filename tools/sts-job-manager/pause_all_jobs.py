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
Pauses all running STS operations.
This can be used as an emergency stop.
"""

import json
import logging
import os

from constants.status import STATUS, sts_operation_status_to_table_status
from lib.options import STSJobManagerOptions
from lib.services import Services

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(os.environ.get("LOGLEVEL", "INFO").upper())


def pause_all_running_jobs(services: Services):
    """
    Pauses all running transfer operations.
    """
    logger.info('Pausing all running jobs...')

    job_filter = json.dumps({"project_id": services.bigquery.project})

    request = services.sts.transferOperations().list(
        name='transferOperations', filter=job_filter, pageSize=256)

    count = 0

    while request is not None:
        response = request.execute()

        if not response:
            break

        for operation in response['operations']:
            operation_name = operation['metadata']['name']
            operation_status = operation['metadata']['status']

            status = sts_operation_status_to_table_status(operation_status)

            if status == STATUS.RUNNING:
                logger.info(f'Pausing `{operation_name}`...')

                operation_request = services.sts.transferOperations().pause(
                    name=operation_name, body={})
                operation_request.execute()

                logger.info(f'...paused `{operation_name}`.')

                count += 1

        request = services.sts.transferOperations().list_next(
            previous_request=request, previous_response=response)

    logger.info(f'Paused all running jobs. Count: {count}')


def main(options: STSJobManagerOptions):
    """
    The main function.
    """
    services = Services()
    pause_all_running_jobs(services)


if __name__ == "__main__":
    options = STSJobManagerOptions()

    main(options)
