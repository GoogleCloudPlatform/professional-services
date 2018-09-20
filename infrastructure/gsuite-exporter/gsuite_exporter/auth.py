# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import httplib2
import logging
from googleapiclient import discovery
from oauth2client.service_account import ServiceAccountCredentials
from oauth2client.client import GoogleCredentials
from google.auth._oauth2client import convert

logger = logging.getLogger(__name__)

def build_service(api, version, credentials_path=None, user_email=None, scopes=None):
    """Build and returns a service object authorized with the service accounts
    that act on behalf of the given user.

    Args:
      user_email: The email of the user. Needs permissions to access the Admin APIs.

    Returns:
      Service object.
    """
    service_config = {
        'serviceName': api,
        'version': version
    }   
    
    # Get service account credentials
    if credentials_path is None:
        logger.info("Getting default application credentials ...")
        credentials = GoogleCredentials.get_application_default()
    else:
        logger.info("Loading credentials from %s", credentials_path)
        credentials = ServiceAccountCredentials.from_json_keyfile_name(
            credentials_path,
            scopes=scopes)

    # Delegate credentials if needed, otherwise use service account credentials
    if user_email is not None:
        delegated = credentials.create_delegated(user_email)
        http = delegated.authorize(httplib2.Http())
        service_config['http'] = http
    else:
        service_config['credentials'] = credentials

    return discovery.build(**service_config)
