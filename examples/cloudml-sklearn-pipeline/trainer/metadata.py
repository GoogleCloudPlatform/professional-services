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
# ==============================================================================

"""Dataset metadata."""

# Usage: Modify below based on the dataset used.
CSV_COLUMNS = None  # Schema of the data. Necessary for data stored in GCS

# In the following, I provided an example based on census dataset.
NUMERIC_FEATURES = [
    'age',
    'hours_per_week',
]

CATEGORICAL_FEATURES = [
    'workclass',
    'education',
    'marital_status',
    'occupation',
    'relationship',
    'race',
    'sex',
    'native_country'
]

FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES

LABEL = 'income_bracket'
PROBLEM_TYPE = 'classification'  # 'regression' or 'classification'

BASE_QUERY = '''
    SELECT
      *
    FROM
      `{table}`
  '''
