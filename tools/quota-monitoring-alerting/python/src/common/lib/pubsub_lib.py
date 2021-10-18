# Copyright 2021 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Helper functions to interact with pubsub messaging."""

import base64
import logging

import simplejson as json

from src.common.lib import gcp


def _validate(envelope):
    """Validate pubsub message envelope.

    Raises:
      ValueError, if expected data is not present in pubsub envelope.
    """
    logging.info('Pubsub: Validating pubsub message')
    if 'message' not in envelope:
        raise ValueError('PubsubHelper: No message in envelope')

    message = envelope.get('message', {})
    if 'data' not in message:
        raise ValueError('PubsubHelper: No data in message')

    if 'attributes' not in message:
        raise ValueError('PubsubHelper: No attributes in message')


def _encode(message):
    """Encode data to make it publishable to pubsub.

    Args:
        message: dict, data that needs to be encoded.
    """
    message['data'] = json.dumps(message.get('data', '')).encode('utf-8')
    message['attributes'] = {
        k: json.dumps(v).encode('utf-8')
        for k, v in message.get('attributes', {}).items()
    }


def _decode(message):
    """Decode pubsub message data.

    Args:
        message: dict, data that needs to be decoded.
    """
    message['data'] = json.loads(base64.b64decode(message['data']))
    metadata = message['attributes']
    message['attributes'] = {k: json.loads(v) for k, v in metadata.items()}


def process_envelope(request_data):
    """Process pubsub envelope data.

    Args:
        request_data: pubsub request object.

    Returns:
      dict, the message from pubsub request object.
    """
    logging.info('PubsubHelper: Processing request data')
    envelope = json.loads(request_data.decode('utf-8'))
    _validate(envelope)
    return process_message(envelope.get('message', {}))


def build_message(data, **metadata):
    """Build pubsub message obj for given input.

    Args:
        data: dict, data that needs to be published.
        metadata: dict, attributes for pubsub message.

    Returns:
        dict, encoded data.
    """
    message = {
        'data': data,
        'attributes': {
            'batch_id': metadata.get('batch_id', ''),
            'message_id': metadata.get('message_id', ''),
            'publish_time': metadata.get('publishTime', ''),
            'src_message_id': metadata.get('src_message_id', ''),
        }
    }
    _encode(message)
    return message


def process_message(message):
    """Process pubsub message.

    Args:
        message: dict, encode data.

    Returns:
        dict, decoded data.
    """
    _decode(message)
    data, metadata = message['data'], message['attributes']
    logging.info('PubsubHelper: message_id - %s and src_message_id - %s',
                 metadata.get('message_id', ''),
                 metadata.get('src_message_id', ''))
    return data, metadata


def publish_message(pubsub_project, pubsub_topic, message):
    """Public message to a topic.

    Args:
        pubsub_project: str, project id.
        pubsub_topic: str, topic name.
        message: dict, data that needs to be published.

    Returns:
        result from publish request.
    """
    logging.info('PubsubHelper: Publishing message to - %s, %s',
                 pubsub_project, pubsub_topic)
    publisher = gcp.pubsub_client()
    # pylint:disable=no-member
    topic_path = publisher.topic_path(pubsub_project, pubsub_topic)
    # pylint:enable=no-member
    future = publisher.publish(topic_path, message['data'],
                               **message['attributes'])
    return future.result()
