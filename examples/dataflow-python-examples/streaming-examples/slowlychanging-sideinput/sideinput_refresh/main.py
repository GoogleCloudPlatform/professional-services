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
"""This script demonstrates the concept of referencing multiple forms of side input data in GCS with main input data
loaded from pubsub, and triggering the refresh of side input data via PubSub notification on demand

Description of main and side inputs with sample records:
-------------------------------------------------------
Main Input: Sales event with schema:
  {"Txid":1, "productname": "Product 5 XL", "qty": 1, "sales": 97.65, "event_timestamp": "2020-05-02 19:08:24.796892"}

Example contains 3 side inputs:  Bonus points, Discount percent and Category
1. Bonus points -> {"productname": "Product 2", "bonuspoints": 204}
2. Discount percent -> {"productname": "Product 2", "discountpct": 0.62}
3. Category -> {"productname": "Product 3", "category": "laptop"}

Args:
    --project: GCP project ID
    --sideinput-notification-subscription: pub sub subscription name notifying new base path from which the side input
        data needs to be reloaded.
    --maininput-subscription: pub sub subscription name from which main input (i.e sales events) are consumed
    --sideinput-window-duration:  Side Input window duration. Ideally Global window needs to be used instead of fixed
      window. However on refresh new state is not replacing old state. Hence Fixed windows of longer duration (180 days
      to an year) can be used to avoid expiration of window. Duration must be provided in seconds.
    --maininput-window-duration: Main Input window duration in seconds
    (--demorun | --outputpath=<OUTPUTPATH>): Use demo run if ouptput should be written to log/stdout for inspection and
            specify output path for writing to persistent storage .


Example Usage:
python -m sideinput_refresh --project=<project> --region=us-central1  --runner=DataFlowRunner \
 --sideinput-notification-subscription=<subscription-name> \
 --maininput-subscription=<subscription-name> \
 --sideinput-window-duration=<518400> \
 --maininput-window-duration=<300> \
 (--demorun | --outputpath=<GCS path>) \
 --staging_location=<GCS path> \
 --temp_location=<GCS Path>
"""

import argparse
import json
import logging
import re
from typing import Dict, List, Tuple

import apache_beam as beam
from apache_beam.options.pipeline_options import (GoogleCloudOptions,
                                                  PipelineOptions, SetupOptions,
                                                  StandardOptions)
from apache_beam.pvalue import AsDict

from sideinput_refresh import dofns, transforms


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


def parse_cliargs(argv: List[str]) -> Tuple[argparse.Namespace, List[str]]:
    """"Parses Command line arguments

      Args:
          argv: List of command line arguments

      Returns:
          Tuple containing Namespace object with specified arguments and list of extra arguments
  """
    args_parser = argparse.ArgumentParser()

    args_parser.add_argument('--project',
                             type=str,
                             help="Google Cloud project id",
                             required=True)

    args_parser.add_argument(
        '--sideinput-notification-subscription',
        type=str,
        help="Cloud Pub/Sub Side input notificaton subscription name",
        required=True)

    args_parser.add_argument('--maininput-subscription',
                             type=str,
                             help="Cloud Pub/Sub main input subscription name",
                             required=True)

    args_parser.add_argument(
        '--sideinput-window-duration',
        type=int,
        help="Duration of the side input window in seconds",
        required=True)

    args_parser.add_argument(
        '--maininput-window-duration',
        type=int,
        help="Duration of the main input window in seconds",
        required=True)

    sink_choices = args_parser.add_mutually_exclusive_group(required=True)

    sink_choices.add_argument(
        '--demorun',
        help="Flag to write the output to log sink instead of file sink",
        action='store_true')

    sink_choices.add_argument(
        '--outputpath',
        type=str,
        help="Output file path e.g: (gs://<buckername>/prefix)",
        action='store')

    return args_parser.parse_known_args(argv)


def get_sideinput_collections(sideinput_filepath: beam.pvalue.PCollection, readTransform: beam.PTransform) \
        -> Dict[str,beam.pvalue.PCollection]:
    """"Load Side Input data from respective file paths

      Args:
          sideinput_filepath: File path representing base path for side inputs to be loaded
          readTransform: Transform responsible for loading the side input data

      Returns:
          Dictionary containing Side Input name as key and corresponding PCollection as value
  """
    sideinput_types = get_sideinput_types()
    # yapf: disable
    filepaths =  (sideinput_filepath
                  | "Get side input paths from base path" >> beam.ParDo(
                     dofns.SplitToMultiple(sideinput_types)).with_outputs(*sideinput_types)
                  )

    sideinput_collections = {}
    for sideinput_type in sideinput_types:
        sideinput_collections[sideinput_type] = (filepaths[sideinput_type]
                                                    | f"Read {sideinput_type}" >> readTransform
                                                   | f"{sideinput_type}:Extract KV" >> beam.Map(
                                                     transforms.kv_of, "productname", sideinput_type)
                                                 )
    # yapf: enable
    return sideinput_collections



