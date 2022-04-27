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

"""Help functions for analysis."""

from __future__ import absolute_import
from __future__ import print_function

from typing import List, Text

import numpy as np
import pandas as pd
from ml_eda.proto import analysis_entity_pb2


def compute_entropy(frequency_series: pd.DataFrame) -> float:
  """Compute entropy given the frequency series.

  Args:
      frequency_series: (pandas.Series), frequency series with index as unique
      values, and value as frequency

  Returns:
      float
  """

  total = frequency_series.sum()

  prob = frequency_series / total

  entropy = - (prob * np.log2(prob)).sum()

  return entropy


def compute_conditional_entropy(
    aggregate_df: pd.DataFrame,
    condition_column: Text,
    entropy_column: Text
) -> float:
  """Compute conditional entropy over an pre-aggregated DataFrame.

  Args:
      aggregate_df: (pd.DataFrame), the pre-aggregated result from
      bigquery.
      condition_column: (string),
      entropy_column: (string),
  Returns:
      float

  The DataFrame is in the format of
      Col1    Col2    frequency
  0   co1_v1  co2_v1  5
  1   co1_v1  co2_v2  8602
  2   co1_v1  co2_v3  707
  3   co1_v2  co2_v1  4
  4   co1_v2  co2_v2  42194
  4   co1_v2  co2_v3  42194
  """

  # re-organize the DataFrame
  pv_df = aggregate_df.pivot_table(index=condition_column,
                                   columns=entropy_column,
                                   values='frequency')

  total = pv_df.sum().sum()
  index_set = set(pv_df.index)

  accumulate = 0.0
  for item in index_set:
    series = pv_df.loc[item]
    prob = series.sum() / total
    entropy = compute_entropy(series.dropna())
    accumulate += prob * entropy

  return accumulate


def create_analysis_proto_from_scalar_metrics(
    analysis_name: str,
    attributes: List[analysis_entity_pb2.Attribute],
    metric_names: List[str],
    metric_values: List[float]
) -> analysis_entity_pb2.Analysis:
  """Create analysis proto with generated scalar metrics

  Args:
      analysis_name: (string), name of the analysis
      attributes: (List[analysis_entity_pb2.Attribute]), attributes used in the
      performed analysis
      metric_names: (List[string]), names of metric computed in the analysis
      metric_values: (List[float]), values of metric computed in the analysis

  Returns:
      analysis_entity_pb2.Analysis
  """
  analysis = analysis_entity_pb2.Analysis()
  analysis.name = analysis_name
  analysis.features.extend(attributes)

  assert len(metric_names) == len(metric_values)
  for i, _ in enumerate(metric_names):
    metric = analysis.smetrics.add()
    metric.name = metric_names[i]
    metric.value = metric_values[i]
  return analysis


def create_analysis_proto_from_table_metric(
    analysis_name: str,
    attributes: List[analysis_entity_pb2.Attribute],
    metric_names: List[str],
    metric_dfs: List[pd.DataFrame]
) -> analysis_entity_pb2.Analysis:
  """

  Args:
      analysis_name: (string), name of the analysis
      attributes: (List[analysis_entity_pb2.Attribute]), attributes used in the
      performed analysis
      metric_names: (List[string]), names of metric computed in the analysis
      metric_dfs: (List[pd.DataFrame]), DataFrames as analysis result computed

  Returns:
      analysis_entity_pb2.Analysis
  """
  analysis = analysis_entity_pb2.Analysis()
  analysis.name = analysis_name
  analysis.features.extend(attributes)

  assert len(metric_names) == len(metric_dfs)
  for i, _ in enumerate(metric_names):
    metric = analysis.tmetrics.add()
    metric.name = metric_names[i]
    metric.column_indexes.extend([str(item) for item in metric_dfs[i].columns])
    for row_name in metric_dfs[i].index:
      row = metric.rows.add()
      row.row_index = str(row_name)  # Need string
      for col_name in metric_dfs[i].columns:
        cell = row.cells.add()
        cell.column_index = str(col_name)  # Need string
        cell.row_index = str(row_name)  # Need string
        cell.value = metric_dfs[i].loc[row_name, col_name]

  return analysis
