# Copyright 2019 Google Inc. All Rights Reserved.
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
"""Build preprocessing pipeline for survival analysis."""

from __future__ import absolute_import

import sys

from . import features
from . import query
import apache_beam as beam
from apache_beam.options import pipeline_options
import argparse
import datetime
import numpy as np
import os
import random
from tensorflow_transform import coders
from tensorflow_transform.beam import impl as tft_beam
from tensorflow_transform.beam import tft_beam_io


def _random_start_date(start_interval, end_interval):
    """Generate a random date between some time interval.

    Used to randomly generate (fake) subscription start date
    """

    delta = end_interval - start_interval
    int_delta = delta.days
    random_day = random.randrange(int_delta)
    return start_interval + datetime.timedelta(days=random_day)


def _random_end_date(start):
    """Generate a random duration and return subscription end date.

    Used to random generate (fake) subscription duration, which directly relates
    to the artificial label
    """

    random_duration = random.randrange(np.max(
        features.LABEL_CEILINGS) + np.min(features.LABEL_CEILINGS))
    return start + datetime.timedelta(days=random_duration)


def _generate_fake_data(element):
    """Appends randomly generated labels to each sample's dictionary.

    This transformation is not necessory when using real data, because these
    values should already be available and these are the labels for the
    supervised classification churn model.

    Args:
        element: dictionary of results from BigQuery
    Returns:
        dictionary of results from BigQuery with the following fields added:
            start_date: datetime object representing date when subscription
                began.
            end_date: datetime object representing date when subscription
                ended. None if subscription has not yet ended.
            active: True if the subscription is still active.
    """

    d1 = datetime.datetime.strptime('1/1/2018', '%m/%d/%Y')
    d2 = datetime.datetime.strptime('12/25/2018', '%m/%d/%Y')
    start_date = _random_start_date(d1, d2)
    end_date = _random_end_date(start_date)
    active = True if end_date > d2 else False
    element.update(start_date=start_date)
    if not active:
        element.update(end_date=end_date)
    else:
        element.update(end_date=None)
    element.update(active=active)
    return element


def append_lifetime_duration(element):
    """Extract duration of user's current lifetime.

    This function is required for both fake and real data, unless fields can be
    extracted directly from source data (i.e. BQ table).

    Returns:
        element (dict) with following field added:
            duration: number of days between subscription start date and end
                date, or current date if customer is still active
    """
    if not element['active']:
        duration = element['end_date'] - element['start_date']
    else:
        duration = datetime.datetime.now() - element['start_date']
    duration_days = duration.days
    element.update(duration=duration_days)
    return element


def append_label(element):
    """Extract label (lifetime bucket) from source data.

    This function is required for both fake and real data, unless fields can be
    extracted directly from source data (i.e. BQ table).

    Returns:
        element (dict) with following field added:
            label: String class denoting interval that lifetime falls in
                between
    """
    class_ceilings = features.LABEL_CEILINGS
    for index in range(0, len(class_ceilings)):
        if element['duration'] < class_ceilings[index]:
            element.update(label=features.LABEL_VALUES[index])
            return element
    element.update(label=features.LABEL_VALUES[len(class_ceilings)-1])
    return element


def combine_censorship_duration(element):
    """Create labels for training using lifetime and censorship.

    Transform users' duration and censorship indicator into a 2*n_intervals
    array. For each row, the first half of the array indicates whether the user
    survived the corresponding interval. Second half indicates whether the user
    died in the corresponding interval. If the user is censored, the second
    half is all zeros.

    This function is required for both fake and real data.

    Args:
        element: Dictionary representing one sample
    Returns:
        element with following field added:
            labelArray: 2D array where for each row (which corresponds to a
                user) first half of the values are 1 if the individual survived
                that interval, 0 if not. The second half of the values are 1
                for time interval during which failure occured (if uncensored)
                and 0 for other intervals.
    """

    num_intervals = len(features.LABEL_CEILINGS)
    y = np.zeros((num_intervals * 2))
    breaks = [0] + features.LABEL_CEILINGS
    duration = element['duration']
    y[0:num_intervals] = 1.0*(np.full(num_intervals, duration) >= breaks[1:])
    if not element['active']:
        if duration < breaks[-1]:
            y[num_intervals + np.where(np.full(
                num_intervals, duration) < breaks[1:])[0][0]] = 1.0
    element.update(labelArray=list(y))
    return element


@beam.ptransform_fn
def shuffle(p):
    """Shuffles the given pCollection."""

    return (p
            | 'PairWithRandom' >> beam.Map(lambda x: (random.random(), x))
            | 'GroupByRandom' >> beam.GroupByKey()
            | 'DropRandom' >> beam.FlatMap(lambda x: x[1]))


# pylint: disable=expression-not-assigned
# pylint: disable=no-value-for-parameter
@beam.ptransform_fn
def write_tfrecord(p, prefix, output_dir, metadata):
    """Shuffles and write the given pCollection as a TFRecord.

    Args:
        p: a pCollection.
        prefix: prefix for location tf-record will be written to.
        output_dir: the directory or bucket to write the json data.
        metadata: metadata of input data from tft_beam.TransformDataset(...)
    """

    coder = coders.ExampleProtoCoder(metadata.schema)
    prefix = str(prefix).lower()
    (p
     | 'ShuffleData' >> shuffle()
     | 'WriteTFRecord' >> beam.io.tfrecordio.WriteToTFRecord(
         os.path.join(output_dir, 'data', prefix, prefix),
         coder=coder,
         file_name_suffix='.tfrecord'))


