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
import copy
from typing import Iterable, Dict

import textdistance
from apache_beam import DoFn


class CalculateSimilaritiesDoFn(DoFn):
  def __init__(self, *unused_args, **unused_kwargs):
    super().__init__(*unused_args, **unused_kwargs)

    self._sorensen = None
    self._jaro_winkler = None

  def setup(self):
    # Called when the worker is created
    self._sorensen = textdistance.Sorensen(3)  # 3-grams for similarity calculation
    self._jaro_winkler = textdistance.JaroWinkler()

  def process(self, element: dict) -> Iterable[Dict]:

    source_address = element['source_address']
    target_address = element['target_address']
    address_similarity = self._sorensen.similarity(source_address, target_address)

    source_city = element['source_city']
    target_city = element['target_city']
    city_similarity = self._jaro_winkler.similarity(source_city, target_city)

    ## Remember that we CANNOT MUTATE the input element, so let's create a copy of the dict,
    ## and then we add the new fields with the similarity value
    output_dict = copy.deepcopy(element)
    output_dict['address_similarity'] = address_similarity
    output_dict['city_similarity'] = city_similarity

    # TODO: calculate the rest of features

    yield output_dict