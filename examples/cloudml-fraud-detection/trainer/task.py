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

"""Builds and runs TF model training and evaluation.

Defined model and training based on input arguments.
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
from datetime import datetime
import json
import os
import posixpath
import sys

import tensorflow as tf

from constants import constants
from trainer import input_fn_utils
from trainer import model


def run(args):
  """Runs tensorflow model training.

  Args:
    args: Arguments parsed at program executions.
  """

  estimator = model.build_estimator(
      output_dir=args.output_dir,
      first_layer_size=args.first_layer_size,
      num_layers=args.num_layers,
      dropout=args.dropout,
      learning_rate=args.learning_rate,
      save_checkpoints_steps=args.save_checkpoints_steps)

  train_input_fn = input_fn_utils.read_dataset(
      input_dir=args.input_dir,
      mode=tf.contrib.learn.ModeKeys.TRAIN,
      batch_size=args.batch_size)

  eval_input_fn = input_fn_utils.read_dataset(
      input_dir=args.input_dir,
      mode=tf.contrib.learn.ModeKeys.EVAL,
      batch_size=args.batch_size)

  serving_input_fn = input_fn_utils.get_serving_input_fn(args.input_dir)

  train_spec = tf.estimator.TrainSpec(
      input_fn=train_input_fn, hooks=[], max_steps=args.max_steps)

  exporter = tf.estimator.LatestExporter('exporter', serving_input_fn)
  eval_spec = tf.estimator.EvalSpec(
      input_fn=eval_input_fn, hooks=[], exporters=exporter)

  tf.estimator.train_and_evaluate(estimator, train_spec, eval_spec)


def parse_arguments(argv):
  """Parses execution arguments and replaces default values.

  Args:
    argv: Input arguments from sys.

  Returns:
    Parsed arguments.
  """

  parser = argparse.ArgumentParser()
  parser.add_argument(
      '--batch_size',
      type=int,
      default=128,
      help='Batch size to use during training.')
  parser.add_argument(
      '--dropout',
      type=float,
      default=None,
      help='Percent of nodes to dropout in dropout layer.')
  parser.add_argument(
      '--first_layer_size',
      type=int,
      default=15,
      help='Size of first hidden layer of network.')
  parser.add_argument(
      '--input_dir',
      required=True,
      help='GCS or local directory containing outputs from preprocessing.')
  parser.add_argument(
      '--learning_rate',
      type=float,
      default=0.001,
      help='Learning rate to use during training.')
  parser.add_argument(
      '--max_steps',
      type=int,
      default=10000,
      help='Maxium number of steps to train model.')
  parser.add_argument(
      '--num_layers',
      type=int,
      default=1,
      help='Number of hidden layers of network.')
  parser.add_argument(
      '--output_dir',
      required=True,
      help='Directory where model outputs will be written.')
  parser.add_argument(
      '--save_checkpoints_steps',
      type=int,
      default=500,
      help='Number of steps between checkpoint saves.')
  args, _ = parser.parse_known_args(args=argv[1:])

  # Adds the trial number from environment variables to avoid clobber output
  # during hyper-parameters tuning.
  trial_id = json.loads(os.environ.get('TF_CONFIG', '{}')).get('task', {}).get(
      'trial', '')
  if not trial_id:
    trial_id = '1'
  args.output_dir = posixpath.join(args.output_dir, 'trials', trial_id)
  return args


def main():
  """Parses execution arguments and calls running function.

  Checks current OS. Posix OS is required for local and GCP paths consistency.

  Raises:
    OSError: Posix OS required.
  """

  if os.name != 'posix':
    raise OSError('Posix OS required.')

  args = parse_arguments(sys.argv)
  tf.logging.set_verbosity(tf.logging.INFO)
  run(args)


if __name__ == '__main__':
  main()
