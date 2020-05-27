# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import os
import time

from flask import Flask, request
from google.cloud import pubsub_v1

import consts
import exceptions

""" Deploy App Engine Webhook Endpoint

    * Extract the Project ID and Destination Pub/Sub Topic
    * Initialize a Publisher used for sending data to Pub/Sub
    * Deploy a Flask App
"""
project_id = os.environ[consts.PROJECT_ID]
topic_name = os.environ[consts.PUBSUB_TOPIC]

publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(project_id, topic_name)
futures = dict()

app = Flask(__name__)

@app.route('/', methods=['POST', 'GET'])
def receive_data():
    if request.method == 'POST':
        return webhook_to_pubsub(request, wait_for_ack=False)
    # the code below is executed if the request method
    # was GET or the credentials were invalid
    return request.method

# @app.errorhandler(exceptions.WebhookException)
# def handle_invalid_usage(error):
#     response = jsonify(error.to_dict())
#     response.status_code = error.status_code
#     return response

def webhook_to_pubsub(request, wait_for_ack=True):
    """HTTP Cloud Function.
    Args:
        request (flask.Request): The request object.
        <http://flask.pocoo.org/docs/1.0/api/#flask.Request>
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`
        <http://flask.pocoo.org/docs/1.0/api/#flask.Flask.make_response>.
    """
    # Send Request to PubSub
    request_json = request.get_json(silent=True)
    if request_json is None:
        raise exceptions.WebhookException(consts.NO_DATA_MESSAGE, status_code=400)
    elif isinstance(request_json, list):
        for row in request_json:
            publish_data(row, wait_for_ack=wait_for_ack)
    else:
        publish_data(request_json, wait_for_ack=wait_for_ack)

    return str(request_json)


"""Publishes multiple messages to a Pub/Sub topic with an error handler."""
def _get_callback(f, data):
    def callback(f):
        # TODO: implement logic here, this logic is okay but not great
        if f.exception():
            print("Please handle {} for {}.".format(f.exception(), data))
        if data in futures:
            futures.pop(data)

    return callback

def publish_data(data, wait_for_ack=False):
    """ Publish Pub/Sub Data """
    if isinstance(data, dict):
        data = json.dumps(data)

    futures.update({data: None})
    # When you publish a message, the client returns a future.
    future = publisher.publish(
        topic_path, data=data.encode("utf-8")  # data must be a bytestring.
    )
    futures[data] = future
    # Publish failures shall be handled in the callback function.
    future.add_done_callback(_get_callback(future, data))

    # Wait for all the publish futures to resolve before exiting.
    if wait_for_ack:
        while futures:
            time.sleep(1)

    return data
