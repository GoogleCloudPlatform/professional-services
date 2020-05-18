#!/usr/bin/env python3
import base64
import fileinput
import google.auth.transport.requests
from google.oauth2 import id_token
import os

# Verify a token on the client
# echo "$token" | ./b64.py

def run():
    buf = []
    for line in fileinput.input():
        buf.append(line.rstrip('\n'))
    buf.append("===")
    audience = os.environ['AUDIENCE']
    token = ''.join(buf)
    request = google.auth.transport.requests.Request()
    payload = id_token.verify_token(token, request=request, audience=audience)
    print(payload)

if __name__ == '__main__':
    run()
