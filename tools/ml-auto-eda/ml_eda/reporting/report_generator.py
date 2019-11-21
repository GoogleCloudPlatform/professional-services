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

"""Generate EDA report based on the performed analysis"""

from collections import OrderedDict
from typing import Union, List, Tuple

from ml_eda.reporting import template
from ml_eda.reporting import utils
from ml_eda.orchestration.analysis_tracker import AnalysisTracker
from ml_eda.metadata import run_metadata_pb2
from ml_eda.reporting import recommendation
from ml_eda.constants import c

REPORT_STRUCTURE = (
    # (section_name, section_title_template,
    # section_title_content, section_skip_if_no_content)
    ('title', template.REPORT_TITLE,
     "Exploratory Data Analysis Report", False),

    ('dataset_info', None, None, True),

    ('descriptive', template.SECTION_TITLE,
     "Descriptive Analysis", True),

    ('correlation_analysis', template.SECTION_TITLE,
     'Correlation Analysis between attributes', True),

    ('correlation_numerical', template.SUB_SECTION_TITLE,
     "Correlation between numerical attributes", True),

    ('correlation_categorical', template.SUB_SECTION_TITLE,
     "Correlation between categorical attributes", True),

    ('correlation_numerical_categorical', template.SUB_SECTION_TITLE,
     "Correlation between categorical and numerical attributes", True),

    ('target_highlight', template.SECTION_TITLE,
     'Correlation highlight between features and target', True),

    ('summary', template.SECTION_TITLE,
     'Summary', False),

    ('warning', template.SUB_SECTION_TITLE,
     'Warnings', True),

    ('recommend', template.SUB_SECTION_TITLE,
     'Recommended features', True)
)


def create_descriptive_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: str) -> (str, List[str]):
  """Create descriptive section of the report

  Args:
      analysis_tracker: (AnalysisTracker)
      figure_base_path: (string), the folder for holding figures

  Returns:
      (str, List[str]), (section_content, List[warnings])
  """

  numerical_attributes = analysis_tracker.get_numerical_attributes()
  categorical_attributes = analysis_tracker.get_categorical_attributes()

  # holders for section content and warnings based on descriptive analysis
  contents = []
  warnings = []

  section_template = template.TABLE_DESCRIPTIVE_TEMPLATE

  for att in numerical_attributes:
    # base analysis is one holding basic descriptive statistics
    base_analysis = analysis_tracker.get_attribute_analysis(
        att, run_metadata_pb2.Analysis.Name.Name(
            run_metadata_pb2.Analysis.DESCRIPTIVE))[0]
    # additional analysis is one holding histogram for numerical attribute
    additional_analysis = analysis_tracker.get_attribute_analysis(
        att, run_metadata_pb2.Analysis.Name.Name(
            run_metadata_pb2.Analysis.HISTOGRAM))[0]
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
    base_analysis = analysis_tracker.get_attribute_analysis(
        att, run_metadata_pb2.Analysis.Name.Name(
            run_metadata_pb2.Analysis.DESCRIPTIVE))[0]
    # additional analysis is one holding value counts
    # for categorical attribute
    additional_analysis = analysis_tracker.get_attribute_analysis(
        att, run_metadata_pb2.Analysis.Name.Name(
            run_metadata_pb2.Analysis.VALUE_COUNTS))[0]
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

  table_content = section_template.format(row_content=''.join(contents))

  if warnings:
    table_content = table_content + utils.create_warning_notes(warnings)

  return table_content, warnings


def create_pearson_correlation_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: str) -> Union[Tuple[str, List[str]], None]:
  """Construct correlation section content for numerical attributes

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), the folder for holding figures

  Returns:
      Union[Tuple[str, List[str]], None], (section_content, List[warining])
  """

  warnings = []
  # extract the correlation analysis result
  # each pair of numerical attributes will have one corresponding analysis
  corr_analysis = analysis_tracker.get_analysis(
      run_metadata_pb2.Analysis.Name.Name(
          run_metadata_pb2.Analysis.PEARSON_CORRELATION))

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

  return None