def get_enriched_events(salesevent: beam.pvalue.PCollection,sideinput_collections: Dict[str,beam.pvalue.PCollection]) \
        -> beam.pvalue.PCollection:
    """Gets enriched events by
        a) Call a transform that combining primary event with corresponding side input values
        b) Group events by dummy key to combine all events in a window into one shard
        c) Discard dummy key

     Args:
        salesevent: Event representing sales transaction
        sideinput_collections: Set of Side Input Collections
    """
    # yapf: disable
    return (salesevent
             | "Enrich event" >> beam.Map(transforms.enrich_event,
                                       AsDict(sideinput_collections["bonuspoints"]),
                                       AsDict(sideinput_collections["discountpct"]),
                                       AsDict(sideinput_collections["category"]))
             | "Group events by dummy Key" >> beam.GroupByKey()
             | "Discard dummy Key" >> beam.Values()
          )
    # yapf: enable


def get_sideinput_types() -> List[str]:
    """Returns list of side input types

     Returns:
        Side Input types
     """

    return ["bonuspoints", "discountpct", "category"]


def run(argv: List[str] = None, save_main_session: bool = True) -> None:
    """"Driver function to parse command line args, build pipeline options and invokes pipeline

      Args:
          argv: Command line arguments specified by the user
          save_main_session: Setting to indicate the visibility of modules to beam

      Returns:
          None
  """
    known_args, extra_args = parse_cliargs(argv)
    known_args.maininput_subscription = get_subscription_path(
        known_args.project, known_args.maininput_subscription)
    known_args.sideinput_notification_subscription = get_subscription_path(
        known_args.project, known_args.sideinput_notification_subscription)

    pipeline_options = PipelineOptions(flags=extra_args)
    pipeline_options.view_as(GoogleCloudOptions).project = known_args.project
    pipeline_options.view_as(SetupOptions).save_main_session = save_main_session
    pipeline_options.view_as(StandardOptions).streaming = True

    pipeline = beam.Pipeline(options=pipeline_options)

    # Get Side Input Refresh Notification
    # yapf: disable
    sideinput_filepath = (pipeline
                     | "Read Side input file path from pubsub subscription" >> beam.io.ReadFromPubSub(subscription=known_args.sideinput_notification_subscription)
                     | "Side input fixed window with early trigger" >> beam.WindowInto(
                    beam.window.FixedWindows(known_args.sideinput_window_duration),
                    trigger=beam.trigger.Repeatedly(beam.trigger.AfterCount(1)),
                    accumulation_mode=beam.trigger.AccumulationMode.DISCARDING)
               )

    # Get Side Input data
    # Ideally instead of writing transform to ReadSideInputData, an inbuilt transform textio.ReadAllFromText(coder=coders.UTF8JsonCoder())
    # can be used. However when ReadAllFromText is used despite of loading all data certain elements are not propogating well as side input
    # Created a BEAM issue https://issues.apache.org/jira/browse/BEAM-10148 for further investigation
    # Once issue is fixed transforms.ReadSideInputData() will be replaced with apache_beam.io.textio.ReadAllFromText(coder=coders.UTF8JsonCoder()))
    sideinput_collections = get_sideinput_collections(sideinput_filepath,transforms.ReadSideInputData())

    # Get Sales as main input
    primary_events = (pipeline
                       | "Read sales events from pubsub subscription" >> beam.io.ReadFromPubSub(subscription=known_args.maininput_subscription)
                       | "Main input fixed window" >> beam.WindowInto(beam.window.FixedWindows(known_args.maininput_window_duration))
                    )

    # Enrich primary events with side input data
    enriched_events = get_enriched_events(primary_events, sideinput_collections)

    # Write enriched events to sink
    if known_args.demorun:
        enriched_events | "Write output to Log" >> transforms.LogEvents()
    else:
        (enriched_events
                |  "Unpack the events" >> beam.FlatMap(lambda x: list(map(json.dumps, x)))
                |  "Write output to GCS" >> beam.io.fileio.WriteToFiles(known_args.outputpath, shards=1)
         )
    # yapf: enable

    pipeline_result = pipeline.run()

    # Used while testing locally
    if pipeline_options.view_as(StandardOptions).runner == "DirectRunner":
        pipeline_result.wait_until_finish()


if __name__ == "__main__":
    logging.getLogger().setLevel(level=logging.INFO)
    run()
