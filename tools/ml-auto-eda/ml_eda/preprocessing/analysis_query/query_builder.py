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

"""Utility functions for building queries for analysis."""

from __future__ import absolute_import
from __future__ import print_function

from itertools import combinations
from typing import List, Text

from ml_eda.preprocessing.analysis_query import query_constants
from ml_eda.preprocessing.analysis_query import query_templates

DUMMY_WHERE = '1=1'


def _build_not_null_string(column_names: List[Text]) -> Text:
  """Construct NOT NULL condition

  Args:
      column_names: (List[string]), names of column

  Returns:
      string
  """
  not_null_string = ' AND '.join(
      ['{} IS NOT NULL'.format(cat) for cat in column_names])
  return not_null_string


def add_random_sampling(sampling_rate: float) -> Text:
  """Add random sampling to end of query.

  Args:
    sampling_rate: sampling rate in (0, 1]

  Returns:
    Sampling string
  """
  return "RAND() < {}".format(sampling_rate)


def build_anova_query(
    table: Text,
    categorical_column: Text,
    numeric_column: Text,
    sampling_rate: float = 1
) -> Text:
  """Construct SQL query for extracting ANOVA data

  Args:
      table: (string), name of the table
      categorical_column: (string), name of the categorical attribute
      numeric_column: (string), name of the numerical attribute
      sampling_rate: (float), sampling rate

  Returns:
      string
  """
  anova_template = query_templates.ANOVA_TEMPLATE

  if sampling_rate < 1:
    where_condition = add_random_sampling(sampling_rate)
  else:
    where_condition = DUMMY_WHERE

  query = anova_template \
    .format(table=table,
            categorical_column=categorical_column,
            numeric_column=numeric_column,
            anova_categorical=query_constants.ANOVA_CATEGORICAL,
            anova_count_per_class=query_constants.ANOVA_COUNT_PER_CLASS,
            anova_mean_per_class=query_constants.ANOVA_MEAN_PER_CLASS,
            anova_variance_per_class=query_constants.ANOVA_VARIANCE_PER_CLASS,
            anova_df_group=query_constants.ANOVA_DF_GROUP,
            anova_df_error=query_constants.ANOVA_DF_ERROR,
            where_condition=where_condition)
  return query


def build_categorical_aggregate_query(
    table: Text,
    categorical_columns: List[Text],
    sampling_rate: float = 1
) -> Text:
  """Build the query to perform aggregation over multiple categorical
  columns.

  Args:
      table: (string), full path of the table
      categorical_columns: (List[string]), names of the categorical columns
      sampling_rate: (float), sampling rate

  Returns:
      string
  """
  template = query_templates.CATEGORICAL_AGGREGATE_TEMPLATE

  column_string = ','.join(categorical_columns)
  not_null_string = _build_not_null_string(categorical_columns)

  if sampling_rate < 1:
    where_condition = add_random_sampling(sampling_rate)
  else:
    where_condition = DUMMY_WHERE

  query = template.format(table=table,
                          column_names=column_string,
                          not_null_string=not_null_string,
                          where_condition=where_condition)

  return query


def build_pearson_correlation_query(
    table: Text,
    numerical_columns: List[Text],
    sampling_rate: float = 1
) -> Text:
  """Build the query to compute correlation between numerical columns

  Args:
      table: (string), full path of the table
      numerical_columns: (List[string]), names of the numerical columns
      sampling_rate: (float), sampling rate

  Returns:
      string
  """

  template = query_templates.PEARSON_CORRELATION_TEMPLATE

  corr_string_template = 'CORR({n1}, {n2}) AS {n1}_vs_{n2}'
  corr_string_list = list()

  for n1, n2 in combinations(numerical_columns, 2):
    corr_string_list.append(corr_string_template.format(n1=n1, n2=n2))

  corr_strings = ',\n\t'.join(corr_string_list)

  if sampling_rate < 1:
    where_condition = add_random_sampling(sampling_rate)
  else:
    where_condition = DUMMY_WHERE

  query = template.format(
      table=table,
      corr_query=corr_strings,
      where_condition=where_condition
  )

  return query


