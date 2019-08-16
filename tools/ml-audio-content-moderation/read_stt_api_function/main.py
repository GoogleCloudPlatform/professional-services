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
import requests
import google.auth
from google.cloud import pubsub, storage
from requests.exceptions import HTTPError
from googleapiclient import discovery
from datetime import datetime

ERROR_STATUS = "error"

def get_finished_stt_operations(job_entry, credentials):
    """Sends HTTP request to get responses from STT.

    Args:
        job_entry: Object of format {'file': file1, 'id': id1}
        credentials: Object of Oauth2 holding credentials

    Returns: JSON response from STT API
    """
    log_message = 'Starting get_finished_stt_operations for {job}'
    logging.info(log_message.format(job=job_entry))
    endpoint = 'https://speech.googleapis.com/v1/operations/{id}'
    endpoint = endpoint.format(id=job_entry['id'])
    token = credentials.token
    headers = {
        'Authorization': 'Bearer {token}'.format(token=token),
        'Content-Type': 'application/json; charset=utf-8'
    }
    response_json = None
    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()
        response_json = response.json()
        logging.info("Response json: {}".format(response_json))
    except HTTPError as http_err:
        logging.error("HTTP error occurred: {}".format(http_err))
    except Exception as err:
        logging.error("Python Exception occurred: {}".format(err))
    return response_json


def parse_transcript_output(response):
    """Reads STT API Output and constructs JSON object with relevant fields.

    Args:
      response: Object holding output from STT API

    Returns:
      Array of objects containing STT output
    """
    log_message = 'Starting parse_transcript_output with {}'
    logging.info(log_message.format(json.dumps(response)))
    stt_result = []
    if 'error' in response:
        logging.error('Error received: '.format(json.dumps(response['error'])))
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


def push_id_to_pubsub(project, publisher_client, job_entry):
    """Pushes unfinished ID back into PubSub topic until operation is complete.

    Args:
      publisher_client: Object representing PubSub client API
      project: String representing GCP project ID
      job_entry: Object holding operation ID and audio file name

    Returns:
      None; Logs message to Stackdriver.
    """
    logging.info('Starting push_id_to_pubsub with {} and {}'.format(project,
                                                                    job_entry))
    topic_name = os.environ.get('topic_name')
    topic_path = publisher_client.topic_path(project, topic_name)
    message = job_entry['id']
    publisher_client.publish(topic_path,
                             message.encode("utf-8"),
                             operation_name=job_entry['id'],
                             audio_file_name=job_entry['file'],
                             pipeline_start_time=job_entry['pipeline_start_time'])
    log_message = 'Repushed STT {op_id} for {file} to PubSub'
    logging.info(log_message.format(op_id=job_entry['id'],
                                    file=job_entry['file']))


def format_time(seconds):
    """Formats timestamp in seconds to string of format HH:MM:SS.

    Args:
      seconds: String representing timestamp of text in seconds.

    Returns:
       String of formatted timestamp in HH:MM:SS
    """
    seconds = float(seconds.split('s')[0])
    mins, sec = divmod(seconds, 60)
    hours, mins = divmod(mins, 60)
    return '{:02d}:{:02d}:{:02d}'.format(int(hours), int(mins), int(sec))


def move_file(client, source_bucket_name, destination_bucket_name, file_name):
    """Moves GCS file from one bucket to another.

    Args:
        client: Object representing GCS client.
        source_bucket_name: String of name of bucket where object is now.
        destination_bucket_name: String of name of bucket to move object to.
        file_name: String of name of file that is being moved.

    Returns:
        None; Logs message to Stackdriver.
    """
    log_message = 'Starting move file {file} from {source} to {destination}.'
    logging.info(log_message.format(file=file_name, source=source_bucket_name,
                                    destination=destination_bucket_name))
    source_bucket = client.get_bucket(source_bucket_name)
    destination_bucket = client.get_bucket(destination_bucket_name)
    blob = source_bucket.blob(file_name)
    try:
        source_bucket.copy_blob(blob, destination_bucket=destination_bucket)
        log_message = 'Successfully moved {file} to {destination}'
        logging.info(log_message.format(file=file_name,
                                        destination=destination_bucket_name))

    except Exception as e:
        logging.error('Moving the file {file} failed.'.format(file=file_name))
        logging.error(e)


