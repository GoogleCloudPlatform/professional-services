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
from typing import Iterable, Dict

from apache_beam import DoFn

from ..model.data_classes import Record
from ..features import clean_input


class CleanAndTransfToDictDoFn(DoFn):
  def __init__(self, *unused_args, **unused_kwargs):
    super().__init__(*unused_args, **unused_kwargs)

  def process(self,
              element: Record,
              abbrev: Dict) -> Iterable[Dict]:
    ## In this process method we are going to change element. But BEWARE: in Beam, the process method should not
    ## mutate the input object, it should produce a new object.
    ## Thankfully for us, named tuples (Record is a named tuple) are immutable; an AttributeError exception
    ## will be triggered if we try to modify element.
    ## So let's make a copy as a dict, and then we will return the dictionary.
    ##
    ## The transform to dictionary is necessary for two reasons:
    ##  * We will need dicts to write to BigQuery
    ##  * We are going to add some new columns/fields, with the similarity values

    # The _asdict method starts with _ to avoid potential conflicts with the named tuple field names
    # (its use is not restricted)
    mutable_element = element._asdict()

    ## source and target address
    mutable_element['source_address'] = clean_input.clean_text(element.source_address, abbrev)
    mutable_element['target_address'] = clean_input.clean_text(element.target_address, abbrev)

    ## source and target city
    mutable_element['source_city'] = clean_input.clean_text(element.source_city)
    mutable_element['target_city'] = clean_input.clean_text(element.target_city)

    # TODO: transform all the rest of fields

    yield mutable_element