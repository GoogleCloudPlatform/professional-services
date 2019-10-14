# Copyright 2018 Google Inc.
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





import posixpath

from utils.datasettype import DatasetType

NUM_FEATURES_IN_DATASET = 28
FEATURE_COLUMNS = (
    ['V' + str(i) for i in range(1, NUM_FEATURES_IN_DATASET + 1)
    ] + ['Time', 'Amount'])
LABEL_COLUMN = 'Class'
KEY_COLUMN = 'key'
BQ_DATASET = 'fraud_detection'

PATH_TRANSFORMED_DATA = 'transformed_data'
PATH_TRANSFORMED_DATA_SPLIT = {
    k: posixpath.join(PATH_TRANSFORMED_DATA, k.name) for k in DatasetType
}
PATH_INPUT_TRANSFORMATION = 'input_transformation'
PATH_INPUT_SCHEMA = 'input_schema'
