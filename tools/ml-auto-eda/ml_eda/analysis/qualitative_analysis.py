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

"""Interface for performing quantitative analysis."""

from __future__ import absolute_import
from __future__ import print_function

import logging
from itertools import combinations
from typing import List, Callable, Tuple, Iterator

from ml_eda.proto import analysis_entity_pb2
from ml_eda.analysis import utils
from ml_eda.job_config_util import job_config
from ml_eda.preprocessing.preprocessors import data_preprocessor


class QualitativeAnalysis:
  """Interface of quantitative analysis"""

  def __init__(
      self,
      data_def: job_config.JobConfig,
      data_extractor: data_preprocessor.DataPreprocessor
  ):
    """Initialize the interface of quantitative analysis.

    Args:
        data_def: (data_definition.DataDef), instance of DataDef that
        provides necessary metadata about studied dataset.
        data_extractor: (preprocessors.DataPreprocessor), instance of
        DataPreprocessor that implements the analysis logic with
        corresponding framework.
    """
    self._data_def = data_def
    self._data_extractor = data_extractor

  def _run_single_contingency_table(
      self,
      categorical_attribute_one: analysis_entity_pb2.Attribute,
      categorical_attribute_two: analysis_entity_pb2.Attribute
  ) -> analysis_entity_pb2.Analysis:
    """Compute contingency table for two categorical attributes.

    Each combination of categorical attributes will generate
    one analysis_entity_pb2.Analysis.

    Args:
        categorical_attribute_one: (analysis_entity_pb2.Attribute)
        categorical_attribute_two: (analysis_entity_pb2.Attribute)

    Returns:
        analysis_entity_pb2.Analysis
    """
    categorical_column_one = categorical_attribute_one.name
    categorical_column_two = categorical_attribute_two.name

    contingency_df = self._data_extractor.extract_categorical_aggregation(
        categorical_columns=[categorical_column_one, categorical_column_two]
    )

    # pylint: disable-msg=logging-format-interpolation
    logging.info(
        'The contingency table for {cat_one} and {cat_two} is: {result}'
          .format(
            cat_one=categorical_column_one,
            cat_two=categorical_column_two,
            result=contingency_df
        )
    )

    return utils.create_analysis_proto_from_table_metric(
        analysis_name=analysis_entity_pb2.Analysis.CONTINGENCY_TABLE,
        attributes=[categorical_attribute_one, categorical_attribute_two],
        metric_names=[analysis_entity_pb2.TableMetric.CONTINGENCY_TABLE],
        metric_dfs=[
            contingency_df.pivot_table(index=categorical_column_one,
                                       columns=categorical_column_two,
                                       values='frequency').fillna(0)
        ]
    )

  def _run_single_categorical_numerical_descrip(
      self,
      categorical_attribute: analysis_entity_pb2.Attribute,
      numerical_attribute: analysis_entity_pb2.Attribute
  ) -> analysis_entity_pb2.Analysis:
    """Generate numerical attribute descriptive data group by a categorical
    attribute

    Each combination of categorical and numerical attributes will generate
    one analysis_entity_pb2.Analysis.

    Args:
        categorical_attribute: (analysis_entity_pb2.Attribute)
        numerical_attribute: (analysis_entity_pb2.Attribute)

    Returns:
        analysis_entity_pb2.Analysis
    """
    categorical_column = categorical_attribute.name
    numerical_column = numerical_attribute.name

    descrip_df = \
      self._data_extractor.extract_numerical_descrip_categorical_data(
          categorical_column=categorical_column,
          numeric_column=numerical_column
      )

    # pylint: disable-msg=logging-format-interpolation
    logging.info(
        'The  analysis of {num_col} against {cat_col} are: {result}'
          .format(
            num_col=numerical_column,
            cat_col=categorical_column,
            result=descrip_df
        )
    )

    return utils.create_analysis_proto_from_table_metric(
        analysis_name=analysis_entity_pb2.Analysis.TABLE_DESCRIPTIVE,
        attributes=[numerical_attribute, categorical_attribute],
        metric_names=[analysis_entity_pb2.TableMetric.TABLE_DESCRIPTIVE],
        metric_dfs=[descrip_df.set_index(categorical_column)]
    )

  def run_contingency_table(self) -> Iterator[analysis_entity_pb2.Analysis]:
    """Running for analysis of generating contingency table"""
    categorical_features = self._data_def.low_card_categorical_attributes

    analyses = [
        self._run_single_contingency_table(cat1, cat2)
        for cat1, cat2 in combinations(categorical_features, 2)
    ]
    return analyses

  def contingency_table_tasks(self) -> List[Tuple[Callable, Tuple]]:
    """Return the (func, params) tuple list for the job, which will be
    feed to ThreadPoolExecutor for parallel execution
    """
    categorical_features = self._data_def.low_card_categorical_attributes

    tasks = [
        (self._run_single_contingency_table, (cat1, cat2))
        for cat1, cat2 in combinations(categorical_features, 2)
    ]
    return tasks

  def run_categorical_numerical_descriptive(
      self
  ) -> Iterator[analysis_entity_pb2.Analysis]:
    """Running for descriptive analysis involving categorical and numerical
    attributes"""
    categorical_features = self._data_def.low_card_categorical_attributes
    numerical_features = self._data_def.numerical_attributes
    analyses = [
        self._run_single_categorical_numerical_descrip(categorical_feature,
                                                       numerical_feature)
        for categorical_feature, numerical_feature in
        zip(categorical_features, numerical_features)
    ]
    return analyses

  def categorical_numerical_descriptive_tasks(
      self
  ) -> List[Tuple[Callable, Tuple]]:
    """Return the (func, params) tuple list for the job, which will be
    feed to ThreadPoolExecutor for parallel execution
    """
    categorical_features = self._data_def.low_card_categorical_attributes
    numerical_features = self._data_def.numerical_attributes
    tasks = [
        (self._run_single_categorical_numerical_descrip, (categorical_feature,
                                                          numerical_feature))
        for categorical_feature, numerical_feature in
        zip(categorical_features, numerical_features)
    ]
    return tasks
