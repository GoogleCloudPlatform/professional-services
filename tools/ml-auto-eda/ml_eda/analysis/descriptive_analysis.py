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
from typing import Iterator, Dict

from ml_eda.analysis import descriptive_analyzer
from ml_eda.analysis import utils
from ml_eda import constants
from ml_eda.metadata import run_metadata_pb2
from ml_eda.metadata import metadata_definition
from ml_eda.preprocessing.preprocessors import data_preprocessor


class DescriptiveAnalysis:
  """Interface for performing descriptive analysis."""

  def __init__(self,
               data_def: metadata_definition.MetadataDef,
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
      attribute_name_map: Dict[str, run_metadata_pb2.Attribute]
  ) -> Iterator[run_metadata_pb2.Analysis]:
    """helper function to convert the descriptive analysis result to
    multiple run_metadata_pb2.Analysis instances

    Args:
        analysis_result: (Dict[str, Dict[str, float]]), dictionary storing
        the analysis result
        attribute_name_map: (Dict[str, run_metadata_pb2.Attribute]), mapping
        between name and Attribute instance

    Returns:
        Iterator[run_metadata_pb2.Analysis]
    """
    for attribute_name in analysis_result:
      metric_names = []
      metric_values = []
      for metric in analysis_result[attribute_name]:
        metric_names.append(
            run_metadata_pb2.ScalarMetric.Name.Value(metric))
        metric_values.append(analysis_result[attribute_name][metric])

      yield utils.create_analysis_proto_from_scalar_metrics(
          analysis_name=run_metadata_pb2.Analysis.DESCRIPTIVE,
          attributes=[attribute_name_map[attribute_name]],
          metric_names=metric_names,
          metric_values=metric_values
      )

  def run_numerical_descriptive(self) -> Iterator[run_metadata_pb2.Analysis]:
    """Running numerical descriptive analysis for numerical attributes.

    Each attribute will generate one run_metadata_pb2.Analysis with multiple
    metrics result inside.

    Returns:
        Iterator[run_metadata_pb2.Analysis]
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

  # TODO: need allow change the number of bins
  def _run_single_numerical_histogram(
      self,
      numerical_attribute: run_metadata_pb2.Attribute,
      num_bins: int
  ) -> run_metadata_pb2.Analysis:
    """Generate histogram for numerical attribute.

    Each attribute will generate one run_metadata_pb2.Analysis.

    Args:
        numerical_attribute: (run_metadata_pb2.Attribute)

    Returns:
        run_metadata_pb2.Analysis
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
        analysis_name=run_metadata_pb2.Analysis.HISTOGRAM,
        attributes=[numerical_attribute],
        metric_names=[run_metadata_pb2.TableMetric.HISTOGRAM],
        metric_dfs=[histogram_df.set_index(
            numerical_column + '_' + constants.NH_BIN_POSTFIX).T]
    )

  def run_numerical_histograms(self, num_bins: int = 10
                               ) -> Iterator[run_metadata_pb2.Analysis]:
    """Running analysis to generate histogram for numerical attributes

    Args:
      num_bins: (int), number of bins

    Returns:
      Iterator[run_metadata_pb2.Analysis]
    """
    for attribute in self._data_def.numerical_attributes:
      yield self._run_single_numerical_histogram(attribute, num_bins)

  def run_categorical_descriptive(self) -> Iterator[run_metadata_pb2.Analysis]:
    """Running categorical descriptive analysis for categorical attributes

    Each attribute will generate one run_metadata_pb2.Analysis with multiple
    metrics result inside.

    Returns:
        Iterator[run_metadata_pb2.Analysis]
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

  def _run_single_value_counts(
      self,
      categorical_attribute: run_metadata_pb2.Attribute,
      cardinality_limits: int
  ) -> run_metadata_pb2.Analysis:
    """Compute value counts for categorical attribute.

    Each attribute will generate one run_metadata_pb2.Analysis.

    Args:
        categorical_attribute: (run_metadata_pb2.Attribute)

    Returns:
        run_metadata_pb2.Analysis
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
        analysis_name=run_metadata_pb2.Analysis.VALUE_COUNTS,
        attributes=[categorical_attribute],
        metric_names=[run_metadata_pb2.TableMetric.VALUE_COUNTS],
        metric_dfs=[value_counts_df.set_index(categorical_column).T]
    )

  def run_value_counts(self, cardinality_limits: int = 100
                       ) -> Iterator[run_metadata_pb2.Analysis]:
    """Running analysis to generate value counts of categorical attributes

    Args:
      cardinality_limits: (int), threshold for cardinality

    Returns:
      Iterator[run_metadata_pb2.Analysis]
    """
    for attribute in self._data_def.categorical_attributes:
      yield self._run_single_value_counts(attribute, cardinality_limits)
