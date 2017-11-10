# Copyright 2017 Google Inc. All Rights Reserved.
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

"""Example of verifying IAP signed headers in web requests."""

import requests
from BaseHTTPServer import BaseHTTPRequestHandler
from BaseHTTPServer import HTTPServer
from googleapiclient import discovery
from googleapiclient.errors import HttpError
from time import sleep
# validate_jwt github link:
#    https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/validate_jwt.py
import validate_jwt


class RequestHandler(BaseHTTPRequestHandler):
  project_number = None
  backend_service_id = None

  def do_GET(self):
    """Intercepts all GET requests and validates
    the IAP JWT that is present in the header.
    
    """
    print self.headers
    identity = validate_jwt.validate_iap_jwt_from_compute_engine(
      self.headers.get("X-Goog-IAP-JWT-Assertion"),
      self.project_number,
      self.backend_service_id)
    if not identity[1]:
      self.send_response(200)
      self.send_header("Content-type", "text/html")
      self.end_headers()
      self.wfile.write("<p>IAP Validation Error!</p>"+
                       "<p>Either IAP is not enabled or JWT is malformed.")
    else:
      self.send_response(200)
      self.send_header("Content-type", "text/html")
      self.end_headers()
      self.wfile.write("Hello " + identity[1] + "!")
    return

def getBackendServiceId():
  compute_service = discovery.build('compute', 'v1')
  project_id = requests.get(
      'http://metadata.google.internal/computeMetadata/v1/project/project-id',
      headers={'Metadata-Flavor': 'Google'}).text
  # backend_service_name below MUST match the same
  # name defined in your deployment manager script
  backend_service_name = 'iap-backend-service'
  try:
    return compute_service.backendServices().get(
      project=project_id,
      backendService=backend_service_name
    ).execute().get('id')  
  except HttpError as e:
    if e.resp.status == 404:
      return None
    else:
      raise

def main():
  project_number = requests.get(
      'http://metadata.google.internal/computeMetadata/v1/project/numeric-project-id',
      headers={'Metadata-Flavor': 'Google'}).text
  
  backend_service_id = getBackendServiceId()
  while not backend_service_id:
    print "Backend service not found, please create a load balancer with a backend service"
    # Keep trying to retrieve backend service id as it's necessary
    # for validating IAP JWTs
    sleep(2)
    backend_service_id = getBackendServiceId()

  # Store project number and backend service id inside 
  # the RequestHandler class so that all IAP traffic can be 
  # verified against the expected audience claim
  RequestHandler.project_number = project_number
  RequestHandler.backend_service_id = backend_service_id
  port = 80
  server = HTTPServer(("", port), RequestHandler)
  print "Listening on localhost: {}".format(port)
  server.serve_forever()
  
if __name__ == "__main__":
  main()
