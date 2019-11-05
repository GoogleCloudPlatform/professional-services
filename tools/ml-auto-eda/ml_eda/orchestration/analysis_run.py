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

"""Module holding the class of main interface of running analysis"""

from __future__ import absolute_import
from __future__ import print_function

import os
import argparse
import logging
import time

from ml_eda.analysis import qualitative_analysis
from ml_eda.analysis import quantitative_analysis
from ml_eda.analysis import descriptive_analysis
from ml_eda.metadata import metadata_loader
from ml_eda.metadata import run_metadata_pb2
from ml_eda.preprocessing import preprocessor_factory
from ml_eda.orchestration.analysis_tracker import AnalysisTracker
from ml_eda.reporting import report_generator


class Run:
  """Class of main interface for running analysis"""
  _run_metadata = run_metadata_pb2.AnalysisRun()

  def __init__(self, config_params: argparse.ArgumentParser):
    # Parameter from CLI
    self._config_params = config_params
    self._run_metadata.timestamp_sec = time.time()

    # Load data definition
    self._metadata_def = metadata_loader.load_metadata_def(
        self._config_params)
    self._run_metadata.datasource.CopyFrom(self._metadata_def.datasource)
    self.tracker = AnalysisTracker(self._metadata_def)

    self.report_path = self._config_params.report_path
    self.figure_path = os.path.join(os.path.dirname(self.report_path),
                                    'figure')
    if not os.path.exists(self.figure_path):
      os.makedirs(self.figure_path)

    logging.info(self._metadata_def.datasource)

  def _run_descriptive(self):
    """Run descriptive analysis for both numerical and
    categorical attributes."""
    analyzer = descriptive_analysis.DescriptiveAnalysis(
        self._metadata_def,
        preprocessor_factory.PreprocessorFactory.new_preprocessor(
            self._config_params))

    analyses = list()

    analyses.extend(analyzer.run_numerical_descriptive())
    analyses.extend(
        analyzer.run_numerical_histograms(self._metadata_def.histogram_bin))

    analyses.extend(analyzer.run_categorical_descriptive())
    vc_limit = self._metadata_def.value_counts_limit
    analyses.extend(analyzer.run_value_counts(vc_limit))

    for item in analyses:
      self.tracker.add_analysis(item)

    return analyses

  def _categorical_cardinality_check(self):
    """Check whether the cardinality of the categorical columns are within
    the specified threshold."""

    def _get_cardinality(attribute):
      descrip_analysis = self.tracker.get_attribute_analysis(
          attribute_name=attribute.name,
          analysis_name=run_metadata_pb2.Analysis.Name.Name(
              run_metadata_pb2.Analysis.DESCRIPTIVE)
      )
      for metric in descrip_analysis[0].smetrics:
        if metric.name == run_metadata_pb2.ScalarMetric.CARDINALITY:
          return metric.value
      return None

    valid_list = []

    for att in self._metadata_def.categorical_attributes:
      cardinality = _get_cardinality(att)
      if cardinality <= self._metadata_def.general_cardinality_limit:
        valid_list.append(att)

    self._metadata_def.update_low_card_categorical(valid_list)

  def _run_qualitative(self):
    """Run correlation qualitative analysis for combinations of numerical
    and categorical attributes"""
    analyzer = qualitative_analysis.QualitativeAnalysis(
        self._metadata_def,
        preprocessor_factory.PreprocessorFactory.new_preprocessor(
            self._config_params))

    analyses = list()
    if self._metadata_def.contingency_table_run:
      analyses.extend(analyzer.run_contigency_table())
    if self._metadata_def.table_descriptive_run:
      analyses.extend(analyzer.run_categorical_numerical_descriptive())

    for item in analyses:
      self.tracker.add_analysis(item)

    return analyses

  def _run_quantitative(self):
    """Run correlation quantitative analysis for combinations of numerical
    and categorical attributes"""
    analyzer = quantitative_analysis.QuantitativeAnalysis(
        self._metadata_def,
        preprocessor_factory.PreprocessorFactory.new_preprocessor(
            self._config_params))

    analyses = []
    if self._metadata_def.pearson_corr_run:
      analyses.extend(analyzer.run_pearson_correlation())
    if self._metadata_def.information_gain_run:
      analyses.extend(analyzer.run_information_gain())
    if self._metadata_def.chi_square_run:
      analyses.extend(analyzer.run_chi_square())
    if self._metadata_def.anova_run:
      analyses.extend(analyzer.run_anova())

    for item in analyses:
      self.tracker.add_analysis(item)

    return analyses

  def run_exploratory_data_analysis(self):
    """Run the main exploratory data analysis loop."""

    self._run_metadata.analyses.extend(self._run_descriptive())
    self._categorical_cardinality_check()
    self._run_metadata.analyses.extend(self._run_qualitative())
    self._run_metadata.analyses.extend(self._run_quantitative())

    # pylint: disable-msg=logging-format-interpolation
    logging.info("Numerical attributes: {}\nCategorical attributes: {}".format(
        self.tracker.get_numerical_attributes(),
        self.tracker.get_categorical_attributes()
    ))
    logging.info('All analysis:\n{}'.format(
        self.tracker.get_all_analysis_unique_names()))

    report = report_generator.create_report_md_content(
        analysis_tracker=self.tracker,
        figure_base_path=self.figure_path)

    logging.info(report)
    with open(self.report_path, 'w') as wf:
      wf.write(report)
