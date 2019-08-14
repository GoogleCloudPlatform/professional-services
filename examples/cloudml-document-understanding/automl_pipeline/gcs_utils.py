#!/usr/bin/python2
# Copyright 2018 Google Inc. All Rights Reserved.
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
"""Utils for GCS."""

from io import BytesIO, StringIO
import re

from google.cloud import storage
from google.oauth2 import service_account


def get_bucket_blob(full_path):
  match = re.match(r'gs://([^/]+)/(.+)', full_path)
  bucket_name = match.group(1)
  blob_name = match.group(2)
  return bucket_name, blob_name


def download_string(full_path, service_account):
  """Downloads the content of a gcs file."""
  storage_client = storage.Client.from_service_account_json(service_account)
  bucket_name, path = get_bucket_blob(full_path)
  bucket = storage_client.get_bucket(bucket_name)
  blob = bucket.blob(path)
  byte_stream = BytesIO()
  blob.download_to_file(byte_stream)
  byte_stream.seek(0)
  return byte_stream


def upload_string(text, output_filename, service_account):
  """Writes to a gcs file."""
  storage_client = storage.Client.from_service_account_json(service_account)
  bucket_name, path = get_bucket_blob(output_filename)
  bucket = storage_client.get_bucket(bucket_name)
  blob = bucket.blob(path)
  blob.upload_from_string(text)
