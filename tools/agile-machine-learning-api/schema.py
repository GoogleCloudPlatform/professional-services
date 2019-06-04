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

"""
Contains schema of the parameters passed to train, deploy and predict API calls
"""
TRAIN_SCHEMA = {
    'properties': {
        "train_csv_path": {'type': ['string', 'array']},
        "eval_csv_path": {'type': 'string'},
        "task_type": {'type': 'string'},
        "target_var": {'type': 'string'},
        "data_type": {'type': 'object'},
        "column_name": {'type': 'string'},
        "na_values": {'type': 'string'},
        "condition": {'type': 'string'},
        "name": {'type': 'string'},
        "n_classes": {'type': 'integer'},
        "hidden_units": {'type': 'integer'},
        "num_layers": {'type': 'integer'},
        "lin_opt": {'type': 'string'},
        "deep_opt": {'type': 'string'},
        "train_steps": {'type': 'integer'},
        "to_drop": {'type': 'array'},
        "export_dir": {'type': 'string'}
    },
    'required': [
        "train_csv_path",
        "eval_csv_path",
        "task_type",
        "target_var",
        "name",
        "export_dir"
    ]
}

PREDICT_SCHEMA = {
    "properties": {
        "model_name": {'type': 'string'},
        "version_name": {'type': 'string'},
    },
    "required": ["model_name", "instances", "version_name"]
}

DEPLOY_SCHEMA = {
    'properties': {
        "model_name": {'type': 'string'},
        "version_name": {'type': 'string'},
        "trained_model_location": {'type': 'string'},
    },
    'required': ["model_name", "version_name", "trained_model_location"]
}

LIME_SCHEMA_2 = {
    'properties': {
        "export_dir": {'type': 'string'},
        "predict_json": {'type': 'string'},
        "batch_prediction": {'type': 'boolean'},
        "name": {'type': 'string'}
    },
    'required': ["export_dir", "predict_json", "batch_prediction", "name"]
}

LIME_SCHEMA = {
    'properties': {
        "export_dir": {'type': 'string'},
        "predict_json": {'type': 'string'},
        "data_points": {'type': 'array'},
        "batch_prediction": {'type': 'boolean'},
        "name": {'type': 'string'}
    },
    'required': ["export_dir", "predict_json", "data_points", "batch_prediction", "name"]
}
