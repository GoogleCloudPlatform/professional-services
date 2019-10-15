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
"""Configuration for transform pipeline construction"""

import numpy as np

from trainer import constants

"""
In the following, I provided an example based on census dataset. To adapt to
arbitrary dataset, please change the TRANSFORM_CONFIG accordingly, and define
your own transform functions. If no feature engineering is needed,
simply leave TRANSFORM_CONFIG = []
"""


def _age_class(age):
  """Example scalar processing function

  Args:
    age: (int), age in integer

  Returns:

  """
  if age < 10:
    return 1
  elif 10 <= age < 18:
    return 2
  elif 18 <= age < 30:
    return 3
  elif 30 <= age < 50:
    return 4
  else:
    return 5


def _age_square_root(age):
  """Example scalar processing function

  Args:
    age: (int), age in integer

  Returns:
    float
  """
  return np.sqrt(age)


TRANSFORM_CONFIG = [
    # this is an example for pass through features,
    # i.e., those doesn't need any processing
    {
        'input_columns': ['age', 'hours_per_week', 'workclass', 'education',
                          'marital_status', 'occupation', 'relationship',
                          'race', 'sex', 'native_country'],
        # the raw feature types are defined in the metadata,
        # no need to do it here
        'process_function': None,
        'output_columns': ['age', 'hours_per_week', 'workclass', 'education',
                           'marital_status', 'occupation', 'relationship',
                           'race', 'sex', 'native_country'],
    },

    # this is an example for generating new categorical feature using single
    # column from the raw data
    {
        'input_columns': ['age'],
        'process_function': _age_class,
        'output_columns': [('age_class', constants.CATEGORICAL_INDICATOR)]
    },

    # this is an example for generating new numerical feature using single
    # column from the raw data
    {
        'input_columns': ['age'],
        'process_function': _age_square_root,
        'output_columns': [('age_sqrt', constants.NUMERICAL_INDICATOR)]
    },

]
