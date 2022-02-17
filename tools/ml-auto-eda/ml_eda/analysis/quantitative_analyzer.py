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

"""Holds the main logics of quantitative analysis."""

from __future__ import absolute_import
from __future__ import print_function

from typing import Dict

import numpy as np
import pandas as pd
from scipy.stats import chi2, f

from ml_eda.preprocessing.analysis_query import query_constants
from ml_eda.analysis import utils


class QuantitativeAnalyzer:
  """Holds the main logics of quantitative analysis."""

  @staticmethod
  def anova_one_way(anova_df: pd.DataFrame) -> float:
    """Calculate the F-statistic over an ANOVA dataframe.

    Args:
        anova_df: (pandas.DataFrame), the pre-aggregated result from
        bigquery. The header of the DataFrame is:
            [
                {anova_categorical},
                {anova_count_per_class},
                {anova_mean_per_class},
                {anova_variance_per_class},
                {anova_df_group},
                {anova_df_error}
            ]

    Returns:
        P-value, (float)
    """
    anova_mean_overall = anova_df[query_constants.ANOVA_MEAN_PER_CLASS].mean()

    ssg = ((anova_df[
        query_constants.ANOVA_MEAN_PER_CLASS] - anova_mean_overall) ** 2 *
           anova_df[query_constants.ANOVA_COUNT_PER_CLASS]).sum()
    sse = (anova_df[query_constants.ANOVA_VARIANCE_PER_CLASS] *
           (anova_df[query_constants.ANOVA_COUNT_PER_CLASS] - 1)).sum()

    df_group = anova_df[query_constants.ANOVA_DF_GROUP][0]
    df_error = anova_df[query_constants.ANOVA_DF_ERROR][0]
    inter_class_means_variation = ssg / df_group

    intra_class_variation = sse / df_error
    f_result = inter_class_means_variation / intra_class_variation

    # given f-stats, find the p value
    f_rv = f(df_group, df_error)
    p_value = 1 - f_rv.cdf(f_result)

    return p_value

  @staticmethod
  def chi_square(chi_square_df: pd.DataFrame) -> float:
    """Perform chi-square statistic test computation over an pre-aggregated
    DataFrame.

    Args:
        chi_square_df: (pd.DataFrame), the pre-aggregated result from
        bigquery.

    Returns:
        float

    The DataFrame is in the format of
        Col1        Col2    frequency
    0       co1_v1  co2_v1  5
    1       co1_v1  co2_v2  8602
    2       co1_v1  co2_v3  707
    3       co1_v2  co2_v1  4
    4       co1_v2  co2_v2  42194
    4       co1_v2  co2_v3  42194
    """
    index_name, column_name, _ = chi_square_df.columns

    # re-organize the dataframe
    pv_df = chi_square_df.pivot_table(index=index_name,
                                      columns=column_name,
                                      values='frequency',
                                      fill_value=0)

    # total count
    total = pv_df.sum().sum()

    # compute the occurrence probability of each unique value of indexes
    column_prob = pv_df.sum() / total
    row_prob = pv_df.sum(axis=1) / total

    # compute the expected occurrence table
    expected_df = pd.DataFrame(np.outer(row_prob, column_prob) * total,
                               index=row_prob.index,
                               columns=column_prob.index,
                               dtype=np.int)

    # compute chi-square stats
    diff_df = expected_df - pv_df
    # plus one here is for stability
    chi_square_stats = (np.power(diff_df, 2) / (
        expected_df + 1)).sum().sum()

    # given chi-square stats, find the p value
    dof = (len(column_prob) - 1) * (len(row_prob) - 1)
    chi_square_rv = chi2(df=dof)
    p_value = 1 - chi_square_rv.cdf(chi_square_stats)

    return p_value

  @staticmethod
  def information_gain(ig_df: pd.DataFrame) -> float:
    """Compute information gain over an pre-aggregated DataFrame.

    Args:
        ig_df: (pd.DataFrame), the pre-aggregated result from
        bigquery.

    Returns:
        float

    The DataFrame is in the format of
        Col1        Col2    frequency
    0       co1_v1  co2_v1  5
    1       co1_v1  co2_v2  8602
    2       co1_v1  co2_v3  707
    3       co1_v2  co2_v1  4
    4       co1_v2  co2_v2  42194
    4       co1_v2  co2_v3  42194
    """
    index_name, column_name, _ = ig_df.columns

    entropy = utils.compute_entropy(
        frequency_series=ig_df.groupby(index_name).sum()['frequency'])

    condition_entropy = utils.compute_conditional_entropy(
        aggregate_df=ig_df,
        condition_column=column_name,
        entropy_column=index_name
    )

    information_gain = entropy - condition_entropy

    return information_gain

  @staticmethod
  def pearson_correlation(corr_df: pd.DataFrame) -> Dict:
    """The entire pearson correlation is done in BQ, therefore, only
    DataFrame to dict conversion is done here

    Args:
        corr_df: (pd.DataFrame), the computed correlation result from
        bigquery.

    Returns:
        dict
    """

    return corr_df.iloc[0, :].to_dict()
