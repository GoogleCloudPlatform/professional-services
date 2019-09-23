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
"""Common util functions called by main.py."""

import json
from typing import Iterator, List, Union
from google.cloud import storage
from google.cloud.storage import Bucket
from google.api_core.exceptions import NotFound


def authenticate_gcs() -> storage.Client:
    """Creates Python Client Object to access GCS API

    Returns:
      Object representing GCS Client
    """
    return storage.Client()


def find_bucket_with_prefix(bucket_iter: Iterator[Bucket],
                            prefix: str) -> Union[str, None]:
    """"Finds bucket in a project based on bucket prefix.

    Args:
        bucket_iter: Iterator of google.cloud.storage.Bucket instances
        prefix: Bucket name prefix to search for

    Returns:
        Bucket name with the specified prefix.
    """
    for bucket in bucket_iter:
        if bucket.name.startswith(prefix):
            return bucket.name
    raise NotFound(f'No bucket found with prefix: {prefix}')


def get_files(client: storage.Client,
              bucket: storage.Bucket) -> List[dict]:
    """Retrieves all files in a given GCS bucket

    Args:
        client: Object representing Python GCS client
        bucket: google.cloud.storage.Bucket holding bucket name

    Returns:
       List of dicts [{name: String holding file name,
                        type: String representing type of file, 'audio/flac'.
                       }]
    """
    bucket = client.get_bucket(bucket)
    return [{'name': blob.name,
             'type': blob.content_type} for blob in list(bucket.list_blobs())]


def get_gcs_object(gcs_client: storage.Client,
                   bucket_name: str,
                   file_name: str) -> List[dict]:
    """Downloads object file from GCS.

    Args:
        gcs_client: google.cloud.storage.Client
        bucket_name: String representing bucket name.
        file_name: String representing file name.

    Returns:
        List of dictionaries with transcript metadata
    """
    bucket = gcs_client.get_bucket(bucket_name)
    object = bucket.blob(file_name)
    return json.loads(object.download_as_string().decode('utf-8'))


def extract_full_transcript(transcript_text: List[dict]):
    """Converts list of dictionaries holding strings to one string.

    Args:
        transcript_text: List of dicts each holding strings of text.

    Returns:
        String holding entire transcript.
    """
    return ' '.join([section['transcript'] for section in transcript_text])
