# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
This script demonstrates a Dataflow pipeline which reads messages from pubsub and writes messages to GCS location.
GCS location will be dynamically constructed during runtime based on the file naming policy utilizing current window
constructs.

Args:
    --project: GCP project ID
    --pubsub-subscription: pub sub subscription name from which messages are consumed
    --window-duration:  Fixed size window duration must be provided in seconds.
    --output-location: GCS Output base path for writing the messages

Example Usage:

python -m window_filenamingpolicy
  --project=<project> \
  --region=us-central1  \
  --runner=DataFlowRunner \
 --pubsub-subscription=<subscription-name> \
 --window-duration=<subscription-name> \
 --output-location=<GCS path> \
 --staging_location=<GCS path> \
 --temp_location=<GCS Path>
"""
import argparse
import json
import re
from datetime import timezone
from typing import Dict, List, Tuple

import apache_beam as beam
import apache_beam.io.fileio as fileio
from apache_beam.options.pipeline_options import (GoogleCloudOptions,
                                                  PipelineOptions, SetupOptions,
                                                  StandardOptions)


def get_subscription_path(project: str, subscription_name: str) -> str:
    """"Helper function to build topic subscription path from project and subscription name

      Args:
        project: GCP Project id
        subscription_name: PubSub Subscription name

      Returns:
        PubSub Subscription Path

  """
    if re.match('projects/([^/]+)/subscriptions/(.+)', subscription_name):
        return subscription_name

    return f"projects/{project}/subscriptions/{subscription_name}"


def window_file_naming_policy(filenaming_options: Dict[str, str]):
    """"Helper function to build topic subscription path from project and subscription name

      Args:
        filenaming_options: Set of values that needs to be substituted in creating file path from template

      Returns:
        filepath with values substituted in the template

  """

    def _window_file_naming(window, pane, shard_index, total_shards,
                            compression, destination):

        def _get_formatted_time(timestamp, datetime_format: str,
                                time_zone: str):
            """
          Args:
          :param timestamp: instance of type apache_beam.utils.Timestamp containing seconds since epoch
          :return: Formatted datetime in local time zone
          """
            utc_dt = timestamp.to_utc_datetime()
            if time_zone == "local":
                return utc_dt.replace(tzinfo=timezone.utc).astimezone(
                    tz=None).strftime(datetime_format)

            return utc_dt.strftime(datetime_format)

        file_name = filenaming_options["file_naming_template"].\
                    format(windowstart = _get_formatted_time(window.start, filenaming_options["windowstart_format"]
                                                                          ,filenaming_options["timezone"])
                           ,windowend = _get_formatted_time(window.end, filenaming_options["windowend_format"]
                                                                     ,filenaming_options["timezone"])
                                            ,shard = shard_index
                                            ,total_shards = total_shards
                                            ,suffix = filenaming_options["file_suffix"]
                         )
        return file_name

    return _window_file_naming


def parse_cliargs() -> Tuple[argparse.Namespace, List[str]]:
    """"Parses Command line arguments

      Args: None

      Returns:
          Tuple containing Namespace object with specified arguments and list of extra arguments
  """
    args_parser = argparse.ArgumentParser()

    args_parser.add_argument('--project',
                             type=str,
                             help="Google Cloud project id",
                             required=True)

    args_parser.add_argument('--pubsub-subscription',
                             type=str,
                             help="Cloud Pub/Sub subscription name",
                             required=True)

    args_parser.add_argument('--window-duration',
                             type=int,
                             help="Duration of the window in seconds",
                             required=True)

    args_parser.add_argument('--output-location',
                             type=str,
                             help="Base path location to write the messages",
                             required=True)

    args_parser.add_argument(
        '--file-naming-template',
        type=str,
        help=
        "File naming template (e.g: {windowstart}-{windowend}/{shard:05d}-of-{total_shards:05d}{suffix}) ",
        default=
        "{windowstart}-{windowend}/{shard:05d}-of-{total_shards:05d}{suffix}")

    args_parser.add_argument(
        '--windowstart-format',
        type=str,
        help="Window Start naming forrmat (e.g: %%Y/%%m/%%d/%%H%%M) ",
        default="%Y/%m/%d/%H%M")

    args_parser.add_argument('--windowend-format',
                             type=str,
                             help="Window end naming forrmat (e.g: %%H%%M) ",
                             default="%H%M")

    args_parser.add_argument('--timezone',
                             type=str,
                             help="Time Zone to be used for window timestamp ",
                             choices=['local', 'utc'],
                             default="utc")

    args_parser.add_argument('--file-suffix',
                             type=str,
                             help="File suffix format",
                             default=".txt")

    return args_parser.parse_known_args()


def run(user_args: argparse.Namespace,
        pipeline_options: PipelineOptions) -> None:
    """"Builds and run the pipeline

      Args:
          user_args: Command line arguments specified by the user
          pipeline_options: Dataflow Pipeline options

      Returns:
          None
  """
    # yapf: disable
    with beam.Pipeline(options=pipeline_options) as pipeline:
        (pipeline
           | 'Read from pubsub' >> beam.io.ReadFromPubSub(subscription=user_args.pubsub_subscription)
           | 'Add window' >> beam.WindowInto(beam.window.FixedWindows(user_args.window_duration))
           | 'Decode Message' >> beam.Map(lambda message: json.dumps(message.decode()))
           | 'Write to File' >>  fileio.WriteToFiles(
                                    path=user_args.output_location
                                   ,file_naming=window_file_naming_policy(user_args.__dict__)
                                   #,temp_directory=StaticValueProvider(str,user_args.temp_location)
                                   # ,shards=1
                                 )
        )
    # yapf: enable


def main():
    """"Driver function to parse command line args, build pipeline options
       and invokes pipeline
  """
    known_args, extra_args = parse_cliargs()
    known_args.pubsub_subscription = get_subscription_path(
        known_args.project, known_args.pubsub_subscription)

    # Build Pipeline Options
    pipeline_options = PipelineOptions(flags=extra_args)
    pipeline_options.view_as(SetupOptions).save_main_session = True
    pipeline_options.view_as(StandardOptions).streaming = True
    pipeline_options.view_as(GoogleCloudOptions).project = known_args.project
    # pipeline_options.view_as(GoogleCloudOptions).temp_location = known_args.temp_location
    run(known_args, pipeline_options)


if __name__ == "__main__":
    main()
