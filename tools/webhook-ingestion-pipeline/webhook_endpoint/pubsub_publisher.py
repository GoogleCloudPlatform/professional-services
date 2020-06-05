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
import logging

from google.cloud.pubsub_v1 import PublisherClient

import consts


class PubSubPublisher:

    _client_config = {
        "interfaces": {
            "google.pubsub.v1.Publisher": {
                "retry_params": {
                    "messaging": {
                        "total_timeout_millis": consts.PUBSUB_TIMEOUT_MS,
                    }
                }
            }
        }
    }

    def __init__(self, project_id):
        self.project_id = project_id
        self.client = PublisherClient(client_config=self._client_config)
        self.futures = dict()

    def _get_callback(self, f, data):
        def callback(f):
            if f.exception():
                logging.error(f"Please handle {f.exeption()} for {data}.")
            if data in self.futures:
                self.futures.pop(data)

        return callback

    def publish_data(self, topic_name, data, timeout=60):
        """ Publish Pub/Sub Data 
            
            :param topic_name: String name of topic
            :param data: String data being processed
            :param wait_for_ack: Bool if user wants to wait for ack
            :param timeout: Int seconds to wait
        """
        if isinstance(data, dict):
            data = json.dumps(data)

        self.futures.update({data: None})
        # When you publish a message, the client returns a future.
        topic_path = self.client.topic_path(self.project_id, topic_name)
        future = self.client.publish(
            topic_path, data=data.encode("utf-8")
        )
        self.futures[data] = future
        # Publish failures shall be handled in the callback function.
        future.add_done_callback(self._get_callback(future, data))

        return data
