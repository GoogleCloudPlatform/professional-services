# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
`pubsub.py`
Pubsub exporter class.
"""
import json
from google.cloud import pubsub_v1
from slo_generator.exporters.base import Exporter


class PubsubExporter(Exporter):
    """Pubsub exporter class."""

    def __init__(self):
        self.publisher = pubsub_v1.PublisherClient()

    def export(self, data, **config):
        """Export data to a Pub/Sub topic name.

        Args:
            data (dict): Data to send to Pub/Sub topic.
            config (dict): Pub/Sub configuration.
                project_id (str): Project id.
                topic_name (str): Topic name.

        Returns:
            str: Pub/Sub topic id.
        """
        project_id = config['project_id']
        topic_name = config['topic_name']
        topic_path = self.publisher.topic_path(project_id, topic_name)
        data = json.dumps(data, indent=4)
        data = data.encode('utf-8')
        return self.publisher.publish(topic_path, data=data).result()
