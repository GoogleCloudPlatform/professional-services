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

"""Utilities for provide recommendation based on analysis results"""

from typing import Union, Text

from ml_eda.proto import analysis_entity_pb2
from ml_eda.reporting import template
from ml_eda.reporting import formatting

# Thresholds
MISSING_THRESHOLD = 0.1
CARDINALITY_THRESHOLD = 100
CORRELATION_COEFFICIENT_THRESHOLD = 0.3
P_VALUE_THRESHOLD = 0.05

Analysis = analysis_entity_pb2.Analysis
ScalarMetric = analysis_entity_pb2.ScalarMetric


def check_missing(
    attribute_name: Text,
    analysis: Analysis
) -> Union[None, Text]:
  """Check whether % of missing exceed threshold

  Args:
      attribute_name: (string),
      analysis: (analysis_entity_pb2.Analysis), analysis that contain the result
      of number of missing values

  Returns:
    Union[None, string]
  """
  metrics = analysis.smetrics
  total = 0
  missing = 0

  for item in metrics:
    if item.name == ScalarMetric.TOTAL_COUNT:
      total = item.value
    elif item.name == ScalarMetric.MISSING:
      missing = item.value

  if total == 0:
    raise ValueError('The dataset is empty')

  missing_rate = missing / total

  if missing_rate > MISSING_THRESHOLD:
    return template.HIGH_MISSING.format(
        name=attribute_name,
        value=missing_rate
    )

  return None


def check_cardinality(
    attribute_name: Text,
    analysis: Analysis
) -> Union[None, Text]:
  """Check whether the cardinality exceeds the predefined threshold

  Args:
      attribute_name: (string),
      analysis: (analysis_entity_pb2.Analysis), analysis that contain the result
      of cardinality

  Returns:
    Union[None, string]
  """
  metrics = analysis.smetrics
  cardinality = 0

  for item in metrics:
    if item.name == ScalarMetric.CARDINALITY:
      cardinality = item.value

  if cardinality > CARDINALITY_THRESHOLD:
    return template.HIGH_CARDINALITY.format(
        name=attribute_name,
        value=cardinality
    )

  return None


def check_pearson_correlation(analysis: Analysis) -> Union[None, Text]:
  """Check whether the correlation coefficients exceed the predefined threshold

  Args:
      analysis: (analysis_entity_pb2.Analysis), analysis that contain the result
      of pearson correlation

  Returns:
    Union[None, string]
  """
  metrics = analysis.smetrics
  name_list = [att.name for att in analysis.features]
  coefficient = 0

  for item in metrics:
    if item.name == ScalarMetric.CORRELATION_COEFFICIENT:
      coefficient = item.value

  if abs(coefficient) > CORRELATION_COEFFICIENT_THRESHOLD:
    return template.HIGH_CORRELATION.format(
        name_one=name_list[0],
        name_two=name_list[1],
        metric='correlation coefficient',
        value="{0:.2f}".format(coefficient)
    )

  return None


def check_p_value(analysis: Analysis) -> Union[None, Text]:
  """Check whether the p-value of statistical tests
  exceed the predefined threshold

  Args:
      analysis: (analysis_entity_pb2.Analysis), analysis that contain the result
      of statistical test

  Returns:
    Union[None, string]
  """
  metric = analysis.smetrics[0]
  name_list = [att.name for att in analysis.features]
  p_value = metric.value

  if p_value < P_VALUE_THRESHOLD:
    return template.LOW_P_VALUE.format(
        name_one=name_list[0],
        name_two=name_list[1],
        metric='p-value',
        value=formatting.numeric_formatting(p_value)
    )

  return None
