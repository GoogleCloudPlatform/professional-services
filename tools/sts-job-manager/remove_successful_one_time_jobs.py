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
A tool for removing successful one-time jobs.
"""

import json
import logging
import os
import time

from constants.status import STATUS, sts_operation_status_to_table_status
from lib.services import Services

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(os.environ.get("LOGLEVEL", "INFO").upper())


def determine_if_all_operations_were_successful(job_name: str,
                                                services: Services):
    """
    Determines if all operations for a given job were successful.
    """

    job_filter = json.dumps({
        "project_id": services.bigquery.project,
        "job_names": [job_name]
    })

    request = services.sts.transferOperations().list(
        name='transferOperations', filter=job_filter, pageSize=256)

    while request is not None:
        response = request.execute()

        if not response:
            break

        for operation in response['operations']:
            operation_status = operation['metadata']['status']

            status = sts_operation_status_to_table_status(operation_status)

            if status != STATUS.DONE:
                return False

        request = services.sts.transferOperations().list_next(
            previous_request=request, previous_response=response)

    return True


def delete_all_successful_one_time_jobs(services: Services):
    """
    Removes all successful one-time jobs.
    """
    logger.info('Removing all successful jobs...')

    job_filter = json.dumps({"project_id": services.bigquery.project})

    request = services.sts.transferJobs().list(filter=job_filter, pageSize=256)

    count = 0

    while request is not None:
        response = request.execute()

        if not response:
            break

        for job in response['transferJobs']:
            name = job['name']
            schedule = job['schedule']

            # determine if one-time operation
            for key in ['year', 'month', 'day']:
                if schedule['scheduleStartDate'][key] != \
                        schedule['scheduleEndDate'][key]:
                    logger.info(f'Skipping non one-time job `{name}`')
                    continue

            if not determine_if_all_operations_were_successful(name, services):
                logger.info(
                    f'Skipping job with non-complete or failed ops: `{name}`')
                continue

            logger.info(f'Removing `{name}`...')

            operation_request_body = {
                'projectId': services.bigquery.project,
                'transferJob': {
                    'status': 'DELETED'
                }
            }

            operation_request = services.sts.transferJobs().patch(
                jobName=name, body=operation_request_body)
            operation_request.execute()

            logger.info(f'...removed `{name}`.')

            count += 1

            # https://cloud.google.com/storage-transfer/quotas
            # - Maximum requests per 100 seconds per user: 1000
            # - Maximum requests per 100 seconds per project: 1000
            # Taking the time between each call into account,
            # we can perform an exact count-based delay
            if count % 1000 == 0:
                logger.debug('Sleeping a bit to avoid quota limit...')
                time.sleep(100)
                logger.debug('...waking up.')

        request = services.sts.transferJobs().list_next(
            previous_request=request, previous_response=response)

    logger.info(f'...removed all successful jobs. Count: {count}')


def main():
    """
    The main function.
    """
    services = Services()

    delete_all_successful_one_time_jobs(services)


if __name__ == "__main__":
    main()
