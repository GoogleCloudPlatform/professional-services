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

# Preprocessing backends
c.preprocessing.BIGQUERY = 'BIGQUERY'
c.preprocessing.DATAFLOW = 'DATAFLOW'

# Metadata keys
c.metadata.DATASOURCE = 'DATASOURCE'
c.metadata.datasource.TYPE = 'Type'
c.metadata.datasource.LOCATION = 'Location'
c.metadata.SCHEMA = 'SCHEMA'
c.metadata.schema.TARGET = 'Target'
c.metadata.schema.NULL = 'Null'
c.metadata.schema.NUMERICAL_FEATURES = 'NumericalFeatures'
c.metadata.schema.CATEGORICAL_FEATURES = 'CategoricalFeatures'
c.metadata.ANALYSIS_RUN = 'ANALYSIS.RUN'
c.metadata.ANALYSIS_CONFIG = 'ANALYSIS.CONFIG'
c.metadata.analysis_run.CONTINGENCY_TABLE_RUN = 'CONTINGENCY_TABLE.Run'
c.metadata.analysis_run.TABLE_DESCRIPTIVE_RUN = 'TABLE_DESCRIPTIVE.Run'
c.metadata.analysis_run.PEARSON_CORRELATION_RUN = 'PEARSON_CORRELATION.Run'
c.metadata.analysis_run.INFORMATION_GAIN_RUN = 'INFORMATION_GAIN.Run'
c.metadata.analysis_run.CHI_SQUARE_RUN = 'CHI_SQUARE.Run'
c.metadata.analysis_run.ANOVA_RUN = 'ANOVA.Run'
c.metadata.analysis_config.HISTOGRAM_BIN = 'HISTOGRAM.Bin'
c.metadata.analysis_config.VALUE_COUNTS_LIMIT = 'VALUE_COUNTS.Limit'
c.metadata.analysis_config.GENERAL_CARDINALITY_LIMIT = \
  'General.CardinalityLimit'

c.metadata.ml_type.REGRESSION = 'Regression'
c.metadata.ml_type.CLASSIFICATION = 'Classification'
c.metadata.ml_type.NULL = 'Null'

# BigQuery types
c.bigquery.type.STRING = 'STRING'
c.bigquery.type.INTEGER = 'INTEGER'
c.bigquery.type.FLOAT = 'FLOAT'
c.bigquery.type.BOOLEAN = 'BOOLEAN'
c.bigquery.type.TIMESTAMP = 'TIMESTAMP'
c.bigquery.type.RECORD = 'TIMESTAMP'
c.bigquery.types.NUMERICAL_TYPES = [c.bigquery.type.INTEGER,
                                    c.bigquery.type.FLOAT,
                                    c.bigquery.type.TIMESTAMP]
c.bigquery.types.CATEGORICAL_TYPES = [c.bigquery.type.STRING,
                                      c.bigquery.type.BOOLEAN]

# Anova Pandas dataframe headers
ANOVA_CATEGORICAL = 'anova_categorical'
ANOVA_COUNT_PER_CLASS = 'anova_count_per_class'
ANOVA_MEAN_PER_CLASS = 'anova_mean_per_class'
ANOVA_VARIANCE_PER_CLASS = 'anova_variance_per_class'
ANOVA_DF_GROUP = 'anova_df_group'
ANOVA_DF_ERROR = 'anova_df_error'

MISSING = 'MISSING'
TOTAL_COUNT = 'TOTAL_COUNT'
COMMON_ORDER = [TOTAL_COUNT, MISSING]
# Numerical Descriptive DataFrame Headers
ND_COLUMN_NAME = 'column'
ND_MEAN = 'MEAN'
ND_MEDIAN = 'MEDIAN'
ND_STD = 'STD'
ND_MIN = 'MIN'
ND_MAX = 'MAX'
ND_QUANTILE_25 = 'QUANTILE_25'
ND_QUANTILE_75 = 'QUANTILE_75'
ND_QUANTILE_95 = 'QUANTILE_95'
NUMERICAL_ORDER = [
    ND_MIN, ND_QUANTILE_25, ND_MEDIAN,
    ND_QUANTILE_75, ND_QUANTILE_95, ND_MAX,
    ND_MEAN, ND_STD
]

# Categorical Descriptive DataFrame Headers
CD_COLUMN_NAME = 'column'
CD_CARDINALITY = 'CARDINALITY'
CATEGORICAL_ORDER = [CD_CARDINALITY]

# Numerical Histogram
NH_MIN_VALUE = 'min_value'
NH_STEP_VALUE = 'step_value'
NH_BIN_POSTFIX = 'bin'
