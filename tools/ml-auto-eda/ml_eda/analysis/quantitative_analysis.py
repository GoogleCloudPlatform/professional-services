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
from typing import List
from itertools import combinations, product

from ml_eda.analysis import quantitative_analyzer
from ml_eda.metadata import run_metadata_pb2
from ml_eda.analysis import utils
from ml_eda.metadata import metadata_definition
from ml_eda.preprocessing.preprocessors import data_preprocessor


class QuantitativeAnalysis:
  """Interface for performing quantitative analysis."""

  def __init__(self,
               data_def: metadata_definition.MetadataDef,
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
    self._data_analyzer = quantitative_analyzer.QuantitativeAnalyzer()

  def _run_single_anova(
      self,
      categorical_attribute: run_metadata_pb2.Attribute,
      numerical_attribute: run_metadata_pb2.Attribute
  ) -> run_metadata_pb2.Analysis:
    """Run an anova test.

    Args:
        categorical_attribute: (run_metadata_pb2.Attribute)
        numerical_attribute: (run_metadata_pb2.Attribute)

    Returns:
        run_metadata_pb2.Analysis
    """
    categorical_column = categorical_attribute.name
    numerical_column = numerical_attribute.name

    anova_df = self._data_extractor.extract_anova_data(categorical_column,
                                                       numerical_column)
    f_stat = self._data_analyzer.anova_one_way(anova_df)
    # pylint: disable-msg=logging-format-interpolation
    logging.info(
        'P-value for {cat} and {numeric} is {f_statistic} under ANOVA test'
        .format(
            cat=categorical_column,
            numeric=numerical_column,
            f_statistic=f_stat
        )
    )
    return utils.create_analysis_proto_from_scalar_metrics(
        run_metadata_pb2.Analysis.ANOVA,
        [categorical_attribute, numerical_attribute],
        [run_metadata_pb2.ScalarMetric.F_STATISTIC],
        [f_stat])

  def _run_single_chi_square(
      self,
      categorical_attribute_one: run_metadata_pb2.Attribute,
      categorical_attribute_two: run_metadata_pb2.Attribute
  ) -> run_metadata_pb2.Analysis:
    """Run a chi-square test

    Args:
        categorical_attribute_one: (run_metadata_pb2.Attribute)
        categorical_attribute_two: (run_metadata_pb2.Attribute)

    Returns:
        run_metadata_pb2.Analysis
    """
    categorical_column_one = categorical_attribute_one.name
    categorical_column_two = categorical_attribute_two.name

    chi_square_df = self._data_extractor.extract_categorical_aggregation(
        categorical_columns=[
            categorical_column_one, categorical_column_two]
    )
    p_value = self._data_analyzer.chi_square(chi_square_df)
    # pylint: disable-msg=logging-format-interpolation
    logging.info(
        'P-value for {cat_one} and {cat_two} is {p_value} under Chi-square test'
        .format(
            cat_one=categorical_column_one,
            cat_two=categorical_column_two,
            p_value=p_value
        )
    )
    return utils.create_analysis_proto_from_scalar_metrics(
        run_metadata_pb2.Analysis.CHI_SQUARE,
        [categorical_attribute_one, categorical_attribute_two],
        [run_metadata_pb2.ScalarMetric.P_VALUE],
        [p_value])

  def _run_single_information_gain(
      self,
      categorical_attribute_one: run_metadata_pb2.Attribute,
      categorical_attribute_two: run_metadata_pb2.Attribute
  ) -> run_metadata_pb2.Analysis:
    """Run a chi-square test

    Args:
        categorical_attribute_one: (run_metadata_pb2.Attribute)
        categorical_attribute_two: (run_metadata_pb2.Attribute)

    Returns:
        run_metadata_pb2.Analysis
    """
    categorical_column_one = categorical_attribute_one.name
    categorical_column_two = categorical_attribute_two.name
    ig_df = self._data_extractor.extract_categorical_aggregation(
        categorical_columns=[
            categorical_column_one, categorical_column_two]
    )
    igain = self._data_analyzer.information_gain(ig_df)
    # pylint: disable-msg=logging-format-interpolation
    logging.info(
        'Information gain for {cat_one} and {cat_two} is {value}'
        .format(
            cat_one=categorical_column_one,
            cat_two=categorical_column_two,
            value=igain
        )
    )
    return utils.create_analysis_proto_from_scalar_metrics(
        run_metadata_pb2.Analysis.INFORMATION_GAIN,
        [categorical_attribute_one, categorical_attribute_two],
        [run_metadata_pb2.ScalarMetric.INFORMATION_GAIN],
        [igain])

  def run_pearson_correlation(self,
                              ) -> List[run_metadata_pb2.Analysis]:
    """Compute pearson correlation for numerical attributes

    Args:

    Returns:
        List[run_metadata_pb2.Analysis]
    """
    name_proto_dict = {item.name: item for item in
                       self._data_def.numerical_attributes}

    corr_df = self._data_extractor.extract_pearson_correlation_data(
        numerical_columns=name_proto_dict.keys()
    )
    corrs = self._data_analyzer.pearson_correlation(corr_df)
    # pylint: disable-msg=logging-format-interpolation
    logging.info(
        'The correlations are: {corr_result}'
        .format(corr_result=corrs)
    )

    analysis = []
    for item in corrs:
      numerical_one, numerical_two = item.split('_vs_')
      analysis.append(utils.create_analysis_proto_from_scalar_metrics(
          run_metadata_pb2.Analysis.PEARSON_CORRELATION,
          [name_proto_dict[numerical_one],
           name_proto_dict[numerical_two]],
          [run_metadata_pb2.ScalarMetric.CORRELATION_COEFFICIENT],
          [corrs[item]]))
    return analysis

  def run_anova(self):
    """Run ANOVA"""
    categorical_features = self._data_def.low_card_categorical_attributes
    numerical_features = self._data_def.numerical_attributes

    return [
        self._run_single_anova(categorical_feature, numerical_feature)
        for categorical_feature, numerical_feature in
        product(categorical_features, numerical_features)
    ]

  def run_chi_square(self):
    """Run Chi-Square"""
    categorical_features = self._data_def.low_card_categorical_attributes
    analyses = [
        self._run_single_chi_square(cat1, cat2)
        for cat1, cat2 in combinations(categorical_features, 2)
    ]
    return analyses

  def run_information_gain(self):
    """Run Information Gain"""
    categorical_features = self._data_def.low_card_categorical_attributes
    analyses = [
        self._run_single_information_gain(cat1, cat2)
        for cat1, cat2 in combinations(categorical_features, 2)
    ]
    return analyses
