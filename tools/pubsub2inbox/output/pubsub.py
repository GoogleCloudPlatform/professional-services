#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
from .base import Output, NotConfiguredException
import json
from google.cloud import pubsub_v1
from concurrent import futures
import hashlib


class PubsubOutput(Output):

    def callback(self, future):
        pass

    def output(self):
        if 'topic' not in self.output_config:
            raise NotConfiguredException(
                'No Pub/Sub topic defined in configuration.')
        topic_template = self.jinja_environment.from_string(
            self.output_config['topic'])
        topic_template.name = 'topic'
        topic_output = topic_template.render()

        if 'content' not in self.output_config:
            raise NotConfiguredException(
                'No Pub/Sub message content defined in configuration.')

        messages = {'single': 'message'}
        if 'messages' in self.output_config:
            messages_template = self.jinja_environment.from_string(
                self.output_config['messages'])
            messages_template.name = 'messages'
            messages_output = messages_template.render()
            messages = json.loads(messages_output)

        publisher_options = pubsub_v1.types.PublisherOptions(
            enable_message_ordering=True if 'ordering_key' in
            self.output_config else False)
        client_options = {}
        if 'api_endpoint' in self.output_config:
            client_options = {
                "api_endpoint": self.output_config['api_endpoint']
            }
        publisher = pubsub_v1.PublisherClient(
            publisher_options=publisher_options, client_options=client_options)

        publish_futures = []
        if isinstance(messages, list):
            new_messages = {}
            for message in messages:
                new_messages[hashlib.md5(
                    json.dumps(message).encode()).hexdigest()] = message
            messages = new_messages
        for message_key, message_value in messages.items():
            attributes = {}
            if 'attributes' in self.output_config:
                attributes_template = self.jinja_environment.from_string(
                    self.output_config['attributes'])
                attributes_template.name = 'attributes'
                attributes_output = attributes_template.render(
                    key=message_key, value=message_value)
                attributes = json.loads(attributes_output)

            ordering_key = None
            if 'ordering_key' in self.output_config:
                ordering_key_template = self.jinja_environment.from_string(
                    self.output_config['ordering_key'])
                ordering_key_template.name = 'ordering_key'
                ordering_key = ordering_key_template.render(key=message_key,
                                                            value=message_value)

            content_template = self.jinja_environment.from_string(
                self.output_config['content'])
            content_template.name = 'content'
            content = content_template.render(key=message_key,
                                              value=message_value)

            if ordering_key:
                future = publisher.publish(topic_output,
                                           data=content.encode('utf-8'),
                                           ordering_key=ordering_key,
                                           **attributes)
            else:
                future = publisher.publish(topic_output,
                                           data=content.encode('utf-8'),
                                           **attributes)
            self.logger.info('Message published.',
                             extra={
                                 'key': message_key,
                                 'topic': topic_output,
                                 'attributes': attributes,
                                 'ordering_key': ordering_key
                             })
            future.add_done_callback(self.callback)
            publish_futures.append(future)

        futures.wait(publish_futures, return_when=futures.ALL_COMPLETED)
        self.logger.info('Message sending finished!',
                         extra={
                             'count': len(publish_futures),
                             'topic': topic_output,
                         })
