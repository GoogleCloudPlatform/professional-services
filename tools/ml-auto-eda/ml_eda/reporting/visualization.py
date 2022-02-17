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

"""Inventory holding helper function of building visualization for report."""
# pylint: disable-msg=wrong-import-position
import re
import os
from typing import Set, Dict, List, Text

import pandas as pd
import matplotlib

matplotlib.use('Agg')
from matplotlib import pyplot as plt
import seaborn as sns

from ml_eda.proto import analysis_entity_pb2

FIGURE_SIZE = (10, 8)
XLABEL_SIZE = 10

Analysis = analysis_entity_pb2.Analysis


def _trim_xlabel(xlabels: List[Text]) -> List[Text]:
  return [item[0:XLABEL_SIZE] if len(item) > XLABEL_SIZE else item
          for item in xlabels]


def plot_bar_chart(analysis: Analysis, figure_base_path: Text) -> Text:
  """Create histogram for numerical attributes or bar chart for categorical

  Args:
      analysis: (analysis_pb2.Analysis), the analysis should be one of
      the following
      - HISTOGRAM for histogram of numerical attribute
      - VALUE_COUNTS for bar chart of categorical attributes
      figure_base_path: (string), the folder for holding figures

  Returns:
      string, path of the generated figure
  """
  # pylint: disable-msg=too-many-locals
  supported_analysis = {Analysis.HISTOGRAM, Analysis.VALUE_COUNTS}

  assert analysis.name in supported_analysis

  # The result of supported analysis should be in the format of TableMetric
  table_metric = analysis.tmetrics[0]
  attribute_name = analysis.features[0].name

  columns = []
  if analysis.name == Analysis.HISTOGRAM:
    boundaries = table_metric.column_indexes
    for item in boundaries:
      # For better display, the midpoint of a bin is computed
      boundary = re.findall(r"\d+\.?\d*", item)
      if len(boundary) == 1:
        center = boundary[0] + '+'
      else:
        left, right = boundary
        center = "{0:.2f}".format((float(left) + float(right)) / 2)
      columns.append(center)
  else:
    columns.extend(table_metric.column_indexes)

  # Trim the xlabel to make it look nicer
  columns = _trim_xlabel(columns)

  for row in table_metric.rows:
    row_values = [item.value for item in row.cells]

  df = pd.DataFrame({'bin_name': columns, "Frequency": row_values})

  fig, axs = plt.subplots(figsize=FIGURE_SIZE)
  fig.subplots_adjust(bottom=0.2)

  df.plot.bar(x="bin_name", y="Frequency", ax=axs, width=0.8)
  axs.set_xlabel(attribute_name)
  axs.set_ylabel('Number of records')
  axs.grid(True, which='both')

  output_path = os.path.join(
      figure_base_path, '{}_histogram.png'.format(attribute_name))
  plt.savefig(output_path, dpi=(200))

  return output_path


def plot_heat_map_for_metric_table(
    heat_map_name: Text,
    row_list: Set[Text],
    column_list: Set[Text],
    name_value_map: Dict[Text, float],
    same_match_value: float,
    figure_base_path: Text
) -> Text:
  """Creat heat map for pair-wised analysis. Currently, this is done for
  numerical pearson correlation and categorical information gain.

  Args:
      heat_map_name: (string), name of the heat map
      row_list: (Set[str]), row index
      column_list: (Set[str]), column index
      name_value_map: (Dict[str, float]), dictionary storing the value of the
      analysis with key being att1-att2, i.e., {att1-att2: value}
      same_match_value: (float), value to fill the cell with row and column
      index being the same
      figure_base_path: (string), the folder for holding figures

  Returns:
      string, path of the generated figure
  """
  table_content = []

  for row_name in row_list:
    row_values = []
    for col_name in column_list:
      if row_name == col_name:
        value = same_match_value
      else:
        value = name_value_map[row_name + '-' + col_name]
      row_values.append(value)
    table_content.append(row_values)

  # Construct the typical corr DataFrame
  corr = pd.DataFrame(data=table_content, index=row_list, columns=column_list)

  # plot the heatmap
  _, axs = plt.subplots(figsize=FIGURE_SIZE)
  sns.heatmap(corr,
              xticklabels=corr.columns,
              yticklabels=corr.columns,
              ax=axs)

  output_path = os.path.join(
      figure_base_path, '{}_heatmap.png'.format(heat_map_name))
  plt.savefig(output_path, dpi=(200))

  return output_path
