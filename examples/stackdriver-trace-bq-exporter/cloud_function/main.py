#Copyright 2019 Google LLC
#
#Licensed under the Apache License, Version 2.0 (the "License");
#you may not use this file except in compliance with the License.
#You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#Unless required by applicable law or agreed to in writing, software
#distributed under the License is distributed on an "AS IS" BASIS,
#WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#See the License for the specific language governing permissions and
#limitations under the License.

"""Exports Stackdriver Trace data to BigQuery for analysis and retention."""

import base64
import json
import logging
import os
import time

from google.api_core.exceptions import ResourceExhausted
from google.cloud import bigquery
from google.cloud import trace_v1

from google.protobuf import timestamp_pb2


# Depending on trace size and Cloud Function memory configuration,
# this value can be adjusted.
_MAX_FILE_SIZE = 120000000
_PROJECT_ID = os.environ['GCP_PROJECT']
_BIG_QUERY_STAGING_FILE_PATH = '/tmp/traces_staging.json'
_TRACE_EXPORT_LOG_FILE_PATH = '/tmp/trace_export_log'
_EXPORT_LOG_TABLE_ID = 'export_log'


def load_trace_data(data, unused_context):
    """Cloud Function entrypoint to be triggered by Pub/Sub.

    Args:
        data (dict): The dictionary with data specific to this type of event.
        context (google.cloud.functions.Context): The Cloud Functions event
            metadata.
    """

    del unused_context # The cloud functions context is unused.
    bq_client = bigquery.Client()
    trace_client = trace_v1.TraceServiceClient()

    try:
        bq_config_string = base64.b64decode(data['data']).decode('utf-8')
        bq_config_dict = json.loads(bq_config_string)
        page_size = bq_config_dict.get('trace_api_page_size', 2000)
        trace_filter = bq_config_dict.get('trace_filter', None)
        trace_table_id = bq_config_dict['bq_destination_table_id']

        min_timestamp = _get_latest_timestamp_from_bq(
            bq_client,
            _PROJECT_ID,
            bq_config_dict['bq_destination_dataset_id'],
            _EXPORT_LOG_TABLE_ID
        )

        _fetch_traces(
            trace_client,
            _PROJECT_ID,
            min_timestamp,
            page_size,
            trace_filter)

        _write_traces_to_bq(
            bq_client,
            bq_config_dict['bq_data_location'],
            bq_config_dict['bq_destination_dataset_id'],
            trace_table_id)

        _write_log_to_bq(
            bq_client,
            bq_config_dict['bq_data_location'],
            bq_config_dict['bq_destination_dataset_id'],
            _EXPORT_LOG_TABLE_ID
        )

    except KeyError:
        logging.error(
            'Required pub/sub message fields not set. Requirements are '
            'bq_destination_dataset_id, bq_data_location, and '
            'bq_destination_table_id.')


