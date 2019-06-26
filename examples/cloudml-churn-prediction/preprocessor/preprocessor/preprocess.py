#!/usr/bin/env python

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
"""Build preprocessing pipeline for survival analysis"""


import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, WorkerOptions
from tensorflow_transform.beam import impl as tft_beam
from tensorflow_transform.beam import tft_beam_io
from tensorflow_transform import coders
import tensorflow_transform as tft
from tensorflow_transform.tf_metadata import dataset_schema

import logging
import sys
import argparse
import time
from datetime import datetime, timedelta
import random
import numpy as np
import os
import posixpath

from . import query
from . import features


def random_date(start, end):
    """Generate random date. 
    Used to randomly generate (fake) subscription start_date
    """
    delta = end - start
    int_delta = delta.days
    random_day = random.randrange(int_delta)
    return start + timedelta(days=random_day)


def randomDuration(start):
    """Generate random duration.
    Used to random generate (fake) subscription duration, which directly relates
    to the artificial label
    """
    random_day = random.randrange(np.max(features.LABEL_CEILINGS)
        + np.min(features.LABEL_CEILINGS))
    return start + timedelta(days=random_day), random_day


def _generateFakeData(element):
    """Appends randomly generated labels to each sample's dictionary.
    It should not be used with real data.
    Function does not add duration to the dictionary, because this field generally
    must be calculated rather than directly output from a database.

    Args:
        element: dictionary of results from BigQuery
    Returns:
        dictionary of results from BigQuery with the following fields added:
            start_date:
            end_date: None if subscription has not yet ended
            active:
    """
    d1 = datetime.strptime('1/1/2018', '%m/%d/%Y')
    d2 = datetime.strptime('12/25/2018', '%m/%d/%Y')
    start_date = random_date(d1, d2)
    end_date, duration = randomDuration(start_date)
    active = True if end_date > d2 else False
    element.update(start_date=start_date)
    if not active:
        element.update(end_date=end_date)
    else:
        element.update(end_date=None)
    element.update(active=active)
    return element


def _mapToClass(element):
    """Extract duration and class from source data. 

    This function is required for both fake and real data, unless fields can be
    extracted directly for source data (i.e. BQ).

    Returns:
        element with following fields added:
            duration: number of days between subscription start date and end date, 
                or current date if customer is still active
            label: String class denoting interval that duration falls in between
    """
    classCeilings = features.LABEL_CEILINGS
    if not element['active']:
        duration = element['end_date'] - element['start_date']
    else:
        duration = datetime.now() - element['start_date']
    duration_days = duration.days
    element.update(duration=duration_days)
    for index in range(0, len(classCeilings)):
        if duration_days < classCeilings[index]:
            element.update(label=features.LABEL_VALUES[index])
            return element
    element.update(label=features.LABEL_VALUES[len(classCeilings)-1])
    return element


