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
import pickle
from shutil import which
from subprocess import call
from typing import Iterator, Callable, Tuple, List, Union
from concurrent.futures import ThreadPoolExecutor, as_completed

from ml_eda.analysis import qualitative_analysis
from ml_eda.analysis import quantitative_analysis
from ml_eda.analysis import descriptive_analysis
from ml_eda.job_config_util import job_config_loader
from ml_eda.proto import analysis_entity_pb2
from ml_eda.preprocessing import preprocessor_factory
from ml_eda.orchestration.analysis_tracker import AnalysisTracker
from ml_eda.reporting import report_generator

Analysis = analysis_entity_pb2.Analysis
ScalarMetric = analysis_entity_pb2.ScalarMetric

MD_FILE_NAME = 'analysis_report.md'
HTML_FILE_NAME = 'analysis_report.html'
PDF_FILE_NAME = 'analysis_report.pdf'
AR_FILE_NAME = 'analysis_result.pkl'


def _parallel_runner(
    tasks: List[Tuple[Callable, Tuple]],
    num_parallel: int = 10
) -> List[Union[Analysis, Iterator[Analysis]]]:
  """Run multiple queries in parallel with ThreadPoolExecutor.

  Args:
    tasks: the tuples of (task_function, task_parameters)
    num_parallel: number of queries to be run in parallel. This is also hard
    constrained by the concurrency quota of backend processor e.g. BigQuery.

  Returns:
    The output of each task will be collected in a List.
  """
  threads = []
  results = []

  executor = ThreadPoolExecutor(num_parallel)

  for func, param in tasks:
    threads.append(executor.submit(func, *param))

  for future in as_completed(threads):
    results.append(future.result())

  return results


