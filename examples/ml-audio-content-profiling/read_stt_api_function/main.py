#!/usr/bin/env python3

# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Creates logic for read_stt_api Cloud Function."""

import json
import logging
import os
from datetime import datetime
from typing import Optional
import requests
import google.auth
from google.cloud import pubsub, storage
from requests.exceptions import HTTPError
from googleapiclient import discovery

ERROR_STATUS = "error"


def get_finished_stt_operations(job_entry: dict,
                                credentials: google.auth.credentials.Credentials) -> dict:
    """Sends HTTP request to get responses from STT.

    Args:
        job_entry: Dict in format {'file': file1, 'id': id1}
        credentials: google.auth.Credentials of Oauth2 holding credentials

    Returns: Dict response from STT API
    """
    log_message = f'Starting get_finished_stt_operations for {job_entry}'
    logging.info(log_message)
    endpoint = f'https://speech.googleapis.com/v1/operations/{job_entry["id"]}'
    token = credentials.token
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json; charset=utf-8'
    }
    response_json = None
    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()
        response_json = response.json()
        logging.info(f'Response json: {response_json}')
    except HTTPError as http_err:
        logging.error(f'HTTP error occurred: {http_err}')
    except Exception as err:
        logging.error(f'Python Exception occurred: {err}')
    return response_json


def parse_transcript_output(response: dict) -> list:
    """Reads STT API Output and constructs JSON object with relevant fields.

    Args:
      response: Dict holding output from STT API

    Returns:
      Array of dict objects containing STT output
    """
    log_message = f'Starting parse_transcript_output with {json.dumps(response)}'
    logging.info(log_message)
    stt_result = []
    if 'error' in response:
        logging.error(f'Error received: {json.dumps(response["error"])}')
    else:
        for result in response['response']['results']:
            if 'transcript' in result['alternatives'][0]:
                transcript = result['alternatives'][0]['transcript']
                start_time = result['alternatives'][0]['words'][0]['startTime']
                last_word = len(result['alternatives'][0]['words'])
                end_time = result['alternatives'][0]['words'][last_word - 1]['endTime']

                stt_result.append({
                    'transcript': transcript,
                    'start_time': format_time(start_time),
                    'end_time': format_time(end_time)
                })
    return stt_result


def push_id_to_pubsub(project: str,
                      publisher_client: google.cloud.pubsub.PublisherClient,
                      job_entry: dict) -> None:
    """Pushes unfinished ID back into PubSub topic until operation is complete.

    Args:
      publisher_client: google.cloud.pubsub.PublisherClient
      project: String representing GCP project ID
      job_entry: Dict holding operation ID and audio file name

    Returns:
      None; Logs message to Stackdriver.
    """
    logging.info(f'Starting push_id_to_pubsub with {project} and {job_entry}')
    topic_name = os.environ.get('topic_name')
    topic_path = publisher_client.topic_path(project, topic_name)
    message = job_entry['id']
    publisher_client.publish(topic_path,
                             message.encode("utf-8"),
                             operation_name=job_entry['id'],
                             audio_file_name=job_entry['file'],
                             pipeline_start_time=job_entry['pipeline_start_time'])
    log_message = (f'Repushed STT {job_entry["id"]} for {job_entry["file"]} to '
                   f'PubSub')
    logging.info(log_message)


def format_time(seconds: str) -> str:
    """Formats timestamp in seconds to string of format HH:MM:SS.

    Args:
      seconds: String representing timestamp of text in seconds.

    Returns:
       String of formatted timestamp in HH:MM:SS
    """
    seconds = float(seconds.split('s')[0])
    mins, sec = divmod(seconds, 60)
    hours, mins = divmod(mins, 60)
    return f'{int(hours):02d}:{int(mins):02d}:{int(sec):02d}'


def copy_file(client: google.cloud.storage.Client,
              source_bucket_name: Optional[str],
              destination_bucket_name: Optional[str], file_name: str) -> None:
    """Copies GCS file from one bucket to another.

    Args:
        client: google.cloud.storage.Client
        source_bucket_name: String of name of bucket where object is now.
        destination_bucket_name: String of name of bucket to copy object to.
        file_name: String of name of file that is being copied.

    Returns:
        None; Logs message to Stackdriver.
    """
    log_message = (f'Starting copy file {file_name} from {source_bucket_name} '
                   f'to {destination_bucket_name}.')
    logging.info(log_message)
    source_bucket = client.get_bucket(source_bucket_name)
    destination_bucket = client.get_bucket(destination_bucket_name)
    blob = source_bucket.blob(file_name)
    try:
        source_bucket.copy_blob(blob, destination_bucket=destination_bucket)
        logging.info(f'Successfully copied {file_name} to '
                     f'{destination_bucket_name}')

    except Exception as e:
        logging.error(f'Copying the file {file_name} failed.')
        logging.error(e)


