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
The STS Job Manager.
This tool creates STS Jobs and records each job's state.
"""

import argparse
import json
import logging
import os
import time
from datetime import datetime
from typing import Dict, List, Optional

from google.cloud import bigquery, monitoring_v3

from constants import schemas
from constants.status import (KNOWN_STATUSES, STATUS,
                              sts_operation_status_to_table_status)
from lib.options import STSJobManagerOptions
from lib.services import Services
from lib.table_util import get_table_identifier, get_table_ref

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(os.environ.get("LOGLEVEL", "INFO").upper())


class Job:
    def __init__(self, data):
        self.prefix: str = data.prefix
        self.status: str = data.status
        self.job_name: str = data.job_name
        self.last_updated: datetime = data.last_updated
        self.operation_results: Optional[dict] = getattr(
            data, 'operation_results', None)


def run_query(query: str, params: Optional[List], services: Services,
              options: STSJobManagerOptions):
    """
    Runs a given query with optional params.
    """
    job_config = bigquery.QueryJobConfig()
    job_config.query_parameters = params if params else []

    return services.bigquery.query(
        query,
        location=options.bigquery_options.dataset_location,
        job_config=job_config
    )


def get_jobs_by_prefix(services: Services, options: STSJobManagerOptions) \
        -> Dict[str, Job]:
    """
    Retrieves jobs from the database and returns them in a key-value format
    where the `key` is the prefix and the value is a `Job` object.
    """
    table = get_table_identifier(
        services, options.bigquery_options,
        options.bigquery_options.table_name['job'])

    # API does not support table names for preparameterized queries
    # https://cloud.google.com/bigquery/docs/parameterized-queries
    query = f"""
    SELECT *
    FROM `{table}`
    """  # nosec

    results = run_query(query, None, services, options)

    prefixToStatus: Dict[str, Job] = {}

    for row in results:
        prefixToStatus[row.prefix] = Job(row)

    return prefixToStatus


def set_prefixes_to_status(prefixes: List[str], status: str,
                           services: Services, options: STSJobManagerOptions):
    """
    Sets a list of prefixes to a given status in the database.
    """
    logger.info(f'Updating {len(prefixes)} prefixes to `{status}` status')

    table = get_table_identifier(
        services, options.bigquery_options,
        options.bigquery_options.table_name['job'])

    # API does not support table names for preparameterized queries
    # https://cloud.google.com/bigquery/docs/parameterized-queries
    query = f"""
    UPDATE `{table}`
    SET status = @status, last_updated = CURRENT_TIMESTAMP()
    WHERE prefix IN UNNEST(@prefixes)
    """

    params = [
        bigquery.ScalarQueryParameter("status", "STRING", status),
        bigquery.ArrayQueryParameter("prefixes", "STRING", prefixes)
    ]

    run_query(query, params, services, options).result()


def set_job_name(prefix: str, job_name: str, services: Services,
                 options: STSJobManagerOptions):
    """
    Set's a prefix's transfer operation job name in the database.
    """
    logger.info(
        f'Updating the prefix `{prefix}` with job name `{job_name}`...')

    table = get_table_identifier(
        services, options.bigquery_options,
        options.bigquery_options.table_name['job'])

    # API does not support table names for preparameterized queries
    # https://cloud.google.com/bigquery/docs/parameterized-queries
    query = f"""
    UPDATE `{table}`
    SET job_name = @job_name, last_updated = CURRENT_TIMESTAMP()
    WHERE prefix = @prefix
    """

    params = [
        bigquery.ScalarQueryParameter("prefix", "STRING", prefix),
        bigquery.ScalarQueryParameter("job_name", "STRING", job_name)
    ]

    run_query(query, params, services, options).result()

    logger.info(
        f'...updated the prefix `{prefix}` with job name `{job_name}`.')


def insert_history(rows: List[object], services: Services,
                   options: STSJobManagerOptions):
    """
    Inserts a list of rows into the job history table.
    Each object provided in the list matches the `JOB_HISTORY` schema
    """
    logger.info(f'Inserting {len(rows)} row(s) into the history table')

    table_ref = get_table_ref(
        services.bigquery, options.bigquery_options,
        options.bigquery_options.table_name['job_history'])

    errors = services.bigquery.insert_rows(
        table_ref, rows, selected_fields=schemas.JOB_HISTORY)

    if errors:
        logger.error('errors were found:')
        for row in errors:
            logger.error(row)

        raise Exception('Error inserting one or more rows')


def get_latest_operation_by_prefix(services: Services,
                                   options: STSJobManagerOptions):
    """
    Gets the latest transfer operation cooresponding to a prefix.
    Returns a key-value object where the key is a prefix and the value is a
    [TransferOperation](https://cloud.google.com/storage-transfer/docs/reference/rest/v1/transferOperations#resource-transferoperation).
    """
    job_filter = json.dumps({"project_id": services.bigquery.project})

    request = services.sts.transferOperations().list(
        name='transferOperations', filter=job_filter, pageSize=256)

    latest_operation_by_prefix: Dict[str, dict] = {}
    operation_to_prefix: Dict[str, str] = {}

    while request is not None:
        response = request.execute()

        if not response:
            break

        for operation in response['operations']:
            transfer_spec = operation['metadata']['transferSpec']

            if 'objectConditions' not in transfer_spec:
                continue

            object_conditions = transfer_spec['objectConditions']

            if 'includePrefixes' not in object_conditions:
                continue

            if 'gcsDataSource' not in operation['metadata']['transferSpec']:
                continue

            if 'gcsDataSink' not in operation['metadata']['transferSpec']:
                continue

            if options.source_bucket != operation['metadata']['transferSpec'][
                    'gcsDataSource']['bucketName']:
                continue

            if options.destination_bucket != operation['metadata'][
                    'transferSpec']['gcsDataSink']['bucketName']:
                continue

            for prefix in object_conditions['includePrefixes']:
                operation_to_set_for_prefix = None

                if prefix not in latest_operation_by_prefix:
                    # The prefix does not have an operation, let's use this one
                    operation_to_set_for_prefix = operation
                elif 'endTime' not in operation['metadata'] or \
                        'endTime' not in latest_operation_by_prefix[prefix][
                            'metadata']:

                    # if end time is not available, use the start time
                    if operation['metadata']['startTime'] > \
                            latest_operation_by_prefix[prefix]['metadata'][
                                'startTime']:
                        latest_operation_by_prefix[prefix] = operation
                elif operation['metadata']['endTime'] > \
                        latest_operation_by_prefix[prefix]['metadata'][
                            'endTime']:
                    # This operation is newer than the assigned operation
                    operation_to_set_for_prefix = operation

                # Set the operation for the prefix
                if operation_to_set_for_prefix:
                    # unreference existing operation to prefix, if exists
                    operation_to_prefix.pop(operation['name'], None)

                    latest_operation_by_prefix[prefix] = operation
                    operation_to_prefix[operation['name']] = prefix

        request = services.sts.transferOperations().list_next(
            previous_request=request, previous_response=response)

    # If the latest transferOperation is from a deleted job, we should not
    # consider the operation for state management
    deleted_job_request = services.sts.transferJobs().list(
        filter=json.dumps({
            "project_id": services.bigquery.project,
            "jobStatuses": ["DELETED"]
        }), pageSize=256)

    while deleted_job_request is not None:
        deleted_job_response = deleted_job_request.execute()

        if not deleted_job_response:
            break

        for transferJob in deleted_job_response['transferJobs']:
            if 'latestOperationName' not in transferJob:
                continue

            operation_to_remove = transferJob['latestOperationName']

            prefix = operation_to_prefix.pop(operation_to_remove, None)

            if prefix:
                latest_operation_by_prefix.pop(prefix, None)

        deleted_job_request = services.sts.transferJobs().list_next(
            previous_request=deleted_job_request,
            previous_response=deleted_job_response)

    return latest_operation_by_prefix


def manage_state(services: Services, options: STSJobManagerOptions):
    """
    Gathers all prefix information from both STS and the database, then updates
    the corresponding rows where necessary.
    """
    logger.info('Checking state...')

    # jobs from the database
    jobs = get_jobs_by_prefix(services, options)

    # transfer operations from STS
    latest_operation_by_prefix = get_latest_operation_by_prefix(
        services, options)

    history_rows: List[object] = []
    job_status_to_update: Dict[str, List[str]] = {
        STATUS.DONE: [],
        STATUS.ERROR: [],
        STATUS.PAUSED: [],
        STATUS.RUNNING: [],
        STATUS.WAITING: []
    }

    def append_history(job: Job, operation_results: object):
        history_rows.append({
            'prefix': job.prefix,
            'status': job.status,
            'job_name': job.job_name,
            'operation_results': json.dumps(operation_results),
            'timestamp': datetime.now()
        })

    for prefix in jobs:
        if prefix in latest_operation_by_prefix:
            operation_status = \
                latest_operation_by_prefix[prefix]['metadata']['status']
            expected_status = jobs[prefix].status
            actual_status = sts_operation_status_to_table_status(
                operation_status)
            actual_job_name = latest_operation_by_prefix[prefix]['name']

            if actual_status != expected_status:
                # Capture the history for running jobs
                logger.info(
                    f'Status for prefix `{prefix}` has changed from \
                        `{expected_status}` to `{actual_status}`')

                jobs[prefix].status = actual_status

                job_status_to_update[actual_status].append(prefix)

                append_history(
                    jobs[prefix], latest_operation_by_prefix[prefix])
            elif actual_status == STATUS.RUNNING:
                # Capture the history for running jobs
                append_history(
                    jobs[prefix], latest_operation_by_prefix[prefix])

            if actual_job_name != jobs[prefix].job_name:
                set_job_name(prefix, actual_job_name, services, options)

                # sleep to avoid rate limiting
                # https://cloud.google.com/bigquery/quotas#standard_tables
                time.sleep(2)

            # Assign the latest `operation_results`
            jobs[prefix].operation_results = latest_operation_by_prefix[prefix]

    if history_rows:
        insert_history(history_rows, services, options)

    for status in job_status_to_update:
        if job_status_to_update[status]:
            set_prefixes_to_status(
                job_status_to_update[status], status, services, options)

            # sleep to avoid rate limiting
            # https://cloud.google.com/bigquery/quotas#standard_tables
            time.sleep(2)

    logger.info('...state is up to date.')

    return jobs


def run_jobs(count: int, services: Services, options: STSJobManagerOptions):
    """
    Pulls pending prefixes from the database and either create a new transfer
    operation or resume an existing one.

    The `manage_state` function will handle the updates in the job statuses;
    this keeps DML usage to a minimum
    """
    table = get_table_identifier(
        services, options.bigquery_options,
        options.bigquery_options.table_name['job'])

    # API does not support table names for preparameterized queries
    # https://cloud.google.com/bigquery/docs/parameterized-queries
    query = f"""
    SELECT *
    FROM `{table}`
    WHERE status IN UNNEST(@statuses)
    LIMIT @count
    """  # nosec

    pending_statuses = [STATUS.WAITING, STATUS.PAUSED]
    tryable_statuses = [STATUS.WAITING, STATUS.PAUSED, STATUS.ERROR]

    statuses = pending_statuses if options.no_retry_on_job_error \
        else tryable_statuses

    params = [
        bigquery.ArrayQueryParameter("statuses", "STRING", statuses),
        bigquery.ScalarQueryParameter("count", "INT64", count),
    ]

    results = run_query(query, params, services, options)

    for row in results:
        job = Job(row)

        if job.status == STATUS.PAUSED:
            operation_request = services.sts.transferOperations().resume(
                name=job.job_name, body={})
            operation_request.execute()

            logger.info(f'Resumed `{job.prefix}` (job name: {job.job_name}).')
        else:
            utc_now = datetime.utcnow()

            if job.status == STATUS.ERROR:
                logger.error(
                    f'Retrying errored prefix `{job.prefix}`. \
                        Previous failed job: {job.job_name}')

            transfer_job_body = {
                'description': f'Created via STS Job Manager - {job.prefix}',
                'project_id': services.bigquery.project,
                'transfer_spec': {
                    'object_conditions': {
                        'include_prefixes': [
                            job.prefix
                        ]
                    },
                    'transfer_options': {
                        'overwrite_objects_already_existing_in_sink':
                        options.overwrite_dest_objects
                    },
                    'gcs_data_source': {
                        'bucket_name': options.source_bucket
                    },
                    'gcs_data_sink': {
                        'bucket_name': options.destination_bucket
                    }
                },
                'schedule': {
                    "schedule_start_date": {
                        "year": utc_now.year,
                        "month": utc_now.month,
                        "day": utc_now.day
                    },
                    "schedule_end_date": {
                        "year": utc_now.year,
                        "month": utc_now.month,
                        "day": utc_now.day
                    }
                },
                'status': 'ENABLED'
            }

            request = services.sts.transferJobs().create(
                body=transfer_job_body)
            response = request.execute()

            logger.info(
                f'Created new transfer job for `{job.prefix}`: ({response}).')

    return True


def determine_stalled_jobs(jobs: Dict[str, Job], last_jobs: Dict[str, Job]) \
        -> List[Job]:
    stalled_jobs: List[Job] = []

    for prefix in jobs:
        if prefix not in last_jobs:
            continue

        current_job = jobs[prefix]
        last_job = last_jobs[prefix]

        if current_job.status != STATUS.RUNNING or \
                last_job.status != STATUS.RUNNING:
            continue

        if not current_job.operation_results or not last_job.operation_results:
            continue

        current_counters = \
            current_job.operation_results['metadata']['counters']
        last_counters = last_job.operation_results['metadata']['counters']

        if current_counters and last_counters:
            has_changed = False

            for key in current_counters:
                if key not in last_counters or \
                        current_counters[key] != last_counters[key]:
                    has_changed = True
                    break

            if not has_changed:
                stalled_jobs.append(current_job)

    return stalled_jobs


def manage_jobs(jobs: Dict[str, Job], last_jobs: Dict[str, Job],
                services: Services, options: STSJobManagerOptions):
    """
    Determines the number of new operations to spin-up, then spins them up.
    """
    def num_new_jobs_to_run():
        pending_job_count = 0
        current_running_jobs = 0

        for prefix in jobs:
            if jobs[prefix].status == STATUS.RUNNING:
                current_running_jobs += 1
            elif jobs[prefix].status == STATUS.WAITING or \
                    jobs[prefix].status == STATUS.PAUSED:
                pending_job_count += 1
            elif not options.no_retry_on_job_error and \
                    jobs[prefix].status == STATUS.ERROR:
                pending_job_count += 1

        if options.allow_new_jobs_when_stalled:
            stalled_count = len(determine_stalled_jobs(jobs, last_jobs))
            current_running_jobs = max(0, current_running_jobs - stalled_count)

        max_number_jobs_available_to_run = \
            options.max_concurrent_jobs - current_running_jobs
        double_current_job_count = current_running_jobs * 2

        if not pending_job_count:
            logger.info('No jobs available to run')
            return 0
        elif current_running_jobs > options.max_concurrent_jobs:
            logger.info(f'Will not create any new jobs - too many are running \
                (current = {current_running_jobs}, \
                max = {options.max_concurrent_jobs})')
            return 0
        elif current_running_jobs == 0 and \
                max_number_jobs_available_to_run > 0:
            logger.info(
                'Will prepare initial job, as no other jobs are running')
            return 1
        else:
            logger.info('Ramping up job count')
            return min(max_number_jobs_available_to_run,
                       double_current_job_count)

    logger.info('Managing jobs...')

    count = num_new_jobs_to_run()

    if not count:
        logger.info('...no new jobs to run.')
        return

    logger.info(f'...spinning up to {count} new job(s)...')

    run_jobs(count, services, options)

    logger.info('...done running jobs.')


def publish_heartbeat(jobs: Dict[str, Job], last_jobs: Dict[str, Job],
                      services: Services, options: STSJobManagerOptions,
                      monitoring_types=monitoring_v3.types):
    """
    Publishes status heartbeats
    """

    def publish_timeseries_heartbeat(name: str, value: int, services: Services,
                                     project_name: str,
                                     monitoring_types=monitoring_v3.types):
        logger.info(f'Preparing heartbeat for `{name}` (value: {value})...')

        series = monitoring_types.TimeSeries()
        series.metric.type = name

        point = series.points.add()
        point.value.int64_value = value
        point.interval.end_time.seconds = int(time.time())

        services.monitoring.create_time_series(project_name, [series])

        logger.info(f'...published heartbeat `{name}`.')

    p = options.stackdriver_project if options.stackdriver_project \
        else services.bigquery.project

    monitoring_project_name = services.monitoring.project_path(p)

    logger.info(f'Preparing heartbeats for `{monitoring_project_name}`...')

    status_count: Dict[str, int] = {}
    stalled_count = 0

    # Ensure known statuses are published, even if 0
    for status in KNOWN_STATUSES:
        status_count[status] = 0

    # Gather raw status counts
    for prefix in jobs:
        job = jobs[prefix]

        # status could be unknown
        if job.status not in status_count:
            status_count[job.status] = 0

        status_count[job.status] += 1

    for status in status_count:
        name = f'custom.googleapis.com/sts_job_manager/status/{status}'
        count = status_count[status]

        publish_timeseries_heartbeat(
            name, count, services, monitoring_project_name, monitoring_types)

    for job in determine_stalled_jobs(jobs, last_jobs):
        logger.warn(f'Job `{job.job_name}` appears to be stalled.')
        stalled_count += 1

    # Publish stalled count
    stalled_metric = 'custom.googleapis.com/sts_job_manager/metrics/stalled'
    publish_timeseries_heartbeat(
        stalled_metric, stalled_count, services, monitoring_project_name,
        monitoring_types)

    logger.info('...done publishing heartbeats.')


def interval(services: Services, options: STSJobManagerOptions):
    """
    The main state and job running interval.
    This runs the main lifecycle of this application.
    """
    interval_count = 0
    last_state_check = 0.0
    last_manage_jobs = 0.0
    last_jobs: Dict[str, Job] = {}
    jobs: Dict[str, Job] = {}

    while True:
        logger.info(f'Running main interval #{interval_count}...')
        start = time.time()

        job_timeout = start - last_manage_jobs >= options.job_interval
        metrics_timeout = start - last_state_check >= options.metrics_interval

        if job_timeout or metrics_timeout:
            last_jobs = jobs
            jobs = manage_state(services, options)
            last_state_check = time.time()

        if job_timeout:
            manage_jobs(jobs, last_jobs, services, options)

            # Regather metrics
            jobs = manage_state(services, options)

            last_manage_jobs = time.time()

        if options.publish_heartbeat:
            try:
                publish_heartbeat(jobs, last_jobs, services, options)
            except Exception as e:
                logger.error('Failed to publish heartbeat:')
                logger.exception(e)

        delta = time.time() - start + options.sleep_timeout

        logger.info(f'...done running main interval #{interval_count}.\n')
        if delta > 0:
            time.sleep(delta)

        interval_count += 1


def main(options: STSJobManagerOptions):
    """
    The main function.
    """
    logger.info('Initializing STS Job Manager.')

    services = Services()

    interval(services, options)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)

    options = STSJobManagerOptions()
    options.setup_arg_parser(parser)

    args = parser.parse_args()
    options.assign_from_parsed_args(args)

    main(options)
