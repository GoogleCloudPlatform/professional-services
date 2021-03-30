# Copyright 2018 Google Inc.
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

import apache_beam as beam
from apache_beam.transforms import CombinePerKey
from apache_beam.transforms.combiners import SampleCombineFn


class EnforcePrimaryKeys(beam.PTransform):
    """
    This is a PTransform to ensure elements of posterior
    PCollection are unique by key.
    """
    def __init__(self, primary_key):
        """
        Args:
            primary_keys: (str) The column by which to ensure
                uniqueness in the posterior PCollection.
        """
        self.primary_key = primary_key

    def expand(self, pcoll):
        return (
            pcoll
            | 'Extract Primary Key' >>
            beam.FlatMap(lambda row: [(row[self.primary_key], row)])
            | 'Sample n=1 by Primary Key' >> CombinePerKey(SampleCombineFn(1))
            | 'Drop keys' >> beam.FlatMap(lambda kv: kv[1]))
