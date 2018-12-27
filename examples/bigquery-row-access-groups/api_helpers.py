# Copyright 2018 Google LLC. All rights reserved. Licensed under the Apache
# License, Version 2.0 (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.
#
# Any software provided by Google hereunder is distributed "AS IS", WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, and is not intended for production use.

"""Helper functions for GSuite API clients."""

import os

from google.auth import compute_engine
from google.oauth2 import service_account

CLOUD_SCOPES = frozenset(['https://www.googleapis.com/auth/cloud-platform'])

_TOKEN_URI = 'https://accounts.google.com/o/oauth2/token'


def get_delegated_credential(delegated_account, scopes):
  """Builds delegated credentials required for accessing the GSuite APIs.

  Args:
    delegated_account: The account to delegate the service account to use. Must
      be a real domain user, not a service account.
    scopes: The list of required scopes for the service account.

  Returns:
    service_account.Credentials: Credentials as built by
      google.oauth2.service_account.
  """

  credentials = get_environment_service_account(scopes)
  try:
    credentials = credentials.with_subject(delegated_account)
  except AttributeError: # Credentials object lacks with_subject function
    print(dir(credentials))
    raise ValueError("Authenticated user doesn't seem to be a service account. "
                     "If you're running locally, make sure the "
                     "GOOGLE_APPLICATION_CREDENTIALS enviroment variable is set "
                     "and points to a valid service account JSON file.")
  return credentials


def get_environment_service_account(scopes):
  """Obtains default credentials from the environment in a unified way.

  If running in GCE, will return the default GCE credentials (service account).
  Otherwise, will attempt to load the service account credentials from the
  GOOGLE_APPLICATION_CREDENTIALS environment variable.

  Args:
    scopes (list): The list of required scopes for the service account. If
      running in GCE, this will be ignored and configured scopes in the VM used
      instead.

  Returns:
    service_account.Credentials: Credentials as built by
      google.oauth2.service_account.
  """

  # Check if we're running in a local (non-GCE) environment
  default_credentials = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', None)

  if default_credentials:
    credentials = service_account.Credentials.from_service_account_file(
        default_credentials, scopes=scopes)
  else:
    # Assume running inside GCE
    credentials = compute_engine.Credentials()

  return credentials
