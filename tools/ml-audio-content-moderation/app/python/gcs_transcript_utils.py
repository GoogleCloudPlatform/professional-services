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
"""Common util functions called by main.py."""

import json
from google.cloud import storage


def authenticate_gcs():
    """Creates Python Client Object to access GCS API

    Returns:
      Object representing GCS Client
    """
    return storage.Client()


def find_bucket(bucket_list, keyword):
    """Finds bucket based on regex checking for keyword, such as 'toxicity'.

    Args:
        bucket_list: List of objects all holding metadat about buckets.
        keyword: Regex name to match when looking up list of buckets.

    Returns:
        String of bucket name matching search critera.
    """
    bucket_names = [bucket.name for bucket in bucket_list]
    return next((name for name in bucket_names if keyword in name), None)


def get_files(client, bucket):
    """Retrieives all files in a given GCS bucket

    Args:
        client: Object representing Python GCS client
        bucket: String holding bucket name

    Returns:
       Array in format [{name: String holding file name,
                        type: String representing type of file, 'audio/flac'.
                       }]
    """
    bucket = client.get_bucket(bucket)
    return [{'name': blob.name,
             'type': blob.content_type} for blob in list(bucket.list_blobs())]


def get_transcript_from_gcs(gcs_client, bucket_name, file_name):
    """Downloads transcript file from GCS.

    Args:
        gcs_client: google.cloud.storage.Client
        bucket_name: String representing bucket name.
        file_name: String representing audio file name.

    Returns:
        JSON holding transcript object
    """
    bucket = gcs_client.get_bucket(bucket_name)
    transcript = bucket.blob(file_name)
    return json.loads(transcript.download_as_string().decode('utf-8'))


def extract_full_transcript(transcript_text):
    """Converts list of dictionaries holding strings to one string.

    Args:
        transcript_text: List of dicts each holding strings of text.

    Returns:
        String holding entire transcript.
    """
    return ' '.join([section['transcript'] for section in transcript_text])
