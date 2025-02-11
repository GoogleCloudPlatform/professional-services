# Copyright 2022 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import apache_beam as beam
from apache_beam.typehints import KV

from wordcount.split_string import SplitString
from wordcount.word_count_options import WordCountOptions


def _format_kv(results: KV[str, int]) -> str:
    """
    Formats a beam.KV into a <key>: <value> string.
    """
    word, count = results
    return '%s: %d' % (word, count)


if __name__ == '__main__':
    options = WordCountOptions()
    source = options.source
    output = options.output

    with beam.Pipeline(options=options) as p:
        (p
         | "Read" >> beam.io.ReadFromText(source)
         | "Split" >> SplitString()
         | "Count" >> beam.combiners.Count.PerElement()
         | "Format" >> beam.Map(_format_kv)
         | "Write Results" >> beam.io.WriteToText(output))
