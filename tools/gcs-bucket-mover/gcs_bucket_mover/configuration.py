# Copyright 2018 Google LLC. All rights reserved. Licensed under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.
#
# Any software provided by Google hereunder is distributed "AS IS", WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, and is not intended for production use.
"""Class to hold all of the config values set up on initial script run."""

import os

from attr import attrs, attrib

from google.auth import environment_vars
from google.cloud import logging
from google.cloud import storage
from google.oauth2 import service_account


@attrs  # This is a data class. pylint: disable=too-few-public-methods
class Configuration(object):
  """Class to hold all of the config values set up on initial script run."""

  source_project_credentials = attrib()
  target_project_credentials = attrib()
  source_storage_client = attrib()
  target_storage_client = attrib()
  target_logging_client = attrib()
  source_project = attrib()
  target_project = attrib()
  bucket_name = attrib()
  target_bucket_name = attrib()
  temp_bucket_name = attrib()
  disable_bucket_lock = attrib()
  lock_file_name = attrib()
  is_rename = attrib()
  preserve_custom_time = attrib()
  log_action = attrib()
  log_action_state = attrib()

  @classmethod
  def from_conf(cls, conf):
    """Load in the values from config.sh and the command line.

    Set up the credentials and storage clients.

    Args:
        conf: the configargparser parsing of command line options
    """

    temp_bucket_name = conf.bucket_name + "-temp"
    if conf.temp_bucket_name:
      temp_bucket_name = conf.temp_bucket_name

    target_bucket_name = conf.bucket_name
    is_rename = False
    if conf.rename_bucket_to:
      target_bucket_name = conf.rename_bucket_to
      if target_bucket_name != conf.bucket_name:
        is_rename = True

    # Decide whether to use user supplied service account key
    # files or the default GOOGLE_APPLICATION_CREDENTIALS value.
    if (not conf.gcp_source_project_service_account_key or
        conf.gcp_source_project_service_account_key == "None"):
      json_path = os.environ.get(environment_vars.CREDENTIALS)
    else:
      json_path = conf.gcp_source_project_service_account_key
    source_credentials = service_account.Credentials.from_service_account_file(
      json_path)

    if (not conf.gcp_target_project_service_account_key or
        conf.gcp_target_project_service_account_key == "None"):
      json_path = os.environ.get(environment_vars.CREDENTIALS)
    else:
      json_path = conf.gcp_target_project_service_account_key
    target_credentials = service_account.Credentials.from_service_account_file(
      json_path)

    return cls(
      source_project_credentials=source_credentials,
      target_project_credentials=target_credentials,
      source_storage_client=storage.Client(credentials=source_credentials,
                                           project=conf.source_project),
      target_storage_client=storage.Client(credentials=target_credentials,
                                           project=conf.target_project),
      target_logging_client=logging.Client(credentials=target_credentials,
                                           project=conf.target_project),
      source_project=conf.source_project,
      target_project=conf.target_project,
      bucket_name=conf.bucket_name,
      target_bucket_name=target_bucket_name,
      temp_bucket_name=temp_bucket_name,
      is_rename=is_rename,
      disable_bucket_lock=conf.disable_bucket_lock,
      lock_file_name=conf.lock_file_name,
      preserve_custom_time=conf.preserve_custom_time,
      log_action=conf.log_action,
      log_action_state=conf.log_action_state,
    )
