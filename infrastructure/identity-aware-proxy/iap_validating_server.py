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
from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler
from validate_jwt import *

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        backendServiceId = self.path.split("/")[-1] #209762747271
        projectNumber = self.path.split("/")[-2]    #935984280712707854
        identity = validate_iap_jwt_from_compute_engine(
                    self.headers.get("X-Goog-IAP-JWT-Assertion"),
                    projectNumber,
                    backendServiceId)          
        if not identity[1]:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write("Unknown User")
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write("Hello " + identity[1] + "!")
        return

    do_POST = do_GET
    do_PUT = do_GET
    do_DELETE = do_GET

def main():
    port = 80
    print 'Listening on localhost:%s' % port
    server = HTTPServer(('', port), RequestHandler)
    server.serve_forever()
if __name__ == "__main__":
    main()
