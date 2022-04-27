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

import apache_beam as beam
from apache_beam import PCollection

from ..model.data_classes import HEADER, Record
from .parse_csv import ParseCSVDoFn



class ExtractDataTransform(beam.PTransform):
  def __init__(self, csv_location: str):
    """ Read and parse input data.
        Returns a successful PCollection and an error-output one.

    Args:
        csv_location: GCS path to CSV input
    """
    self._csv_location = csv_location

    super().__init__()

  def expand(self, pipeline):
    # Read all inputs
    lines: PCollection[str] = pipeline | "Read CSV" >> beam.io.ReadFromText(self._csv_location)

    # Reshuffle after reading lines, just in case we had some very large files
    reshuffled = lines | "Reshuffle after reading" >> beam.Reshuffle()

    # Parse CSV
    records_and_errors = reshuffled | "To Records" >> beam.ParDo(ParseCSVDoFn(HEADER)).with_outputs()

    records: PCollection[Record] = records_and_errors[ParseCSVDoFn.CORRECT_OUTPUT_TAG]
    parsing_errors: PCollection[dict] = records_and_errors[ParseCSVDoFn.WRONG_OUTPUT_TAG]

    return records, parsing_errors