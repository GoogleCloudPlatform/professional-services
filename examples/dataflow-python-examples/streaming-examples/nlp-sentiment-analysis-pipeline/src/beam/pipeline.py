#
# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

import argparse
import logging
import json

import apache_beam as beam

from datetime import datetime
from pytz import timezone

from apache_beam.io import filesystems

from apache_beam.options.pipeline_options import GoogleCloudOptions
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import SetupOptions
from apache_beam.options.pipeline_options import StandardOptions

from google.cloud import language
from google.cloud.language import enums
from google.cloud.language import types

from google.api_core import exceptions
from google.api_core import retry

from apache_beam.io.gcp.internal.clients import bigquery


def parse_json(bytestring):
    """Parses JSON tweet represented as bytestring and converts to tuple.

    Using:
    * Timestamp (date: YYYY-MM-DD HH:MM:SS)
    * Full Text

    Args:
        bytestring: Byestring from Pub/Sub representing tweet JSON.

    Returns:
      Tuple of (`str`, `str`) representing:
        ('<YYYY-MM-DD>', '<Full Tweet Text>').
    """
    json_value = json.loads(bytestring.decode('utf-8'))
    time_value = datetime.fromtimestamp(int(json_value['Timestamp'])/1000.0).astimezone(timezone('US/Central')).strftime("%Y-%m-%d")
    return (time_value, json_value['Text'])


class DictCombineFn(beam.CombineFn):
    """Custom combiner for stateful counter dictionaries.

    AddWindowingInformation produces 2 stateful dictionaries
    to keep track of:
        1) How many tweets are assigned to each document
        2) How many documents are created per date

    More on stateful pricessing:
        https://beam.apache.org/blog/stateful-processing/
    """
    def create_accumulator(self):
        return {}

    def add_input(self, accumulator, element):
        time_value, increment = element
        accumulator[time_value] = accumulator.get(time_value, 0) + increment
        return accumulator

    def merge_accumulators(self, accumulators):
        from collections import Counter
        merged_accumulator = {}
        for dictionary in accumulators:
            merged_accumulator = Counter(merged_accumulator) + Counter(dictionary)
        return dict(merged_accumulator)

    def extract_output(self, accumulator):
        return accumulator


class AddWindowingInformation(beam.DoFn):
    """Adds start time of window to each element.

    Only used when --nlp_batching is set. By adding the window's
    start time to the key of each element, the pipeline
    can group each element per window per key into a document.
    Additionally, after 500 tweets per date, the document version
    will be incremented to avoid overloading the NLP API.

    TWEET_INDEX and DOC_INDEX are stateful dictionaries that
    track how many tweets are in each document and what version
    the respective document is on. After 500 tweets per day,
    a new document should be created and the version should
    consequently be incremented.

    For example, a modified key might be: "2020-05-20+XXXXXXXXXX+3"
    """
    TWEET_INDEX = beam.transforms.userstate.CombiningValueStateSpec('tweet_index', DictCombineFn())
    DOC_INDEX = beam.transforms.userstate.CombiningValueStateSpec('doc_index', DictCombineFn())

    def process(self, tweet_tuple, tweet_index=beam.DoFn.StateParam(TWEET_INDEX), doc_index=beam.DoFn.StateParam(DOC_INDEX), window=beam.DoFn.WindowParam):
        time_value, tweet_text = tweet_tuple

        tweet_index.add([time_value, 1])

        if tweet_index.read()[time_value] > 500:
            tweet_index.clear()
            doc_index.add([time_value, 1])

        window_start = int(window.start.to_utc_datetime().timestamp())
        doc_index = doc_index.read().get(time_value, 0)

        modified_key = "{time_value}+{window_start}+{doc_index}".format(time_value=time_value, window_start=window_start, doc_index=doc_index)
        yield (modified_key, tweet_text)


