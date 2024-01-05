# Copyright 2023 Google LLC
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
"""Model features metadata utils."""


TARGET_FEATURE_NAME = "Class"
TARGET_LABELS = ["legit", "fraudulent"]


def generate_explanation_config(transform_feature_spec=None):
    explanation_config = {
        "inputs": {},
        "outputs": {},
        "params": {"sampled_shapley_attribution": {"path_count": 10}},
    }
    
    if transform_feature_spec is None:
        # hardcoded
        for i in range(28):
            feature_name = f'V{i+1}'
            explanation_config["inputs"][feature_name] = {
                "input_tensor_name": feature_name,
                "modality": "numeric",
            }
        feature_name = 'Amount'
        explanation_config["inputs"][feature_name] = {
            "input_tensor_name": feature_name,
            "modality": "numeric",
        }
    else:
        # specified by input argument
        for feature_name in transform_feature_spec:
            if feature_name != TARGET_FEATURE_NAME:
                explanation_config["inputs"][feature_name] = {
                    "input_tensor_name": feature_name,
                    "modality": "numeric",
                }
 
    explanation_config["outputs"] = {"scores": {"output_tensor_name": "scores"}}

    return explanation_config
