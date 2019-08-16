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
"""Creates perspective_api_function code for Cloud Function."""

import json
import logging
import os
from datetime import datetime
from google.cloud import storage
from googleapiclient import discovery

ERROR_STATUS = "error"
SUCCESS_STATUS = "success"


def authenticate_perspective():
    """Authenticates and creates client object for Perspective API.

    Returns:
        Credentials for discovery build of Perspective API.
    """
    return discovery.build('commentanalyzer', 'v1alpha1', cache_discovery=False)


def get_transcript(gcs_client, bucket_name, file_name):
    """Downloads transcript file from GCS.

    Args:
        gcs_client: Object representing GCS Client Object.
        bucket_name: String representing bucket name of transcription of audio.
        file_name: String of 'transcript.json'.

    Returns:
        JSON holding transcript object
    """
    log_message = 'Retrieving transcript for {file} from {bucket}'
    logging.info(log_message.format(file=file_name, bucket=bucket_name))
    bucket = gcs_client.get_bucket(bucket_name)
    transcript = bucket.blob(file_name)
    return json.loads(transcript.download_as_string())


def get_perspective_api_results(perspective_client, text):
    """Calls Perspective API to get toxicity of transcribed text.

    Args:
        perspective_client: Object representing Perspective API Client
        text: Array in format [{'transcript': sample_text,
                                      'start_time': HH:MM:SS,
                                      'end_time': HH:MM:SS
                                    }]

    Returns:
        Object holding perspective API results in format
            {'attributeScores': {
                'TOXICITY': {
                    'spanScores': [
                      {
                          'begin': 0,
                          'end': xxx,
                          'score': {
                            'value': 0.xx,
                            'type': 'PROBABILITY'
                          }
                        }
                    ],
                    'summaryScore': {
                        'value': 0.xx,
                        'type': 'PROBABILITY'
                    }
                }
              },
             'languages': ['en'],
             'detectedLanguages': ['en']
    """
    log_message = 'Starting get_perspective_api_results with {creds} and {text}'
    logging.info(log_message.format(creds=perspective_client, text=text))
    body = {
        'comment': {
            'text': text['transcript']
        },
        'requestedAttributes': {
            'TOXICITY': {}
        },
        'languages': ['en'],
    }
    logging.info('Request: {}'.format(json.dumps(body)))
    try:
        response = perspective_client.comments().analyze(body=body).execute()
        logging.info('Response: {}'.format(json.dumps(response)))
        return response

    except Exception as e:
        logging.error('Calling Perspective API failed.')
        logging.error(e)


def format_api_results(response, text):
    """Extracts relevant fields from Perspective API

    Args:
        response: Object holding perspective API results in format
            {'attributeScores': {
                'TOXICITY': {
                      'spanScores': [
                          {
                              'begin': 0,
                              'end': xxx,
                              'score': {
                                  'value': 0.xx,
                                  'type': 'PROBABILITY'
                              }
                            }
                          ],
                          'summaryScore': {
                              'value': 0.xx,
                              'type': 'PROBABILITY'
                    }
                }
              },
             'languages': ['en'],
             'detectedLanguages': ['en']
            }
            text: Object in format {'transcript': sample_text,
                                    'start_time': HH:MM:SS,
                                    'end_time': HH:MM:SS
                                    }]

        Returns:
             Object in format {'text': sample_text,
             Object in format {'text': sample_text,
                              'start_time': HH:MM:SS,
                              'end_time': HH:MM:SS,
                              'toxicity': 00.00
                            }
    """
    log_message = 'Starting format_api_results with {results} and {text}.'
    logging.info(log_message.format(results=json.dumps(response), text=text))

    try:
        toxicity = response['attributeScores']['TOXICITY']['summaryScore']['value']
        return {'text': text['transcript'],
                'start_time': text['start_time'] if 'start_time' in text else '',
                'end_time': text['end_time'] if 'end_time' in text else '',
                'toxicity': round(toxicity, 2)}

    except Exception as e:
        log_message = 'Extracting toxicity fields failed for {response}'
        logging.error(log_message.format(response=json.dumps(response)))
        logging.error(e)