class NlpClient_Batched(beam.DoFn):
    """Gets sentiment score for each tweet via batching.

    This class batches each tweet into a document. There is
    one document per window per key. In other words, if there
    exists 3 dates within a window, there are 3 documents made.
    The document approach is meant to drastically reduce the
    number of API calls to the Natural Language API.

    Attributes:
      language: Language of tweets.
      client: NLP API client instance.
    """
    def __init__(self, client=None):
        self.language = "en"
        self.client = client

    def setup(self): # NOTE: setup() is only supported with Dataflow Runner or Direct Runner (Apache Beam 2.22.0)
        if self.client is None:
            self.client = language.LanguageServiceClient() 

    def process(self, modified_tweet_tuple):
        if self.client is None:
            self.client = language.LanguageServiceClient()

        (modified_key, text_iterable) = modified_tweet_tuple

        time_value = modified_key[:modified_key.index("+")]

        file_name = './' + modified_key + ".txt"
        writer = filesystems.FileSystems.create(file_name)
        punctuation = ['.', '?', '!']
        for tweet in text_iterable:
            tweet = tweet.replace('...', ' ').replace('\n', ' ')
            for p in punctuation:
                tweet = tweet.replace(p, ' ')
            writer.write((tweet + ".\n").encode('utf-8'))

        writer.close()

        annotations = self.analyze_document(file_name)
        for tweet in annotations.sentences:
            yield (time_value, tweet.sentiment.score)

        filesystems.FileSystems.delete([file_name])

    @retry.Retry(predicate=retry.if_exception_type(exceptions.ResourceExhausted), initial=10.0, maximum=100.0, multiplier=2.0)
    def analyze_document(self, file_name):
        with open(file_name, 'r+') as review_file:
            content = review_file.read()

        document = types.Document(
            content=content,
            type=enums.Document.Type.PLAIN_TEXT,
            language=self.language
        )

        annotations = self.client.analyze_sentiment(document)
        return annotations


class NlpClient_ElementWise(beam.DoFn):
    """Gets element-wise sentiment score for each tweet

    This class calls one Natural Language API call per tweet.
    Although high traffic might be incurred, this preserves
    the original gramatical integrity of each tweet as there
    is no need to alter punctuation.

    Documentation:
      https://cloud.google.com/natural-language/docs/basics#sentiment_analysis

    Languages Available for NLP API Sentiment Analysis: 
      https://cloud.google.com/natural-language/docs/languages#sentiment_analysis 

    Attributes:
      language: Language of tweets.
      client: NLP API client instance.
    """
    def __init__(self, client=None):
        self.language = "en"
        self.client = client

    def setup(self): # NOTE: setup() is only supported with Dataflow Runner or Direct Runner (Apache Beam 2.22.0)
        if self.client is None:
            self.client = language.LanguageServiceClient()

    @retry.Retry(predicate=retry.if_exception_type(exceptions.ResourceExhausted), initial=10.0, maximum=400.0, multiplier=2.0)
    def process(self, tweet):
        if self.client is None:
            self.client = language.LanguageServiceClient()

        (time_value, tweet_text) = tweet

        document = {
            "content": tweet_text,
            "type": enums.Document.Type.PLAIN_TEXT,
            "language": self.language
        }

        encoding_type = enums.EncodingType.UTF8
        response = self.client.analyze_sentiment(document, encoding_type=encoding_type)

        yield (time_value, response.document_sentiment.score)


class CombineScores(beam.CombineFn):
    """Combines sentiment scores per single date.

    Reports total sum, total count, and average for all elements in an
    individual window for an individual date. Total running average for
    all windows can be calculated and updated in BigQuery.
    """
    def create_accumulator(self):
        return (0.0, 0)

    def add_input(self, score_values, input):
        (sum, count) = score_values
        return sum + input, count + 1

    def merge_accumulators(self, accumulators):
        sums, counts = zip(*accumulators)
        return sum(sums), sum(counts)

    def extract_output(self, score_values):
        (sum, count) = score_values
        return (sum, count, sum/count if count else float('NaN'))


class DictFormat(beam.DoFn):
    """Formats results into dictionary format and adds window timestamps.

    WriteToBigQuery requires input data to be converted to dictionary format.
    """
    def process(self, tweet_tuple, window=beam.DoFn.WindowParam):
        (date, data_tuple) = tweet_tuple
        window_start = window.start.to_utc_datetime().strftime("%m-%d-%Y (%H:%M:%S)")
        window_end = window.end.to_utc_datetime().strftime("%m-%d-%Y (%H:%M:%S)")

        yield {
            'tweet_date': date,
            'window_start_utc': window_start,
            'window_end_utc': window_end,
            'sentiment_score_sum': data_tuple[0],
            'num_tweets': data_tuple[1],
            'average_sentiment_for_window': data_tuple[2]
        }


