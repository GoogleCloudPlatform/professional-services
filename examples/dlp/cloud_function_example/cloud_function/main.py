
# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Scrubs PII from Log Exports.

This Cloud Function example is intended to redact sensitive data from
logs exported to pub/sub. It will read a pub/sub message and attempt
to identify PII data within the jsonPayload.message field using the dlp
api.  If any sensitive data has been found, it will rewrite the message
with the identified data replaced with "[<INFO_TYPE>]" and post it to a
pub/sub topic named 'scrubbed-logs'.

This example only attempts to redact sensitive data within the
jsonPaylod.message field.  If does not look at any other log field.
"""

import base64
import copy
import json
import logging
import os

from google.cloud import dlp_v2
from google.cloud import pubsub_v1

_INFO_TYPE_LIST = ['CREDIT_CARD_NUMBER', 'DATE_OF_BIRTH', 'EMAIL_ADDRESS']
_OUTPUT_TOPIC_NAME = os.environ['OUTPUT_TOPIC_NAME']
_PROJECT_ID = os.environ['GCP_PROJECT']


def process_log_entry(event, unused_context):
  """Entrypoint for the cloud function to redact pii from log messages."""

  del unused_context # The cloud functions context is unused.

  log_json = _read_pubsub_json(event)
  dlp_response = _get_redacted_dlp_response(log_json['jsonPayload']['message'])
  _post_scrubbed_message_to_pub_sub(_OUTPUT_TOPIC_NAME, dlp_response.item.value,
                                    log_json)


def _read_pubsub_json(event):
  """Extracts the json payload from a pub/sub message.

    Args:
      event: A Pub/Sub event.

    Returns:
      The json_payload from a pub/sub message.
  """

  pubsub_message = base64.b64decode(event['data']).decode('utf-8')
  return json.loads(pubsub_message)


def _build_deidentify_config(info_type_list):
  """Constructs the deidentify config dictionary for the dlp api.

    Args:
      info_type_list: A list containing the dlp info types to redact.

    Returns:
      A dictionary representation of the DLP API DeidentifyConfig object
      to be used to redact the sensitive fields.
  """

  transformation_config = {
      'info_types': [],
      'primitive_transformation': {
          'replace_config': {
              'new_value': {
                  'string_value': ''
              }
          }
      }
  }

  deidentify_config = {'info_type_transformations': {'transformations': []}}

  for info_type in info_type_list:
    config = copy.deepcopy(transformation_config)
    config['info_types'].append({'name': info_type})
    replace_config = config['primitive_transformation']['replace_config']
    replace_config['new_value']['string_value'] = '[%s]' % info_type
    deidentify_config['info_type_transformations']['transformations'].append(
        config)
  return deidentify_config


def _get_redacted_dlp_response(message):
  """Calls the DLP API and returns the response.

    Args:
      message: The string that should be inspected by the DLP API.

    Returns:
      A DLP API deidentify content response.
  """

  dlp = dlp_v2.DlpServiceClient()
  info_types = [{'name': info_type} for info_type in _INFO_TYPE_LIST]
  inspect_config = {'info_types': info_types}
  deidentify_config = _build_deidentify_config(_INFO_TYPE_LIST)
  item = {'value': message}
  parent = dlp.project_path(_PROJECT_ID)
  return dlp.deidentify_content(
      parent,
      inspect_config=inspect_config,
      deidentify_config=deidentify_config,
      item=item)


def _post_scrubbed_message_to_pub_sub(message_topic, scrubbed_message,
                                      log_json):
  """Posts the log json payload with redacted PII to a pub/sub topic.

    Args:
      message_topic: The pub/sub topic to post the message to.
      scrubbed_message: The PII scrubbed message string.
      log_json: The original log json.
  """

  publisher = pubsub_v1.PublisherClient()
  topic_path = publisher.topic_path(_PROJECT_ID, message_topic)
  log_json['jsonPayload']['message'] = scrubbed_message
  data = json.dumps(log_json).encode('utf-8')
  message_future = publisher.publish(topic_path, data=data)
  message_future.add_done_callback(_post_scrubbed_message_callback)


def _post_scrubbed_message_callback(message_future):
  """The pub/sub message post callback.

    Args:
      message_future: A google.api_core.future.Future object returned from the
        pub/sub publish call.
  """

  if message_future.exception(timeout=30):
    logging.info('Publishing message on {} threw an Exception {}.'.format(
        _OUTPUT_TOPIC_NAME, message_future.exception()))
  else:
    logging.info("Posted message id:" + message_future.result())