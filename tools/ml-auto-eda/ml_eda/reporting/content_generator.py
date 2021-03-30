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

"""Generate EDA report content based on the performed analysis"""

from typing import Union, List, Tuple, Text

from ml_eda.proto import analysis_entity_pb2
from ml_eda.orchestration.analysis_tracker import AnalysisTracker
from ml_eda.constants import c
from ml_eda.reporting import template
from ml_eda.reporting import utils
from ml_eda.reporting import recommendation

Analysis = analysis_entity_pb2.Analysis

"""
Each function in this module is responsible to generate the report content for
one of the sections.

The function signature here should be
func(analysis_tracker, figure_base_path) -> (content, additional_info)
analysis_tracker: AnalysisTracker
figure_base_path: Text
content: Text
additional_info: List[Text]

The content: is the markdown content for the section
The additional_info: is the possible warnings and recommends from the analysis

Both content and additional_info can be None depends on whether the
corresponding results can be obtained.

Even though some function may not need figure_base_path, and/or may not
generate additional info. The signature is required to preserve for
downstream function calling.
"""


# pylint: disable-msg=unused-argument
def create_dataset_info_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text = ''
) -> Tuple[Text, None]:
  """Create the top dataset info section without section title. No additional
  info will be generated.

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), not used, for signature consistence

  Returns:
      Tuple[Text, None]
  """
  target = analysis_tracker.get_target_attribute().name
  ml_problem = analysis_tracker.get_job_config().ml_type
  numerical_attributes = analysis_tracker.get_num_attribute_names()
  categorical_attributes = analysis_tracker.get_cat_attribute_names()

  content = template.DATASET_INFO_TEMPLATE.format(
      location=analysis_tracker.get_job_config().datasource.location,
      numerical_attributes=len(numerical_attributes),
      categorical_attributes=len(categorical_attributes),
      target_name=target,
      ml_problem_type=ml_problem
  )
  return content, None


def create_descriptive_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text
) -> (Text, List[Text]):
  """Create descriptive section of the report. Checking based on the descriptive
  results will be performed, e.g., missing values and high cardinality.

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), the folder for holding figures

  Returns:
      Tuple[Text, List[Text]], (section_content, List[warnings])
  """

  numerical_attributes = analysis_tracker.get_num_attribute_names()
  categorical_attributes = analysis_tracker.get_cat_attribute_names()

  # holders for section content and warnings based on descriptive analysis
  contents = []
  warnings = []

  section_template = template.TABLE_DESCRIPTIVE_TEMPLATE

  for att in numerical_attributes:
    # base analysis is one holding basic descriptive statistics
    base_analysis = analysis_tracker.get_analysis_by_attribute_and_name(
        att, Analysis.Name.Name(Analysis.DESCRIPTIVE))[0]
    # additional analysis is one holding histogram for numerical attribute
    additional_analysis = analysis_tracker.get_analysis_by_attribute_and_name(
        att, Analysis.Name.Name(Analysis.HISTOGRAM))[0]
    contents.append(utils.create_table_descriptive_row_from_analysis(
        attribute_name=att,
        base_analysis=base_analysis,
        additional_analysis=additional_analysis,
        figure_base_path=figure_base_path
    ))
    # check missing value condition
    missing_check = recommendation.check_missing(att, base_analysis)
    if missing_check:
      warnings.append(missing_check)

  for att in categorical_attributes:
    # base analysis is one holding basic descriptive statistics
    base_analysis = analysis_tracker.get_analysis_by_attribute_and_name(
        att, Analysis.Name.Name(Analysis.DESCRIPTIVE))[0]
    # additional analysis is one holding value counts
    # for categorical attribute
    additional_analysis = analysis_tracker.get_analysis_by_attribute_and_name(
        att, Analysis.Name.Name(Analysis.VALUE_COUNTS))[0]
    contents.append(utils.create_table_descriptive_row_from_analysis(
        attribute_name=att,
        base_analysis=base_analysis,
        additional_analysis=additional_analysis,
        figure_base_path=figure_base_path

    ))
    # check missing value condition
    missing_check = recommendation.check_missing(att, base_analysis)
    if missing_check:
      warnings.append(missing_check)
    # check cardinality condition
    cardinality_check = recommendation.check_cardinality(att, base_analysis)
    if cardinality_check:
      warnings.append(cardinality_check)

  # finally all the descriptive analysis result will be organised in a table
  table_content = section_template.format(row_content=''.join(contents))

  if warnings:
    table_content = table_content + utils.create_warning_notes(warnings)

  return table_content, warnings


