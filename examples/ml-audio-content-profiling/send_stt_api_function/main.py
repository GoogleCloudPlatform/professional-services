#!/usr/bin/env python3
#
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
"""Creates logic for send_stt_api Cloud Function."""


import json
import logging
import os
from datetime import datetime
from typing import Optional, Any
from google.cloud import pubsub
from google.cloud.speech_v1 import enums
from google.cloud import storage
import google.auth
import google.auth.transport.requests
import requests
from requests.exceptions import HTTPError


def create_config_object(content_type: str) -> dict:
    """Creates config object to send required params to STT API.

    Args:
      content_type: String from GCS representing type of content i.e. 'audio/flac'

    Returns:
      Dict in format {'language_code': string
                        'enable_word_time_offsets': boolean
                        'enable_automatic_punctuation': boolean
                        'encoding': enums.RecognititionConfig.AudioEncoding
                        }
    """
    logging.info('Starting create_config_object')
    encoding_mapping = {
        'flac': enums.RecognitionConfig.AudioEncoding.FLAC,
        'wav': enums.RecognitionConfig.AudioEncoding.LINEAR16
    }

    config_object = {
        'language_code': 'en-US',
        'enable_word_time_offsets': True,
        'enable_automatic_punctuation': True,
        'model': 'video'
    }
    try:
        if '/' in content_type:
            content_encoding_type = content_type.split('/')[1]
            if content_encoding_type in encoding_mapping:
                config_object['encoding'] = encoding_mapping[content_encoding_type]
            else:
                # pylint: disable=line-too-long
                config_object['encoding'] = enums.RecognitionConfig.AudioEncoding.ENCODING_UNSPECIFIED
        else:
            config_object['encoding'] = enums.RecognitionConfig.AudioEncoding.ENCODING_UNSPECIFIED
        return config_object

    except Exception as e:
        logging.error('Creating config object failed.')
        logging.error(e)


def call_stt_api(gcs_uri: str, config_object: dict,
                 credentials: google.auth.credentials.Credentials) -> Optional[Any]:
    """Sends HTTP Post Request to Speech-to-Text API

    Args:
        gcs_uri: String holding URI where audio file is stored in GCS.
        config_object: Object holding config information for
        credentials: Object holding Oauth2 token for default App Engine account

    Returns:
        String holding name of operation in STT API Queue
    """

    audio_object = {'uri': gcs_uri}
    endpoint = 'https://speech.googleapis.com/v1/speech:longrunningrecognize'
    body = json.dumps({
        'config': config_object,
        'audio': audio_object
    })
    token = credentials.token
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json; charset=utf-8'
    }
    logging.info(f'Body: {body}')
    operation_name = None
    try:
        response = requests.post(endpoint, data=body, headers=headers)
        logging.info(f'Response: {response}')
        response_json = response.json()
        logging.info(f'Response json: {response_json}')
        response.raise_for_status()
        if 'name' in response_json:
            operation_name = response_json['name']
    except HTTPError as http_err:
        logging.error(f'HTTP error occurred: {http_err}')
        raise Exception
    except Exception as err:
        logging.error(f'Python Exception occurred: {err}')
    return operation_name


def publish_operation_to_pubsub(publisher_client: google.cloud.pubsub.PublisherClient,
                                project: str, operation_name: str,
                                file_name: str) -> None:
    """Pushes message to PubSub topic holding STT Operation ID and file name.

    Args:
        publisher_client: google.cloud.pubsub.PublisherClient
        project: String representing GCP project ID
        operation_name: String of operation ID for STT API
        file_name: String

    Returns:
        None; Logs message to Stackdriver
    """
    try:
        topic_name = os.environ.get('topic_name')
        topic_path = publisher_client.topic_path(project, topic_name)
        message = operation_name
        start_time = str(datetime.now())
        publisher_client.publish(topic_path,
                                 message.encode('utf-8'),
                                 operation_name=operation_name,
                                 audio_file_name=file_name,
                                 pipeline_start_time=start_time)
        log_message = f'Pushed STT {operation_name} for {file_name} to PubSub'
        logging.info(log_message)

    except Exception as e:
        logging.error('Publishing message to PubSub failed.')
        logging.error(e)


def copy_file(client: google.cloud.storage.Client, source_bucket_name: str,
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
    log_message = (f'Starting copy file {file_name} from {source_bucket_name}'
                   f'to {destination_bucket_name}.')
    logging.info(log_message)
    source_bucket = client.get_bucket(source_bucket_name)
    destination_bucket = client.get_bucket(destination_bucket_name)
    blob = source_bucket.blob(file_name)
    try:
        source_bucket.copy_blob(blob, destination_bucket=destination_bucket)
        log_message = (f'Successfully copied {file_name} to '
                       f'{destination_bucket_name}')
        logging.info(log_message)

    except Exception as e:
        logging.error(f'Moving the file {file_name} failed.')
        logging.error(e)


def delete_file(client: google.cloud.storage.Client, bucket_name: str,
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
        log_message = f'Deleted {file_name} from {bucket_name}'
        logging.info(log_message)

    except Exception as e:
        error_message = f'Deleting {file_name} from {bucket_name} failed'
        logging.error(error_message)
        logging.error(e)


def main(data: dict, context) -> None:
    """Background Cloud Function to be triggered by Cloud Storage.
     This function logs relevant data when a file is uploaded.

    Args:
        data (dict): The Cloud Functions event payload.
        context (google.cloud.functions.Context): Metadata of triggering event.
    Returns:
        None; the output is written to Stackdriver Logging
    """
    try:
        gcs_client = storage.Client()
        credentials, project = google.auth.default()
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        publisher_client = pubsub.PublisherClient()
        logging.info(f'data: {data}')
        staging_bucket = data['bucket']
        file_name = data['name']
        content_type = data['contentType']
        gcs_uri = f'gs://{staging_bucket}/{file_name}'
        config_object = create_config_object(content_type)
        operation_name = call_stt_api(gcs_uri, config_object, credentials)
        if operation_name is not None:
            publish_operation_to_pubsub(publisher_client, project,
                                        operation_name, file_name)
            log_message = f'Completed sending {file_name} to STT API.'
            logging.info(log_message)
        else:
            logging.info('Operation failed. No message sent')

    except Exception as e:
        logging.error(e)
        error_bucket = os.environ.get('error_audio_bucket')
        staging_bucket = data['bucket']
        file_name = data['name']
        copy_file(gcs_client, staging_bucket, error_bucket, file_name)
        delete_file(gcs_client, staging_bucket, file_name)
