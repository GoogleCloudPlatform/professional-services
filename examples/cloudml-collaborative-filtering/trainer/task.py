# Copyright 2019 Google Inc. All Rights Reserved.
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
"""Main script to train the model for product recommendation."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
import os
import sys

import tensorflow as tf

from constants import constants  # pylint: disable=g-bad-import-order
from trainer import inputs
from trainer import model


def parse_arguments(argv):
  """Parses execution arguments and replaces default values.

  Args:
    argv: Input arguments from sys.

  Returns:
    Dictionary of parsed arguments.
  """

  parser = argparse.ArgumentParser()
  parser.add_argument(
      "--model_dir",
      help="Where to save model files.",
      default="model_dir")
  parser.add_argument(
      "--input_dir",
      help="Dir or bucket containing tf-record files.",
      required=True)
  parser.add_argument(
      "--tft_dir",
      required=True,
      help="Dir or bucket where tft outputs are written.")
  parser.add_argument(
      "--batch_size",
      help="Number of rows of data to be fed into the model each iteration.",
      type=int,
      default=512)
  parser.add_argument(
      "--max_steps",
      help="The maximum number of iterations to train the model for.",
      type=int,
      default=10000)
  parser.add_argument(
      "--user_embed_mult",
      help="A multiplier on the user embedding size.",
      type=float,
      default=1)
  parser.add_argument(
      "--item_embed_mult",
      help="A multiplier on the item embedding size.",
      type=float,
      default=1)
  parser.add_argument(
      "--num_layers",
      help="Number of layers to use to map higher dim embedding a lower dim.",
      type=int,
      default=2)
  parser.add_argument(
      "--embedding_size",
      help="The dimension of the user-item embedding space.",
      type=int,
      default=30)
  parser.add_argument(
      "--learning_rate",
      help="Multiplier on the gradient to adjust weights each iteration.",
      type=float,
      default=0.001)
  parser.add_argument(
      "--save_checkpoints_steps",
      help="Number of steps to run before saving a model checkpoint.",
      type=int,
      default=5000)
  parser.add_argument(
      "--keep_checkpoint_max",
      help="Number of model checkpoints to keep.",
      type=int,
      default=2)
  parser.add_argument(
      "--log_step_count_steps",
      help="Number of steps to run before logging training performance.",
      type=int,
      default=1000)
  parser.add_argument(
      "--eval_steps",
      help="Number of steps to use to evaluate the model.",
      type=int,
      default=20)

  args, _ = parser.parse_known_args(args=argv[1:])
  return args


def _make_input_fn(file_pattern, params):
  """Creates an input function from files matching the given pattern."""

  return inputs.get_input_fn(
      file_pattern=os.path.join(params.input_dir, file_pattern),
      batch_size=params.batch_size)


def run_training(params):
  """Initializes the estimator and runs train_and_evaluate."""

  train_input_fn = _make_input_fn(constants.TRAIN_PATTERN, params)
  train_spec = tf.estimator.TrainSpec(
      input_fn=train_input_fn,
      max_steps=params.max_steps,
  )
  eval_input_fn = _make_input_fn(constants.VAL_PATTERN, params)
  exporter = tf.estimator.FinalExporter("export", inputs.get_serving_input_fn())
  eval_spec = tf.estimator.EvalSpec(
      input_fn=eval_input_fn,
      throttle_secs=1,
      steps=params.eval_steps,
      start_delay_secs=1,
      exporters=[exporter],
  )
  recommender = model.get_recommender(params)
  tf.estimator.train_and_evaluate(recommender, train_spec, eval_spec)


def main():
  params = parse_arguments(sys.argv)
  tf.logging.set_verbosity(tf.logging.INFO)
  run_training(params)

if __name__ == "__main__":
  main()

