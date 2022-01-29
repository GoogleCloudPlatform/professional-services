# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
Hello
"""
import subprocess
from google.cloud import storage


def sh(command, output=subprocess.PIPE, err=subprocess.STDOUT, use_shell=False):
    """
    A wrapper around subprocess for executing shell commands
    """
    with subprocess.Popen(command, stdout=output, stderr=err,
                          shell=use_shell) as proc:
        try:
            command_result = proc.communicate(timeout=15)
            return command_result
        except subprocess.TimeoutExpired:
            proc.kill()


def upload_blob(bucket_name, source_file_name, destination_blob_name):
    """
    Uploads a local file to a given bucket
    """
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(source_file_name)


def copy_gcs_folder(bucket_from, bucket_to):
    sh(['gsutil', '-m', 'rsync', '-r', bucket_from, bucket_to])
