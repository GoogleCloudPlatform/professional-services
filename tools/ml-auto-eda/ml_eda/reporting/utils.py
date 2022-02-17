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

"""Utilities for report generation"""

from __future__ import absolute_import
from __future__ import print_function

from collections import OrderedDict
from typing import Set, Dict, List, Union, Text

from ml_eda.proto import analysis_entity_pb2
from ml_eda.preprocessing.analysis_query import query_constants
from ml_eda.reporting import template
from ml_eda.reporting import visualization
from ml_eda.reporting import formatting

Analysis = analysis_entity_pb2.Analysis
TableMetric = analysis_entity_pb2.TableMetric
ScalarMetric = analysis_entity_pb2.ScalarMetric
Attribute = analysis_entity_pb2.Attribute


def create_table_descriptive_row_from_analysis(
    attribute_name: Text,
    base_analysis: Analysis,
    additional_analysis: Analysis,
    figure_base_path: Text
) -> Text:
  # pylint: disable-msg=too-many-locals
  """Create makrdown formatted descriptive analysis result

  Args:
      attribute_name: (string), name of the attribute
      base_analysis: (analysis_entity_pb2.Analysis), analysis holding
      all the metrics
      additional_analysis: (analysis_entity_pb2.Analysis), histogram for
      numerical attribute, value_counts for categorical attributes
      figure_base_path: (string), the folder for holding figures

  Returns:
      string, markdown formatted content
  """
  row_template = template.TABLE_DESCRIPTIVE_ROW_TEMPLATE
  stats_template = template.TABLE_DESCRIPTIVE_STATS_TEMPLATE

  metrics = base_analysis.smetrics
  attribute_type = base_analysis.features[0].type

  # Make sure the display order of each attribute is consistent
  common_order = query_constants.COMMON_ORDER
  if attribute_type == Attribute.NUMERICAL:
    detail_order = query_constants.NUMERICAL_ORDER
  else:
    detail_order = query_constants.CATEGORICAL_ORDER
  # Use a OrderedDict to store the result
  result_holder = OrderedDict(
      [(item, 0) for item in common_order + detail_order])
  for item in metrics:
    name = ScalarMetric.Name.Name(item.name)
    value = formatting.numeric_formatting(item.value)
    result_holder[name] = value

  # Construct the markdown formatted row
  row_stats_contents = []
  for item in result_holder:
    row_stats_contents.append(stats_template.format(
        metric=item,
        value=result_holder[item]
    ))

  figure_path = visualization.plot_bar_chart(additional_analysis,
                                             figure_base_path)
  return row_template.format(
      name=attribute_name,
      type=Attribute.Type.Name(attribute_type),
      stats=' <br/> '.join(row_stats_contents),
      url=figure_path,
      alt_text=attribute_name,
  )


def create_table_from_table_metric(table_metric: TableMetric) -> Text:
  """Create a table for a TableMetric object. Currently, this function is
  used for Contingency_Table and TABLE_DESCRIPTIVE

  Examples:
  &#x200B;|Cash|Credit Card|No Charge|Unknown|Mobile|Prcard
  :-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:
  frequency|108114952.0|74475448.0|797730.0|369844.0|255082.0|192063.0

  Args:
      table_metric: (analysis_entity_pb2.TableMetric)

  Returns:
      string
  """

  supported_metric = {
      TableMetric.CONTINGENCY_TABLE,
      TableMetric.TABLE_DESCRIPTIVE
  }

  assert table_metric.name in supported_metric

  table_template = template.TABLE_TEMPLATE

  headers = ['&#x200B;'] + list(table_metric.column_indexes)
  header_string = "|".join(headers)
  header_separator = "|".join([":-----:" for i in range(len(headers))])

  table_content = []

  for row in table_metric.rows:
    # row header is in BOLD
    row_header = template.BOLD.format(
        content=str(row.row_index).strip())
    row_values = [row_header] + [formatting.numeric_formatting(item.value)
                                 for item in row.cells]
    table_content.append("|".join(row_values))

  table_content_string = "\n".join(table_content)

  return table_template.format(
      header=header_string,
      header_separator=header_separator,
      table_content=table_content_string
  )


def create_pairwise_metric_table(
    row_list: Set[Text],
    column_list: Set[Text],
    name_value_map: Dict[Text, float],
    same_match_value
) -> Text:
  """Construct table for pair-wise computed metrics, e.g.,
  PEARSON_CORRELATION, ANOVA, CHI_SQUARE, INFORMATION_GAIN

  Examples:
  &#x200B;|tips|tolls|trip_total
  :-----:|:-----:|:-----:|:-----:
  tips|1|0.0001942405360750854|0.1952170878648758
  tolls|0.0001942405360750854|1|0.22858665883541107
  trip_total|0.1952170878648758|0.22858665883541107|1

  Args:
      row_list: (List[str]), list of attribute names for table header
      column_list: (List[str]), list of attribute names for table row name
      name_value_map: (Dict[str, float]), map of name -> value
      same_match_value: value if the column and row name are the same. This
      could be either float or 'NA' depends on whether the computation of
      A-v.s.-A makes sense

  Returns:
      string
  """
  table_template = template.TABLE_TEMPLATE

  headers = ['&#x200B;'] + list(column_list)
  header_string = "|".join(headers)
  header_separator = "|".join([":-----:" for i in range(len(headers))])

  table_content = []

  for row_name in row_list:
    # row header is in BOLD
    row_values = [template.BOLD.format(content=row_name.strip())]
    for col_name in column_list:
      # same_match_value is used when row_name == column_name
      if row_name == col_name:
        value = same_match_value
      else:
        value = name_value_map[row_name + '-' + col_name]

      # if the same_match_value is string, simply append it
      if isinstance(value, str):
        row_values.append(same_match_value)
      else:
        row_values.append(formatting.numeric_formatting(value))

    table_content.append("|".join(row_values))

  table_content_string = "\n".join(table_content)

  return table_template.format(
      header=header_string,
      header_separator=header_separator,
      table_content=table_content_string
  )