def build_numerical_descriptive_analysis_query(
    table: Text,
    numerical_columns: List[Text],
    sampling_rate: float = 1
) -> Text:
  """Build the query to compute descriptive analysis of numerical columns

  Examples:
      SELECT
          column_name as column
          COUNTIF(column_name IS NULL) AS missing,
          COUNT(*) as total_count,
          AVG(column_name) AS mean,
          STDDEV(column_name) AS std,
          MIN(column_name) AS min,
          APPROX_QUANTILES(column_name, 4)[ORDINAL(2)] AS q25,
          APPROX_QUANTILES(column_name, 4)[ORDINAL(3)] AS median,
          APPROX_QUANTILES(column_name, 4)[ORDINAL(4)] AS q75,
          APPROX_QUANTILES(column_name, 20)[ORDINAL(20)] AS q95,
          MAX(column_name) AS max
      FROM
          Table
      UNION ALL

  Args:
      table: (string), full path of the table
      numerical_columns: (List[string]), names of the numerical columns
      sampling_rate: (float), sampling rate

  Returns:
      string
  """

  template = query_templates.NUMERICAL_STATS_TEMPLATE

  if sampling_rate < 1:
    where_condition = add_random_sampling(sampling_rate)
  else:
    where_condition = DUMMY_WHERE

  sub_querys = list()

  for column in numerical_columns:
    sub_querys.append(template.format(
        table=table,
        column_name=column,
        column_header=query_constants.ND_COLUMN_NAME,
        missing_header=query_constants.MISSING,
        total_header=query_constants.TOTAL_COUNT,
        mean_header=query_constants.ND_MEAN,
        std_header=query_constants.ND_STD,
        min_header=query_constants.ND_MIN,
        quantile_25_header=query_constants.ND_QUANTILE_25,
        median_header=query_constants.ND_MEDIAN,
        quantile_75_header=query_constants.ND_QUANTILE_75,
        quantile_95_header=query_constants.ND_QUANTILE_95,
        max_header=query_constants.ND_MAX,
        where_condition=where_condition
    ))

  query = 'UNION ALL'.join(sub_querys)

  return query


def build_numerical_descrip_categorical_analysis_query(
    table: Text,
    categorical_column: Text,
    numerical_column: Text,
    sampling_rate: float = 1
) -> Text:
  """Build the query to compute descriptive analysis of a numerical column
  against categorical column for qualitative analysis of the relationship
  between analyzed numerical and categorical columns

  Examples:
      SELECT
          column_name as column
          COUNTIF(column_name IS NULL) AS missing,
          COUNT(*) as total_count,
          AVG(column_name) AS mean,
          STDDEV(column_name) AS std,
          MIN(column_name) AS min,
          APPROX_QUANTILES(column_name, 4)[ORDINAL(2)] AS q25,
          APPROX_QUANTILES(column_name, 4)[ORDINAL(3)] AS median,
          APPROX_QUANTILES(column_name, 4)[ORDINAL(4)] AS q75,
          APPROX_QUANTILES(column_name, 20)[ORDINAL(20)] AS q95,
          MAX(column_name) AS max
      FROM
          Table

  Args:
      table: (string), full path of the table
      categorical_column: (string), names of the categorical column
      numerical_column: (string), names of the numerical column
      sampling_rate: (float), sampling rate

  Returns:
      string
  """

  template = query_templates.NUMERICAL_STATS_PER_CATEGORICAL_TEMPLATE
  not_null_string = _build_not_null_string([categorical_column])

  if sampling_rate < 1:
    where_condition = add_random_sampling(sampling_rate)
  else:
    where_condition = DUMMY_WHERE

  query = template.format(
      table=table,
      categorical_column_name=categorical_column,
      n_column_name=numerical_column,
      total_header=query_constants.TOTAL_COUNT,
      missing_header=query_constants.MISSING,
      mean_header=query_constants.ND_MEAN,
      std_header=query_constants.ND_STD,
      min_header=query_constants.ND_MIN,
      quantile_25_header=query_constants.ND_QUANTILE_25,
      median_header=query_constants.ND_MEDIAN,
      quantile_75_header=query_constants.ND_QUANTILE_75,
      quantile_95_header=query_constants.ND_QUANTILE_95,
      max_header=query_constants.ND_MAX,
      not_null_string=not_null_string,
      where_condition=where_condition
  )

  return query


