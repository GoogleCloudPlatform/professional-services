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

"""Utility functions for constructing transform pipeline"""

import numpy as np
from numpy.lib.function_base import _parse_gufunc_signature
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import FeatureUnion, Pipeline

from trainer import metadata
from trainer.constants import NUMERICAL_INDICATOR, CATEGORICAL_INDICATOR


class DFSelector(BaseEstimator, TransformerMixin):
  """This is a helper class to introduce columns selection as the (usually)
  first step of a pipeline.

  """

  def __init__(self, attribute_names):
    """Initialization

    Args:
      attribute_names: List[string], names of the column to be selected
    """
    self.attribute_names = attribute_names

  def fit(self, X, y=None):
    return self

  def transform(self, X):
    """Get the desired columns from the raw DataFrame,
    and convert to numpy.array

    Args:
      X: (pandas.DataFrame), DataFrame to work on

    Returns:
      Numpy.array containing the data in desired columns
    """

    result = X[self.attribute_names].to_numpy()
    return result


class VectorizedFunctionTransformer(BaseEstimator, TransformerMixin):
  """Apply any function element-wise on the input, including complex data
  types like list, dict.

  This class is required because a vectorized function cannot be loaded back
  from dumped file correctly. It vectorizes the function lazily only when
  transform() is called instead of storing it as an instance variable.
  See:
  https://github.com/numpy/numpy/issues/8099
  https://github.com/numba/numba/issues/2943
  """

  def __init__(self, func, signature=None):
    """

    Args:
      func: (function), any function to be applied element-wise on the input
      signature: (string), signature of the func, which explain the desied
      shape of input and output data. Currently the following four signatures
      are supported:
        1. '()->()': scalar to scalar, for single input and single output
        2. '()->(n)': scalar to array, for single input and multiple outputs
        3. '(n)->()': array to scalar, for multiple inputs and single output
        4. '(n)->(n)': array to array, for multiple inputs and multiple outputs
    """
    self.func = func
    self.signature = signature

  def fit(self, X, y=None):
    """Empty function, simply return self to fulfill the signature"""
    return self

  def transform(self, X):
    if self.func is None:
      return X

    if self.signature:
      input_dims, output_dims = _parse_gufunc_signature(
          signature=self.signature)
    else:
      input_dims, output_dims = [()], [()]

    # This below ensures FeatureUnion's concatenation (hstack) does not fail
    # because of resulting arrays having different number of dims
    if len(input_dims[0]) == 1 and len(output_dims[0]) == 0:
      X = np.expand_dims(X, axis=1)  # Add one extra dimension if (n)->()
    elif len(input_dims[0]) == 0 and len(output_dims[0]) == 1:
      X = np.squeeze(X, axis=1)  # Remove singleton dimension if ()->(n)

    return np.vectorize(self.func, otypes=[np.float], signature=self.signature)(
        X)


def _parse_signature(input_length, output_length):
  """Helper function that construct the desired signature string based on the
  shape of input_columns and output_columns defined in transform_config.
  The signature string will be used for invoking numpy.vectorize function.

  Args:
    input_length: (int), length of input column
    output_length: (int), length of output columnf

  Returns:
    str
  """

  if input_length == 1 and output_length == 1:
    signature = None
  elif input_length > 1 and output_length == 1:
    signature = '(n)->()'
  elif input_length == 1 and output_length > 1:
    signature = '()->(n)'
  else:
    signature = '(n)->(n)'

  return signature


def get_transform_pipeline(transform_config):
  """This helper function will take the transform config object, and generate
  a transform pipeline. The transform pipeline aims for generating new features
  out of the existing features with user defined functions.
  The format of transform_config is expected as follows:

  TRANSFORM_CONFIG = [
    # pass through features
    {
        'input_columns': ['col1', 'col2', 'col3'],
        'process_function': None,
        'output_columns': ['col1', 'col2', 'col3']
    },
    # generate new feature
    {
        'input_columns': ['col1', 'col2'],
        'process_function': _process_func,
        # 'N' stands for numerical feature
        'output_columns': [('col_new', TYPE_INDICATOR)]
    },
  ]

  TYPE_INDICATOR: NUMERICAL_INDICATOR or CATEGORICAL_INDICATOR
  _process_func: user defined function to generate new feature '
  col_new' based on 'col1' and 'col2'

  Args:
    transform_config: (object), defines how the transform pipeline
    should be constructed

  Returns:
    sklearn.pipeline.Pipeline, List[str], List[str], List[str]
  """

  if not transform_config:
    transform_config = [
        {
            'input_columns': metadata.FEATURE_COLUMNS,
            'process': False,
            'output_columns': metadata.FEATURE_COLUMNS
        }
    ]

  transform_pipeline = []
  # holder for storing the feature names after transformation
  transformed_column_names = []
  # holder for storing the numerical feature names after transformation
  new_numeric_columns = []
  # holder for storing the categorical feature names after transformation
  new_categorical_columns = []

  for config in transform_config:
    # Pass through features
    if config['process_function'] is None:
      transform_pipeline.append(
          ('pass_through',
           Pipeline([('extract', DFSelector(config['input_columns'])), ]))
      )
      transformed_column_names.extend(config['output_columns'])
    else:
      inner_pipeline = list()

      # Use the name of the first output feature as the name of this process
      process_name = config['output_columns'][0][0]
      # Infer the signature based on the shape of input_columns,  output_columns
      signature = _parse_signature(len(config['input_columns']),
                                   len(config['output_columns']))

      # First select the columns needed for the transformations
      inner_pipeline.append(('extract', DFSelector(config['input_columns'])))
      # Using the selected columns and produce new columns based on
      # provided process_function
      inner_pipeline.append(
          (process_name + '-process',
           VectorizedFunctionTransformer(func=config['process_function'],
                                         signature=signature))
      )

      transform_pipeline.append((process_name, Pipeline(inner_pipeline)))

      # Keep track of the schema after transformation,
      # since new columns will be generated
      for name, indicator in config['output_columns']:
        # Add the name of new feature
        transformed_column_names.append(name)
        # Based on the provided indicator, add the feature name to corresponding
        # buffer.This is important because the subsequent process will depends
        # on the type if the feature.
        if indicator == NUMERICAL_INDICATOR:
          new_numeric_columns.append(name)
        elif indicator == CATEGORICAL_INDICATOR:
          new_categorical_columns.append(name)

  transform_pipeline = Pipeline(
      [('features', FeatureUnion(transform_pipeline))])

  return transform_pipeline, transformed_column_names, \
         new_numeric_columns, new_categorical_columns
