#  Copyright 2020 Google LLC.
#  This software is provided as-is, without warranty or representation for any use or purpose.
#  Your use of it is subject to your agreement with Google.
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