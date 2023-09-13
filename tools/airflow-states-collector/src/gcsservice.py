# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.cloud import storage
from src.utils import get_logger

LOGGER = get_logger('gcs-service')

class GCSService(object):
  """
  GCS Service for storing text content on gcs and creating GCS objects
  """
  def __init__(self,
      project=None,
      location='US',
      json_credentials_path=None):
    self.project = project
    self.location = location
    self.json_credentials_path = json_credentials_path
    self.gcs = None

  def get_client(self):
    """
    Initializes GCS.Client
    :return storage.Client
    """
    if self.gcs is None:
      if self.json_credentials_path is not None:
        self.gcs = storage.Client.from_service_account_json(
            self.json_credentials_path)
      elif self.project is not None:
        self.gcs = storage.Client(project=self.project)
      else:
        self.gcs = storage.Client()
    return self.gcs


  def store_gcs_file(self, gcs_filepath, content):
    """
    Stores given string content into a GCS file and returns public URL
    :param gcs_filepath: Complete GCS path of the file in the format: gs://<bucket-name>/<path-to-file>
    :param content: String content to be written to GCS file
    :return: GCS file public url
    """
    bucket_name = gcs_filepath.split("/")[2]
    object_name = "/".join(gcs_filepath.split("/")[3:])
    LOGGER.info(f"GCS Upload Bucket Name: {bucket_name}, Object Name: {object_name}")
    bucket = self.get_client().bucket(bucket_name)
    gcs_file = bucket.blob(object_name)

    # Mode can be specified as wb/rb for bytes mode.
    # See: https://docs.python.org/3/library/io.html
    with gcs_file.open("w") as f:
      f.write(content)

    LOGGER.info(f"File content stored to gcs path: {gcs_filepath}")
    return gcs_file.public_url