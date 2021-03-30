#!/usr/bin/env python
#Copyright 2018 Google LLC
#
#Licensed under the Apache License, Version 2.0 (the "License");
#you may not use this file except in compliance with the License.
#You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
#Unless required by applicable law or agreed to in writing, software
#distributed under the License is distributed on an "AS IS" BASIS,
#WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#See the License for the specific language governing permissions and
#limitations under the License.
# ==============================================================================
"""Runs the TensorFlow experiment.

  Creates a TensorFlow Estimator and trains it.

  Typical usage example:

  Use ML Engine SDK to submit this script
"""

import argparse
import json
import os

import tensorflow as tf

import inputs
import model


def initialise_params():
    """Parses all arguments and assigns default values when missing.

    Convert argument strings to objects and assign them as attributes of the
    namespace.

    Returns:
        An object containing all the parsed arguments for script to use.
    """
    args_parser = argparse.ArgumentParser()
    args_parser.add_argument(
        '--job-dir',
        help='GCS location to write checkpoints and export models.',
        required=True
    )
    args_parser.add_argument(
        '--training_path',
        help='Location to training data.',
        default='gs://energyforecast/data/csv/MLDataTrain.csv'
    )
    args_parser.add_argument(
        '--validation_path',
        help='Location to validation data.',
        default='gs://energyforecast/data/csv/MLDataValid.csv'
    )
    args_parser.add_argument(
        '--mean_path',
        help='Location to pre-computed means.',
        default='gs://energyforecast/data/pickle/mean.pkl'
    )
    args_parser.add_argument(
        '--std_path',
        help='Location to pre-computed standard deviations.',
        default='gs://energyforecast/data/pickle/std.pkl'
    )
    args_parser.add_argument(
        '--dropout',
        help='Dropout probability.',
        default=0.2,
        type=float
    )
    args_parser.add_argument(
        '--hour_embedding',
        help='Size of hour embedding.',
        default=20,
        type=int
    )
    args_parser.add_argument(
        '--day_embedding',
        help='Size of day embedding.',
        default=10,
        type=int
    )
    args_parser.add_argument(
        '--first_layer_size',
        help='First layer size.',
        default=100,
        type=int
    )
    args_parser.add_argument(
        '--number_layers',
        help='Number of hidden layers.',
        default=3,
        type=int
    )
    args_parser.add_argument(
        '--layer_reduction_fraction',
        help='Fraction to reduce layers in network.',
        default=0.5,
        type=float
    )
    args_parser.add_argument(
        '--learning_rate',
        help='Learning rate.',
        default=0.01,
        type=float
    )
    args_parser.add_argument(
        '--batch_size',
        help='Training batch size.',
        default=64,
        type=int
    )
    args_parser.add_argument(
        '--eval_batch_size',
        help='Evaluation batch size.',
        default=168,
        type=int
    )
    args_parser.add_argument(
        '--max_steps',
        help='Maximum steps for training.',
        default=5000,
        type=int
    )
    return args_parser.parse_args()


def run_experiment(run_config, parameters):
    """Runs TensorFlow experiment.

    Creates the model, trains it, and evaluates it.

    Args:
        run_config: Configuration for experiment.
        parameters: Parameters passed to the job.
    """
    estimator = model.create_regressor(
        config=run_config, parameters=parameters)
    train_spec = inputs.get_train_spec(
        parameters.training_path,
        parameters.batch_size,
        parameters.max_steps)
    eval_spec = inputs.get_eval_spec(
        parameters.validation_path,
        parameters.eval_batch_size)

    tf.estimator.train_and_evaluate(
        estimator,
        train_spec,
        eval_spec
    )


def main():
    """Main function to be run when executing job.

    Orchestrates the script
    """
    parameters = initialise_params()
    tf.logging.set_verbosity(tf.logging.INFO)
    model_dir = os.path.join(parameters.job_dir, json.loads(
        os.environ.get('TF_CONFIG', '{}')).get('task', {}).get('trial', ''))

    run_config = tf.estimator.RunConfig(
        log_step_count_steps=1000,
        save_checkpoints_secs=120,
        keep_checkpoint_max=3,
        model_dir=model_dir
    )
    run_experiment(run_config, parameters)


if __name__ == '__main__':
    main()