def store_toxicity(gcs_client, bucket_name, file_name, file_contents):
    """Uploads toxicity JSON object to GCS.

    Args:
       gcs_client: Object representing JSON object
        bucket_name: String of name of bucket to store the files
        file_name: String of audio file name
        file_contents: JSON holding toxicity information

    Returns:
        None; Logs message to Stackdriver.
    """
    log_message = 'Starting store_toxicity with {contents}'
    logging.info(log_message.format(contents=file_contents))
    try:
        bucket = gcs_client.get_bucket(bucket_name)
        destination = bucket.blob(file_name)
        destination.upload_from_string(json.dumps(file_contents),
                                       content_type='application/json')
        log_message = 'Successfully stored {contents} for {file} in {bucket}'
        logging.info(log_message.format(contents=file_contents, file=file_name,
                                        bucket=bucket_name))
    except Exception as e:
        logging.error('Storing toxicity results failed.')
        logging.error(e)


def write_processing_time_metric(pipeline_start_time, processing_status):
    """Writes custom metrics to Stackdriver.

    Args:
        pipeline_start_time: Datetime object holding current time in seconds.
        processing_status: either SUCCESS or ERROR

    Returns:
         None; Logs message to Stackdriver.
    """
    try:
        logging.info(
            "write_processing_time_metric: {},{}".format(
                pipeline_start_time, processing_status
            )
        )
        function_name = os.environ.get('FUNCTION_NAME')
        project = os.environ.get('GCP_PROJECT')
        logging.info("project: {}, function_name: {}".format(project,
                                                             function_name))
        end_time = datetime.now()
        end_time_str = end_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        logging.info("end+time_str: {}".format(end_time_str))
        start_time = datetime.strptime(pipeline_start_time,
                                       '%Y-%m-%d %H:%M:%S.%f')
        logging.info("start_time: {}".format(start_time))
        total_processing_time = end_time - start_time
        logging.info("total_processing_time: {}".format(total_processing_time))

        monitoring_service = discovery.build(
            serviceName='monitoring', version= 'v3', cache_discovery=False
        )
        project_name = 'projects/{project_id}'.format(
            project_id=project
        )

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
    """Background Cloud Function to be triggered by Cloud Storage.
   This function logs relevant data when a file is uploaded.

    Args:
        data (dict): The Cloud Functions event payload.
        context (google.cloud.functions.Context): Metadata of triggering event.
    Returns:
        None; the output is written to Stackdriver Logging
    """
    try:
        perspective_client = authenticate_perspective()
        gcs_client = storage.Client()
        transcription_bucket = data['bucket']
        file = data['name']
        log_message = 'Looking up toxicity for gs://{bucket}/{file}'
        logging.info(log_message.format(file=file, bucket=transcription_bucket))
        json_msg = get_transcript(gcs_client, transcription_bucket, file)
        transcript = json_msg['json_payload']
        toxicity = []
        for speech_exert in transcript:
            response = get_perspective_api_results(perspective_client,
                                                   speech_exert)
            if response:
                per_segment_toxicity = format_api_results(response,
                                                          speech_exert)
                toxicity.append(per_segment_toxicity)
            else:
                error_message = 'Perspective API response is empty for {text}'
                logging.error(error_message.format(text=speech_exert))
        toxicity_bucket = os.environ.get('toxicity_bucket')
        store_toxicity(gcs_client, toxicity_bucket, file, toxicity)
        log_message = 'Toxicity function finished for {file}'
        logging.info(log_message.format(file=file))
        write_processing_time_metric(json_msg['pipeline_start_time'],
                                     SUCCESS_STATUS)

    except Exception as e:
        logging.error(e)
        if json_msg and 'pipeline_start_time' in json_msg:
            write_processing_time_metric(json_msg['pipeline_start_time'],
                                         ERROR_STATUS)