def create_pearson_correlation_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text
) -> Union[Tuple[Text, List[Text]], Tuple[None, None]]:
  """Construct correlation section content for numerical attributes. If pearson
  correlation is not performed, None will be returned.

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), the folder for holding figures

  Returns:
      Union[Tuple[Text, List[Text]], Tuple[None, None],
      (section_content, List[warining])
  """

  warnings = []
  # extract the correlation analysis result
  # each pair of numerical attributes will have one corresponding analysis
  corr_analysis = analysis_tracker.get_analysis_by_name(
      Analysis.Name.Name(Analysis.PEARSON_CORRELATION))

  if corr_analysis:
    table_content = utils.create_no_order_pair_metric_section(
        analysis_list=corr_analysis,
        same_match_value=1.0,
        table_name="Correlation",
        figure_base_path=figure_base_path)

    for analysis in corr_analysis:
      # correlation condition check
      corr_check = recommendation.check_pearson_correlation(analysis)
      if corr_check:
        warnings.append(corr_check)

    if warnings:
      table_content = table_content + utils.create_warning_notes(warnings)

    return table_content, warnings

  return None, None


def create_information_gain_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text
) -> Union[Tuple[Text, None], Tuple[None, None]]:
  """Construct information gain section content for categorical attributes. No
  additional info will be generated.

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), the folder for holding figures

  Returns:
      Union[Tuple[Text, None], Tuple[None, None]]
  """

  # extract the information gain analysis result
  # each pair of categorical attributes will have one corresponding analysis
  info_analysis = analysis_tracker.get_analysis_by_name(
      Analysis.Name.Name(Analysis.INFORMATION_GAIN))

  if info_analysis:
    content = utils.create_no_order_pair_metric_section(
        analysis_list=info_analysis,
        same_match_value=0.0,
        table_name="Information-Gain",
        figure_base_path=figure_base_path)
    return content, None

  return None, None


# pylint: disable-msg=unused-argument
def create_anova_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text = ''
) -> Union[Tuple[Text, List[Text]], Tuple[None, None]]:
  """Construct anova section content. If anova test is not performed,
  None will be returned.

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), the folder for holding figures

  Returns:
      Union[Tuple[Text, List[Text]], Tuple[None, None]],
      (section_content, List[warning])
  """
  warnings = []

  # extract the anova analysis result
  # each pair of numerical and categorical attributes will have
  # one corresponding analysis
  anova_analysis = analysis_tracker.get_analysis_by_name(
      Analysis.Name.Name(Analysis.ANOVA))

  if anova_analysis:
    table_content = utils.create_order_pair_metric_section(
        analysis_list=anova_analysis,
        same_match_value='NA')

    for analysis in anova_analysis:
      corr_check = recommendation.check_p_value(analysis)
      if corr_check:
        warnings.append(corr_check)

    if warnings:
      table_content = table_content + utils.create_warning_notes(warnings)

    return table_content, warnings

  return None, None


# pylint: disable-msg=unused-argument
def create_chi_square_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text = ''
) -> Union[Tuple[Text, List[Text]], Tuple[None, None]]:
  """Construct chi-square section content. If chi-square text
  is not performed, None will be returned.

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), not used, for signature consistence

  Returns:
      Union[Tuple[Text, List[Text]], Tuple[None, None]],
      (section_content, List[warning])
  """
  warnings = []

  # extract the anova analysis result
  # each pair of categorical attributes will have
  # one corresponding analysis
  chi_square_analysis = analysis_tracker.get_analysis_by_name(
      Analysis.Name.Name(Analysis.CHI_SQUARE))

  if chi_square_analysis:
    table_content = utils.create_no_order_pair_metric_section(
        analysis_list=chi_square_analysis,
        same_match_value='NA',
        figure_base_path='NA')
    for analysis in chi_square_analysis:
      corr_check = recommendation.check_p_value(analysis)
      if corr_check:
        warnings.append(corr_check)

    if warnings:
      table_content = table_content + utils.create_warning_notes(warnings)

    return table_content, warnings

  return None, None


# pylint: disable-msg=unused-argument
def create_contingency_table_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text = ''
) -> Union[Tuple[Text, None], Tuple[None, None]]:
  """Construct contingency table section content for categorical attributes.

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), not used, for signature consistence

  Returns:
      Union[Tuple[Text, None], Tuple[None, None]]
  """
  # extract the contingency table analysis result
  # each pair of categorical attributes will have one corresponding analysis
  analysis_results = analysis_tracker.get_analysis_by_name(
      Analysis.Name.Name(Analysis.CONTINGENCY_TABLE))

  if analysis_results:
    content = []
    for analysis in analysis_results:
      attributes = [item.name for item in analysis.features]
      section_title = template.SUB_SUB_SUB_SECTION_TITLE.format(
          content="{} / {}".format(attributes[0], attributes[1]))
      analysis_content_str = utils.create_table_from_table_metric(
          analysis.tmetrics[0])
      content.extend([section_title, analysis_content_str, "\n<br/>\n"])
    return ''.join(content), None

  return None, None


