#!/usr/bin/env python

# Copyright 2020 Google Inc. All rights reserved.
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

# python experiment.py -max_batch_size=100 =tensorflow_intra_op_parallelism=20 --enable_batching

import argparse

ENABLE_BATCHING = 'enable_batching'
BATCHING_CONFIG_FILE = 'batching_parameters_file'
BATCHING_DEFAULT_PARAMS = {'max_batch_size': 100, 'batch_timeout_micros': 1,
                           'max_enqueued_batches': 100, 'num_batch_threads': 1}
TF_SERVING_ALLOWED_PARAMS = [BATCHING_CONFIG_FILE,
                             'tensorflow_session_parallelism', 'tensorflow_intra_op_parallelism',
                             'tensorflow_inter_op_parallelism', 'rest_api_num_threads', 'rest_api_timeout_in_ms']
BATCHING_CONFIG_DEFAULT_PATH = './batching_parameters_default.txt'
SERVING_CONFIG_DEFAULT_PATH = './kubernetes_default.yaml'


class Experiment:

    def __init__(self, tf_serving_params=TF_SERVING_ALLOWED_PARAMS,
                 batching_default_params=BATCHING_DEFAULT_PARAMS,
                 batching_config_default_path=BATCHING_CONFIG_DEFAULT_PATH,
                 serving_config_default_path=SERVING_CONFIG_DEFAULT_PATH,
                 model_name='regression',
                 **kwargs):
        self.params = {k: v for k, v in kwargs.items() if k in tf_serving_params}
        self.enable_batching = kwargs.get(ENABLE_BATCHING, False)
        self.batching_params = {k: kwargs.get(k, v) for k, v in batching_default_params.items()}
        self.batching_config_default_path = batching_config_default_path
        self.serving_config_default_path = serving_config_default_path
        self.model_name = model_name

    def _dump_parameters(self, origin_path, destination_path, params):
        with open(origin_path, 'r') as f:
            data = f.read()
        with open(destination_path, 'w') as f:
            f.write(data.format(**params))

    def _get_parameters_line(self):
        params = []
        for k, v in self.params.items():
            params.append(''.join(['"--', k, '=', str(v), '"']))
        if BATCHING_CONFIG_FILE in self.params and not self.enable_batching:
            raise ValueError('Batching should be enabled to use the batching config file.')
        if self.enable_batching:
            params.append('"--enable_batching"')
        return params

    def _merge_params(self, params):
        return ', '.join(params)

    def deploy_serving(self):
        if self.enable_batching:
            self._dump_parameters(self.batching_config_default_path, './batching_parameters.txt',
                                  self.batching_params)
        tf_params = self._merge_params(self._get_parameters_line())
        self._dump_parameters(self.serving_config_default_path, './kubernetes.yaml',
                              {'tensorflow_params': tf_params, 'model_name': self.model_name})


def parse_args():
    parser = argparse.ArgumentParser(description='Experiment setup.')
    for p in TF_SERVING_ALLOWED_PARAMS:
        parser.add_argument('--'+p)
    for p in BATCHING_DEFAULT_PARAMS.keys():
        parser.add_argument('--'+p)
    parser.add_argument('--'+ENABLE_BATCHING, action='store_true')

    args = parser.parse_args()
    return {k:v for k, v in vars(args).items() if v is not None}


def main():
    args = parse_args()
    e = Experiment(**args)
    e.deploy_serving()


if __name__ == '__main__':
    main()
