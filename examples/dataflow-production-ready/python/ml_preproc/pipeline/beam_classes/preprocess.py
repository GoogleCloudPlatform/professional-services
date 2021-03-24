#  Copyright 2020 Google LLC.
#  This software is provided as-is, without warranty or representation for any use or purpose.
#  Your use of it is subject to your agreement with Google.

import apache_beam as beam
from apache_beam import PCollection, pvalue
from typing import Iterable, Dict
from .similarities import CalculateSimilaritiesDoFn
from ..model.data_classes import HEADER, Record
from .clean_records import CleanAndTransfToDictDoFn
from .parse_csv import ParseCSVDoFn


class PreprocessingTransform(beam.PTransform):
  def __init__(self, abbrev: Dict):
    """ The transform applied in this project

    Args:
        abbrev: Location of the abbreviations file.
    """
    self._abbrev = abbrev

    super().__init__()

  def expand(self, input):

    # Apply transformations
    clean_dicts: PCollection[dict] = input | "Clean Records" >> beam.ParDo(
      CleanAndTransfToDictDoFn(),
      abbrev=self._abbrev)

    calc_similarity: PCollection[dict] = clean_dicts | "Calculate similarities" >> beam.ParDo(
      CalculateSimilaritiesDoFn())

    return calc_similarity