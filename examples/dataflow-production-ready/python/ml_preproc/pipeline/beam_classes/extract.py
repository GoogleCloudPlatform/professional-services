#  Copyright 2020 Google LLC.
#  This software is provided as-is, without warranty or representation for any use or purpose.
#  Your use of it is subject to your agreement with Google.

import apache_beam as beam
from apache_beam import PCollection, pvalue

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