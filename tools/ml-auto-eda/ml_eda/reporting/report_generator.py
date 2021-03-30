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
from typing import Text
import logging
import argparse

from markdown2 import markdown

from ml_eda.proto import analysis_entity_pb2
from ml_eda.orchestration.analysis_tracker import AnalysisTracker
from ml_eda.reporting import utils
from ml_eda.reporting.formatting import SectionMeta
from ml_eda.reporting.formatting import REPORT_STRUCTURE
from ml_eda.reporting.formatting import WARNING_STR, RECOMMEND_STR
from ml_eda.reporting.template import JOB_CONFIG_TEMPLATE
from ml_eda.reporting.template import SECTION_TITLE, SUB_SECTION_TITLE
from ml_eda.reporting.template import CLI_PARAM_LIST_TEMPLATE
from ml_eda.reporting.template import CLI_PARAM_TEMPLATE

Analysis = analysis_entity_pb2.Analysis


def create_report_contents(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text
) -> OrderedDict:
  """Generate the analysis report content based on all the analyze performed

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), the folder for holding figures

  Returns:
      Dict -> {section_name: [section_contents]}
  """

  # The content is stored in an OrderedDict
  report_content = OrderedDict()
  for section in REPORT_STRUCTURE:
    report_content[section.section_name] = []

  for section in REPORT_STRUCTURE:
    # Only the dataset_info section has no title
    if section.section_title is not None:
      title = section.section_title_template.format(
          content=section.section_title)
      report_content[section.section_name].append(title)

    # Check whether the content generation function is specified for a section
    if section.section_content_generator is not None:
      # Run the content generation function, the signature is consistent
      content, additional = section.section_content_generator(
          analysis_tracker, figure_base_path)

      # Add generated content for the result holder
      if content is not None:
        report_content[section.section_name].append(content)

      if (section.generate_recommend
          and additional is not None
          and RECOMMEND_STR in report_content):
        report_content[RECOMMEND_STR].extend(additional)
      elif (section.generate_warning
            and additional is not None
            and WARNING_STR in report_content):
        report_content[WARNING_STR].extend(additional)

  # Consolidate all warnings collected from analysis
  if WARNING_STR in report_content and len(report_content[WARNING_STR]) > 1:
    report_content[WARNING_STR] = [
        report_content[WARNING_STR][-1],
        utils.create_content_list(report_content[WARNING_STR][0:-1])]

  # Consolidate all recommendations collected from analysis
  if RECOMMEND_STR in report_content and len(report_content[RECOMMEND_STR]) > 1:
    report_content[RECOMMEND_STR] = [
        report_content[RECOMMEND_STR][-1],
        utils.create_content_list(report_content[RECOMMEND_STR][0:-1])]

  return report_content


def create_md_report(
    analysis_tracker: AnalysisTracker,
    figure_base_path: Text,
    config_params: argparse.ArgumentParser
) -> Text:
  # pylint: disable-msg=too-many-locals
  """Creat report based on all the analysis performed

  Args:
      analysis_tracker: (AnalysisTracker), holder for all the analysis
      figure_base_path: (string), the folder for holding figures
      config_params: runtime configuration from CLI

  Returns:
      Markdown formatted report in text
  """

  def _check_empty_section(
      r_contents: OrderedDict,
      section_meta: SectionMeta
  ) -> bool:
    """Check whether the content of a section is empty. If a section has
    has dependency as specified in its SectionMeta, all its dependencies need
    to be checked to ensure its emptiness.

    Args:
      r_contents: generated report contents holder
      section_meta: section metadata

    Returns:
      Boolean flag
    """
    if section_meta.section_content_generator is not None:
      if section_meta.section_title is None:
        # if there is no title, nonempty content length should be larger than 1
        return len(r_contents[section_meta.section_name]) < 1
      # if there is title, nonempty content length should be larger than 2
      return len(r_contents[section_meta.section_name]) < 2

    if not section_meta.dependency:
      return len(r_contents[section_meta.section_name]) < 2

    check_list = list()
    for item in section_meta.dependency:
      # recursively check dependency
      check_list.append(_check_empty_section(r_contents, item))
    # all dependency need to be empty to claim the parent
    # section to be empty
    if all(check_list):
      return True

    return False

  # Generate contents for each section
  report_content = create_report_contents(
      analysis_tracker=analysis_tracker,
      figure_base_path=figure_base_path)

  contents = []
  # Put contents in correct order and add appropriate section title
  # The `report_structure` define the overall structure

  for section in REPORT_STRUCTURE:
    if section.skip_if_no_content:
      is_empty = _check_empty_section(report_content, section)
      logging.info(
          'Emptiness check for {}: {}'.format(section.section_name, is_empty))
      if not is_empty:
        contents.extend(report_content[section.section_name])
    else:
      contents.extend(report_content[section.section_name])

  if config_params.add_config_to_report:
    config_title = SECTION_TITLE.format(content='Configurations')
    contents.append(config_title)
    with open(config_params.job_config, 'r') as f:
      job_config_title = SUB_SECTION_TITLE.format(content='job_config.ini')
      config_content = JOB_CONFIG_TEMPLATE.format(
          config_content=''.join(f.readlines()))
    contents.extend([job_config_title, config_content])

    cli_list_template = CLI_PARAM_LIST_TEMPLATE
    config_dict = config_params.__dict__
    cli_title = SUB_SECTION_TITLE.format(content='cli params')
    param_content = '\n'.join(
        [cli_list_template.format(param=param, value=config_dict[param])
         for param in config_dict])
    cli_content = CLI_PARAM_TEMPLATE.format(param_content=param_content)
    contents.extend([cli_title, cli_content])

  return ''.join(contents)


def create_html_report_from_markdown(
    markdown_content: Text
) -> Text:
  """Creat report based on all the analysis performed

  Args:
      markdown_content: markdown format content.

  Returns:
      HTML formatted report in text
  """

  extras = ['cuddled-list', 'tables', 'fenced-code-blocks']
  raw_html = markdown(markdown_content, extras=extras)

  return raw_html
