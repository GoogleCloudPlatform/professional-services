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
"""Defaults for the model.

These values can be tweaked to affect model training performance.
"""


HIDDEN_UNITS = [64, 32]
LEARNING_RATE = 0.0001
BATCH_SIZE = 512
NUM_EPOCHS = 10
NUM_EVAL_STEPS = 100


def update_hyperparams(hyperparams: dict) -> dict:
    if "hidden_units" not in hyperparams:
        hyperparams["hidden_units"] = HIDDEN_UNITS
    else:
        if not isinstance(hyperparams["hidden_units"], list):
            hyperparams["hidden_units"] = [
                int(v) for v in hyperparams["hidden_units"].split(",")
            ]
    if "learning_rate" not in hyperparams:
        hyperparams["learning_rate"] = LEARNING_RATE
    if "batch_size" not in hyperparams:
        hyperparams["batch_size"] = BATCH_SIZE
    if "num_epochs" not in hyperparams:
        hyperparams["num_epochs"] = NUM_EPOCHS
    return hyperparams
