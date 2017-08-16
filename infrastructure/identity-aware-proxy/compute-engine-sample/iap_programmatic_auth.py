# Copyright 2016 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
####################################################################################################
## Programmatic Authentication from a service account
## Online Doc: https://cloud.google.com/iap/docs/authentication-howto#authenticating_from_a_service_account
## 1. Add the service account to the access list for the Cloud IAP-secured project.
## 2. Generate a JWT-based access token (JWT-bAT).
## 3. Request an OpenID Connect (OIDC) token for the Cloud IAP-secured client ID.
## 4. Include the OIDC token in an Authorization: Bearer header to make the authenticated request to the Cloud IAP-secured resource.
##
## Example of how to run this script:
##   python iap_programmatic_auth.py "https://example.com" "IAPclientID" "path/to/jsonprivatekey.json"
##
####################################################################################################
import requests,json,sys
from google.oauth2.service_account import Credentials

def get_token_endpoint():
	response = requests.get("https://accounts.google.com/.well-known/openid-configuration")
	return json.loads(response.text)["token_endpoint"]

def generate_JWT(iap_client_id, json_private_key):
    # Create Service Account credential from downloaded JSON private key file.
    # Note: Additional claim of 'target_audience' is required and must be 
    # set to the clientId of the IAP Service Account
    credential = Credentials.from_service_account_file(json_private_key
    	           ).with_claims({'target_audience': iap_client_id})
    # Must change credential's token uri to point to Google's 
    # OpenId token endpoint instead of Google's authorization endpoint
    credential._token_uri = get_token_endpoint()
    # Generate and return OAuth 2.0 signed JWT-based access token (JWT-bAT)
    return credential._make_authorization_grant_assertion()

def get_google_open_id_connect_token(signed_jwt):
    # Request an OpenID Connect (OIDC) token for the Cloud IAP-secured client ID.
    response = requests.post(
                          url=get_token_endpoint(),
                          headers = {'content-type': 'application/x-www-form-urlencoded'},
                          data = {
                            'assertion': signed_jwt,
                            'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer'})
    return json.loads(response.text)["id_token"]

def get_request(url, iap_client_id, json_private_key):
    id_token = get_google_open_id_connect_token(generate_JWT(iap_client_id, json_private_key))
    # Include the above OIDC token in an Authorization: Bearer header
    # to make the authenticated request to the Cloud IAP-secured resource.
    response = requests.get(
                          url=url,
                          headers={'Authorization': 'Bearer {}'.format(id_token)},
                          # Do not set verify=False in production!!
                          # This is for demo only using self-signed certs
                          verify=False) 
    print 'Status:{}\nReason:{}\nBody:{}'.format(
    	    response.status_code,
    	    response.reason,
    	    response.text)

if __name__ == "__main__":
	# sys.argv[1] = URL
	# sys.argv[2] = IAP Client ID
	# sys.argv[3] = JSON Private Key File
	get_request(sys.argv[1],sys.argv[2],sys.argv[3])