def _combineCensorshipDuration(element):
    """Transform users' duration and censorship indicator into a 2*n_intervals
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
    numIntervals = len(features.LABEL_CEILINGS)
    y = np.zeros((numIntervals * 2))
    breaks = [0] + features.LABEL_CEILINGS
    duration = element['duration']
    y[0:numIntervals] = 1.0*(np.full(numIntervals, duration) >= breaks[1:])
    if not element['active']:
        if duration < breaks[-1]:
            y[numIntervals + np.where(np.full(numIntervals, duration) < breaks[1:])[0][0]] = 1.0
    element.update(labelArray=y)
    return element


@beam.ptransform_fn
def Shuffle(p):
    """Shuffles the given pCollection."""
    return (p
            | "PairWithRandom" >> beam.Map(lambda x: (random.random(), x))
            | "GroupByRandom" >> beam.GroupByKey()
            | "DropRandom" >> beam.FlatMap(lambda x: x[1]))


@beam.ptransform_fn
def WriteTFRecord(p, prefix, output_dir, metadata):
    """Shuffles and write the given pCollection as a TF-Record.
    Args:
        p: a pCollection.
        prefix: prefix for location tf-record will be written to.
        output_dir: the directory or bucket to write the json data.
        metadata: 
    """
    coder = coders.ExampleProtoCoder(metadata.schema)
    prefix = str(prefix).lower()
    _ = (p
        | "ShuffleData" >> Shuffle()  # pylint: disable=no-value-for-parameter
        | "WriteTFRecord" >> beam.io.tfrecordio.WriteToTFRecord(
            os.path.join(output_dir, 'data', prefix, prefix),
            coder=coder,
            file_name_suffix=".tfrecord"))


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
            'Train validation and test sizes don`t add up to 1.0.')

    class _SplitData(beam.DoFn):
        def process(self, element):
            r = random.random()
            if r < test_size:
                yield beam.pvalue.TaggedOutput('Test', element)
            elif r < 1 - train_size:
                yield beam.pvalue.TaggedOutput('Val', element)
            else:
                yield element

    split_data = (
        p | 'SplitData' >> beam.ParDo(_SplitData()).with_outputs(
            'Test',
            'Val',
            main='Train'))
    return split_data['Train'], split_data['Val'], split_data['Test']


def parse_arguments(argv):
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser()
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    parser.add_argument(
        '--job_name',
        default='{}-{}'.format('bq-to-tfrecords', timestamp)
    )
    parser.add_argument(
        '--output_dir',
        required=True,
    )
    parser.add_argument(
        '--log_level',
        help='Set logging level',
        default='INFO'
    )
    parser.add_argument(
        '--bq_table',
        help="""Source BigQuery table in [Project]:[Dataset]:[Table]
            format.""",
        default='bigquery-public-data.google_analytics_sample.ga_sessions_*'
    )
    parser.add_argument(
        '--machine_type',
        help="""Set machine type for Dataflow worker machines.""",
        default='n1-highmem-4'
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
    """Create Apache Beam pipeline arguments"""
    options = {
        'project': flags.project_id,
        'staging_location': os.path.join(flags.output_dir, 'staging'),
        'temp_location': os.path.join(flags.output_dir, 'temp2'),
        'job_name': flags.job_name,
        'save_main_session': True,
        'setup_file': './setup.py'
    }
    return options


def run():
    """Run Apache Beam pipeline to generate TFRecords for Survival Analysis"""
    flags = parse_arguments(sys.argv[1:])
    pipeline_args = get_pipeline_args(flags)

    options = PipelineOptions(flags=[], **pipeline_args)
    options.view_as(WorkerOptions).machine_type = flags.machine_type

    input_spec = features.RAW_FEATURE_SPEC
    temp_dir = os.path.join(flags.output_dir, 'tmp')

    runner = 'DataflowRunner' if flags.cloud else 'DirectRunner'

    with beam.Pipeline(runner, options=options) as p:
        with tft_beam.Context(temp_dir=temp_dir):
            raw_data = (p 
                        | 'QueryTable' >> beam.io.Read(beam.io.BigQuerySource(
                            query=query.get_query(flags.bq_table),
                            project=flags.project_id,
                            use_standard_sql=True))
                        #omit 'Generate Data' step if working with real data
                        | 'Generate Data' >> 
                            beam.Map(lambda row: _generateFakeData(row))
                        | 'Extract duration and Label' >> 
                            beam.Map(lambda row: _mapToClass(row))
                        | 'Generate label array' >> 
                            beam.Map(lambda row: 
                                _combineCensorshipDuration(row))
                       )
            raw_train, raw_eval, raw_test = (
                raw_data | 'RandomlySplitData' >> randomly_split(
                    train_size=.7,
                    validation_size=.15,
                    test_size=.15))
            raw_metadata = features.get_raw_dataset_metadata()
            spec = features.get_raw_feature_spec()
            preprocess_fn = features.preprocess_fn
            transform_fn = ((raw_train, raw_metadata)
                           | 'AnalyzeTrain' >> tft_beam.AnalyzeDataset(
                                preprocess_fn))
            _ = (transform_fn
                | 'WriteTransformFn' >> tft_beam_io.WriteTransformFn(
                    flags.output_dir))

            for dataset_type, dataset in [('Train', raw_train), 
                                         ('Eval', raw_eval),
                                         ('Test', raw_test)]:
                transform_label = 'Transform{}'.format(dataset_type)
                t, metadata = (((dataset, raw_metadata), transform_fn)
                              | transform_label >> tft_beam.TransformDataset())
                if dataset_type == 'Train':
                    _ = (metadata
                        | 'WriteMetadata' >> tft_beam_io.WriteMetadata(
                            os.path.join(flags.output_dir, 
                                        'transformed_metadata'),
                            pipeline=p))
                write_label = 'Write{}TFRecord'.format(dataset_type)
                _ = t | write_label >> WriteTFRecord(
                    dataset_type, flags.output_dir, metadata)
