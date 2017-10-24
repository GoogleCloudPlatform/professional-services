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

from BaseHTTPServer import BaseHTTPRequestHandler
from BaseHTTPServer import HTTPServer
from googleapiclient import discovery
from oauth2client.client import GoogleCredentials
import sys
# validate_jwt github link:
#    https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/validate_jwt.py
import validate_jwt


class RequestHandler(BaseHTTPRequestHandler):
  
  def __init__(self, *args, **kwargs):
    super(RequestHandler, self).__init__(*args, **kwargs)
    self.project_number = kwargs['project_number']
    self.backend_service_id = kwargs['backend_service_id']

  def do_GET(self):
    """Intercepts all GET requests and validates
    the IAP JWT that is present in the header.
    For this example, all requests must have the
    load balancer's backend service id and the
    project number present in the url.

    Example request:
    https:testdomain.com/projectNumber/backendServiceId
    """
    print self.headers
    print self.project_number
    print self.backend_service_id
    # project_number = self.path.split("/")[-2]
    # backend_service_id = self.path.split("/")[-1]
    identity = validate_jwt.validate_iap_jwt_from_compute_engine(
        self.headers.get("X-Goog-IAP-JWT-Assertion"),
        self.project_number,
        self.backend_service_id)
    if not identity[1]:
      self.send_response(200)
      self.send_header("Content-type", "text/html")
      self.end_headers()
      self.wfile.write("IAP Validation Failed")
    else:
      self.send_response(200)
      self.send_header("Content-type", "text/html")
      self.end_headers()
      self.wfile.write("Hello " + identity[1] + "!")
    return
  

def main():
  port = 80
  print "Listening on localhost:%s" % port
  print "Project Number: {}".format(sys.argv[1])
  print "Project ID: {}".format(sys.argv[2])
  credentials = GoogleCredentials.get_application_default()
  service = discovery.build('compute', 'v1', credentials=credentials)
  backend_service_id = service.backendServices().get(project=sys.argv[2], backendService='iap-backend-service').execute()['id']
  print "Backend Service: {}".format(backend_service_id)
  server = HTTPServer(("", port), RequestHandler(project_number=sys.argv[1], backend_service_id=backend_service_id))
  server.serve_forever()
if __name__ == "__main__":
  main()
