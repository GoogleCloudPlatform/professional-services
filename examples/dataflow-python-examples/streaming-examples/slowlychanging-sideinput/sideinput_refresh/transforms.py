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

import json
import logging
from typing import Any, Dict, Iterable, List, Tuple

import apache_beam as beam
import apache_beam.io.filesystem as beamfs
from apache_beam.io.fileio import ReadableFile
from apache_beam.io.filesystems import FileSystems

from sideinput_refresh import util


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

    # Replaced this with a ReadSideInputFile Dofn
    def _readfile(
        self, readable_file: ReadableFile
    ) -> Dict[str, Any]:  # -> List[Dict[str, Any]]
        """Reads the records from the file and converts them to Json objects (i.e dicts)
        Args:
         readable_file: Readable file instance containing metadata with path and size of the file

        Returns: Json object representing side input record
        """
        logging.info(f"Loading data from file: {readable_file.metadata.path}")
        with readable_file.open(compression_type=None) as file_handle:
            for record in file_handle.readlines():
                try:
                    yield json.loads(record)
                except Exception as e:
                    logging.error("Error: %s while parsing record: %s", str(e),
                                  record)

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
                    )
                | "Read Contents" >> beam.FlatMap(self._readfile)
               )
        # yapf: enable


def enrich_event(sales_event: bytes, bonuspoints: Dict[str, Any],
                 discountpct: Dict[str, Any],
                 category: Dict[str, Any]) -> Tuple[None, Dict[str, Any]]:
    """Enriches main event with values from side input data
       Note: In this example a dummy key has been added to each event to group all the events inside a window into single
       batch. Appropriate design choice must be made depending on how the final enriched events needs to be processed.

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

    return (None, event)


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


@beam.typehints.with_input_types(Iterable[Dict[str, Any]])
class LogFn(beam.DoFn):
    """Emits the current window information and enriched events to log output"""

    def process(self,
                element,
                timestamp=beam.DoFn.TimestampParam,
                window=beam.DoFn.WindowParam,
                pane_info=beam.DoFn.PaneInfoParam):

        # Logs one message per window trigger indicating the window and pane information
        if not isinstance(window, beam.transforms.window.GlobalWindow):
            logging.info(
                f"Timestamp:{timestamp};Window Start:{util.get_formatted_time(window.start)}; "
                f"Window end:{util.get_formatted_time(window.end)}; Pane Info:{pane_info}"
            )

        for event in element:
            logging.info(event)


@beam.ptransform_fn
def LogEvents(pcol):
    pcol | 'Output Events' >> beam.ParDo(LogFn())