def _fetch_traces(
        trace_client, project_id, min_timestamp, page_size, trace_filter):
    """Fetches traces from the Stackdriver trace v1 api and writes them to file.

    Args:
        trace_client (google.cloud.trace_v1.Client): The Stackdriver Trace Api
            client.
        project_id (string): The project id.
        min_timestamp (google.protobuf.timestamp_pb2.Timestamp): A Timestamp
            representing the minimum timestamp to fetch traces for.
        page_size (int): The max number of records to return for each
            page in the response.
        trace_filter (string): The trace api filter. Filter syntax is described
            here https://cloud.google.com/trace/docs/trace-filters.
    """

    last_read_timestamp = min_timestamp
    trace_count = 0
    page_size = page_size
    fetch_completed = False
    sleep_time = 1

    with open(_BIG_QUERY_STAGING_FILE_PATH, 'w') as batch_staging_file:
        while not fetch_completed:
            try:
                request = trace_client.list_traces(
                    project_id,
                    view='COMPLETE',
                    page_size=page_size,
                    start_time=last_read_timestamp,
                    filter_=trace_filter,
                    order_by='start')

                for page in request.pages:
                    for element in page:
                        trace = {
                            'trace_id': element.trace_id,
                            'trace_span': []
                        }

                        trace_count += 1
                        for span in element.spans:
                            trace['trace_span'].append(_parse_span(span))
                            last_read_timestamp = (
                                _determine_last_read_timestamp(
                                    last_read_timestamp, span))
                        batch_staging_file.write(json.dumps(trace) + '\n')

                    # Because /tmp/ file storage utilizes Cloud Functions
                    # memory, a check needs to be performed to ensure the
                    # filesize doesn't cause the function to terminate from
                    # a memory exception.
                    # https://cloud.google.com/functions/docs/concepts/exec#file_system
                    if (os.stat(_BIG_QUERY_STAGING_FILE_PATH).st_size
                            >= _MAX_FILE_SIZE):
                        logging.warning(
                            'File size limit reached, ending fetch.')
                        fetch_completed = True
                        break

                    # Ensure that we don't exaust the api request limit
                    # https://cloud.google.com/trace/docs/quotas
                    time.sleep(sleep_time)

                fetch_completed = True

            except ResourceExhausted as error:
                logging.warning(error)

                # If the page size is too high, a resource exhausted error will
                # occur and require lowering of the page size before retrying.
                if 'Received message larger than max' in error.message:
                    page_size = int(page_size *.75)
                    logging.info(
                        'Resource Exhausted with page size %i, '
                        'reducing page size.', page_size
                    )

                # If pages are read too quickly, a quota exceeded message will
                # be thrown necessitating the increase in sleep time.
                # https://cloud.google.com/trace/docs/quotas
                elif 'Quota exceeded for quota metric' in error.message:
                    time.sleep(10)
                    sleep_time = sleep_time * 2
                    logging.info(
                        'Quota exceeded, increasing sleep to %i', sleep_time
                    )
                else:
                    raise error

    logging.debug('Wrote %d traces to staging file.', trace_count)
    _write_local_export_log_file(
        _TRACE_EXPORT_LOG_FILE_PATH, last_read_timestamp, trace_count)


def _write_local_export_log_file(
        log_path, last_read_timestamp, trace_count):
    """Write function log data to a local file.

    Args:
        log_path (string): The name of the tmp file containing the
            log data.
        last_read_timestamp (google.protobuf.timestamp_pb2.Timestamp): A
            Timestamp representing the last read span timestamp
        trace_count (integer): A count of the number of traces fetched.
    """

    with open(log_path, 'w') as log_file:
        log_entry = {
            'timestamp_micros': last_read_timestamp.ToMicroseconds(),
            'trace_insert_count': trace_count
        }
        log_file.write(json.dumps(log_entry))
        logging.debug('Wrote log entry to staging file.')


def _determine_last_read_timestamp(last_read_timestamp, span):
    """Determines if a span end ts should be used as the last_read_timestamp.

    Args:
        last_read_timestamp (google.protobuf.timestamp_pb2.Timestamp): A
            Timestamp representing the last read span timestamp
        span (google.cloud.trace_v1.TraceSpan): The span to inspect for a
            potential new last read timestamp.

    Returns:
        A Timestamp of the new last_read_timestamp.
    """

    if span.end_time.ToMicroseconds() > last_read_timestamp.ToMicroseconds():
        return span.end_time
    return last_read_timestamp


def _parse_span(span):
    """Parses the span protobuf into a dict that BigQuery can read.

    Args:
        span (google.cloud.trace_v1.TraceSpan): The trace span.

    Returns:
        A dict containing span data to be written to BigQuery.
    """

    span_dict = {
        'name': span.name,
        'parent_span_id': span.parent_span_id,
        'start_time_micros': span.start_time.ToMicroseconds(),
        'end_time_micros': span.end_time.ToMicroseconds(),
        'span_id': span.span_id,
        'milliseconds':
            (span.end_time.ToMicroseconds() -
             span.start_time.ToMicroseconds()) / 1000.0,
        'labels': []
    }

    # Span labels need to be converted from 'label_key': 'label_value' to
    # 'key': 'label_key', 'value': 'label_value'.
    for key, value in span.labels.items():
        span_dict['labels'].append({
            'key': key,
            'value': value
        })

    return span_dict


