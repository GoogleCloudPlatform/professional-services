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
"""Trainer for survival analysis model."""

import sys
import argparse
import functools

import tensorflow as tf
import tensorflow_transform as tft

from trainer import input_util
from trainer import metadata
from trainer import model


def parse_arguments(argv):
    """Parse command-line arguments."""

    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--verbosity',
        help='Set logging level.',
        choices=['DEBUG', 'ERROR', 'FATAL', 'INFO', 'WARN'],
        default='INFO',
    )
    parser.add_argument(
        '--train-batch-size',
        help='Batch size for each training step.',
        type=int,
        default=120,
    )
    parser.add_argument(
        '--eval-batch-size',
        help='Batch size for evaluation steps.',
        type=int,
        default=1000,
    )
    parser.add_argument(
        '--eval-start-secs',
        help='How long to wait before starting first evaluation.',
        default=20,
        type=int,
    )
    parser.add_argument(
        '--eval-steps',
        help="""Number of steps to run evaluation for at each checkpoint',
        Set to None to evaluate on the whole evaluation data.
        """,
        default=None,
        type=int,
    )
    parser.add_argument(
        '--num-epochs',
        help="""Maximum number of training data epochs.
        If both --train-size and --num-epochs are specified, --train-steps will
        be: (train-size/train-batch-size) * num-epochs.""",
        default=None,
        type=int,
    )
    parser.add_argument(
        '--job-dir',
        help='GCS location to write checkpoints and export models.',
        required=True,
    )
    parser.add_argument(
        '--input-dir',
        help='GCS or local directory to TFRecord and metadata files.',
        required=True,
    )
    parser.add_argument(
        '--train-steps',
        help="""Steps to run the training job for.
        If --num-epochs and --train-size are specified, then --train-steps will
        be: (train-size/train-batch-size) * num-epochs.""",
        default=10000,
        type=int,
    )
    parser.add_argument(
        '--train-size',
        help='Size of training set (instance count).',
        type=int,
        default=None,
    )
    parser.add_argument(
        '--hidden-units',
        help='Hidden units, default is [10, 10].',
        default=[10, 10],
    )
    parser.add_argument(
        '--first-layer-size',
        help='Number of hidden units in first layer.',
        type=int,
        default=35,
    )
    parser.add_argument(
        '--num-layers',
        help='Number of layers.',
        type=int,
        default=2,
    )
    parser.add_argument(
        '--layer-sizes-scale-factor',
        help="""Determine how the size of the layers in the DNN decays.
        If value = 0 then the provided --hidden-units will be taken as is.""",
        default=0.78535296735911486,
        type=float,
    )
    parser.add_argument(
        '--learning-rate',
        help='Learning rate',
        default=0.021388123321319803,
        type=float,
    )
    parser.add_argument(
        '--threshold',
        help='Confidence Score threshold to resolve class predictions.',
        default=0.34157646920229945,
        type=float,
    )
    parser.add_argument(
        '--checkpoint_steps',
        help='Number of steps between each checkpoint.',
        default=1000,
        type=int,
    )
    return parser.parse_args(argv)


def train_and_evaluate(flags):
    """Runs model training and evaluation using TF Estimator API."""

    # Get TF transform metadata generated during preprocessing
    tf_transform_output = tft.TFTransformOutput(flags.input_dir)

    feature_spec = tf_transform_output.transformed_feature_spec()
    train_input_fn = functools.partial(
        input_util.input_fn,
        input_dir=flags.input_dir,
        mode=tf.estimator.ModeKeys.TRAIN,
        batch_size=flags.train_batch_size,
        num_epochs=flags.num_epochs,
        label_name=metadata.LABEL_COLUMN,
        feature_spec=feature_spec
    )
    train_spec = tf.estimator.TrainSpec(
        train_input_fn, max_steps=flags.train_steps)

    eval_input_fn = functools.partial(
        input_util.input_fn,
        input_dir=flags.input_dir,
        mode=tf.estimator.ModeKeys.EVAL,
        batch_size=flags.eval_batch_size,
        num_epochs=1,
        label_name=metadata.LABEL_COLUMN,
        feature_spec=feature_spec
    )

    exporter = tf.estimator.FinalExporter(
        'export', functools.partial(
            input_util.tfrecord_serving_input_fn,
            feature_spec=feature_spec,
            label_name=metadata.LABEL_COLUMN))

    eval_spec = tf.estimator.EvalSpec(
        eval_input_fn,
        steps=flags.eval_steps,
        start_delay_secs=flags.eval_start_secs,
        exporters=[exporter],
        name='churn-eval'
    )

    run_config = tf.estimator.RunConfig(
        save_checkpoints_steps=flags.checkpoint_steps,
        tf_random_seed=metadata.SEED,
        model_dir=flags.job_dir
    )

    feature_columns = model.get_feature_columns(
        tf_transform_output, exclude_columns=metadata.NON_FEATURE_COLUMNS)
    num_intervals = metadata.NUM_INTERVALS
    estimator = model.build_estimator(
        run_config, flags, feature_columns, num_intervals)

    tf.estimator.train_and_evaluate(estimator, train_spec, eval_spec)


def main():
    flags = parse_arguments(sys.argv[1:])
    tf.logging.set_verbosity(flags.verbosity)
    train_and_evaluate(flags)


if __name__ == '__main__':
    main()