def run(argv=None, save_main_session=True):
    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--project_id',
        dest='project_id',
        required=True,
        help='GCP Project ID'
    )

    parser.add_argument(
        '--runner',
        dest='runner',
        required=True,
        help='Runner values are: "DirectRunner" and "DataflowRunner"'
    )

    parser.add_argument(
        '--subscription_id',
        dest='subscription_id',
        required=True,
        help='Pub/Sub subscription ID in format: <subscription_id>',
    )

    parser.add_argument(
        '--bq_dataset',
        dest='bq_dataset',
        required=True,
        help='Dataset ID for BigQuery table'
    )

    parser.add_argument(
        '--bq_table',
        dest='bq_table',
        required=True,
        help='Table ID for BigQuery table'
    )

    parser.add_argument(
        '--fixed_window_size',
        dest='window_size',
        required=True,
        help='Size of fixed windows in minutes'
    )

    parser.add_argument(
        '--nlp_batching',
        dest='nlp_batching',
        default=False,
        action='store_true'
    )

    known_args, pipeline_args = parser.parse_known_args(argv)

    pipeline_options = PipelineOptions(pipeline_args)
    pipeline_options.view_as(SetupOptions).save_main_session = save_main_session
    pipeline_options.view_as(StandardOptions).streaming = True
    pipeline_options.view_as(StandardOptions).runner = known_args.runner
    pipeline_options.view_as(GoogleCloudOptions).project = known_args.project_id
    p = beam.Pipeline(options=pipeline_options)

    bq_table_spec = bigquery.TableReference(
        projectId=known_args.project_id,
        datasetId=known_args.bq_dataset,
        tableId=known_args.bq_table,
    )

    bq_table_schema = {
        'fields': [
            {'name': 'tweet_date', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'window_start_utc', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'window_end_utc', 'type': 'STRING', 'mode': 'REQUIRED'},
            {'name': 'sentiment_score_sum', 'type': 'FLOAT64', 'mode': 'REQUIRED'},
            {'name': 'num_tweets', 'type': 'INT64', 'mode': 'REQUIRED'},
            {'name': 'average_sentiment_for_window', 'type': 'FLOAT64', 'mode': 'REQUIRED'}
        ]
    }

    if pipeline_options.view_as(StandardOptions).runner == "DataflowRunner":
        read_input = (
            p
            | 'ingest_from_pubsub' >> beam.io.ReadFromPubSub(
                subscription="projects/{project_id}/subscriptions/{subscription_id}".format(project_id=known_args.project_id, subscription_id=known_args.subscription_id),
                id_label="ID"
            )
        )
    else:
        read_input = (
            p
            | 'ingest_from_pubsub' >> beam.io.ReadFromPubSub(
                subscription="projects/{project_id}/subscriptions/{subscription_id}".format(project_id=known_args.project_id, subscription_id=known_args.subscription_id)
            )
        )

    format_tweets = (
        read_input
        | 'parse_json' >> beam.Map(parse_json)
        | 'add_windows' >> beam.WindowInto(
            beam.window.FixedWindows(60 * int(known_args.window_size)),
            trigger = beam.trigger.AfterWatermark(),
            accumulation_mode = beam.trigger.AccumulationMode.ACCUMULATING,
        )
    )

    if known_args.nlp_batching:
        analyze_tweets = (
            format_tweets
            | 'add_windowing_info' >> beam.ParDo(AddWindowingInformation())
            | 'group_by_date' >> beam.GroupByKey()
            | 'nlp' >> beam.ParDo(NlpClient_Batched())
        )
    else:
        analyze_tweets = (
            format_tweets
            | 'nlp' >> beam.ParDo(NlpClient_ElementWise())
        )

    (
        analyze_tweets
        | 'combine_scores' >> beam.CombinePerKey(CombineScores())
        | 'convert_to_dictionary' >> beam.ParDo(DictFormat())
        | 'write_to_bq' >> beam.io.WriteToBigQuery (
            bq_table_spec,
            schema = bq_table_schema,
            write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
            create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED
        )
    )

    result = p.run()
    if pipeline_options.view_as(StandardOptions).runner == "DirectRunner":
        result.wait_until_finish()


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