@beam.ptransform_fn
def randomly_split(p, train_size, validation_size, test_size):
    """Randomly splits input pipeline in three sets based on input ratio.

    Args:
        p: PCollection, input pipeline.
        train_size: float, ratio of data going to train set.
        validation_size: float, ratio of data going to validation set.
        test_size: float, ratio of data going to test set.
    Returns:
        Tuple of PCollection.
    Raises:
        ValueError: Train validation and test sizes don`t add up to 1.0.
    """

    if train_size + validation_size + test_size != 1.0:
        raise ValueError(
            'Train, validation, and test sizes don`t add up to 1.0.')

    class SplitData(beam.DoFn):

        def process(self, element):
            r = random.random()
            if r < test_size:
                yield beam.pvalue.TaggedOutput('Test', element)
            elif r < 1 - train_size:
                yield beam.pvalue.TaggedOutput('Val', element)
            else:
                yield element

    split_data = (
        p | 'SplitData' >> beam.ParDo(SplitData()).with_outputs(
            'Test',
            'Val',
            main='Train'))
    return split_data['Train'], split_data['Val'], split_data['Test']


def parse_arguments(argv):
    """Parse command-line arguments."""

    parser = argparse.ArgumentParser()
    timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    parser.add_argument(
        '--job_name',
        help='Name of the Cloud Dataflow job',
        default='{}-{}'.format('bq-to-tfrecords', timestamp),
    )
    parser.add_argument(
        '--output_dir',
        help='Local or GCS directory to store output TFRecords.',
        required=True,
    )
    parser.add_argument(
        '--log_level',
        help='Set logging level',
        default='INFO',
    )
    parser.add_argument(
        '--bq_table',
        help="""Source BigQuery table in [Project]:[Dataset]:[Table]
            format.""",
        default='bigquery-public-data.google_analytics_sample.ga_sessions_*',
    )
    parser.add_argument(
        '--machine_type',
        help="""Set machine type for Dataflow worker machines.""",
        default='n1-standard-2',
    )
    parser.add_argument(
        '--cloud',
        help="""Run preprocessing on the cloud. Default False.""",
        action='store_true',
        default=False,
    )
    parser.add_argument(
        '--project_id',
        help="""Google Cloud project ID""",
        required=True,
    )
    known_args, _ = parser.parse_known_args(argv)

    return known_args


def get_pipeline_args(flags):
    """Create Apache Beam pipeline arguments."""

    options = {
        'project': flags.project_id,
        'staging_location': os.path.join(flags.output_dir, 'staging'),
        'temp_location': os.path.join(flags.output_dir, 'temp'),
        'job_name': flags.job_name,
        'save_main_session': True,
        'setup_file': './setup.py'
    }
    return options


# pylint: disable=expression-not-assigned
def build_pipeline(p, flags):
    """Sets up Apache Beam pipeline for execution."""

    raw_data = (
        p | 'QueryTable' >> beam.io.Read(
            beam.io.BigQuerySource(
                query=query.get_query(flags.bq_table),
                project=flags.project_id,
                use_standard_sql=True)
            )
        # omit 'Generate data' step if working with real data
        | 'Generate data' >> beam.Map(_generate_fake_data)
        | 'Extract lifetime ' >> beam.Map(append_lifetime_duration)
        | 'Extract label' >> beam.Map(append_label)
        | 'Generate label array' >> beam.Map(combine_censorship_duration)
        )
    raw_train, raw_eval, raw_test = (
        raw_data | 'RandomlySplitData' >> randomly_split(
            train_size=.7,
            validation_size=.15,
            test_size=.15))
    raw_metadata = features.get_raw_dataset_metadata()
    preprocess_fn = features.preprocess_fn
    transform_fn = (
        (raw_train, raw_metadata) | 'AnalyzeTrain' >> tft_beam.AnalyzeDataset(
            preprocess_fn))
    (transform_fn | 'WriteTransformFn' >> tft_beam_io.WriteTransformFn(
        flags.output_dir))

    for dataset_type, dataset in [('Train', raw_train),
                                  ('Eval', raw_eval),
                                  ('Test', raw_test)]:
        transform_label = 'Transform{}'.format(dataset_type)
        t, metadata = (((dataset, raw_metadata), transform_fn)
                       | transform_label >> tft_beam.TransformDataset())
        if dataset_type == 'Train':
            (metadata | 'WriteMetadata' >> tft_beam_io.WriteMetadata(
                os.path.join(
                    flags.output_dir, 'transformed_metadata'), pipeline=p))
        write_label = 'Write{}TFRecord'.format(dataset_type)
        t | write_label >> write_tfrecord(
            dataset_type, flags.output_dir, metadata)


def run():
    """Run Apache Beam pipeline to generate TFRecords for Survival Analysis."""

    flags = parse_arguments(sys.argv[1:])
    pipeline_args = get_pipeline_args(flags)

    options = pipeline_options.PipelineOptions(flags=[], **pipeline_args)
    options.view_as(pipeline_options.WorkerOptions).machine_type = (
        flags.machine_type)

    temp_dir = os.path.join(flags.output_dir, 'tmp')

    runner = 'DataflowRunner' if flags.cloud else 'DirectRunner'

    with beam.Pipeline(runner, options=options) as p:
        with tft_beam.Context(temp_dir=temp_dir):
            build_pipeline(p, flags)
