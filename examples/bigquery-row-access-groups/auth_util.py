# Copyright 2019 Google LLC. All rights reserved. Licensed under the Apache
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
"""Utility to obtain credentials with domain delegation.

Author: woogie@
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import google.auth
import google.auth.iam
import google.auth.transport.requests
import oauth2client.service_account


def get_credentials(admin_email, scopes):
  request = google.auth.transport.requests.Request()
  #  This retrieves the default credentials from the environment - in this
  #  case, for the Service Account attached to the VM. The unused _ variable
  #  is just the GCP project ID - we're dropping it because we don't care.
  default_credentials, _ = google.auth.default()
  #  The credentials object won't include the service account e-mail address
  #  until it has been used or refreshed.
  default_credentials.refresh(request)
  #  The Signer object uses the IAM API to cryptographically sign blobs. With a
  #  JSON key file, this action can be done locally by client libraries, as the
  #  private key is accessible. On a GCE VM, only the token is available - the
  #  private key is inaccessible.
  signer = google.auth.iam.Signer(request, default_credentials,
                                  default_credentials.service_account_email)
  #  This creates a service account credentials object by combining our Signer
  #  object and the default credentials token from the VM.
  base_credential = oauth2client.service_account.ServiceAccountCredentials(
      default_credentials.service_account_email, signer, scopes=scopes)
  #  This creates a delegated credential, which is needed to invoke GSuite
  #  admin APIs. Delegating a credential means generating a signed OAuth
  #  request, which is why it was necessary to create the Signer object,
  #  since the default GCE credentials do not include a private key.
  delegated_credential = base_credential.create_delegated(admin_email)
  return delegated_credential

