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

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import os

from attr import attrs, attrib

from google.cloud import storage
from google.oauth2 import service_account


@attrs  # This is a data class. pylint: disable=too-few-public-methods
class Configuration(object):
    """Class to hold all of the config values set up on initial script run."""
    source_project_credentials = attrib()
    target_project_credentials = attrib()
    source_storage_client = attrib()
    target_storage_client = attrib()
    source_project = attrib()
    target_project = attrib()
    bucket_name = attrib()
    temp_bucket_name = attrib()

    @classmethod
    def from_conf(cls, conf):
        """Load in the values from config.sh and the command line.

        Set up the credentials and storage clients.

        Args:
            conf: the argparser parsing of command line options
        """

        source_service_account_key = os.getenv(
            'GCP_SOURCE_PROJECT_SERVICE_ACCOUNT_KEY')
        target_service_account_key = os.getenv(
            'GCP_TARGET_PROJECT_SERVICE_ACCOUNT_KEY')

        if not (source_service_account_key and target_service_account_key):
            raise SystemExit(
                'Missing some environment variables. Do you need to edit and source the config.sh'
                ' script?')

        temp_bucket_name = conf.bucket_name + '-temp'
        if conf.tempBucketName:
            temp_bucket_name = conf.tempBucketName

        return cls(
            source_project_credentials=service_account.Credentials.
            from_service_account_file(source_service_account_key),
            target_project_credentials=service_account.Credentials.
            from_service_account_file(target_service_account_key),
            source_storage_client=storage.Client.from_service_account_json(
                source_service_account_key),
            target_storage_client=storage.Client.from_service_account_json(
                target_service_account_key),
            source_project=conf.source_project,
            target_project=conf.target_project,
            bucket_name=conf.bucket_name,
            temp_bucket_name=temp_bucket_name)