def delete_file(client: google.cloud.storage.Client, bucket_name: Optional[str],
                file_name: str) -> None:
    """Deletes file from specified bucket.

    Args:
        client: google.cloud.storage.Client
        bucket_name: String holding name of bucket.
        file_name: String of name of file to delete.

    Returns:
        None; Logs message to Stackdriver.
    """
    try:
        bucket = client.get_bucket(bucket_name)
        bucket.delete_blob(file_name)
        logging.info(f'Deleted {file_name} from {bucket_name}')

    except Exception as e:
        logging.info(f'Deleting {file_name} from {bucket_name} failed')
        logging.error(e)


def upload_audio_transcription(client: google.cloud.storage.Client,
                               bucket_name: Optional[str],
                               transcription: str,
                               audio_name: str) -> None:
    """Uploads JSON file to GCS.

    Args:
        client: google.cloud.storage.Client
        bucket_name: String holding name of bucket to store file
        transcription: String holding output from STT API
        audio_name: String of audio file name

    Returns:
        None; Logs message to Stackdriver.
    """
    logging.info(f'Starting store_file with {transcription} and {audio_name}')
    bucket = client.get_bucket(bucket_name)
    destination = bucket.blob(audio_name)
    try:
        destination.upload_from_string(transcription,
                                       content_type='application/json')
        logging.info(f'Uploaded transcript of {audio_name} to {bucket_name}')

    except Exception as e:
        logging.error(e)


def check_subscription_exists(project: str,
                              subscriber_client: google.cloud.pubsub.SubscriberClient,
                              subscription_path: str) -> bool:
    """Check if PubSub subscription exists.

    Args:
        subscriber_client: google.cloud.pubsub.SubscriberClient
        project: String of GCP project id
        subscription_path: String representing topic path in format
            project/{proj}/subscriptions/{subscription}

    Returns:
        Boolean denoting if subscription to topic exists.
    """
    logging.info(f'Checking if subscription {subscription_path} exists.')
    project_path = subscriber_client.project_path(project)
    subscription_list = list(subscriber_client.list_subscriptions(project_path))
    return subscription_path in [sub.name for sub in subscription_list]


def get_received_msgs_from_pubsub(subscriber_client: google.cloud.pubsub.SubscriberClient,
                                  project: str) -> list:
    """Retrieves receives messages in PubSub topic.

    Args:
        subscriber_client: google.cloud.pubsub.SubscriberClient
        project: String holding GCP project id

    Returns:
        Array of PubSub messages holding message metadata
    """
    logging.info('Starting get_received_msgs_from_pubsub')
    try:
        subscription_name = os.environ.get('subscription_name')
        topic_name = os.environ.get('topic_name')
        topic_path = subscriber_client.topic_path(project, topic_name)
        subscription_path = subscriber_client.subscription_path(project,
                                                                subscription_name)
        if not check_subscription_exists(project, subscriber_client,
                                         subscription_path):
            logging.info(f'Subscription {subscription_path} does not exist yet.'
                         f' Creating now.')
            subscriber_client.create_subscription(subscription_path, topic_path)
        response = subscriber_client.pull(subscription_path, max_messages=50)
        return list(response.received_messages)
    except Exception as e:
        logging.error(e)


def get_stt_ids_from_msgs(subscriber_client: google.cloud.pubsub.SubscriberClient,
                          project: str,
                          received_messages: list) -> list:
    """Creates array of objects with STT API operation IDs and file names.

    Args:
        subscriber_client: google.cloud.pubsub.SubscriberClient
        project: String holding GCP project id
        received_messages: List of PubSub message objects

    Returns:
        Array of objects in format [{'file': file1,
                                    'id': id1}]
    """
    logging.info('Starting to get_stt_ids_from_msgs')
    try:
        file_id_map = [{'file': msg.message.attributes.get('audio_file_name'),
                        'id': msg.message.attributes.get('operation_name'),
                        'pipeline_start_time': msg.message.attributes.get('pipeline_start_time')}
                       for msg in received_messages]
        if received_messages:
            ack_ids = [msg.ack_id for msg in received_messages]
            subscription_name = os.environ.get('subscription_name')
            subscription_path = subscriber_client.subscription_path(project,
                                                                    subscription_name)
            subscriber_client.acknowledge(subscription_path, ack_ids)
        else:
            logging.info('No new messages were found in PubSub queue.')
        return file_id_map

    except Exception as e:
        logging.error('Getting STT ids from PubSub received messages failed.')
        logging.error(e)