def create_information_gain_section(
    analysis_tracker: AnalysisTracker,
    figure_base_path: str) -> Union[str, None]:
  """Construct information gain section content for categorical attributes

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), the folder for holding figures

  Returns:
      Union[str, None]
  """

  # extract the information gain analysis result
  # each pair of categorical attributes will have one corresponding analysis
  info_analysis = analysis_tracker.get_analysis(
      run_metadata_pb2.Analysis.Name.Name(
          run_metadata_pb2.Analysis.INFORMATION_GAIN))

  if info_analysis:
    return utils.create_no_order_pair_metric_section(
        analysis_list=info_analysis,
        same_match_value=0.0,
        table_name="Information-Gain",
        figure_base_path=figure_base_path)

  return None


def create_anova_section(analysis_tracker: AnalysisTracker
                         ) -> Union[Tuple[str, List[str]], None]:
  """Construct anova section content

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis

  Returns:
      Union[Tuple[str, List[str]], None], (section_content, List[warning])
  """
  warnings = []

  # extract the anova analysis result
  # each pair of numerical and categorical attributes will have
  # one corresponding analysis
  anova_analysis = analysis_tracker.get_analysis(
      run_metadata_pb2.Analysis.Name.Name(
          run_metadata_pb2.Analysis.ANOVA))

  if anova_analysis:
    table_content = utils.create_order_pair_metric_section(
        analysis_list=anova_analysis, same_match_value='NA')

    for analysis in anova_analysis:
      corr_check = recommendation.check_p_value(analysis)
      if corr_check:
        warnings.append(corr_check)

    if warnings:
      table_content = table_content + utils.create_warning_notes(warnings)

    return table_content, warnings

  return None


def create_chi_square_section(analysis_tracker: AnalysisTracker
                              ) -> Union[Tuple[str, List[str]], None]:
  """Construct chi-square section content

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis

  Returns:
      Union[Tuple[str, List[str]], None], (section_content, List[warning])
  """
  warnings = []

  # extract the anova analysis result
  # each pair of categorical attributes will have
  # one corresponding analysis
  chi_square_analysis = analysis_tracker.get_analysis(
      run_metadata_pb2.Analysis.Name.Name(
          run_metadata_pb2.Analysis.CHI_SQUARE))

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

  return None


def create_contingency_table_section(analysis_tracker: AnalysisTracker
                                     ) -> Union[str, None]:
  """Construct contingency table section content for categorical attributes

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis

  Returns:
      Union[str, None]
  """
  # extract the contingency table analysis result
  # each pair of categorical attributes will have one corresponding analysis
  analysis_results = analysis_tracker.get_analysis(
      run_metadata_pb2.Analysis.Name.Name(
          run_metadata_pb2.Analysis.CONTINGENCY_TABLE))

  if analysis_results:
    content = []
    for analysis in analysis_results:
      attributes = [item.name for item in analysis.features]
      section_title = template.SUB_SUB_SUB_SECTION_TITLE.format(
          content="{} / {}".format(attributes[0], attributes[1]))
      analysis_content_str = utils.create_table_from_TableMetric(
          analysis.tmetrics[0])
      content.extend([section_title, analysis_content_str, "\n<br/>\n"])
    return ''.join(content)

  return None


def create_table_descriptive_section(analysis_tracker: AnalysisTracker
                                     ) -> Union[str, None]:
  """Construct descriptive table section content for categorical attributes

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis

  Returns:
      Union[str, None]
  """
  # extract the descriptive table analysis result
  # each pair of categorical attributes will have one corresponding analysis
  analysis_results = analysis_tracker.get_analysis(
      run_metadata_pb2.Analysis.Name.Name(
          run_metadata_pb2.Analysis.TABLE_DESCRIPTIVE))

  if analysis_results:
    content = []
    for analysis in analysis_results:
      attributes = [item.name for item in analysis.features][::-1]
      section_title = template.SUB_SUB_SUB_SECTION_TITLE.format(
          content="{} / {}".format(attributes[0], attributes[1]))
      analysis_content_str = utils.create_table_from_TableMetric(
          analysis.tmetrics[0])
      content.extend([section_title, analysis_content_str, "\n<br/>\n"])
    return ''.join(content)

  return None


def create_dataset_info_section(analysis_tracker: AnalysisTracker
                                ) -> Union[str, None]:
  """Create the top dataset info section without section title

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis

  Returns:
      Union[str, None]
  """
  target = analysis_tracker.get_target().name
  ml_problem = analysis_tracker.metadata.ml_type
  numerical_attributes = analysis_tracker.get_numerical_attributes()
  categorical_attributes = analysis_tracker.get_categorical_attributes()

  return template.DATASET_INFO_TEMPLATE.format(
      location=analysis_tracker.metadata.datasource.location,
      numerical_attributes=len(numerical_attributes),
      categorical_attributes=len(categorical_attributes),
      target_name=target,
      ml_problem_type=ml_problem
  )


