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

import logging
from typing import List

import apache_beam as beam
from apache_beam.io.filesystems import FileSystems

from sideinput_refresh import util


@beam.typehints.with_input_types(bytes)
@beam.typehints.with_output_types(beam.pvalue.TaggedOutput)
class SplitToMultiple(beam.DoFn):
    """Generates a base path for each side input type combining root path received via file notification subscription
       and side input type. PCollection recieved will contain only single element representing base path and will
       be fired once every x hours matching the side input refresh frequency

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

        # Logging to audit triggering of side input refresh process. Statement will be logged only whenever the pubsub notification
        # triggers side input refresh process (i.e normally once in every x hours)
        if isinstance(window, beam.transforms.window.GlobalWindow):
            logging.info(
                f"(Re)loading side input data from basepath {element.decode()} for global window: {timestamp} - {window}"
            )
        else:
            logging.info(
                f"(Re)loading side input data from basepath {element.decode()} for window: {util.get_formatted_time(window.start)} - {util.get_formatted_time(window.end)}"
            )

        for sideinput_type in self.sideinput_types:
            yield beam.pvalue.TaggedOutput(
                sideinput_type,
                FileSystems.join(element.decode(), sideinput_type,
                                 self.file_prefix))
