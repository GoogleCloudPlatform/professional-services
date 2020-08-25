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
after_response: delay execution of a function after the response is completed

In order to use, decorate a function (only one allowed) with the
after_response.after_response(app) decorator.


Example:

import flask
import time
import after_response
import requests

app = flask.Flask(__name__)

@after_response.after_response(app)
def sleep(path):
  print("waiting...")
  time.sleep(2)
  print("ready! " + path)

@app.route("/", defaults={"path":""})
@app.route("/<path:path>")
def root(path):
  sleep(path) # <------- this function call is delayed to AFTER the response
  return "OK\n"

if __name__ == "__main__":
    app.run(debug=1)
~

"""

import traceback
from werkzeug.wsgi import ClosingIterator

def after_response(app):
  """ after_response(app) registers a function to
      be executed after the response is flushed

      eg:
      @after_response(app):
      def sleep():
        time.sleep(2)
        print('done')
  """
      
  delayed = dict(
    function = None,
    args = None,
    kwargs = None
  )

  def execute():
    try:
      f = delayed['function']
      args = delayed['args']
      kwargs = delayed['kwargs']
      f(*args, **kwargs)
    except:
       traceback.print_exc()

  def register(f):
    delayed['function'] = f
    def inner(*args, **kwargs):
      delayed['args'] = args
      delayed['kwargs'] = kwargs
    return inner

  app.wsgi_app = _middleware(app.wsgi_app, execute)

  return register


def _middleware(wsgi_app, callback):
  """ middleware that executes the callback """
  def inner(environ, after_response):
    iterator = wsgi_app(environ, after_response)
    try:
      return ClosingIterator(iterator, [callback])
    except:
      traceback.print_exc()
    return iterator
  return inner

