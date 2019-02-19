# Copyright 2019 Google LLC.
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

"""Configuration module containing the columns to be extracted from BigQuery.

The following global variables should be configured:
    * COLUMNS - Feature columns to be extracted from the source table without
    modifications.
    * TARGET_COLUMNS_SHUFFLE - Target columns to be either extracted from the
    source table without modifications or to be calculated at shuffle time.
    * TARGET_COLUMNS_EXPORT - Final target columns to be saved in the training
    and validation datasets, either extracted without modifications from the
    source table or generated at shuffle time.
"""

# Feature columns to be extracted from the source table without modifications.
COLUMNS = [
    'country_code',
    'year',
    'gross_reproduction_rate',
    'sex_ratio_at_birth',
    'fertility_rate_{0}',
    'fertility_rate_{1}',
    'fertility_rate_{2}',
    'fertility_rate_{3}',
    'fertility_rate_{4}',
    'fertility_rate_{5}',
    'fertility_rate_{6}'
]

# Target columns to be either extracted from the source table without modifications or to be
# calculated at shuffle time.
TARGET_COLUMNS_SHUFFLE = [
    'total_fertility_rate',
    '(fertility_rate_{0} + fertility_rate_{1} + fertility_rate_{2} + fertility_rate_{3} +\
			fertility_rate_{4} + fertility_rate_{5} + fertility_rate_{6})/7 as age_avg_fertility_rate'
]

# Final target columns to be saved in the training and validation datasets, either extracted
# without modifications from the source table or generated at shuffle time.
TARGET_COLUMNS_EXPORT = [
    'total_fertility_rate',
    'age_avg_fertility_rate'
]