def create_no_order_pair_metric_section(
    analysis_list: List[Analysis],
    same_match_value: Union[Text, float],
    figure_base_path: Text,
    table_name: Text = "NA"
) -> Text:
  """Create metric table for pairwise comparison

  Args:
      analysis_list: (List[analysis_entity_pb2.Analysis])
      same_match_value: (Union[str, float])
      figure_base_path: (string), the folder for holding figures
      table_name: (str)

  Returns:
      string
  """
  attribute_list = set()
  # a dictionary with {attributeone-attributetwo: metric_value}
  analysis_name_value_map = {}
  for item in analysis_list:
    value = item.smetrics[0].value
    name_list = [att.name for att in item.features]
    attribute_list.update(name_list)
    analysis_name_value_map['-'.join(name_list)] = value
    analysis_name_value_map['-'.join(reversed(name_list))] = value

  table_content = create_pairwise_metric_table(
      row_list=attribute_list,
      column_list=attribute_list,
      name_value_map=analysis_name_value_map,
      same_match_value=same_match_value)

  if table_name != "NA":
    figure_path = visualization.plot_heat_map_for_metric_table(
        heat_map_name=table_name,
        row_list=attribute_list,
        column_list=attribute_list,
        name_value_map=analysis_name_value_map,
        same_match_value=same_match_value,
        figure_base_path=figure_base_path)
    figure_content = template.IMAGE_TEMPLATE.format(
        url=figure_path,
        alt_text=table_name
    )
  else:
    figure_content = ""

  return table_content + figure_content


def create_order_pair_metric_section(
    analysis_list: List[Analysis],
    same_match_value: Union[Text, float]
) -> Text:
  """Create metric table for pairwise comparison

  Args:
      analysis_list: (List[analysis_entity_pb2.Analysis])
      same_match_value: (Union[str, float])

  Returns:
      string
  """
  row_list = set()
  column_list = set()
  # a dictionary with {attributeone-attributetwo: metric_value}
  analysis_name_value_map = {}
  for item in analysis_list:
    value = item.smetrics[0].value
    name_list = [att.name for att in item.features]
    row_list.add(name_list[0])
    column_list.add(name_list[1])
    analysis_name_value_map['-'.join(name_list)] = value
  return create_pairwise_metric_table(
      row_list=row_list,
      column_list=column_list,
      name_value_map=analysis_name_value_map,
      same_match_value=same_match_value)


def create_target_metrics_highlight(
    target_name: Text,
    metric_name_list: List[Text],
    metric_analysis_list: List[List[Analysis]]
) -> Text:
  # pylint: disable-msg=too-many-locals
  """Create the content for highlight section regarding a target attribute

  Args:
      target_name: (string)
      metric_name_list: (List(string)
      metric_analysis_list: (List[List[analysis_entity_pb2.Analysis]])

  Returns:

  """

  assert len(metric_name_list) == len(metric_analysis_list)
  # Every metric should have the same length, i.e., target v.s. remaining
  assert len({len(item) for item in metric_analysis_list}) == 1

  name_enrich = {
      'ANOVA': 'ANOVA P-value',
      'CHI_SQUARE': 'Chi-square P-value',
      'INFORMATION_GAIN': 'Information Gain',
      'PEARSON_CORRELATION': 'Correlation Coefficient'
  }

  table_template = template.TARGET_METRIC_HIGHLIGHT_TEMPLATE
  row_template = template.TARGET_METRIC_HIGHLIGHT_ROW_TEMPLATE

  num_metrics = len(metric_name_list)

  enrich_name_list = [name_enrich[item] if item in name_enrich else item
                      for item in metric_name_list]
  metric_names_str = '|'.join(enrich_name_list)

  separator_str = ':-----:|' * num_metrics

  attribute_set = set()
  metric_holders = {metric: {} for metric in metric_name_list}
  for i in range(num_metrics):
    for analysis in metric_analysis_list[i]:
      metric_name = Analysis.Name.Name(analysis.name)
      attribute_name = [att.name for att in analysis.features
                        if att.name != target_name][0]
      attribute_set.add(attribute_name)
      metric_value = analysis.smetrics[0].value
      metric_holders[metric_name][attribute_name] = metric_value

  row_content_list = []
  for attribute in attribute_set:
    values_str = '|'.join(
        [formatting.numeric_formatting(metric_holders[metric][attribute])
         for metric in metric_name_list])
    row_content_list.append(row_template.format(
        name=attribute,
        values=values_str
    ))

  return table_template.format(
      target_column=target_name,
      metric_names=metric_names_str,
      seperators=separator_str,
      row_content='\n'.join(row_content_list)
  )


def create_content_list(contents: List[Text]) -> Text:
  """Format list of string into markdown list

  Args:
    contents: (List[string]), list of string to be formatted

  Returns:
    String
  """
  # print(contents)
  return '\n'.join(
      [template.LIST_TEMPLATE.format(
          level='',
          content=item
      ) for item in contents if item.strip()])


def create_warning_notes(warnings: List[Text]) -> Text:
  """Format list of warnings into markdown list

  Args:
    warnings: (List(string)), list of warnings

  Returns:
    String
  """
  warning_title = template.SUB_SUB_SECTION_TITLE.format(
      content='Warnings'
  )
  return warning_title + create_content_list(warnings)