def _get_latest_timestamp_from_bq(bq_client, project_id, dataset_id, table_id):
    """Fetches the last_read_timestamp from the bq trace logs table.

    Args:
        bq_client (google.cloud.bigquery.Client): The BigQuery Api
            client.
        project_id (string): The project id of the bq trace dataset.
        dataset_id (string): The bq dataset id for the trace data.
        table_id (string): The bq table id for the trace log data.

    Returns:
        A Timestamp protobuf object of the last read timestamp from the
        previous run. If this is the first run, the current timestamp will
        be returned. The returned timestamp will be used as the min timestamp
        filter for the current trace api fetch.
    """

    table_name = '.'.join([project_id, dataset_id, table_id])
    query_job = bq_client.query("""
        WITH last_partition AS (
            SELECT MAX(_PARTITIONTIME) AS partition_time
            FROM `%(table_name)s`
        )
        SELECT MAX(timestamp_micros) AS last_timestamp
        FROM
            `%(table_name)s` AS updates,
            last_partition
        WHERE
            _PARTITIONTIME = last_partition.partition_time""" % {
                'table_name': table_name})
    results = query_job.result()

    for row in results:
        timestamp = timestamp_pb2.Timestamp()
        if row.last_timestamp:
            timestamp.FromMicroseconds(row.last_timestamp)
            logging.debug(
                'Last update timestamp set to %s', timestamp.ToJsonString)
        else:
            # Using ts.GetCurrentTime will throw an error on request so
            # subtracting 1000 milliseconds from current time.
            timestamp.FromMilliseconds(int(round(time.time() * 1000))- 1000)
            logging.info(
                'No timestamp found in BigQuery table, '
                'setting min timestamp to now')
        return timestamp


def _write_log_to_bq(bq_client, data_location, dataset_id, table_id):
    """Writes the execution log data to BigQuery.

    The execution log data contains the number of traces loaded into bq and the
    last read timestamp which is used as the min_timestamp filter for future
    invocations.

    Args:
        bq_client (google.cloud.bigquery.Client): The BigQuery Api
            client.
        project_id (string): The project id of the bq trace dataset.
        dataset_id (string): The bq dataset id for the trace data.
        table_id (string): The bq table id for the trace log data.
    """

    try:
        dataset_ref = bq_client.dataset(dataset_id)
        table_ref = dataset_ref.table(table_id)
        job_config = bigquery.LoadJobConfig()
        job_config.source_format = bigquery.SourceFormat.NEWLINE_DELIMITED_JSON
        job_config.autodetect = False

        with open(_TRACE_EXPORT_LOG_FILE_PATH, 'rb') as source_file:
            job = bq_client.load_table_from_file(
                source_file,
                table_ref,
                location=data_location,
                job_config=job_config
            )
        job.result()
        logging.info('Loaded %s rows into %s:%s',
                     job.output_rows, dataset_id, table_id)
    except Exception as error:
        logging.error('Failed to write export log to BigQuery: %s', error)
        raise


def _write_traces_to_bq(bq_client, data_location, dataset_id, table_id):
    """Writes trace data to a Big Query table.

    Args:
        bq_client (google.cloud.bigquery.Client): The BigQuery Api
            client.
        data_location (string): The location to store data (e.g. US).
        dataset_id (string): The id of the Big Query dataset.
        table_id (string): The id of the Big Query table.
    """

    try:
        dataset_ref = bq_client.dataset(dataset_id)
        table_ref = dataset_ref.table(table_id)
        job_config = bigquery.LoadJobConfig()
        job_config.source_format = bigquery.SourceFormat.NEWLINE_DELIMITED_JSON
        job_config.autodetect = False

        with open(_BIG_QUERY_STAGING_FILE_PATH, 'rb') as source_file:
            job = bq_client.load_table_from_file(
                source_file,
                table_ref,
                location=data_location,
                job_config=job_config
            )

        job.result()
        logging.info('Loaded %s rows into %s:%s',
                     job.output_rows, dataset_id, table_id)
    except Exception as error:
        logging.error('Failed to load trace data into Big Query: %s', error)
        raise
