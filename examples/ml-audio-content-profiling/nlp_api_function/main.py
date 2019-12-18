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
"""Creates source code for nlp_api_function Cloud Function."""

import json
import logging
import os
from datetime import datetime
from typing import List, Optional, Union
from google.cloud import language
from google.cloud import storage
from googleapiclient import discovery

ERROR_STATUS = "error"
SUCCESS_STATUS = "success"


def get_transcript(gcs_client: storage.Client, bucket_name: str,
                   file_name: str) -> dict:
    """Downloads transcript file from GCS.

    Args:
        gcs_client: google.cloud.storage.Client.
        bucket_name: String representing bucket name of audio file.
        file_name: String representing audio file name.

    Returns:
        List of dicts holding transcript object
    """
    bucket = gcs_client.get_bucket(bucket_name)
    transcript = bucket.blob(file_name)
    return json.loads(transcript.download_as_string())


def get_nlp_api_results(client: language.LanguageServiceClient,
                        text_content: str) -> language.types.AnalyzeEntitySentimentResponse:
    """Retrieves sentiment/entity information per entity on the whole transcript.

    Args:
        client: google.cloud.language.LanguageServiceClient
        text_content: String containing text of transcribed audio file.

    Returns:
        google.cloud.language.types.AnalyzeEntitySentimentResponse.
    """
    logging.info(f'Starting get_nlp_api_results with {client} and '
                 f'{text_content}')
    try:
        text = language.types.Document(content=text_content, type='PLAIN_TEXT')
        return client.analyze_entity_sentiment(document=text,
                                               encoding_type='UTF32')

    except Exception as e:
        logging.error('Retrieving response from NLP failed.')
        logging.error(e)


def format_nlp_api_results(response: language.types.AnalyzeEntitySentimentResponse,
                           text: str) -> Union[dict, None]:
    """Extracts sentiment/entity information from NLP API response.

    Args:
        response: google.cloud.language.types.AnalyzeEntitySentimentResponse
        text: String containing text of transcribed audio file.

    Returns:
        Dict holding entity result in format:
        {
           'text': String,
           'nlp_response': {
               entity_name: String,
               entity_type: String,
               score: float,
               magnitude: float,
               salience per entity: float
           }
        }
    """
    try:
        logging.info(f'Starting format_nlp_api_results with {text}')
        return {'text': text,
                'nlp_response': [
                    {'entity_name': entity.name,
                     'entity_type': language.enums.Entity.Type(entity.type).name,
                     'score': entity.sentiment.score,
                     'magnitude': entity.sentiment.magnitude,
                     'salience': entity.salience
                    } for entity in response.entities]}

    except Exception as e:
        logging.error('Extracting entity info from NLP API failed.')
        logging.error(e)
        return None


def upload_json_to_gcs(gcs_client: storage.Client, bucket_name: Optional[str],
                       file_name: str, file_contents: List[dict]) -> None:
    """Uploads toxicity JSON object to GCS.

    Args:
        gcs_client: google.cloud.storage.Client
        bucket_name: String holding bucket of where to store results.
        file_name: String of bucket which is the name of the audio file.
        file_contents: List of dicts holding toxicity information

    Returns:
       None
    """
    bucket = gcs_client.get_bucket(bucket_name)
    destination = bucket.blob(f'nlp-files/{file_name}')
    destination.upload_from_string(json.dumps(file_contents),
                                   content_type='application/json')


def write_processing_time_metric(pipeline_start_time: str,
                                 processing_status: str) -> None:
    """Writes custom metrics to Stackdriver.

    Args:
        pipeline_start_time: String holding current time in seconds.
        processing_status: Sting of either SUCCESS or ERROR

    Returns:
         None; Logs message to Stackdriver.
    """
    try:
        logging.info(f'write_processing_time_metric: {pipeline_start_time},'
                     f'{processing_status}')
        function_name = os.environ.get('FUNCTION_NAME')
        project = os.environ.get('GCP_PROJECT')
        logging.info(f'project: {project}, function_name: {function_name}')
        end_time = datetime.now()
        end_time_str = end_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        logging.info(f'end+time_str: {end_time_str}')
        start_time = datetime.strptime(pipeline_start_time,
                                       '%Y-%m-%d %H:%M:%S.%f')
        logging.info(f'start_time: {start_time}')
        total_processing_time = end_time - start_time
        logging.info(f'total_processing_time: {total_processing_time}')

        monitoring_service = discovery.build(
            serviceName='monitoring', version='v3', cache_discovery=False
        )
        project_name = f'projects/{project}'
        time_series = {
            "timeSeries": [
                {
                    "metric": {
                        "type": "custom.googleapis.com/functions/audioprocessing/processingtime",
                        "labels": {
                            "function_name": function_name,
                            "processing_status": processing_status
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
                                "doubleValue": total_processing_time.total_seconds()
                            }
                        }
                    ]
                }
            ]
        }
        logging.info(f'monitoring request: {json.dumps(time_series)}')

        response = monitoring_service.projects().timeSeries().create(
            name=project_name,
            body=time_series
        ).execute()
        logging.info(f'Response: {response}')

    except Exception as e:
        logging.error('Writing custom metric failed.')
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
        nlp_client = language.LanguageServiceClient()
        gcs_client = storage.Client()
        transcription_bucket = data['bucket']
        file = data['name']
        json_msg = get_transcript(gcs_client, transcription_bucket, file)
        logging.info(f'json_msg: {json_msg}')
        transcript = json_msg['json_payload']
        nlp = []
        for speech_exert in transcript:
            response = get_nlp_api_results(nlp_client,
                                           speech_exert['transcript'])
            if response:
                per_segment_nlp = format_nlp_api_results(response,
                                                         speech_exert['transcript'])
                nlp.append(per_segment_nlp)
            else:
                logging.error(f'NLP result is empty for {speech_exert}.')
        nlp_bucket = os.environ.get('output_bucket')
        upload_json_to_gcs(gcs_client, nlp_bucket, file, nlp)
        logging.info(f'Stored NLP output for file {file}')
        write_processing_time_metric(json_msg['pipeline_start_time'],
                                     SUCCESS_STATUS)

    except Exception as e:
        logging.error(e)
        if json_msg and 'pipeline_start_time' in json_msg:
            write_processing_time_metric(json_msg['pipeline_start_time'],
                                         ERROR_STATUS)
