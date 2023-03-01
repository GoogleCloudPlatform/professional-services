# Copyright 2023 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.cloud import pubsub_v1
import time
import signal
import logging
import argparse

publisher = pubsub_v1.PublisherClient()

DEFAULT_XML_STRING = """<note><to>PubSub</to><from>Test</from><heading>Test
</heading><body>Sample body</body></note>"""
DEFAULT_SEND_PERIOD = 1


def user_abort_handler(signum, frame):
    confirm = input("\nCtrl-C was pressed. Do you really want to abort? Y/N ")
    if confirm.lower() == 'y':
        exit(1)


signal.signal(signal.SIGINT, user_abort_handler)


def run(project_id, pub_sub_topic_id, xml_string, message_send_interval):
    topic_path = publisher.topic_path(project_id, pub_sub_topic_id)

    while True:
        data = xml_string
        # Data must be a bytestring
        data = data.encode("utf-8")
        # When you publish a message, the client returns a future.
        future = publisher.publish(topic_path, data=data)
        print(future.result())
        time.sleep(message_send_interval)


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--project_id",
        help="The GCP project that hosts the PubSub.",
    )
    parser.add_argument(
        "--pub_sub_topic_id",
        default="pub_sub_to_xml",
        help="""The Cloud Pub/Sub topic to post to.
        The resulting full PubSub topic will be: 'projects/<PROJECT_ID>/topics/
        <PUB_SUB_TOPIC_ID>'.""",
    )
    parser.add_argument(
        "--xml_string",
        default=DEFAULT_XML_STRING,
        help="An XML encoded string to post to PubSub. [Defaults to '"
        + DEFAULT_XML_STRING + "']",
    )
    parser.add_argument(
        "--message_send_interval",
        type=int,
        default=DEFAULT_SEND_PERIOD,
        help="""Number of seconds to wait in between sending messages to
        PubSub. [Defaults to """ + str(DEFAULT_SEND_PERIOD) + " seconds.]",
    )
    known_args, other_args = parser.parse_known_args()

    run(
        known_args.project_id,
        known_args.pub_sub_topic_id,
        known_args.xml_string,
        known_args.message_send_interval
    )
