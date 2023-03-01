# Copyright 2022 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# TODO: Edit the README file to link this new folder

import argparse
from datetime import datetime
import logging
import random

from apache_beam import DoFn, GroupByKey, io, ParDo, Pipeline, \
    PTransform, WindowInto, WithKeys
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.transforms.window import FixedWindows

import xml.etree.ElementTree as ET


class GroupMessagesByFixedWindows(PTransform):
    """A composite transform that groups Pub/Sub messages based on publish time
    and outputs a list of tuples, each containing a message and its publish
    time.
    """

    def __init__(self, window_size, num_shards=5):
        # Set window size to 60 seconds * window_size.
        self.window_size = int(window_size * 60)
        self.num_shards = num_shards

    def expand(self, pcoll):
        return (
            pcoll
            # Bind window info to each element using element timestamp (or \
            # publish time).
            | "Window into fixed intervals"
            >> WindowInto(FixedWindows(self.window_size))
            | "Add timestamp to windowed elements" >> ParDo(AddTimestamp())
            # Assign a random key to each windowed element based on the \
            # number of shards.
            | "Add key" >> WithKeys(
                lambda _: random.randint(0, self.num_shards - 1)
            )
            # Group windowed elements by key. All the elements in the same \
            # window must fit memory for this. If not, you need to use \
            # `beam.util.BatchElements`.
            | "Group by key" >> GroupByKey()
        )


class AddTimestamp(DoFn):
    def process(self, element, publish_time=DoFn.TimestampParam):
        """Processes each parsed element by extracting the message body and its
        received time into a tuple.
        """
        yield (
            {
                "ts": datetime.utcfromtimestamp(float(publish_time)).
                strftime("%Y-%m-%d %H:%M:%S.%f")
            } | element
        )


class ParseXML(DoFn):
    def process(self, message_body):
        """Parse all tags and attributes from an XML and serialize them to a
        dict for later storage."""

        try:
            parsedXml = ET.fromstring(message_body)
            allTags = []
            allTagsText = []
            for element in parsedXml:
                allTags.append(element.tag)
                allTagsText.append(element.text)
            yield {"tags": allTags, "text": allTagsText}
        except Exception as e:
            yield {"error": str(e), "raw_contents": message_body}


class WriteToGCS(DoFn):
    def __init__(self, output_path):
        self.output_path = output_path

    def process(self, key_value, window=DoFn.WindowParam):
        """Write messages in a batch to Google Cloud Storage."""

        ts_format = "%H:%M"
        window_start = window.start.to_utc_datetime().strftime(ts_format)
        window_end = window.end.to_utc_datetime().strftime(ts_format)
        shard_id, parsed_payload = key_value
        filename = "{0}streaming_data-{1}-{2}-{3}.txt".format(self.output_path,
                                                              window_start,
                                                              window_end,
                                                              str(shard_id))

        with io.gcsio.GcsIO().open(filename=filename, mode="w") as f:
            f.write(f"{parsed_payload}\n".encode("utf-8"))


def run(project_id,
        input_topic,
        gcs_path,
        window_size,
        num_shards,
        runner,
        region,
        pipeline_args=None):
    # Set `save_main_session` to True so DoFns can access globally imported
    # modules.
    input_topic = "projects/{0}/topics/{1}".format(project_id, input_topic)
    if gcs_path[-1] == "/":
        gcs_path = gcs_path[:-1]
    output_path = "{0}/output/".format(gcs_path)
    provided_args = {
        "project": project_id,
        "runner": runner,
        "region": region,
        "staging_location": "{0}/staging/".format(gcs_path),
        "temp_location": "{0}/temp/".format(gcs_path),
        "streaming": True,
        "save_main_session": True
        }

    pipeline_options = PipelineOptions(
        pipeline_args, **provided_args
    )

    with Pipeline(options=pipeline_options) as pipeline:
        (
            pipeline
            # Because `timestamp_attribute` is unspecified in `ReadFromPubSub`,
            # Beam binds the publish time returned by the Pub/Sub server for
            # each message to the element's timestamp parameter, accessible via
            # `DoFn.TimestampParam`.
            # https://beam.apache.org/releases/pydoc/current/apache_beam.io.gcp.pubsub.html#apache_beam.io.gcp.pubsub.ReadFromPubSub
            # https://cloud.google.com/pubsub/docs/stream-messages-dataflow#set_up_your_pubsub_project
            | "Read from Pub/Sub" >> io.ReadFromPubSub(topic=input_topic)
            | "Parse XML tags and attributes" >> ParDo(ParseXML())
            | "Window into" >> GroupMessagesByFixedWindows(window_size,
                                                           num_shards)
            | "Write to GCS" >> ParDo(WriteToGCS(output_path))
        )


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--project_id",
        help="The GCP project that hosts the PubSub and Dataflow.",
    )
    parser.add_argument(
        "--input_topic_id",
        help="The Cloud Pub/Sub topic to read from.",
    )
    parser.add_argument(
        "--runner",
        help="""The beam runner to be used. For cloud Dataflow:
        'DataflowRunner'. For local debugging: 'DirectRunner'.
        [Defaults to: 'DataflowRunner']""",
        default='DataflowRunner',
    )
    parser.add_argument(
        "--region",
        help="The GCP region for Dataflow. [Defaults to: 'us-central1']",
        default='us-central1',
    )
    parser.add_argument(
        "--window_size",
        type=float,
        default=1.0,
        help="Output file's window size in minutes. [Defaults to: 1.0]",
    )
    parser.add_argument(
        "--gcs_path",
        help="Path of the output GCS file including the prefix.",
    )
    parser.add_argument(
        "--num_shards",
        type=int,
        default=5,
        help="""Number of shards to use when writing windowed elements to GCS.
        [Defaults to: 5]""",
    )
    known_args, pipeline_args = parser.parse_known_args()

    run(
        known_args.project_id,
        known_args.input_topic_id,
        known_args.gcs_path,
        known_args.window_size,
        known_args.num_shards,
        known_args.runner,
        known_args.region,
        pipeline_args,
    )
