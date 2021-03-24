#  Copyright 2020 Google LLC.
#  This software is provided as-is, without warranty or representation for any use or purpose.
#  Your use of it is subject to your agreement with Google.
from apache_beam import DoFn, pvalue
from apache_beam.metrics import Metrics

from ..model import data_classes
from ..model.data_classes import Record


class ParseCSVDoFn(DoFn):
  CORRECT_OUTPUT_TAG = 'accommodations'
  WRONG_OUTPUT_TAG = 'parse_errors'

  def __init__(self, header_line: str):
    """ Parse the CSV data and create a PCollection of Accommodation.

    Args:
        header_line: The header line used in the CSV line, it will be ignored by the parser.
    """
    self._header_line = header_line

    # Metrics to report the number of records
    self.input_records_counter = Metrics.counter("ParseCSVDoFn", 'input_records')
    self.correct_records_counter = Metrics.counter("ParseCSVDoFn", 'correct_records')
    self.wrong_records_counter = Metrics.counter("ParseCSVDoFn", 'wrong_records')

  def process(self, element: str):
    self.input_records_counter.inc()


    # We have two outputs: one for well formed input lines, and another one with potential parsing errors
    # (the parsing error output will be written to a different BigQuery table)
    try:
      # ignore header row
      if element != self._header_line:
        record: Record = data_classes.line2record(element)
        self.correct_records_counter.inc()
        yield pvalue.TaggedOutput(ParseCSVDoFn.CORRECT_OUTPUT_TAG, record)
    except TypeError as err:
      self.wrong_records_counter.inc()
      msg = str(err)
      yield pvalue.TaggedOutput(ParseCSVDoFn.WRONG_OUTPUT_TAG, {'error': msg, 'line': element})