def write_processing_time_metric(project: str,
                                 pipeline_start_time: float) -> None:
    """Writes custom metrics to Stackdriver.

    Args:
        project: String holding GCP project id
        pipeline_start_time: Float holding current time in seconds.

    Returns:
         None; Logs message to Stackdriver.
    """
    try:
        logging.info(f'write_processing_time_metric: {project},'
                     f'{pipeline_start_time}')
        function_name = os.environ.get('FUNCTION_NAME')
        logging.info(f'function_name: {function_name}')
        end_time = datetime.now()
        end_time_str = end_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        logging.info(f'end+time_str: {end_time_str}')
        start_time = datetime.fromtimestamp(pipeline_start_time)
        logging.info(f'start_time: {start_time}')
        total_processing_time = end_time - start_time
        logging.info(f'total_processing_time: {total_processing_time}')

        monitoring_service = discovery.build(
            serviceName='monitoring', version='v3', cache_discovery=False
        )
        project_name = f'projects/{project}'
        time_series = [
            {
                "metric": {
                    "type": "custom.googleapis.com/functions/audioprocessing/processingtime",
                    "labels": {
                        "function_name": function_name,
                        "processing_status": ERROR_STATUS
                    }
                },
                "resource": {
                    "type": "global"
                },
                "points": [
                    {
                        "interval": {
                            "endTime": end_time_str
                        },
                        "value": {
                            "doubleValue": total_processing_time
                        }
                    }
                ]
            }
        ]

        logging.info(f'monitoring request: {json.dumps(time_series)}')

        response = monitoring_service.projects().timeSeries().create(
            name=project_name,
            body=time_series
        ).execute()
        logging.info(f'Response: {response}')

    except Exception as e:
        logging.error('Writing custom metric failed.')
        logging.error(e)

# pylint: disable=unused-argument
def main(data: dict, context) -> None:
    """Background Cloud Function to be triggered by Pub/Sub.
    Args:
         event (dict):  The dictionary with data specific to this type of
         event. The `data` field contains the PubsubMessage message. The
         `attributes` field will contain custom attributes if there are any.
         context (google.cloud.functions.Context): The Cloud Functions event
         metadata. The `event_id` field contains the Pub/Sub message ID. The
         `timestamp` field contains the publish time.
    """
    try:
        credentials, project = google.auth.default()
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        gcs_client = storage.Client()
        publisher_client = pubsub.PublisherClient()
        subscriber_client = pubsub.SubscriberClient()
        received_messages = get_received_msgs_from_pubsub(subscriber_client,
                                                          project)
        file_job_id_map = get_stt_ids_from_msgs(subscriber_client, project,
                                                received_messages)
        staging_bucket_name = os.environ.get('staging_audio_bucket')
        error_bucket_name = os.environ.get('error_audio_bucket')
        processed_bucket_name = os.environ.get('processed_audio_bucket')

        if file_job_id_map:
            for job in file_job_id_map:
                stt_response = get_finished_stt_operations(job, credentials)
                # Speech-to-text returned an empty response.
                if stt_response is None:
                    error_message = '''
                                    Speech-to-text API request returned empty
                                    response.'''
                    logging.error(error_message)
                    copy_file(gcs_client, staging_bucket_name,
                              error_bucket_name, job['file'])
                    delete_file(gcs_client, staging_bucket_name, job['file'])
                    write_processing_time_metric(project,
                                                 job['pipeline_start_time'])
                # Speech-to-text finished transcribing the file.
                elif 'done' in stt_response:
                    stt_json = parse_transcript_output(stt_response)
                    json_for_gcs = {
                        'pipeline_start_time': job['pipeline_start_time'],
                        'json_payload': stt_json
                    }

                    if stt_json:
                        transcription_bucket = os.environ.get('transcription_bucket')
                        upload_audio_transcription(gcs_client,
                                                   transcription_bucket,
                                                   json.dumps(json_for_gcs),
                                                   job['file'])
                        copy_file(gcs_client, staging_bucket_name,
                                  processed_bucket_name, job['file'])
                        delete_file(gcs_client, staging_bucket_name,
                                    job['file'])
                    else:
                        error_message = '''
                                        STT API request completed. Parsing the
                                        output returned a blank response.
                                        Transcription may be blank, indicating no
                                        audio found.'''
                        logging.error(error_message)
                        copy_file(gcs_client, staging_bucket_name,
                                  error_bucket_name, job['file'])
                        delete_file(gcs_client, staging_bucket_name,
                                    job['file'])
                        write_processing_time_metric(project,
                                                     job['pipeline_start_time'])
                # Speech-to-text is still transcribing the file. Repush id.
                else:
                    push_id_to_pubsub(project, publisher_client, job)
        else:
            logging.info('Not processing any messages')

    except Exception as e:
        logging.error(e)
