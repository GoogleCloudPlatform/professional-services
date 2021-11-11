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

"""Constants used for query building."""

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
