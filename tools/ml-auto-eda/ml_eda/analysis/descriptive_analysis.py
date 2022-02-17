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

"""Interface for performing descriptive analysis."""

from __future__ import absolute_import
from __future__ import print_function

import logging
from typing import Iterator, Dict, Callable, List, Tuple

from ml_eda.analysis import descriptive_analyzer
from ml_eda.analysis import utils
from ml_eda.preprocessing.analysis_query import query_constants
from ml_eda.proto import analysis_entity_pb2
from ml_eda.job_config_util import job_config
from ml_eda.preprocessing.preprocessors import data_preprocessor


class DescriptiveAnalysis:
  """Interface for performing descriptive analysis."""

  def __init__(self,
               data_def: job_config.JobConfig,
               data_extractor: data_preprocessor.DataPreprocessor
               ):
    """Initialize the interface of descriptive analysis.

    Args:
        data_def: (data_definition.DataDef), instance of DataDef that
        provides necessary metadata about studied dataset.
        data_extractor: (preprocessors.DataPreprocessor), instance of
        DataPreprocessor that implements the analysis logic with
        corresponding framework.
    """
    self._data_def = data_def
    self._data_extractor = data_extractor
    self._data_analyzer = descriptive_analyzer.DescriptiveAnalyzer()

  @staticmethod
  def _descriptive_result_to_proto(
      analysis_result: Dict[str, Dict[str, float]],
      attribute_name_map: Dict[str, analysis_entity_pb2.Attribute]
  ) -> Iterator[analysis_entity_pb2.Analysis]:
    """helper function to convert the descriptive analysis result to
    multiple analysis_entity_pb2.Analysis instances

    Args:
        analysis_result: (Dict[str, Dict[str, float]]), dictionary storing
        the analysis result
        attribute_name_map: (Dict[str, analysis_entity_pb2.Attribute]), mapping
        between name and Attribute instance

    Returns:
        Iterator[analysis_entity_pb2.Analysis]
    """
    for attribute_name in analysis_result:
      metric_names = []
      metric_values = []
      for metric in analysis_result[attribute_name]:
        metric_names.append(
            analysis_entity_pb2.ScalarMetric.Name.Value(metric))
        metric_values.append(analysis_result[attribute_name][metric])

      yield utils.create_analysis_proto_from_scalar_metrics(
          analysis_name=analysis_entity_pb2.Analysis.DESCRIPTIVE,
          attributes=[attribute_name_map[attribute_name]],
          metric_names=metric_names,
          metric_values=metric_values
      )

  # TODO: need allow change the number of bins
  def _run_single_numerical_histogram(
      self,
      numerical_attribute: analysis_entity_pb2.Attribute,
      num_bins: int
  ) -> analysis_entity_pb2.Analysis:
    """Generate histogram for numerical attribute.

    Each attribute will generate one analysis_entity_pb2.Analysis.

    Args:
        numerical_attribute: (analysis_entity_pb2.Attribute)

    Returns:
        analysis_entity_pb2.Analysis
    """
    numerical_column = numerical_attribute.name

    histogram_df = self._data_extractor.extract_numerical_histogram_data(
        numerical_column=numerical_column,
        num_bins=num_bins
    )

    # pylint: disable-msg=logging-format-interpolation
    logging.info(
        'The histogram of numerical column {column_name} are: {result}'
          .format(column_name=numerical_column, result=histogram_df)
    )

    return utils.create_analysis_proto_from_table_metric(
        analysis_name=analysis_entity_pb2.Analysis.HISTOGRAM,
        attributes=[numerical_attribute],
        metric_names=[analysis_entity_pb2.TableMetric.HISTOGRAM],
        metric_dfs=[histogram_df.set_index(
            numerical_column + '_' + query_constants.NH_BIN_POSTFIX).T]
    )

  def _run_single_value_counts(
      self,
      categorical_attribute: analysis_entity_pb2.Attribute,
      cardinality_limits: int
  ) -> analysis_entity_pb2.Analysis:
    """Compute value counts for categorical attribute.

    Each attribute will generate one analysis_entity_pb2.Analysis.

    Args:
        categorical_attribute: (analysis_entity_pb2.Attribute)

    Returns:
        analysis_entity_pb2.Analysis
    """
    categorical_column = categorical_attribute.name

    value_counts_df = self._data_extractor.extract_value_counts_data(
        categorical_column=categorical_column,
        limit=cardinality_limits
    )

    # pylint: disable-msg=logging-format-interpolation
    logging.info(
        'The value counts of categorical attribute {name} are: {result}'
          .format(name=categorical_column, result=value_counts_df)
    )

    return utils.create_analysis_proto_from_table_metric(
        analysis_name=analysis_entity_pb2.Analysis.VALUE_COUNTS,
        attributes=[categorical_attribute],
        metric_names=[analysis_entity_pb2.TableMetric.VALUE_COUNTS],
        metric_dfs=[value_counts_df.set_index(categorical_column).T]
    )

  def run_numerical_descriptive(self) -> Iterator[analysis_entity_pb2.Analysis]:
    """Running numerical descriptive analysis for numerical attributes.

    Each attribute will generate one analysis_entity_pb2.Analysis with multiple
    metrics result inside.

    Returns:
        Iterator[analysis_entity_pb2.Analysis]
    """
    name_proto_dict = {item.name: item for item in
                       self._data_def.numerical_attributes}

    descriptive_df = \
      self._data_extractor.extract_numerical_descriptive_data(
          numerical_columns=name_proto_dict.keys()
      )
    descriptive_result = self._data_analyzer.numerical_descriptive(
        descriptive_df)

    # pylint: disable-msg=logging-format-interpolation
    logging.info(
        'The numerical descriptive analysis results are: {result}'
          .format(result=descriptive_result)
    )

    return self._descriptive_result_to_proto(descriptive_result,
                                             name_proto_dict)

  def numerical_descriptive_tasks(self) -> List[Tuple[Callable, Tuple]]:
    """Return the (func, params) tuple list for the job, which will be
    feed to ThreadPoolExecutor for parallel execution
    """
    return [(self.run_numerical_descriptive, ())]

  def run_numerical_histograms(
      self, num_bins: int = 10
  ) -> Iterator[analysis_entity_pb2.Analysis]:
    """Running analysis to generate histogram for numerical attributes

    Args:
      num_bins: (int), number of bins

    Returns:
      Iterator[analysis_entity_pb2.Analysis]
    """
    for attribute in self._data_def.numerical_attributes:
      yield self._run_single_numerical_histogram(attribute, num_bins)

  def numerical_histograms_tasks(
      self, num_bins: int = 10
  ) -> List[Tuple[Callable, Tuple]]:
    """Return the (func, params) tuple list for the job, which will be
    feed to ThreadPoolExecutor for parallel execution
    """
    tasks = [
        (self._run_single_numerical_histogram, (attribute, num_bins))
        for attribute in self._data_def.numerical_attributes
    ]
    return tasks

  def run_categorical_descriptive(
      self
  ) -> Iterator[analysis_entity_pb2.Analysis]:
    """Running categorical descriptive analysis for categorical attributes

    Each attribute will generate one analysis_entity_pb2.Analysis with multiple
    metrics result inside.

    Returns:
        Iterator[analysis_entity_pb2.Analysis]
    """
    name_proto_dict = {item.name: item for item in
                       self._data_def.categorical_attributes}

    descriptive_df = \
      self._data_extractor.extract_categorical_descriptive_data(
          categorical_columns=name_proto_dict.keys()
      )
    descriptive_result = self._data_analyzer.categorical_descriptive(
        descriptive_df)

    # pylint: disable-msg=logging-format-interpolation
    logging.info(
        'The categorical descriptive analysis result are: {result}'
          .format(result=descriptive_result)
    )

    return self._descriptive_result_to_proto(descriptive_result,
                                             name_proto_dict)

  def categorical_descriptive_tasks(self) -> List[Tuple[Callable, Tuple]]:
    """Return the (func, params) tuple list for the job, which will be
    feed to ThreadPoolExecutor for parallel execution
    """
    return [(self.run_categorical_descriptive, ())]

  def run_value_counts(
      self,
      cardinality_limits: int = 100
  ) -> Iterator[analysis_entity_pb2.Analysis]:
    """Running analysis to generate value counts of categorical attributes

    Args:
      cardinality_limits: (int), threshold for cardinality

    Returns:
      Iterator[analysis_entity_pb2.Analysis]
    """
    for attribute in self._data_def.categorical_attributes:
      yield self._run_single_value_counts(attribute, cardinality_limits)

  def value_counts_tasks(
      self,
      cardinality_limits: int = 100
  ) -> List[Tuple[Callable, Tuple]]:
    """Return the (func, params) tuple list for the job, which will be
    feed to ThreadPoolExecutor for parallel execution
    """
    tasks = [
        (self._run_single_value_counts, (attribute, cardinality_limits))
        for attribute in self._data_def.categorical_attributes
    ]
    return tasks
