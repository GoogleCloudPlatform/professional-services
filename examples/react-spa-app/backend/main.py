# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import functions_framework
import os
import sys
from google.auth.transport import requests as auth_requests
from google.oauth2 import id_token
from flask import abort

def validate_iap_jwt(iap_jwt, expected_audience):
    """Validate an IAP JWT.

    Args:
      iap_jwt: The contents of the X-Goog-IAP-JWT-Assertion header.
      expected_audience: The Signed Header JWT audience. See
          https://cloud.google.com/iap/docs/signed-headers-howto
          for details on how to get this value.

    Returns:
      (user_id, user_email, error_str).
    """

    try:
        decoded_jwt = id_token.verify_token(
            iap_jwt,
            auth_requests.Request(),
            # Normally we would have an audience here, but this creates a chicken and an egg problem
            # due to backend service needing to point to a function, so the audience is created after
            # deployment. We could store the audience in a Secret Manager secret to decouple the process,
            # but this exercise is left up to the reader.
            audience=None, # audience=expected_audience
            certs_url="https://www.gstatic.com/iap/verify/public_key",
        )
        return (decoded_jwt["sub"], decoded_jwt["email"], "")
    except Exception as e:
        print(f"**ERROR: JWT validation error {e}**", file=sys.stderr)
        return (None, None, f"**ERROR: JWT validation error {e}**")

@functions_framework.http
def hello_function(request):
  if os.getenv("IAP_AUDIENCE"):
    ret = validate_iap_jwt(request.headers.get("x-goog-iap-jwt-assertion"), os.getenv("IAP_AUDIENCE"))
    if not ret[0]:
      abort(403)
    return "Hello World: %s" % (ret[0])
  return 'Hello World'