def create_target_highlight_section(analysis_tracker: AnalysisTracker
                                    ) -> Union[Tuple[str, List[str]], None]:
  """Create the section highlight the correlation analysis performed between
  target and other attributes

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis

  Returns:
      Union[Tuple[str, List[str]], None], (section_content, List[warning])
  """

  # pylint: disable-msg=too-many-locals
  def _other_attribute_name(target_name: str,
                            analysis: run_metadata_pb2.Analysis) -> str:
    attribute_name = [att.name for att in analysis.features
                      if att.name != target_name][0]
    return attribute_name

  def _check_analysis(analysis_list: List[List[run_metadata_pb2.Analysis]]):
    for item in analysis_list:
      for analysis in item:
        if analysis.name in checking_map:
          if checking_map[analysis.name](analysis):
            yield _other_attribute_name(target, analysis)

  def _consolidate_analysis(metric_names, analysis_tracker):
    revised_names = []
    analysis_list = []
    for name in metric_names:
      analysis = analysis_tracker.get_attribute_analysis(
          target, name)
      if analysis:
        revised_names.append(name)
        analysis_list.append(analysis)
    return revised_names, analysis_list

  checking_map = {
      run_metadata_pb2.Analysis.ANOVA:
          recommendation.check_p_value,
      run_metadata_pb2.Analysis.PEARSON_CORRELATION:
          recommendation.check_pearson_correlation,
      run_metadata_pb2.Analysis.CHI_SQUARE:
          recommendation.check_p_value
  }

  target = analysis_tracker.get_target().name
  ml_problem = analysis_tracker.metadata.ml_type

  recommend_features = []

  # pylint: disable-msg=no-else-return
  if ml_problem == c.metadata.ml_type.NULL:
    return None
  else:
    if ml_problem == c.metadata.ml_type.REGRESSION:
      # Correlation for numerical attributes
      # ANOVA for categorical attributes
      numerical_metric_names = [run_metadata_pb2.Analysis.Name.Name(
          run_metadata_pb2.Analysis.PEARSON_CORRELATION)]
      categorical_metric_names = [
          run_metadata_pb2.Analysis.Name.Name(
              run_metadata_pb2.Analysis.ANOVA)]

    elif ml_problem == c.metadata.ml_type.CLASSIFICATION:
      # ANOVA for numerical attributes
      # IG and Chi-square for categorical attributes
      numerical_metric_names = [run_metadata_pb2.Analysis.Name.Name(
          run_metadata_pb2.Analysis.ANOVA)]
      categorical_metric_names = [
          run_metadata_pb2.Analysis.Name.Name(
              run_metadata_pb2.Analysis.INFORMATION_GAIN),
          run_metadata_pb2.Analysis.Name.Name(
              run_metadata_pb2.Analysis.CHI_SQUARE)]

    else:
      raise ValueError('The ML problem type is not supported')

    section_content = [
        "**Target:** {}\n".format(analysis_tracker.get_target().name)
    ]

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

    return ''.join(section_content), recommend_features


