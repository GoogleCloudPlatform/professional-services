# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import re
from typing import Iterable

import apache_beam as beam


def _split_string(element: str) -> Iterable[str]:
    for word in re.findall(r'[A-Za-z\']+', element):
        yield word


class SplitString(beam.PTransform):
    """
    Split PCollection string elements into words.
    """

    class _Fn(beam.DoFn):

        def process(self, element: str, *args, **kwargs):
            for word in re.findall(r'[A-Za-z\']+', element):
                yield word

    def expand(
            self,
            input_or_inputs: beam.PCollection[str]) -> beam.PCollection[str]:
        return input_or_inputs | "SplitString" >> beam.FlatMap(_split_string)
