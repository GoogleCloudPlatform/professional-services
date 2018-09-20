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
import google.auth
from google.auth import iam
from google.auth.credentials import with_scopes_if_required
from google.auth.transport import requests
from google.oauth2 import service_account

logger = logging.getLogger(__name__)

_TOKEN_URI = 'https://accounts.google.com/o/oauth2/token'
_TOKEN_SCOPE = frozenset(['https://www.googleapis.com/auth/iam'])

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
        credentials, _ = google.auth.default()
        if user_email is not None:  # make delegated credentials
            request = requests.Request()
            credentials = _make_delegated_google(
                    credentials,
                    request,
                    user_email,
                    scopes)
        service_config['credentials'] = credentials
    else:  # load credentials from file
        logger.info("Loading credentials from '%s'", credentials_path)
        credentials = ServiceAccountCredentials.from_json_keyfile_name(
            credentials_path,
            scopes=scopes)
        if user_email is not None:
            request = httplib2.Http()
            http = _make_delegated_oauth2(
                    credentials,
                    request,
                    user_email)
            service_config['http'] = http
        else:
            service_config['credentials'] = credentials

    return discovery.build(**service_config)

def _make_delegated_oauth2(credentials, request, user_email):
    delegated = credentials.create_delegated(user_email)
    http = delegated.authorize(request)
    return http

def _make_delegated_google(credentials, request, user_email, scopes):
    credentials = with_scopes_if_required(credentials, _TOKEN_SCOPE)
    credentials.refresh(request)
    email = credentials.service_account_email
    signer = iam.Signer(
        request,
        credentials,
        email)
    return service_account.Credentials(
        signer,
        email,
        _TOKEN_URI,
        scopes=scopes,
        subject=user_email)
