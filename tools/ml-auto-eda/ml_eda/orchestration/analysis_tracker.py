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

"""Tracker for storing the performed analysis results"""

from __future__ import absolute_import
from __future__ import print_function

from typing import Set, List, Text, Dict
from collections import defaultdict

from google.protobuf.json_format import MessageToDict

from ml_eda.proto import analysis_entity_pb2
from ml_eda.job_config_util.job_config import JobConfig

NAME_SEP = '-'
Analysis = analysis_entity_pb2.Analysis
Attribute = analysis_entity_pb2.Attribute


def _analysis_unique_name(analysis: Analysis) -> Text:
  """The unique name of an analysis is:
  [analysis_name]_[attribute_one]_[attribute_two]_ ......

  Args:
      analysis: An instance of analysis_entity_pb2.Analysis

  Returns:
      Unique name of an Analysis in string
  """
  attributes = analysis.features
  # analysis_entity_pb2.Analysis.Name is an integer, need the following
  # conversion to get its string value
  analysis_name = Analysis.Name.Name(analysis.name)
  attribute_names = [att.name for att in attributes]
  return NAME_SEP.join([analysis_name] + sorted(attribute_names))


class AttributeAnalysisTracker:
  """
  Tracker for storing the performed analysis results related to one
  particular attribute
  """

  def __init__(self, att_name: Text, att_type: Text):
    """
    Args:
      att_name: (string), attribute name
      att_type: (string), attribute type
    """
    self.att_type = att_type
    self.att_name = att_name
    self.tracker = dict()

  def add_analysis(self, analysis: Analysis):
    """Add an analysis result to attribute tracker

    Args:
        analysis: (analysis_entity_pb2.Analysis),  performed analysis result

    """
    analysis_unique_name = _analysis_unique_name(analysis)
    self.tracker[analysis_unique_name] = analysis

  def get_analysis(self, analysis_name: Text) -> List[Analysis]:
    """Return all the analysis related to the attribute given an analysis
    name. Since one attribute can run the same analysis with
    multiple attributes, this function would return an iterator.

    Args:
        analysis_name: (string), name of the analysis specified in the proto

    Returns:
        List[analysis_entity_pb2.Analysis]
    """

    analysis = []
    for item in self.tracker:
      if item.startswith(analysis_name):
        analysis.append(self.tracker[item])
    return analysis

  def get_all_analysis(self) -> List[Analysis]:
    """Return all the analysis stored in the attribute tracker"""
    return list(self.tracker.values())


class AnalysisTracker:
  """
  Tracker for storing the performed analysis results
  """

  def __init__(self, job_config: JobConfig):
    self._job_config = job_config
    # tracker for tracking all the analysis
    self._analysis_tracker = dict()
    # tracker for tracking all attributes having analysis performed
    self._attribute_tracker = dict()
    # tracker for attributes in different type
    self._attribute_type_tracker = defaultdict(set)

  def add_analysis(self, analysis: Analysis):
    """Add analysis to two trackers

    Args:
        analysis: (analysis_entity_pb2.Analysis)

    """
    analysis_attributes = analysis.features
    # Get the unique name for the analysis
    analysis_unique_name = _analysis_unique_name(analysis)

    # Add analysis to analysis_tracker
    self._analysis_tracker[analysis_unique_name] = analysis

    # Add analysis to attribute_tracker
    for attr in analysis_attributes:
      if attr.name not in self._attribute_tracker:
        self._attribute_tracker[attr.name] = AttributeAnalysisTracker(
            att_name=attr.name,
            att_type=attr.type)
        self._attribute_type_tracker[attr.type].add(attr.name)

      self._attribute_tracker[attr.name].add_analysis(analysis)

  def get_job_config(self) -> JobConfig:
    """Get the job config"""
    return self._job_config

  def get_target_attribute(self) -> Attribute:
    """Get the target attribute"""
    return self._job_config.target_column

  def get_attribute_names(self) -> Set[Text]:
    """Get the names of all the involved attributes"""
    return set(self._attribute_tracker.keys())

  def get_num_attribute_names(self) -> Set[Text]:
    """Get the names of all numerical attributes"""
    return self._attribute_type_tracker[Attribute.NUMERICAL]

  def get_cat_attribute_names(self) -> Set[Text]:
    """Get the names of all categorical attributes"""
    return self._attribute_type_tracker[Attribute.CATEGORICAL]

  def get_all_analysis(self) -> List[Analysis]:
    """Get all the stored analyses results"""
    return list(self._analysis_tracker.values())

  def get_all_analysis_unique_names(self) -> List[Text]:
    """Get the unique name of all stored analyses"""
    return list(self._analysis_tracker.keys())

  def get_analysis_by_attribute(self, attribute_name: Text) -> List[Analysis]:
    """Get all the analyses given attribute name"""
    if attribute_name in self._attribute_tracker:
      return self._attribute_tracker[attribute_name].get_all_analysis()

    return []

  def get_analysis_by_name(self, analysis_name: Text) -> List[Analysis]:
    """Get all the analyses given analysis name"""
    analysis = []
    for item in self._analysis_tracker:
      if item.startswith(analysis_name):
        analysis.append(self._analysis_tracker[item])
    return analysis

  def get_analysis_by_attribute_and_name(self,
                                         attribute_name: Text,
                                         analysis_name: Text
                                         ) -> List[Analysis]:
    """Get all the analyses given attribute name and analysis name"""
    if attribute_name in self._attribute_tracker:
      return self._attribute_tracker[attribute_name].get_analysis(
          analysis_name)

    return []

  def export_to_dict(self) -> Dict[Text, Dict]:
    """Export all analysis in a dictionary, where the Analysis object
    is serialized."""
    export_dict = {}
    for analysis_name in self._analysis_tracker:
      analysis_str = MessageToDict(self._analysis_tracker[analysis_name])
      export_dict[analysis_name] = analysis_str
    return export_dict
