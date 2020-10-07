#
# Copyright (C) 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License. You may obtain a copy of
# the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.
#
"""A word-counting workflow using Flex Templates."""

import argparse
import json
import logging
import re

import apache_beam as beam
from apache_beam.io import ReadFromText
from apache_beam.io import WriteToText
from apache_beam.io.avroio import WriteToAvro
from apache_beam.io.parquetio import WriteToParquet
from apache_beam.metrics import Metrics
from apache_beam.metrics.metric import MetricsFilter
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import SetupOptions

import avro.schema
from past.builtins import unicode
import pyarrow

FORMATS = {'text', 'parquet', 'avro'}
HEADER = ['word', 'count']
AVRO_SCHEMA = {
    'namespace':
        'avro.wordcount',
    'type':
        'record',
    'name':
        'WordCount',
    'fields': [{
        'name': 'word',
        'type': 'string'
    }, {
        'name': 'count',
        'type': 'int'
    }]
}
PARQUET_SCHEMA = pyarrow.schema([('word', pyarrow.string()),
                                 ('count', pyarrow.int64())])
DEFAULT_CODEC = 'snappy'


class WordExtractingDoFn(beam.DoFn):
    """Parse each line of input text into words."""

    def __init__(self):
        self.words_counter = Metrics.counter(self.__class__, 'words')
        self.word_lengths_counter = Metrics.counter(self.__class__,
                                                    'word_lengths')
        self.word_lengths_dist = Metrics.distribution(self.__class__,
                                                      'word_len_dist')
        self.empty_line_counter = Metrics.counter(self.__class__, 'empty_lines')

    def process(self, element):
        """Returns an iterator over the words of this element.

    The element is a line of text.  If the line is blank, note that, too.
    Args:
      element: the element being processed

    Returns:
      The processed element.
    """
        text_line = element.strip()
        if not text_line:
            self.empty_line_counter.inc(1)
        words = re.findall(r'[\w\']+', text_line, re.UNICODE)
        for w in words:
            self.words_counter.inc()
            self.word_lengths_counter.inc(len(w))
            self.word_lengths_dist.update(len(w))
        return words


def run(argv=None):
    """Main entry point; defines and runs the wordcount pipeline."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--input',
        dest='input',
        default='gs://dataflow-samples/shakespeare/kinglear.txt',
        help='Input file to process.')
    parser.add_argument('--output',
                        dest='output',
                        required=True,
                        help='Output file to write results to.')
    parser.add_argument('--format',
                        dest='format',
                        default='text',
                        help='Supported output file formats: %s.' % FORMATS)
    known_args, pipeline_args = parser.parse_known_args(argv)

    if known_args.format not in FORMATS:
        raise ValueError('--format should be one of: %s' % FORMATS)

    # We use the save_main_session option because one or more DoFn's in this
    # workflow rely on global context (e.g., a module imported at module level).
    pipeline_options = PipelineOptions(pipeline_args)
    pipeline_options.view_as(SetupOptions).save_main_session = True
    p = beam.Pipeline(options=pipeline_options)

    # Read the text file[pattern] into a PCollection.
    lines = p | 'read' >> ReadFromText(known_args.input)

    # Count the occurrences of each word.
    def count_ones(word_ones):
        (word, ones) = word_ones
        return (word, sum(ones))

    counts = (lines | 'split' >>
              (beam.ParDo(WordExtractingDoFn()).with_output_types(unicode)) |
              'pair_with_one' >> beam.Map(lambda x: (x, 1)) |
              'group' >> beam.GroupByKey() | 'count' >> beam.Map(count_ones))

    # Format the counts into a PCollection of strings.
    def format_text(word_count):
        (word, count) = word_count
        return '%s: %d' % (word, count)

    # Format the counts into a PCollection of dictionary strings.

    def format_dict(word_count):
        (word, count) = word_count
        row = dict(zip(HEADER, [word, count]))
        return row

    if known_args.format == 'text':
        output = counts | 'format text' >> beam.Map(format_text)

        # Write the output using a "Write" transform that has side effects.
        # pylint: disable=expression-not-assigned
        output | 'write text' >> WriteToText(known_args.output)
    elif known_args.format == 'avro':
        output = counts | 'format avro' >> beam.Map(format_dict)

        schema = avro.schema.parse(json.dumps(AVRO_SCHEMA))

        # Write the output using a "Write" transform that has side effects.
        # pylint: disable=expression-not-assigned
        output | 'write avro' >> WriteToAvro(file_path_prefix=known_args.output,
                                             schema=schema,
                                             codec=DEFAULT_CODEC)
    else:
        output = counts | 'format parquet' >> beam.Map(format_dict)

        # Write the output using a "Write" transform that has side effects.
        # pylint: disable=expression-not-assigned
        output | 'write parquet' >> WriteToParquet(
            file_path_prefix=known_args.output,
            schema=PARQUET_SCHEMA,
            codec=DEFAULT_CODEC)

    result = p.run()
    result.wait_until_finish()

    # Do not query metrics when creating a template which doesn't run
    if (not hasattr(result, 'has_job')  # direct runner
            or result.has_job):  # not just a template creation
        empty_lines_filter = MetricsFilter().with_name('empty_lines')
        query_result = result.metrics().query(empty_lines_filter)
        if query_result['counters']:
            empty_lines_counter = query_result['counters'][0]
            logging.info('number of empty lines: %d',
                         empty_lines_counter.result)

        word_lengths_filter = MetricsFilter().with_name('word_len_dist')
        query_result = result.metrics().query(word_lengths_filter)
        if query_result['distributions']:
            word_lengths_dist = query_result['distributions'][0]
            logging.info('average word length: %d',
                         word_lengths_dist.result.mean)


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
