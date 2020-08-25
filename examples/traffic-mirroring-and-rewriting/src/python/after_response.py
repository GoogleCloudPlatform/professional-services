# Copyright 2020 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google

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

