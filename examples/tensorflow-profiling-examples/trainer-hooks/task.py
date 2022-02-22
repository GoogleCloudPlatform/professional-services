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

import argparse
import json
import os

import model


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--bucket',
                        help='GCS path to data',
                        required=True)
    parser.add_argument('--output_dir',
                        help='GCS loc to write checkpoints and export models',
                        required=True)
    parser.add_argument('--train_steps',
                        help='Steps to run the training job for.',
                        type=int,
                        default=10000)
    parser.add_argument('--eval_int',
                        help='Evaluation interval in seconds',
                        type=int,
                        default=200)
    parser.add_argument('--pattern',
                        help="""Specify a pattern that has to be in input files.
                        For example 00001-of will process only one shard""",
                        default='of')
    parser.add_argument('--job-dir',
                        help='we ignore it, but it is required',
                        default='junk')
    parser.add_argument('--eval_steps',
                        type=int,
                        default=None)
    parser.add_argument('--batch_size',
                        type=int,
                        default=512)
    parser.add_argument('--n_embeds',
                        type=int,
                        default=3)
    parser.add_argument('--dropout_rate',
                        type=float,
                        default=0.1)
    parser.add_argument('--learning_rate',
                        type=float,
                        default=0.001)
    parser.add_argument('--first_layer_size',
                        type=int,
                        default=64)
    parser.add_argument('--num_layers',
                        type=int,
                        default=2)

    args = parser.parse_args()
    return vars(args)


def main():
    # unused args provided by service
    arguments = parse_args()
    arguments.pop('job_dir', None)
    arguments.pop('job-dir', None)

    output_dir = arguments.pop('output_dir')
    model.BUCKET = arguments.pop('bucket')
    model.TRAIN_STEPS = arguments.pop('train_steps')
    model.EVAL_INTERVAL = arguments.pop('eval_int')
    model.PATTERN = arguments.pop('pattern')
    model.BATCH_SIZE = arguments.pop('batch_size')
    model.NUM_LAYERS = arguments.pop('num_layers')
    model.FIRST_LAYER_SIZE = arguments.pop('first_layer_size')
    model.N_EMBEDS = arguments.pop('n_embeds')
    model.LEARNING_RATE = arguments.pop('learning_rate')
    model.DROPOUT_RATE = arguments.pop('dropout_rate')

    # Append trial_id to path if we are doing hptuning
    # This code can be removed if you are not using hyperparameter tuning
    config_json = json.loads(os.environ.get('TF_CONFIG', '{}'))
    output_dir = os.path.join(output_dir,
                              config_json.get('task', {}).get('trial', ''))

    #  Run the training job
    #  learn_runner.run(model.experiment_fn, output_dir)
    model.train_and_evaluate(output_dir)

if __name__ == '__main__':
    main()
