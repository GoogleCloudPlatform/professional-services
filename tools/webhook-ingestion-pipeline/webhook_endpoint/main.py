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

from datetime import datetime
import json
import os
import uuid
from flask import Flask, request, jsonify

import consts
import pubsub_publisher

from exceptions import WebhookException

""" Deploy App Engine Webhook Endpoint

    * Extract the Project ID and Destination Pub/Sub Topic
    * Initialize a Publisher used for sending data to Pub/Sub
    * Deploy a Flask App
"""
project_id = os.environ[consts.PROJECT_ID]
topic_name = os.environ[consts.PUBSUB_TOPIC]

publisher = pubsub_publisher.PubSubPublisher(project_id)
app = Flask(__name__)


@app.route('/', methods=['POST'])
def receive_data():
    return webhook_to_pubsub(request)


@app.route('/', methods=['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD'])
def unsupported_request():
    raise WebhookException(consts.UNSUPPORTED_METHOD.format(
                           method=request.method,
                           status_code=405))


@app.errorhandler(WebhookException)
def handle_invalid_usage(error):
    """ Raise Exception for Unsupported Types """
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


def _set_missing_metadata(json_data):
    """ Adds necessary _metadata fields
        for downstream processing
        and event splitting
    """
    default_metadata = {'@uuid': str(uuid.uuid4()),
                        '@timestamp': datetime.utcnow().isoformat()}
    if isinstance(json_data, str):
        json_data = json.loads(json_data)

    if '_metadata' not in json_data:
        json_data['_metadata'] = default_metadata
    return json.dumps(json_data)


def _extract_data(request):
    """ Return Dict with extracted data from request

        :param request: Flask.request with data to process
    """
    if request.content_length == 0:
        raise WebhookException(consts.NO_DATA_MESSAGE, status_code=400)
    if request.content_length > consts.MAX_CONTENT_MB:
        raise WebhookException(
            consts.MESSAGE_TOO_BIG.format(content_length=request.content_length,
                                          max_bytes=consts.MAX_CONTENT_MB),
            status_code=400)
    try:
        return request.get_json()
    except Exception:
        return {"message": request.get_data(as_text=True)}


def webhook_to_pubsub(request) -> str:
    """ Return String response for HTTP Request Processing

        :param request: (flask.Request) The request object.
        <http://flask.pocoo.org/docs/1.0/api/#flask.Request>
    """
    request_json = _extract_data(request)
    if isinstance(request_json, list):
        for row in request_json:
            row = _set_missing_metadata(row)
            publisher.publish_data(topic_name, row)
    else:
        request_json = _set_missing_metadata(request_json)
        publisher.publish_data(topic_name, request_json)

    return str(request_json)