def build_categorical_descriptive_analysis_query(
    table: Text,
    categorical_columns: List[Text],
    sampling_rate: float = 1
) -> Text:
  """Build the query to compute descriptive analysis of categorical columns

  Examples:
      SELECT
          column_name as column,
          COUNTIF(column_name IS NULL) as missing,
          COUNT(*) as total_count,
          COUNT(DISTINCT column_name) as cardinality
      FROM
          Table
      UNION ALL

  Args:
      table: (string), full path of the table
      categorical_columns: (List[string]), names of the categorical columns
      sampling_rate: (float), sampling rate

  Returns:
      string
  """

  template = query_templates.CATEGORICAL_STATS_TEMPLATE

  if sampling_rate < 1:
    where_condition = add_random_sampling(sampling_rate)
  else:
    where_condition = DUMMY_WHERE

  sub_querys = list()

  for column in categorical_columns:
    sub_querys.append(template.format(
        table=table,
        column_name=column,
        column_header=query_constants.CD_COLUMN_NAME,
        missing_header=query_constants.MISSING,
        total_header=query_constants.TOTAL_COUNT,
        cardinality_header=query_constants.CD_CARDINALITY,
        where_condition=where_condition
    ))

  query = 'UNION ALL'.join(sub_querys)

  return query


def build_numerical_histogram_query(
    table: Text,
    numerical_column: Text,
    num_bins: int,
    sampling_rate: float = 1
) -> Text:
  # pylint: disable-msg=line-too-long
  """Build the query to generate histogram for numerical columns

  Examples:
      WITH boundary AS (
      SELECT
          MIN({column_name}) AS min_value,
          (MAX({column_name}) - MIN({column_name})) / {num_bin} AS step
      FROM
          `{table}`
      )

      SELECT
          CASE
          WHEN {column_name} >= {lower_threshold} AND {column_name} < {upper_threshold}
              THEN CONCAT('[', CAST(lower_threshold AS String), ', ', CAST(upper_threshold AS String), ')')
          ELSE CONCAT('[', CAST(lower_threshold AS String), ', ', 'Inf)')
          END AS {column_name}_bin,
          COUNT(*) as frequency
      FROM
          `{table}`
      GROUP BY
          {column_name}_bin
      ORDER BY
          {column_name}_bin

  Args:
      table: (string), full path of the table
      numerical_column: (string), name of the numerical column
      num_bins: (int), number of bins
      sampling_rate: (float), sampling rate

  Returns:
      string
  """

  template = query_templates.HISTOGRAM_TEMPLATE
  case_when_template = query_templates.HISTOGRAM_WHEN_TEMPLATE
  case_else_template = query_templates.HISTOGRAM_ELSE_TEMPLATE

  threshold_template = "ROUND({min_value}+{step}*{step_value}, 3)"

  case_string_list = []
  for i in range(num_bins - 1):
    lower_threshold = threshold_template.format(
        min_value=query_constants.NH_MIN_VALUE,
        step_value=query_constants.NH_STEP_VALUE,
        step=i
    )
    upper_threshold = threshold_template.format(
        min_value=query_constants.NH_MIN_VALUE,
        step_value=query_constants.NH_STEP_VALUE,
        step=i + 1
    )
    case_string_list.append(case_when_template.format(
        column_name=numerical_column,
        lower_threshold=lower_threshold,
        upper_threshold=upper_threshold
    ))

  case_string_list.append(
      case_else_template.format(
          lower_threshold=threshold_template.format(
              min_value=query_constants.NH_MIN_VALUE,
              step_value=query_constants.NH_STEP_VALUE,
              step=num_bins - 1
          )
      )
  )

  case_string = ''.join(case_string_list)

  if sampling_rate < 1:
    where_condition = add_random_sampling(sampling_rate)
  else:
    where_condition = DUMMY_WHERE

  query = template.format(
      column_name=numerical_column,
      histogram_case_when=case_string,
      num_bins=num_bins,
      table=table,
      postfix=query_constants.NH_BIN_POSTFIX,
      where_condition=where_condition
  )

  return query


def build_value_counts_query(
    table: Text,
    categorical_column: Text,
    limit: int,
    sampling_rate: float = 1
) -> Text:
  """
  Examples:
          SELECT
              {column_name},
              COUNT (*) as frequency
          FROM
              `{table}`
          WHERE
              {not_null_string}
          GROUP BY
              {column_name}
          ORDER BY
              frequency DESC
          LIMIT {limit}

  Args:
      table: (string), full path of the table
      categorical_column: (string), name of the numerical column
      limit: (int), return the top counts
      sampling_rate: (float), sampling rate

  Returns:
      string
  """

  template = query_templates.VALUE_COUNTS_TEMPLATE
  not_null_string = _build_not_null_string([categorical_column])

  if sampling_rate < 1:
    where_condition = add_random_sampling(sampling_rate)
  else:
    where_condition = DUMMY_WHERE

  query = template.format(
      table=table,
      column_name=categorical_column,
      limit=limit,
      not_null_string=not_null_string,
      where_condition=where_condition
  )

  return query


if __name__ == '__main__':
  pass
