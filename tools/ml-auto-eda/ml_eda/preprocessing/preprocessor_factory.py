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

"""Factory for preprocessor"""

from __future__ import absolute_import
from __future__ import print_function

from ml_eda.preprocessing.preprocessors.bigquery import bq_preprocessor

# Preprocessing backends
BIGQUERY = 'BIGQUERY'
DATAFLOW = 'DATAFLOW'


class PreprocessorFactory:
  """Factory for preprocessor"""

  @staticmethod
  def new_preprocessor(config):
    """Creat new preprocessor instance"""
    if config.preprocessing_backend == 'BIGQUERY':
      return bq_preprocessor.BqPreprocessor(config)

    raise ValueError('Preprocessor type {} not supported yet.'.format(
        config.preprocessing_backend))