class AnalysisRun:
  """Class of main interface for running analysis"""
  _analysis_run_metadata = analysis_entity_pb2.AnalysisRun()

  def __init__(self, config_params: argparse.ArgumentParser):
    # Parameter from CLI
    self._config_params = config_params
    self._analysis_run_metadata.timestamp_sec = time.time()

    # Load data definition
    self._job_config = job_config_loader.load_job_config(self._config_params)
    self._analysis_run_metadata.datasource.CopyFrom(self._job_config.datasource)
    self.tracker = AnalysisTracker(self._job_config)

    self.report_path = self._config_params.report_path
    self.figure_path = os.path.join(os.path.dirname(self.report_path), 'figure')
    if not os.path.exists(self.figure_path):
      os.makedirs(self.figure_path)

    logging.info(self._job_config.datasource)

  def run_parallel_analysis_tasks(self, analysis_task):
    """Run parallel analysis task."""
    task_result = _parallel_runner(
        tasks=analysis_task,
        num_parallel=self._config_params.parallel_thread)

    analysis_list = list()
    for result in task_result:
      if isinstance(result, Analysis):
        analysis_list.append(result)
      else:
        analysis_list.extend(result)

    for analysis in analysis_list:
      self.tracker.add_analysis(analysis)

    return analysis_list

  def _run_descriptive(self):
    """Run descriptive analysis for both numerical and
    categorical attributes."""
    analyzer = descriptive_analysis.DescriptiveAnalysis(
        self._job_config,
        preprocessor_factory.PreprocessorFactory.new_preprocessor(
            self._config_params))

    analysis_tasks = list()
    analysis_tasks.extend(analyzer.numerical_descriptive_tasks())

    h_bin = self._job_config.histogram_bin
    analysis_tasks.extend(analyzer.numerical_histograms_tasks(h_bin))

    analysis_tasks.extend(analyzer.categorical_descriptive_tasks())

    vc_limit = self._job_config.value_counts_limit
    analysis_tasks.extend(analyzer.value_counts_tasks(vc_limit))

    return self.run_parallel_analysis_tasks(analysis_tasks)

  def _categorical_cardinality_check(self):
    """Check whether the cardinality of the categorical columns are within
    the specified threshold."""

    def _get_cardinality(attribute):
      descrip_analysis = self.tracker.get_analysis_by_attribute_and_name(
          attribute_name=attribute.name,
          analysis_name=Analysis.Name.Name(Analysis.DESCRIPTIVE)
      )
      for metric in descrip_analysis[0].smetrics:
        if metric.name == ScalarMetric.CARDINALITY:
          return metric.value
      return None

    valid_list = []

    for att in self._job_config.categorical_attributes:
      cardinality = _get_cardinality(att)
      if cardinality <= self._job_config.general_cardinality_limit:
        valid_list.append(att)

    self._job_config.update_low_card_categorical(valid_list)

  def _qualitative_tasks(self):
    """Run correlation qualitative analysis for combinations of numerical
    and categorical attributes"""
    analyzer = qualitative_analysis.QualitativeAnalysis(
        self._job_config,
        preprocessor_factory.PreprocessorFactory.new_preprocessor(
            self._config_params))

    analysis_tasks = list()

    if self._job_config.contingency_table_run:
      analysis_tasks.extend(analyzer.contingency_table_tasks())
    if self._job_config.table_descriptive_run:
      analysis_tasks.extend(analyzer.categorical_numerical_descriptive_tasks())

    return analysis_tasks

  def _quantitative_tasks(self):
    """Run correlation quantitative analysis for combinations of numerical
    and categorical attributes"""
    analyzer = quantitative_analysis.QuantitativeAnalysis(
        self._job_config,
        preprocessor_factory.PreprocessorFactory.new_preprocessor(
            self._config_params))

    analysis_tasks = list()

    if self._job_config.pearson_corr_run:
      analysis_tasks.extend(analyzer.pearson_correlation_tasks())
    if self._job_config.information_gain_run:
      analysis_tasks.extend(analyzer.information_gain_tasks())
    if self._job_config.chi_square_run:
      analysis_tasks.extend(
          analyzer.chi_square_tasks(self._config_params.sampling_rate))
    if self._job_config.anova_run:
      analysis_tasks.extend(
          analyzer.anova_tasks(self._config_params.sampling_rate))

    return analysis_tasks

  def _generate_and_write_report(self):
    # generate markdown report
    md_report = report_generator.create_md_report(
        analysis_tracker=self.tracker,
        figure_base_path=self.figure_path,
        config_params=self._config_params)
    md_report_path = os.path.join(self.report_path, MD_FILE_NAME)
    # write report to a file
    with open(md_report_path, 'w') as wf:
      wf.write(md_report)
    logging.debug(md_report)
    logging.info('Markdown report generated successfully.')

    # generate html report
    html_report = report_generator.create_html_report_from_markdown(
        markdown_content=md_report)
    html_report_path = os.path.join(self.report_path, HTML_FILE_NAME)
    with open(html_report_path, 'w') as wf:
      wf.write(html_report)
    logging.debug(html_report)
    logging.info('HTML report generated successfully.')

    # generate pdf file if wkhtmltopdf is installed
    if which('wkhtmltopdf'):
      pdf_file_path = os.path.join(self.report_path, PDF_FILE_NAME)
      call(['wkhtmltopdf', '--enable-local-file-access',
            html_report_path, pdf_file_path])
    else:
      logging.info(
          'wkhtmltopdf is not detected, pdf report wont be generated.')

  def _export_analysis_results(self):
    result_dict = self.tracker.export_to_dict()
    report_folder = os.path.dirname(self.report_path)
    export_file = os.path.join(report_folder, AR_FILE_NAME)
    with open(export_file, 'wb') as wf:
      pickle.dump(result_dict, wf)

  def run_exploratory_data_analysis(self):
    """Run the main exploratory data analysis loop."""

    self._analysis_run_metadata.analyses.extend(self._run_descriptive())

    self._categorical_cardinality_check()

    non_descriptive_tasks = self._qualitative_tasks()
    non_descriptive_tasks.extend(self._quantitative_tasks())
    self._analysis_run_metadata.analyses.extend(
        self.run_parallel_analysis_tasks(non_descriptive_tasks))

    # pylint: disable-msg=logging-format-interpolation

    logging.info("""Numerical attributes: {}
    Categorical attributes: {}""".format(
        self.tracker.get_num_attribute_names(),
        self.tracker.get_cat_attribute_names()
    ))
    logging.info('All analysis:\n{}'.format(
        self.tracker.get_all_analysis_unique_names()))

    self._generate_and_write_report()

    # export the analysis results
    if self._config_params.export_result:
      self._export_analysis_results()
