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

"""Inventory for holding literal constants"""

from __future__ import absolute_import
from __future__ import print_function


class ConstantsHolder:
  """Helper class for easy access of literal constants"""

  def __getattr__(self, name):
    config = ConstantsHolder()
    setattr(self, name, config)
    return config


c = ConstantsHolder()

# Data source types
c.datasources.BIGQUERY = 'BIGQUERY'
c.datasources.CSV = 'CSV'

# Metadata keys
# pylint: disable-msg=attribute-defined-outside-init
c.DATASOURCE = 'DATASOURCE'
c.datasource.TYPE = 'Type'
c.datasource.TYPE_NUMERICAL = 'Numerical'
c.datasource.TYPE_CATEGORICAL = 'Categorical'
c.datasource.LOCATION = 'Location'

c.SCHEMA = 'SCHEMA'
c.schema.TARGET = 'Target'
c.schema.NULL = 'Null'
c.schema.NUMERICAL_FEATURES = 'NumericalFeatures'
c.schema.CATEGORICAL_FEATURES = 'CategoricalFeatures'

c.ANALYSIS_RUN = 'ANALYSIS.RUN'
c.analysis_run.CONTINGENCY_TABLE_RUN = 'CONTINGENCY_TABLE.Run'
c.analysis_run.TABLE_DESCRIPTIVE_RUN = 'TABLE_DESCRIPTIVE.Run'
c.analysis_run.PEARSON_CORRELATION_RUN = 'PEARSON_CORRELATION.Run'
c.analysis_run.INFORMATION_GAIN_RUN = 'INFORMATION_GAIN.Run'
c.analysis_run.CHI_SQUARE_RUN = 'CHI_SQUARE.Run'
c.analysis_run.ANOVA_RUN = 'ANOVA.Run'

c.ANALYSIS_CONFIG = 'ANALYSIS.CONFIG'
c.analysis_config.HISTOGRAM_BIN = 'HISTOGRAM.Bin'
c.analysis_config.VALUE_COUNTS_LIMIT = 'VALUE_COUNTS.Limit'
c.analysis_config.GENERAL_CARDINALITY_LIMIT = \
  'General.CardinalityLimit'

c.ml_type.REGRESSION = 'Regression'
c.ml_type.CLASSIFICATION = 'Classification'
c.ml_type.NULL = 'Null'