def delete_file(client, bucket_name, file_name):
    """Deletes file from specified bucket.

    Args:
        client: Object representing GCS client
        bucket_name: String holding name of bucket.
        file_name: String of name of file to delete.

    Returns:
        None; Logs message to Stackdriver.
    """
    try:
        bucket = client.get_bucket(bucket_name)
        bucket.delete_blob(file_name)
        log_message = 'Deleted {file} from {bucket}'.format(file=file_name,
                                                            bucket=bucket_name)
        logging.info(log_message)

    except Exception as e:
        error_message = 'Deleting {file} from {bucket} failed'
        logging.error(error_message.format(file=file_name, bucket=bucket_name))
        logging.error(e)


def upload_audio_transcription(client, bucket_name, json, audio_name):
    """Uploads JSON file to GCS.

    Args:
        client: Object representing Python GCS Client
        bucket_name: String holding name of bucket to store file
        json: JSON object holding output from STT API
        audio_name: String of audio file name

    Returns:
        None; Logs message to Stackdriver
    """
    logging.info('Starting store_file with {} and {}'.format(json,
                                                             audio_name))
    bucket = client.get_bucket(bucket_name)
    destination = bucket.blob(audio_name)
    try:
        destination.upload_from_string(json, content_type='application/json')
        log_message = 'Uploaded transcript of {file} to {bucket}'
        logging.info(log_message.format(file=audio_name, bucket=bucket_name))

    except Exception as e:
        logging.error(e)


def does_subscription_exist(project, subscriber_client, subscription_path):
    """Check if PubSub subscription has been created.

    Args:
        subscriber_client: Object representing PubSub client
        project: String of GCP project id
        subscription_path: String representing topic path in format
            project/{proj}/subscriptions/{subscription}

    Returns:
        Boolean denoting if subscription to topic exists.
    """
    logging.info('Checking if subscription {} exists.'.format(subscription_path))
    project_path = subscriber_client.project_path(project)
    subscription_list = list(subscriber_client.list_subscriptions(project_path))
    return subscription_path in [sub.name for sub in subscription_list]


def get_received_msgs_from_pubsub(subscriber_client, project):
    """Retreieves receives messages in PubSub topic.

    Args:
        subscriber_client: Object representing PubSub subscriber client
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
        if not does_subscription_exist(project, subscriber_client,
                                       subscription_path):
            log_message = 'Subscription {sub} does not exist yet. Creating now.'
            logging.info(log_message.format(sub=subscription_path))
            subscriber_client.create_subscription(subscription_path, topic_path)
        response = subscriber_client.pull(subscription_path, max_messages=50)
        return list(response.received_messages)
    except Exception as e:
        logging.error(e)


def get_stt_ids_from_msgs(subscriber_client, project, received_messages):
    """Creates array of objects with STT API operation IDs and file names.

    Args:
        subscriber_client: Object representing PubSub subscriber client
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


def write_processing_time_metric(project, pipeline_start_time):
    """Writes custom metrics to Stackdriver.

    Args:
        pipeline_start_time: Datetime object holding current time in seconds.
        processing_status: either SUCCESS or ERROR

    Returns:
         None; Logs message to Stackdriver.
    """
    try:
        logging.info(
            'write_processing_time_metric: {},{}'.format(
                project, pipeline_start_time
            )
        )
        function_name = os.environ.get('FUNCTION_NAME')
        logging.info('function_name: {}'.format(function_name))
        end_time = datetime.now()
        end_time_str = end_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        logging.info('end+time_str: {}'.format(end_time_str))
        start_time = datetime.fromtimestamp(pipeline_start_time)
        logging.info('start_time: {}'.format(start_time))
        total_processing_time = end_time - start_time
        logging.info('total_processing_time: {}'.format(total_processing_time))

        monitoring_service = discovery.build(
            serviceName='monitoring', version= 'v3', cache_discovery=False
        )
        project_name = 'projects/{project_id}'.format(
            project_id=project
        )
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

        logging.info("monitoring request: {}".format(json.dumps(time_series)))

        response = monitoring_service.projects().timeSeries().create(
            name=project_name,
            body=time_series
        ).execute()
        logging.info('Response: {}'.format(response))

    except Exception as e:
        logging.error('Writing custom metric failed.')
        logging.error(e)


def main(data, context):
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
                    move_file(gcs_client, staging_bucket_name,
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
                        upload_audio_transcription(gcs_client, transcription_bucket,
                                                json.dumps(json_for_gcs),
                                                job['file'])
                        move_file(gcs_client, staging_bucket_name,
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
                        move_file(gcs_client, staging_bucket_name,
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