def create_report_contents(analysis_tracker: AnalysisTracker,
                           figure_base_path: str) -> dict:
  """Generate the analysis report content based on all the analyze performed

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), the folder for holding figures

  Returns:
      dict. {section_name: [section_contents]}
  """
  # pylint: disable-msg=too-many-locals
  # pylint: disable-msg=too-many-branches
  # pylint: disable-msg=too-many-statements
  # The content is stored in an OrderedDict
  report_content = OrderedDict()
  for item in REPORT_STRUCTURE:
    report_content[item[0]] = []

  # Dataset Info section
  report_content['dataset_info'].append(
      create_dataset_info_section(analysis_tracker))

  # Descriptive Analysis section
  descriptive_content, descriptive_warning = create_descriptive_section(
      analysis_tracker=analysis_tracker,
      figure_base_path=figure_base_path)
  report_content['descriptive'].append(descriptive_content)
  if descriptive_warning:
    report_content['warning'].extend(descriptive_warning)

  # Correlation Analysis
  # Pearson correlation
  corr_result = create_pearson_correlation_section(
      analysis_tracker=analysis_tracker,
      figure_base_path=figure_base_path)
  if corr_result is not None:
    corr_content, corr_warning = corr_result
    corr_section_title = template.SUB_SUB_SECTION_TITLE.format(
        content="Pearson correlation"
    )
    report_content['correlation_numerical'].extend([
        corr_section_title,
        corr_content
    ])
    if corr_warning:
      report_content['warning'].extend(corr_warning)

  # Contingency table
  contingency_content = create_contingency_table_section(analysis_tracker)
  if contingency_content is not None:
    contingency_section_title = template.SUB_SUB_SECTION_TITLE.format(
        content="Contingency Table"
    )
    report_content['correlation_categorical'].extend([
        contingency_section_title,
        contingency_content
    ])

  # Information gain section
  info_content = create_information_gain_section(
      analysis_tracker=analysis_tracker,
      figure_base_path=figure_base_path)
  if info_content is not None:
    info_section_title = template.SUB_SUB_SECTION_TITLE.format(
        content="Information Gain"
    )
    report_content['correlation_categorical'].extend([
        info_section_title,
        info_content
    ])

  # Chi-square section
  chi_square_result = create_chi_square_section(analysis_tracker)
  if chi_square_result is not None:
    chi_square_content, chi_square_warning = chi_square_result
    chi_square_section_title = template.SUB_SUB_SECTION_TITLE.format(
        content="Chi-square Statistical Test"
    )
    report_content['correlation_categorical'].extend([
        chi_square_section_title,
        chi_square_content
    ])
    if chi_square_warning:
      report_content['warning'].extend(chi_square_warning)

  # Descriptive table section
  table_descriptive_content = create_table_descriptive_section(
      analysis_tracker)
  if table_descriptive_content is not None:
    dt_section_title = template.SUB_SUB_SECTION_TITLE.format(
        content="Descriptive Table"
    )
    report_content['correlation_numerical_categorical'].extend([
        dt_section_title,
        table_descriptive_content
    ])

  # ANOVA section
  anova_result = create_anova_section(analysis_tracker)
  if anova_result is not None:
    anova_content, anova_warning = anova_result
    anova_section_title = template.SUB_SUB_SECTION_TITLE.format(
        content="ANOVA Statistical Test"
    )
    report_content['correlation_numerical_categorical'].extend([
        anova_section_title,
        anova_content
    ])
    if anova_warning:
      report_content['warning'].extend(anova_warning)

  # target highlight section
  highlight_result = create_target_highlight_section(analysis_tracker)
  if highlight_result is not None:
    highlight_content, recommendations = highlight_result
    report_content['target_highlight'].append(highlight_content)
    if recommendations:
      report_content['recommend'].extend(recommendations)

  # Warning
  if report_content['warning']:
    report_content['warning'] = utils.create_content_list(
        report_content['warning'])

  # Recommendation
  if report_content['recommend']:
    report_content['recommend'] = utils.create_content_list(
        report_content['recommend'])

  return report_content


def create_report_md_content(analysis_tracker: AnalysisTracker,
                             figure_base_path: str) -> str:
  """Creat report based on all the analysis performed

  Args:
      analysis_tracker: (AnalysisTracker)
      figure_base_path: (string), the folder for holding figures

  Returns:
      string, markdown formatted report
  """
  # Generate contents for each section
  report_content = create_report_contents(
      analysis_tracker=analysis_tracker,
      figure_base_path=figure_base_path)

  # Correlation is a section title, which is attached to three subsections.
  # If none of the subsections has content, it should be skipped.
  if any([report_content['correlation_numerical'],
          report_content['correlation_categorical'],
          report_content['correlation_numerical_categorical']]):
    report_content['correlation_analysis'] = ['Skip']

  contents = []
  # Put contents in correct order and add appropriate section title
  # The `report_structure` define the overall structure
  # (section_name, section_title_template,
  # section_title_content, section_skip_if_no_content)
  for section in REPORT_STRUCTURE:
    # if not section_skip_if_no_content, always add the title
    if not section[3]:
      contents.append(section[1].format(content=section[2]))
    else:
      section_content = report_content[section[0]]
      if section_content:
        # if the section doesn't need a title, add contents
        if section[1] is None:
          contents.extend(section_content)
        # if the content is simply a 'Skip', just add section title
        else:
          contents.append(section[1].format(content=section[2]))
          if section_content[0] != 'Skip':
            contents.extend(section_content)

  return ''.join(contents)
