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
This script demonstrates the concept of referencing multiple forms of side input data in GCS with main input data
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

Example Usage:

python -m sideinput_refresh
 --project=<project> \
 --region=us-central1  \
 --runner=DataFlowRunner \
 --sideinput-notification-subscription=<subscription-name> \
 --maininput-subscription=<subscription-name> \
 --sideinput-window-duration=<518400> \
 --maininput-window-duration=<300> \
 --staging_location=<GCS path> \
 --temp_location=<GCS Path>
"""

import argparse
import json
import logging
import random
import re
from datetime import timezone
from typing import Any, Dict, Iterable, List, Tuple

import apache_beam as beam
import apache_beam.io.filesystem as beamfs
from apache_beam.io.fileio import ReadableFile
from apache_beam.io.filesystems import FileSystems
from apache_beam.options.pipeline_options import (PipelineOptions, SetupOptions,
                                                  StandardOptions)
from apache_beam.pvalue import AsDict


############################# Dofn  classes ###############
@beam.typehints.with_input_types(str)
@beam.typehints.with_output_types(Tuple[str, Any])
class ReadStaticSideInput(beam.DoFn):
    """Helper Dofn function that generates static side input data and can be used in to validate the functionality
       instead of reading side input data from persistent storage such as GCS/LocalFileSystem

       Attributes:
         sideinput_type: Side Input type for which the data needs to be generated
         products: Static list  of products that matches with product names from the main input
    """

    def __init__(self, sideinput_type: str):
        self.sideinput_type: str = sideinput_type
        self.products: List[str] = [
            "Product 2", "Product 2 XL", "Product 3", "Product 3 XL",
            "Product 4", "Product 4 XL", "Product 5", "Product 5 XL"
        ]

    def _get_lookup_values(self) -> List[Any]:
        """Generates product look up values  based on side input type in random fashion

      Returns:
          List of product look up values (numbers/text)
      """
        if self.sideinput_type == "bonuspoints":
            multiplier: int = random.randint(10, 20)
            return [
                random.randint(1, 20) * multiplier for product in self.products
            ]
        elif self.sideinput_type == "discountpct":
            return [round(random.random(), 2) for product in self.products]
        else:
            categories = [
                "tables", "chairs", "couch", "shoes", "electronics", "mobile",
                "printer", "laptop"
            ]

            return random.sample(categories,
                                 k=len(categories))  # Shuffles data every time

    def process(self,
                element,
                timestamp=beam.DoFn.TimestampParam,
                window=beam.DoFn.WindowParam,
                pane_info=beam.DoFn.PaneInfoParam):
        """Called once for each side input type whenever the side input data needs to be refreshed
           Fetches look up values, associates the look up values to the corresponding products

         Args:
             element(str): Pipeline input element
             timestamp: Timestamp associated with an input element assigned by source
             window: window information
             pane_info: Pane details

         Returns:
            Tuple containing product name and corresponding look up value
         """
        lookup_values = self._get_lookup_values()

        window_start = get_formatted_time(window.start, time_zone='UTC')
        window_end = get_formatted_time(window.end, time_zone='UTC')
        logging.info(
            f"Timestamp:{timestamp};Window Start{window_start}; Window end:{window_end}; Pane Info:{pane_info}",
            self.sideinput_type)

        products_lookupvalues = [(product, lookup_values[index])
                                 for index, product in enumerate(self.products)]
        logging.info(
            ",".join([
                f"{productinfo[0]} - {productinfo[1]}"
                for productinfo in products_lookupvalues
            ]), self.sideinput_type)

        for product in products_lookupvalues:
            yield product


@beam.typehints.with_input_types(bytes)
@beam.typehints.with_output_types(beam.pvalue.TaggedOutput)
class SplitToMultiple(beam.DoFn):
    """Generates a base path for each side input type combining root path received via file notification subscription
       and side input type

       Attributes:
         sideinput_types: List of Side input types
         file_prefix: file_prefix matching required files. Default is * indicating all files
    """

    def __init__(self, sideinput_types: List[str], file_prefix: str = "*"):
        self.sideinput_types = sideinput_types
        self.file_prefix = file_prefix

    def process(self,
                element,
                timestamp=beam.DoFn.TimestampParam,
                window=beam.DoFn.WindowParam,
                pane_info=beam.DoFn.PaneInfoParam):
        logging.info(
            f"(Re)loading side input data for window: {get_formatted_time(window.start)} - {get_formatted_time(window.end)}"
        )
        for sideinput_type in self.sideinput_types:
            yield beam.pvalue.TaggedOutput(
                sideinput_type,
                FileSystems.join(element.decode(), sideinput_type,
                                 self.file_prefix))


@beam.typehints.with_input_types(Tuple[str, Iterable[Dict[str, Any]]])
class PrintEvents(beam.DoFn):
    """Logs the current window information and enriched events to Stackdriver logs"""

    def process(self,
                element,
                timestamp=beam.DoFn.TimestampParam,
                window=beam.DoFn.WindowParam,
                pane_info=beam.DoFn.PaneInfoParam):
        logging.info(
            f"Timestamp:{timestamp};Window Start:{get_formatted_time(window.start)}; "
            f"Window end:{get_formatted_time(window.end)}; Pane Info:{pane_info}"
        )
        for event in element[1]:
            logging.info(event)


############################# Transforms ###############
@beam.typehints.with_input_types(str)
@beam.typehints.with_output_types(Dict[str, Any])
class ReadSideInputData(beam.PTransform):
    """Reads Side Input new line delimited Json data from appropriate location

       Attributes:
         compression: Side Input data compression type
    """

    def __init__(self, compression: str = None):
        self.compression = compression

    def _match_files(
            self, file_pattern: str) -> List[beam.io.filesystem.FileMetadata]:
        """Fetch files based on the file pattern.
        Args:
         file_pattern: Full path of the files containing data

        Returns:
         List of matching FileMetadata instances
        """
        match_results = FileSystems.match([file_pattern])
        match_result = match_results[0]

        if match_result.metadata_list:
            return match_result.metadata_list

    def _readfile(self, readable_file: ReadableFile) -> List[Dict[str, Any]]:
        """Reads the records from the file and converts them to Json objects (i.e dicts)
        Args:
         readable_file: Readable file instance containing metadata with path and size of the file

        Returns:
         List of json objects representing side input records
        """
        logging.info(f"Loading data from file: {readable_file.metadata.path}")
        output_values = []
        with readable_file.open(compression_type=None) as file_handle:
            for record in file_handle.readlines():
                try:
                    output_values.append(json.loads(record))
                except Exception as e:
                    logging.error("Error: %s while parsing record: %s", str(e),
                                  record)
        return output_values

    def expand(self, pcol):
        """Fetch files based on the file pattern, read the contents from matching files

        Args:
         pcol: PCollection containing list of file patterns

        Returns:
         PCollection of type Json objects that represents data read from the files
        """
        # yapf: disable
        return (pcol
                | "Match files" >> beam.FlatMap(self._match_files).with_output_types(beamfs.FileMetadata)
                | "Read Matches" >> beam.Map(
                        lambda metadata: ReadableFile(metadata, self.compression)
                    )  # Generates beam.io.fileio.ReadableFile
                | "Read Contents" >> beam.FlatMap(self._readfile)
               )
        # yapf: enable


############################# Transform Functions ###############
def enrich_event(sales_event: bytes, bonuspoints: Dict[str, Any],
                 discountpct: Dict[str, Any],
                 category: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    """Enriches main event with values from side input data

    Args:
        sales_event: Primary event data fetched from pubsub
        bonuspoints: Lookup dictionary with product name as key and corresponding bonus points as value
        discountpct: Lookup dictionary with product name as key and corresponding discount percent as value
        category: Lookup dictionary with product name as key and corresponding category as value

        Returns:
         Enriched event matching the side input data based on product name
    """
    event = json.loads(sales_event.decode())

    event["bonuspoints"] = bonuspoints.get(event["productname"],
                                           0) if bonuspoints else 0
    event["discountpct"] = discountpct.get(event["productname"],
                                           0.0) if discountpct else 0.0
    event["category"] = category.get(event["productname"],
                                     "Unknown") if category else "Unknown"

    return ("None", event)


def kv_of(event: Dict[str, Any], name_field: str,
          value_field: str) -> Tuple[Any, Any]:
    """Enriches main event with values from side input data

     Args:
      event: Primary event data fetched from pubsub
      name_field: Lookup key field name
      value_field: Lookup value field name

     Returns:
         Look up information representing product name and lookup value
    """
    return (event[name_field], event[value_field])


############################# Util Functions ###############
def get_formatted_time(timestamp: beam.utils.timestamp.Timestamp,
                       datetime_format: str = "%Y-%m-%d  %H:%M:%S",
                       time_zone: str = "local") -> str:
    """
     Args:
        timestamp: Seconds since epoch
        datetime_format: Date Time format
        time_zone: Time zone value either local/utc

     Returns:
         Formatted datetime in local/utc time zone
     """
    utc_dt = timestamp.to_utc_datetime()
    if time_zone == "local":
        return utc_dt.replace(tzinfo=timezone.utc).astimezone(
            tz=None).strftime(datetime_format)

    return utc_dt.strftime(datetime_format)


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

    return args_parser.parse_known_args()


############################# Main ###############
def run(user_args: argparse.Namespace,
        pipeline_options: PipelineOptions) -> None:
    """"Builds and run the pipeline

      Args:
          user_args: Command line arguments specified by the user
          pipeline_options: Dataflow Pipeline options

      Returns:
          None
  """
    pipeline = beam.Pipeline(options=pipeline_options)

    # Get Side Input Refresh Notification
    sideinput_types = ["bonuspoints", "discountpct", "category"]
    # yapf: disable
    filepaths = (pipeline
                 | "Read file path" >> beam.io.ReadFromPubSub(
                    subscription=user_args.sideinput_notification_subscription)
                 | "Add Fixed side window with early Trigger" >> beam.WindowInto(
                    beam.window.FixedWindows(user_args.sideinput_window_duration),
                    trigger=beam.trigger.Repeatedly(beam.trigger.AfterCount(1)),
                    accumulation_mode=beam.trigger.AccumulationMode.DISCARDING)
                 | "Split into multiple records" >> beam.ParDo(
                     SplitToMultiple(sideinput_types)).with_outputs(*sideinput_types)
               )

    # Get Side Input data
    sideinput_collections = {}
    for sideinput_type in sideinput_types:
        sideinput_collections[sideinput_type] = (filepaths[sideinput_type]
                                                  | f"Read {sideinput_type}" >> ReadSideInputData()
                                                  | f"Extract KV of {sideinput_type}" >> beam.Map(
                                                    kv_of, "productname", sideinput_type)
                                                )

    # Get Sales as main input
    _ = (pipeline
         | "Read Sales" >> beam.io.ReadFromPubSub(subscription=user_args.maininput_subscription)
         | "Add Fixed window" >> beam.WindowInto(beam.window.FixedWindows(user_args.maininput_window_duration))
         | "Enrich event" >> beam.Map(enrich_event,
                                   AsDict(sideinput_collections["bonuspoints"]),
                                   AsDict(sideinput_collections["discountpct"]),
                                   AsDict(sideinput_collections["category"]))
         | "Group the events" >> beam.GroupByKey()
         | "Print the events" >> beam.ParDo(PrintEvents())
        )
    # yapf: enable
    pipeline.run()  # .wait_until_finish()


def main():
    """"Driver function to parse command line args, build pipeline options
       and invokes pipeline
    """
    known_args, extra_args = parse_cliargs()
    known_args.maininput_subscription = get_subscription_path(
        known_args.project, known_args.maininput_subscription)
    known_args.sideinput_notification_subscription = get_subscription_path(
        known_args.project, known_args.sideinput_notification_subscription)
    pipeline_options = PipelineOptions()
    pipeline_options.view_as(SetupOptions).save_main_session = True
    pipeline_options.view_as(StandardOptions).streaming = True
    run(known_args, pipeline_options)


if __name__ == "__main__":
    main()
