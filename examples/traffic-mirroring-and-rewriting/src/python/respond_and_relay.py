#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright 2020 Google Inc. All Rights Reserved.
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

"""
respond_and_relay.py: Receiving end of the mirror plane.

- Serve a request from the mirror-proxy by storing a copy and responding 200 OK. 
- After responding to the mirror-proxy, modify and relay the request to the backend.

usage:

import respond_and_relay

def pre(path, request_params):
  print(request_params)

def post(content, status, headers):
  print(headers)

app = respond_and_relay(pre, post)
app.run()
 
"""

import flask
import requests
import after_response


def create_relay_app(pre_cb, post_cb):
  """ create relay app and hook pre and post callbacks
  Inputs:
   - pre_cb(path, request_params)
   - post_cb(content, status, headers)
  Outputs:
   - flask app
  """

  METHODS = "GET OPTIONS HEAD POST PUT PATCH DELETE".split()
  app = flask.Flask(__name__)

  @after_response.after_response(app)
  def process_request(path, request_params):
    """ apply rewrite rules and relay request to backend
    """
    request_params['timeout'] = 0.01
    new_request_params = pre_cb(path, request_params)
    if new_request_params:
      response = requests.request(**request_params)
      post_cb(response.content, response.status_code, response.raw.headers)
  
  @app.route("/", defaults={"path":""}, methods=METHODS)
  @app.route("/<path:path>", methods=METHODS)
  def root(path):
    """ catch-all endpoint to cache the request
    """
    orig_request = _copy_request(flask.request)
    process_request(path, orig_request)
    return "OK\n"

  return app

def _copy_request(request):
  """ return a dictionary with a copy of the request
  """
  return dict(
    headers = dict(request.headers),
    method = request.method,
    data = request.get_data(),
    json = request.get_json(),
    cookies = dict(request.cookies),
    files = dict(request.files),
  )

