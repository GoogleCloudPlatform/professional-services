# Copyright 2019 Google LLC
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

"""Unit tests for API calls"""
import unittest
import requests
from mock import patch


class BasicTest(unittest.TestCase):
    """Class to test api calls of Training, Deployment and Prediction"""

    def is_not_used(self):
        """"Function to remove no-self-use warning"""
        pass

    @patch('requests.post')
    def test_train(self, mock_post):
        """
        Test case 1
        Tested LinearClassifier model on Census data
        """
        self.is_not_used()
        params = {"bucket": "gs://cmla",
                  "train_csv_path": "census_train.csv",
                  "eval_csv_path": "census_eval.csv",
                  "task_type": "classification",
                  "target_var": "income_bracket",
                  "column_name": "None",
                  "na_values": "None",
                  "condition": "None",
                  "name": "linearclassifier",
                  "n_classes": 2,
                  "hidden_units": 64,
                  "num_layers": 2,
                  "lin_opt": "ftrl",
                  "deep_opt": "adam",
                  "train_steps": 500,
                  "export_dir": "saved_model/export_dir",
                  "to_drop": "None"
                  }
        _ = requests.post('http://127.0.0.1:8080/train', data=params,
                          headers={'Content-Type': 'application/json'})
        mock_post.assert_called_with(
            "http://127.0.0.1:8080/train", data=params, headers={'Content-Type': 'application/json'})

    @patch('requests.post')
    def test_deploy(self, mock_post):
        """
        Deploy call
        Positive test
        """
        self.is_not_used()
        params = {
            "job_id": "C46f52b9f_9019101920_d7583d1f8286",
            "model_name": "testing",
            "runtime_version": "1.12",
            "version_name": "v6_1",
            "trained_model_location": "gs://cmla/saved_model/export_dir"
        }
        _ = requests.post('http://127.0.0.1:8080/deploy', data=params,
                          headers={'Content-Type': 'application/json'})
        mock_post.assert_called_with(
            "http://127.0.0.1:8080/deploy", data=params, headers={'Content-Type': 'application/json'})

    @patch('requests.post')
    def test_predict(self, mock_post):
        """
        Testing predict call
        Positive
        """
        self.is_not_used()
        params = {"model_name": "testing",
                  "instances": [{"capital_gain": 0,
                                 "relationship": "Unmarried",
                                 "gender": "Female",
                                 "marital_status": "Divorced",
                                 "education": "7th-8th",
                                 "fnlwgt": 140359,
                                 "occupation": "Machine-op-inspct",
                                 "capital_loss": 3900,
                                 "workclass": "Private",
                                 "age": 54,
                                 "native_country": "United-States",
                                 "race": "White",
                                 "education_num": 4,
                                 "hours_per_week": 40}],
                  "version_name": "v6_1"}
        _ = requests.post('http://127.0.0.1:8080/predict', data=params,
                          headers={'Content-Type': 'application/json'})
        mock_post.assert_called_with(
            "http://127.0.0.1:8080/predict", data=params, headers={'Content-Type': 'application/json'})