# pylint: disable-msg=unused-argument
def create_table_descriptive_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text = ''
) -> Union[Tuple[Text, None], Tuple[None, None]]:
  """Construct descriptive table section content for categorical attributes.

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), not used, for signature consistence

  Returns:
      Union[str, None]
  """
  # extract the descriptive table analysis result
  # each pair of categorical attributes will have one corresponding analysis
  analysis_results = analysis_tracker.get_analysis_by_name(
      Analysis.Name.Name(Analysis.TABLE_DESCRIPTIVE))

  if analysis_results:
    content = []
    for analysis in analysis_results:
      attributes = [item.name for item in analysis.features][::-1]
      section_title = template.SUB_SUB_SUB_SECTION_TITLE.format(
          content="{} / {}".format(attributes[0], attributes[1]))
      analysis_content_str = utils.create_table_from_table_metric(
          analysis.tmetrics[0])
      content.extend([section_title, analysis_content_str, "\n<br/>\n"])
    return ''.join(content), None

  return None, None


# pylint: disable-msg=unused-argument
def create_target_highlight_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text = ''
) -> Union[Tuple[Text, List[Text]], Tuple[None, None]]:
  """Create the section highlight the correlation analysis performed between
  target and other attributes.

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), not used, for signature consistence

  Returns:
      Union[Tuple[str, List[str]], None], (section_content, List[warning])
  """

  # pylint: disable-msg=too-many-locals
  def _other_attribute_name(target_name: str,
                            analysis: analysis_entity_pb2.Analysis) -> str:
    attribute_name = [att.name for att in analysis.features
                      if att.name != target_name][0]
    return attribute_name

  def _check_analysis(analysis_list: List[List[analysis_entity_pb2.Analysis]]):
    for item in analysis_list:
      for analysis in item:
        if analysis.name in checking_map:
          if checking_map[analysis.name](analysis):
            yield _other_attribute_name(target, analysis)

  def _consolidate_analysis(metric_names, analysis_tracker):
    revised_names = []
    analysis_list = []
    for name in metric_names:
      analysis = analysis_tracker.get_analysis_by_attribute_and_name(
          target, name)
      if analysis:
        revised_names.append(name)
        analysis_list.append(analysis)
    return revised_names, analysis_list

  checking_map = {
      Analysis.ANOVA: recommendation.check_p_value,
      Analysis.PEARSON_CORRELATION: recommendation.check_pearson_correlation,
      Analysis.CHI_SQUARE: recommendation.check_p_value
  }

  target = analysis_tracker.get_target_attribute().name
  ml_problem = analysis_tracker.get_job_config().ml_type

  # pylint: disable-msg=no-else-return
  if ml_problem == c.ml_type.NULL:
    return None, None
  else:
    if ml_problem == c.ml_type.REGRESSION:
      target_type = c.datasource.TYPE_NUMERICAL
      # Correlation for numerical attributes
      # ANOVA for categorical attributes
      numerical_metric_names = [
          Analysis.Name.Name(Analysis.PEARSON_CORRELATION)]
      categorical_metric_names = [
          Analysis.Name.Name(Analysis.ANOVA)]

    elif ml_problem == c.ml_type.CLASSIFICATION:
      target_type = c.datasource.TYPE_CATEGORICAL
      # ANOVA for numerical attributes
      # IG and Chi-square for categorical attributes
      numerical_metric_names = [Analysis.Name.Name(Analysis.ANOVA)]
      categorical_metric_names = [
          Analysis.Name.Name(Analysis.INFORMATION_GAIN),
          Analysis.Name.Name(Analysis.CHI_SQUARE)]

    else:
      raise ValueError('The ML problem type is not supported')

    recommend_features = []
    section_content = []

    r_numerical_metrics, r_numerical_analysis = \
      _consolidate_analysis(numerical_metric_names, analysis_tracker)
    r_categorical_metrics, r_categorical_analysis = \
      _consolidate_analysis(categorical_metric_names, analysis_tracker)

    if r_numerical_metrics:
      section_content.append(template.SUB_SUB_SECTION_TITLE.format(
          content="Numerical features and target"
      ))

      # recommendation based on checking results
      recommend_features.extend(_check_analysis(r_numerical_analysis))
      numerical_highlight = utils.create_target_metrics_highlight(
          target_name=target,
          metric_name_list=r_numerical_metrics,
          metric_analysis_list=r_numerical_analysis
      )
      section_content.append(numerical_highlight)

    if r_categorical_metrics:
      section_content.append(template.SUB_SUB_SECTION_TITLE.format(
          content="Categorical features and target"
      ))
      recommend_features.extend(_check_analysis(r_categorical_analysis))
      # recommendation based on checking results
      categorical_highlight = utils.create_target_metrics_highlight(
          target_name=target,
          metric_name_list=r_categorical_metrics,
          metric_analysis_list=r_categorical_analysis
      )
      section_content.append(categorical_highlight)

    if not section_content:
      return None, None
    else:
      target_str_template = template.TARGET_HEADLINE_TEMPLATE
      target_str = target_str_template.format(target=target,
                                              target_type=target_type)
      section_content.insert(0, target_str)
      return ''.join(section_content), recommend_features
