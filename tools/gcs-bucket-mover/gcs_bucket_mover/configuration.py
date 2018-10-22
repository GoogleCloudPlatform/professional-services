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

from google.cloud import storage
from google.oauth2 import service_account


class Configuration(object):
    """Class to hold all of the config values set up on initial script run."""

    # pylint: disable=too-many-instance-attributes
    # I don't think this class should be split into multiple config classes because all of
    # the attributes are closely related.

    def __init__(self, conf):
        """Load the values from config.sh into global variables.

        Set up the credentials and storage clients.

        Args:
            conf: the argparser parsing of command line options
        """

        self._source_service_account_json = os.getenv(
            'GCP_SOURCE_PROJECT_SERVICE_ACCOUNT_KEY')
        self._target_service_account_json = os.getenv(
            'GCP_TARGET_PROJECT_SERVICE_ACCOUNT_KEY')

        if (self._source_service_account_json is
                None) or (self._target_service_account_json is None):
            raise SystemExit(
                'Missing some environment variables. Do you need to edit and source the config.sh'
                ' script?')

        self._source_project_credentials = service_account.Credentials.from_service_account_file(
            self._source_service_account_json)
        self._target_project_credentials = service_account.Credentials.from_service_account_file(
            self._target_service_account_json)
        print 'Using the following service accounts for GCS credentials: '
        print('Source Project - {}'.format(
            self._source_project_credentials.service_account_email))
        print('Target Project - {}\n'.format(
            self._target_project_credentials.service_account_email))

        self._source_storage_client = storage.Client.from_service_account_json(
            self._source_service_account_json)
        self._target_storage_client = storage.Client.from_service_account_json(
            self._target_service_account_json)
        self._target_service_account_email = self.__get_service_account_email(
            self._target_storage_client)

        # Load the values passed in on the command line
        self._bucket_name = conf.bucket_name
        self._temp_bucket_name = self.__get_temp_bucket_name(
            self._bucket_name, conf.tempBucketName)
        self._source_project = conf.source_project
        self._target_project = conf.target_project

    @property
    def source_project_credentials(self):
        """Get the credentials object for the source project"""
        return self._source_project_credentials

    @property
    def target_project_credentials(self):
        """Get the credentials object for the target project"""
        return self._target_project_credentials

    @property
    def source_storage_client(self):
        """Get the storage client object for the source project"""
        return self._source_storage_client

    @property
    def target_storage_client(self):
        """Get the storage client object for the target project"""
        return self._target_storage_client

    @property
    def target_service_account_email(self):
        """Get the email account of the target project's service account"""
        return self._target_service_account_email

    @property
    def bucket_name(self):
        """Get the name of the bucket to be moved"""
        return self._bucket_name

    @property
    def temp_bucket_name(self):
        """Get the temporary bucket name to use in the target project"""
        return self._temp_bucket_name

    @property
    def source_project(self):
        """Get the name of the source project"""
        return self._source_project

    @property
    def target_project(self):
        """Get the name of the target project"""
        return self._target_project

    def __get_service_account_email(self, storage_client):  #Google guidelines differ from pylint. pylint: disable=no-self-use
        # Copied from an approved PR to
        # https://github.com/GoogleCloudPlatform/google-cloud-python/blob/master/storage/google/cloud/storage/client.py pylint: disable=line-too-long
        # Once it is released, this can be replaced with the library call.
        """Get the email address of the project's GCS service account

        Args:
            storage_client: The storage client object used to access GCS

        Returns:
            The service account email address
        """

        project = storage_client.project
        path = '/projects/%s/serviceAccount' % (project,)
        api_response = storage_client._base_connection.api_request(  #pylint: disable=protected-access
            method='GET', path=path)
        return api_response['email_address']

    def __get_temp_bucket_name(self, bucket_name, temp_bucket_name):  #Google guidelines differ from pylint. pylint: disable=no-self-use
        """Get the temporary bucket name

        Args:
            bucket_name: The name of the source bucket
            temp_bucket_name: The temp bucket name that was specifically passed on the command line

        Returns:
            Either the temp bucket name from the command line or the bucket name with -temp
            appended to it as a string
        """

        if not temp_bucket_name:
            return bucket_name + '-temp'
        return temp_bucket_name
