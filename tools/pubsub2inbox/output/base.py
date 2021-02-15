#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
from google.cloud.functions.context import Context
import logging
import os
import abc
from google.cloud.iam_credentials_v1 import IAMCredentialsClient


class NotConfiguredException(Exception):
    pass


class NoCredentialsException(Exception):
    pass


class Output:
    config = None
    output_config = None
    data = None
    event = None
    context: Context
    jinja_environment = None
    logger = None

    def __init__(self, config, output_config, jinja_environment, data, event,
                 context: Context):
        self.config = config
        self.output_config = output_config
        self.jinja_environment = jinja_environment
        self.data = data
        self.event = event
        self.context = context

        self.logger = logging.getLogger('pubsub2inbox')

    def get_token_for_scopes(self, scopes, service_account=None):
        if not service_account:
            service_account = os.getenv('SERVICE_ACCOUNT')

        if not service_account:
            raise NoCredentialsException(
                'You need to specify a service account for Directory API credentials, either through SERVICE_ACCOUNT environment variable or serviceAccountEmail parameter.'
            )

        client = IAMCredentialsClient()
        name = 'projects/-/serviceAccounts/%s' % service_account
        response = client.generate_access_token(name=name, scope=scopes)
        return response.access_token

    @abc.abstractmethod
    def output(self):
        pass