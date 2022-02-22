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

"""Inventory holding template base queries for analysis."""

# template to generate necessary intermediate result for ANOVA table calculation
ANOVA_TEMPLATE = """
    SELECT
        {anova_categorical},
        {anova_count_per_class},
        {anova_mean_per_class},
        {anova_variance_per_class},
        COUNT(1) OVER() - 1 AS {anova_df_group},
        SUM(anova_count_per_class) OVER() - COUNT(1) OVER() AS {anova_df_error}
    FROM (
        SELECT
            {categorical_column} AS {anova_categorical},
            COUNT(1) AS {anova_count_per_class},
            AVG(CAST({numeric_column} AS FLOAT64)) AS {anova_mean_per_class},
            VAR_POP(CAST({numeric_column} AS FLOAT64)) AS {anova_variance_per_class}
        FROM
            `{table}`
        WHERE
            {where_condition}
        GROUP BY
            {categorical_column}
    )
"""

# template to compute the frequency aggregation of multiple categorical columns
CATEGORICAL_AGGREGATE_TEMPLATE = """
    SELECT
        {column_names},
        COUNT (*) as frequency
    FROM
        `{table}`
    WHERE
        {where_condition} AND {not_null_string}
    GROUP BY
        {column_names}
"""

# template to compute the value counts of a categorical column
VALUE_COUNTS_TEMPLATE = """
    SELECT
        {column_name},
        COUNT (*) as frequency
    FROM
        `{table}`
    WHERE
        {where_condition} AND {not_null_string}
    GROUP BY
        {column_name}
    ORDER BY
        frequency DESC
    LIMIT {limit} 
"""

# template to compute correlation of numerical attributes
PEARSON_CORRELATION_TEMPLATE = """
    SELECT
        {corr_query}
    FROM
        `{table}`
    WHERE
        {where_condition}
"""

# template to compute descriptive analysis of numerical attributes
NUMERICAL_STATS_TEMPLATE = """
SELECT
    '{column_name}' as `{column_header}`,
    COUNTIF({column_name} IS NULL) as `{missing_header}`,
    COUNT(*) as `{total_header}`,
    AVG({column_name}) AS `{mean_header}`,
    STDDEV({column_name}) AS `{std_header}`,
    MIN({column_name}) AS `{min_header}`,
    APPROX_QUANTILES({column_name}, 4)[OFFSET(2)] AS `{quantile_25_header}`,
    APPROX_QUANTILES({column_name}, 4)[OFFSET(3)] AS `{median_header}`,
    APPROX_QUANTILES({column_name}, 4)[OFFSET(4)] AS `{quantile_75_header}`,
    APPROX_QUANTILES({column_name}, 20)[OFFSET(20)] AS `{quantile_95_header}`,
    MAX({column_name}) AS `{max_header}`
FROM
    `{table}`
WHERE
    {where_condition}
"""

# template to compute descriptive analysis of a numerical attribute against
# another categorical attribute
NUMERICAL_STATS_PER_CATEGORICAL_TEMPLATE = """
SELECT
    {categorical_column_name},
    COUNTIF({n_column_name} IS NULL) as `{missing_header}`,
    COUNT(*) as `{total_header}`,
    AVG({n_column_name}) AS `{mean_header}`,
    STDDEV({n_column_name}) AS `{std_header}`,
    MIN({n_column_name}) AS `{min_header}`,
    APPROX_QUANTILES({n_column_name}, 4)[OFFSET(2)] AS `{quantile_25_header}`,
    APPROX_QUANTILES({n_column_name}, 4)[OFFSET(3)] AS `{median_header}`,
    APPROX_QUANTILES({n_column_name}, 4)[OFFSET(4)] AS `{quantile_75_header}`,
    APPROX_QUANTILES({n_column_name}, 20)[OFFSET(20)] AS `{quantile_95_header}`,
    MAX({n_column_name}) AS `{max_header}`
FROM
    `{table}`
WHERE
    {where_condition} AND {not_null_string}
GROUP BY
    {categorical_column_name}
"""

# template to compute descriptive analysis of categorical attributes
CATEGORICAL_STATS_TEMPLATE = """
SELECT
    '{column_name}' as `{column_header}`,
    COUNTIF({column_name} IS NULL) as `{missing_header}`,
    COUNT(*) as `{total_header}`,
    COUNT(DISTINCT {column_name}) as `{cardinality_header}`
FROM
    `{table}`
WHERE
    {where_condition}
"""

# template to generate histogram for a numerical attribute
# pylint: disable-msg=anomalous-backslash-in-string
HISTOGRAM_TEMPLATE = """
WITH boundary AS (
SELECT
    MIN({column_name}) AS min_value,
    (MAX({column_name}) - MIN({column_name})) / {num_bins} AS step_value
FROM
    `{table}`
)

SELECT
    CASE
    {histogram_case_when}
    END AS {column_name}_{postfix},
    COUNT(*) as frequency
FROM
    `{table}`, boundary
WHERE
    {where_condition}
GROUP BY
    {column_name}_{postfix}
ORDER BY
    CAST(REGEXP_EXTRACT({column_name}_{postfix}, r"\d+\.?\d*") AS FLOAT64)
"""

HISTOGRAM_WHEN_TEMPLATE = """
    WHEN {column_name} >= {lower_threshold} AND {column_name} < {upper_threshold} 
        THEN CONCAT('[', CAST({lower_threshold} AS String), ', ', CAST({upper_threshold} AS String), ')')
"""

HISTOGRAM_ELSE_TEMPLATE = """
    ELSE CONCAT('[', CAST({lower_threshold} AS String), ', ', 'Inf)')
"""
