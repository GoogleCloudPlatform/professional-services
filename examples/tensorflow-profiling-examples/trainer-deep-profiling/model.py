#!/usr/bin/env python

# Copyright 2018 Google Inc. All Rights Reserved.
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

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import numpy as np

import tensorflow as tf

tf.logging.set_verbosity(tf.logging.INFO)

BUCKET = None  # set from task.py
PATTERN = 'of'  # gets all files
TRAIN_STEPS = 10000
COLUMNS = 'weight_pounds,is_male,mother_age,plurality,gestation_weeks,key'
CSV_COLUMNS = COLUMNS.split(',')
LABEL_COLUMN = 'weight_pounds'
KEY_COLUMN = 'key'
DEFAULTS = [[0.0], ['null'], [0.0], ['null'], [0.0], ['nokey']]

# Define some hyperparameters
BATCH_SIZE = 512
N_EMBEDS = 3
FIRST_LAYER_SIZE = 64
NUM_LAYERS = 3
DROPOUT_RATE = 0.1
LEARNING_RATE = 0.001
EVAL_INTERVAL = 200

TRANSFORMED_TRAIN_DATA_FILEBASE = 'train_transformed'
TRANSFORMED_TEST_DATA_FILEBASE = 'test_transformed'
EXPORTED_MODEL_DIR = 'exported_model_dir'


def read_dataset(mode):
    def _decode_csv(line):
        features = tf.decode_csv(line, record_defaults=DEFAULTS)
        features = dict(zip(CSV_COLUMNS, features))
        labels = features.pop(LABEL_COLUMN)
        return features, labels

    def _input_fn():
        # use prefix to create filename
        if mode == tf.estimator.ModeKeys.TRAIN:
            prefix = 'train'
            num_epochs = None
            shuffle = True
        else:
            prefix = 'eval'
            num_epochs = 1
            shuffle = False
        filename_pattern = 'gs://{}/preproc/{}*{}*'.format(BUCKET, prefix,
                                                           PATTERN)
        files = tf.data.Dataset.list_files(file_pattern=filename_pattern,
                                           shuffle=shuffle)
        dataset = files.flat_map(
            lambda filename: tf.data.TextLineDataset(filename).map(
                _decode_csv))
        if mode == tf.estimator.ModeKeys.TRAIN:
            dataset = dataset.batch(BATCH_SIZE, drop_remainder=True)
        else:
            dataset = dataset.batch(5012)
        return dataset.repeat(num_epochs).make_one_shot_iterator().get_next()

    return _input_fn


def get_wide_deep(n_embeds):
    # define column types
    plurality_values = ['Single(1)', 'Twins(2)', 'Triplets(3)',
                        'Quadruplets(4)', 'Quintuplets(5)', 'Multiple(2+)']
    is_male = tf.feature_column.categorical_column_with_vocabulary_list(
        'is_male', ['True', 'False', 'Unknown'])
    mother_age = tf.feature_column.numeric_column('mother_age')
    plurality = tf.feature_column.categorical_column_with_vocabulary_list(
        'plurality', plurality_values)
    gestation_weeks = tf.feature_column.numeric_column('gestation_weeks')

    # discretize
    age_buckets = tf.feature_column.bucketized_column(
        mother_age,
        boundaries=np.arange(15, 45, 1).tolist())
    gestation_buckets = tf.feature_column.bucketized_column(
        gestation_weeks,
        boundaries=np.arange(17, 47, 1).tolist())

    # sparse columns are wide
    wide = [is_male, plurality, age_buckets, gestation_buckets]

    # feature cross all the wide columns and embed into a lower dimension
    crossed = tf.feature_column.crossed_column(wide, hash_bucket_size=20000)
    embed = tf.feature_column.embedding_column(crossed, n_embeds)

    # continuous columns are deep
    deep = [mother_age, gestation_weeks, embed]
    return wide, deep


def my_rmse(labels, predictions):
    pred_values = predictions['predictions']
    return {'rmse': tf.metrics.root_mean_squared_error(labels, pred_values)}


def serving_input_fn():
    feature_placeholders = {
        'is_male': tf.placeholder(tf.string, [None]),
        'mother_age': tf.placeholder(tf.float32, [None]),
        'plurality': tf.placeholder(tf.string, [None]),
        'gestation_weeks': tf.placeholder(tf.float32, [None]),
        KEY_COLUMN: tf.placeholder_with_default(tf.constant(['nokey']), [None])
    }
    features = {key: tf.expand_dims(tensor, -1)
                for key, tensor in feature_placeholders.items()}
    return tf.estimator.export.ServingInputReceiver(features,
                                                    feature_placeholders)


def train_and_evaluate(output_dir):
    wide, deep = get_wide_deep(N_EMBEDS)
    run_config = tf.estimator.RunConfig(save_checkpoints_secs=EVAL_INTERVAL,
                                        keep_checkpoint_max=3)
    hidden_units = [max(int(FIRST_LAYER_SIZE / (pow(2, i))), 2)
                    for i in range(NUM_LAYERS)]
    optimizer = tf.train.AdagradOptimizer(LEARNING_RATE)
    estimator = tf.estimator.DNNLinearCombinedRegressor(
        model_dir=output_dir,
        linear_feature_columns=wide,
        dnn_feature_columns=deep,
        dnn_hidden_units=hidden_units,
        dnn_dropout=DROPOUT_RATE,
        dnn_optimizer=optimizer,
        config=run_config)
    train_spec = tf.estimator.TrainSpec(
        input_fn=read_dataset(tf.estimator.ModeKeys.TRAIN),
        max_steps=TRAIN_STEPS)
    exporter = tf.estimator.LatestExporter('exporter', serving_input_fn)
    estimator = tf.contrib.estimator.add_metrics(estimator, my_rmse)
    estimator = tf.contrib.estimator.forward_features(estimator, KEY_COLUMN)
    eval_spec = tf.estimator.EvalSpec(
        input_fn=read_dataset(tf.estimator.ModeKeys.EVAL),
        steps=None,
        start_delay_secs=60,
        throttle_secs=EVAL_INTERVAL,
        exporters=exporter)
    with tf.contrib.tfprof.ProfileContext(''.join([output_dir, 'profiler']),
                                          trace_steps=range(1050, 1100),
                                          dump_steps=[1100]):
        tf.estimator.train_and_evaluate(estimator, train_spec, eval_spec)
