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
import jwt
import requests

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        request_path = self.path
        identity = (None, None, None)
        request_proto = self.headers.get("X-Forwarded-Proto")
        host = self.headers.get("Host")
        user_jwt = self.headers.get("X-Goog-Authenticated-User-JWT")
        if request_proto and host and user_jwt:
            base_url = request_proto + "://" + host
            identity = validate_iap_jwt(base_url, user_jwt)
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

def validate_iap_jwt(base_url, iap_jwt):
    """Validate a JWT passed to your application by Identity-Aware Proxy.
    Args:
      base_url: The URL from the incoming request, minus any path, query, etc.
                For instance: "https://example.com:8443" or
                "https://example.appspot.com" .
      iap_jwt: The contents of the X-Goog-Authenticated-User-JWT header.
    Returns:
      (user_id, user_email, error_str).
    """
    print "validating"
    try:
        key_id = jwt.get_unverified_header(iap_jwt).get('kid')
        print "key_id: " + str(key_id)
        if not key_id:
            return (None, None, '**ERROR: no key ID**')
        key = get_iap_key(key_id)
        print "key: " + str(key)
        print "base_url: " + str(base_url)
        print "iap_jwt: " + str(iap_jwt)
        decoded_jwt = jwt.decode(
            iap_jwt, key,
            algorithms=['ES256'],
            audience=base_url)
        return (decoded_jwt['sub'], decoded_jwt['email'], '')
    except (jwt.exceptions.InvalidTokenError,
            requests.exceptions.RequestException) as e:
        return (None, None, '**ERROR: JWT validation error {}**'.format(e))

def get_iap_key(key_id):
    """Retrieves a public key from the list published by Identity-Aware Proxy,
    re-fetching the key file if necessary.
    """
    key_cache = get_iap_key.key_cache
    key = key_cache.get(key_id)
    if not key:
        # Re-fetch the key file.
        resp = requests.get(
            'https://www.gstatic.com/iap/verify/public_key')
        if resp.status_code != 200:
            raise Exception(
                'Unable to fetch IAP keys: {} / {} / {}'.format(
                    resp.status_code, resp.headers, resp.text))
        key_cache = resp.json()
        get_iap_key.key_cache = key_cache
        key = key_cache.get(key_id)
        if not key:
            raise Exception('Key {!r} not found'.format(key_id))
    return key

# Used to cache the Identity-Aware Proxy public keys.  This code only
# refetches the file when a JWT is signed with a key not present in
# this cache.
get_iap_key.key_cache = {}
# [END iap_validate_jwt]
def main():
    port = 80
    print 'Listening on localhost:%s' % port
    server = HTTPServer(('', port), RequestHandler)
    server.serve_forever()
if __name__ == "__main__":
    main()
