"""Helper functions to use the Google API Client."""
# Copyright 2019 Google LLC
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
#
#    This script is a proof of concept and is not meant to be fully functional
#    nor feature-complete. Error checking and log reporting should be adjusted
#    based on the user's needs. Script invocation is still in its infancy.
#
#    Please, refer to README.md file for instructions.

import json
import logging

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from retrying import retry

from google.oauth2 import service_account

logger = logging.getLogger(__name__)


@retry(wait_exponential_multiplier=1000,
       wait_exponential_max=60000,
       stop_max_attempt_number=10)
def _execute_request(request):
    """Helper function to call an API function with error retrying.

  Helper function to call an API function with retrying: it calls execute() on
  the request and retries in case of errors.
  If the error is an HttpError from the Google API library, the reason is
  extracted and logged. In case the daily quota is exceeded, the program
  terminates as requested by the Google API guidelines.

  Args:
    request: request object (googleapiclient.http.HttpRequest)

  Returns:
    Result of the request.
  """
    try:
        return request.execute()
    except HttpError as err:
        resp = json.loads(err.content)
        reason = resp.get('error').get('errors')[0].get('reason')
        logger.warning('API call failed - Status: %s, Reason: %s',
                       err.resp.status, reason)
        if reason == 'dailyLimitExceeded':
            logger.error('Daily limit exceeded. Request quota increase.')
            exit(1)
        elif reason == 'userRateLimitExceeded':
            logger.warning(
                'User rate limit exceeded. Consider raising the limit '
                'in the Developer Console. Waiting and retrying...')
        elif reason == 'quotaExceeded':
            logger.warning('Limit of concurrent requests reached. Waiting and '
                           'retrying...')
        raise


def create_delegated_credentials(service_account_file, scopes, user):
    """Creates the delegated credentials to impersonate a given user.

  Args:
    service_account_file: credentials file for the service account
    scopes: scopes to authorize. These scopes must be whitelisted in the G Suite
      console for the service account (see READ.md file)
    user: email of the domain user to impersonate

  Returns:
    Delegated credentials.
  """
    credentials = service_account.Credentials.from_service_account_file(
        service_account_file, scopes=scopes)
    delegated_credentials = credentials.with_subject(user)
    return delegated_credentials


def create_directory_client(credentials):
    """Creates a Directory client for the G Suite Admin SDK.

  Args:
    credentials: credentials for the client

  Returns:
    Client for the directory API of the G Suite Admin SDK.
  """
    return build('admin', 'directory_v1', credentials=credentials)


def get_users(directory, domain, ou_path):
    """Retrieves the list of users for the specified domain and OU.

  Retrieves the list of users for a given G Suite domain and organizational
  unit. The user here is only the primary email.

  Args:
    directory: directory service from Google API Client
    domain: G Suite domain
    ou_path: path to organizational unit, e.g. "/My OU/My Sub OU"

  Returns:
    A list of the primary emails for the required users.
  """

    @retry(wait_exponential_multiplier=1000,
           wait_exponential_max=60000,
           stop_max_attempt_number=10)
    def _users_list(domain, query):
        return directory.users().list(domain=domain, query=query)

    @retry(wait_exponential_multiplier=1000,
           wait_exponential_max=60000,
           stop_max_attempt_number=10)
    def _users_list_next(request, result):
        return directory.users().list_next(request, result)

    users = []
    request = _users_list(domain, "orgUnitPath:'{}'".format(ou_path))
    while request is not None:
        result = _execute_request(request)
        for user in result['users']:
            users.append(user['primaryEmail'])
        request = _users_list_next(request, result)
    return users


def get_denormalized_scopes_for_user(directory, user):
    """Get the list of denormalized scopes for a given user.

  Gets the list of scopes for a given users and "denormalizes" them,
  preparing them for the insertion in a relational database.
  A list of tuples is created, with a tuple for each different clientId and
  each different scope.
  Because data is denormalized, client IDs are repeated in the result.
  That is, if a user authorizes the client ID "123abc" with scopes "scope1"
  and "scope2", and client id "456def" with scopes "scope1" and "scope3", the
  result will be the following (ignoring the display text for simplicity):
  ('user@example.com', '123abc', 'scope1')
  ('user@example.com', '123abc', 'scope2')
  ('user@example.com', '456def', 'scope1')
  ('user@example.com', '456def', 'scope3')

  Args:
    directory: directory service from Google API Client
    user: primary email in G Suite for the user

  Returns:
    List of tuples with information about the scopes granted to a user.
  """
    rows = []
    request = directory.tokens().list(userKey=user)
    result = _execute_request(request)
    if 'items' in result:
        for item in result['items']:
            client_id = item['clientId']
            display_text = item['displayText']
            scopes = item['scopes']
            for scope in scopes:
                rows.append((user, client_id, scope, display_text))
    return rows
