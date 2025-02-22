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
from typing import Dict
from .similarities import CalculateSimilaritiesDoFn
from .clean_records import CleanAndTransfToDictDoFn


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