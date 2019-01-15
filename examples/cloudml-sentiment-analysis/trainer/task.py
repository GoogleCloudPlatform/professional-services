# Copyright 2018 Google Inc.
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

"""Runs model training locally or on Google Cloud ML Engine."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import json
import os
import tempfile

import tensorflow as tf
from tensorflow.contrib import feature_column

from constants import constants
from trainer import input_fn


FLAGS = tf.flags.FLAGS
tf.flags.DEFINE_string('input_dir', None, 'Path to directory with input data.')
tf.flags.DEFINE_string('model_dir', None,
                       'Location to store tensorflow model to.')
tf.flags.DEFINE_integer('training_steps', 2000,
                        'Maximum number of training steps.')
tf.flags.DEFINE_integer('eval_steps', 100,
                        'Number of eval steps during training.')
tf.flags.DEFINE_integer('batch_size', 64, 'Batch size.')
tf.flags.DEFINE_integer('prefetch_buffer_size', 1,
                        'Buffer size to use for prefetch step in input fn.')

tf.flags.DEFINE_integer('num_units', 50, 'Number of units of LSTM layer.')
tf.flags.DEFINE_float('learning_rate', 0.005, 'Learning rate.')
tf.flags.DEFINE_integer('embedding_dimension', 250,
                        'Size of word embedding vectors.')
tf.flags.DEFINE_integer('num_hash_buckets', 20000,
                        'Number of buckets to hash words tokens into.')
tf.flags.DEFINE_integer('save_checkpoints_steps', 200,
                        'Save model checkpoints every specified steps.')
tf.flags.DEFINE_integer('start_delay_secs', 120,
                        'Number of seconds by which delaying evaluation.')
tf.flags.DEFINE_integer('throttle_secs', 600,
                        'Minimum number of seconds between two consecutive '
                        'evaluations.')
tf.flags.mark_flag_as_required('input_dir')

# Model training constants.
_RNN_CELL_TYPE = 'lstm'
_INPUT_SHUFFLING_SEED = 1
_EXPORTER_NAME = 'exporter'


def get_feature_columns(num_hash_buckets, embedding_dimension):
  """Creates sequential input columns to `RNNEstimator`.

  Args:
    num_hash_buckets: `int`, number of embedding vectors to use.
    embedding_dimension: `int`, size of embedding vectors.

  Returns:
    List of `tf.feature_column` ojects.
  """

  id_col = feature_column.sequence_categorical_column_with_hash_bucket(
      constants.TOKENS, num_hash_buckets, dtype=tf.string)
  features_columns = [tf.feature_column.embedding_column(
      id_col, dimension=embedding_dimension)]
  return features_columns


def append_gcp_trial_id(path):
  """Adds the trial number from environment variables to model directory.

  Goal is to avoid clobber output with hyper-parameter tuning.

  Args:
    path: `str`, path to edit.

  Returns:
    `str` with updated path.
  """

  trial_id = json.loads(
      os.environ.get('TF_CONFIG', '{}')).get('task', {}).get('trial', '')
  if trial_id:
    return os.path.join(path, trial_id)
  return path


def run(hparams, input_dir, training_steps, eval_steps, model_dir):
  """Builds classifier and input function and runs estimator train&evaluate.

  Args:
    hparams: Object holding a set of hyperparameters as name-value pairs.
    input_dir: `str`, path to training input data (local or GCS path).
    training_steps: `int`, number of maximum training steps.
    eval_steps: `int`, number of evaluation steps.
    model_dir: `str`, path to model directory (local or GCS path).
  """

  features_columns = get_feature_columns(hparams.num_hash_buckets,
                                         hparams.embedding_dimension)
  config = tf.estimator.RunConfig(
      save_checkpoints_steps=hparams.save_checkpoints_steps)
  classifier = tf.contrib.estimator.RNNClassifier(
      sequence_feature_columns=features_columns,
      cell_type=_RNN_CELL_TYPE,
      num_units=[hparams.num_units],
      optimizer=tf.train.AdagradOptimizer(learning_rate=hparams.learning_rate),
      model_dir=model_dir,
      config=config)

  def _get_file_path(sub_directory):
    return os.path.join(input_dir,
                        '{}{}*'.format(sub_directory, constants.TFRECORD))

  train_input_fn = input_fn.make_input_fn(
      _get_file_path(constants.SUBDIR_TRAIN),
      training=True,
      batch_size=hparams.batch_size,
      random_seed=_INPUT_SHUFFLING_SEED,
      prefetch_buffer_size=FLAGS.prefetch_buffer_size)
  eval_input_fn = input_fn.make_input_fn(
      _get_file_path(constants.SUBDIR_VAL),
      training=False,
      batch_size=hparams.batch_size,
      random_seed=_INPUT_SHUFFLING_SEED,
      prefetch_buffer_size=FLAGS.prefetch_buffer_size)

  exporter = tf.estimator.LatestExporter(_EXPORTER_NAME,
                                         input_fn.serving_input_fn)
  train_spec = tf.estimator.TrainSpec(input_fn=train_input_fn,
                                      max_steps=training_steps)
  eval_spec = tf.estimator.EvalSpec(
      input_fn=eval_input_fn,
      steps=eval_steps,
      exporters=exporter,
      start_delay_secs=hparams.start_delay_secs,
      throttle_secs=hparams.throttle_secs)

  results = tf.estimator.train_and_evaluate(classifier, train_spec, eval_spec)
  tf.logging.info('Training results: %s.', results)


def main():
  tf.logging.set_verbosity(tf.logging.INFO)

  model_dir = FLAGS.model_dir
  if not model_dir:
    model_dir = tempfile.mkdtemp()
  model_dir = append_gcp_trial_id(model_dir)

  run(FLAGS,
      input_dir=FLAGS.input_dir,
      training_steps=FLAGS.training_steps,
      eval_steps=FLAGS.eval_steps,
      model_dir=model_dir)

if __name__ == '__main__':
  main()
