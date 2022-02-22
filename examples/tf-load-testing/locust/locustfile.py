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

import json
import os

from locust import HttpUser, task, between
import pandas as pd


class RegressionUser(HttpUser):
    wait_time = between(0., 0.2)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.testdata = pd.read_csv(
            os.environ.get('testdata_path', '/testdata/regression_test.csv'))
        self.batch_size = os.environ.get('batch_size', 1)

    @task(1)
    def test(self):
        rows = self.testdata.sample(self.batch_size, replace=True).iterrows()
        instances = [{k: [v] for k, v in row.to_dict().items()}
                     for _, row in rows]
        data = json.dumps(
            {"signature_name": "serving_default", 
             "instances": instances})
        self.client.post('v1/models/regression:predict', data=data,
                         headers={"content-type": "application/json"})
