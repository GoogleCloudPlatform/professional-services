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

from typing import Set, List
from collections import defaultdict

from ml_eda.metadata import run_metadata_pb2
from ml_eda.metadata.metadata_definition import MetadataDef


def get_analysis_unique_name(analysis: run_metadata_pb2.Analysis) -> str:
  """The unique name of an analysis is:
  [analysis_name]_[attribute_one]_[attribute_two]_ ......

  Args:
      analysis: (run_metadata_pb2.Analysis)

  Returns:
      string
  """
  attributes = analysis.features
  # run_metadata_pb2.Analysis.Name is an integer, need the following
  # conversion to get its string value
  analysis_name = run_metadata_pb2.Analysis.Name.Name(analysis.name)
  return '-'.join([analysis_name] + [att.name for att in attributes])


class AttributeAnalysisTracker:
  """
  Tracker for storing the performed analysis results related to one
  particular attribute
  """

  def __init__(self, att_type: str, att_name: str):
    """
    Args:
      att_type: (string), attribute type
      att_name: (string), attribute name
    """
    self.att_type = att_type
    self.att_name = att_name
    self.attribute_tracker = dict()

  def add_analysis(self, analysis: run_metadata_pb2.Analysis):
    """Add an analysis result to attribute tracker

    Args:
        analysis: (run_metadata_pb2.Analysis),  performed analysis result

    Returns:

    """
    analysis_unique_name = get_analysis_unique_name(analysis)
    self.attribute_tracker[analysis_unique_name] = analysis

  def get_analysis(self,
                   analysis_name: str) -> List[run_metadata_pb2.Analysis]:
    """Return all the analysis related to the attribute given an analysis
    name. Since one attribute can run the same analysis with
    multiple attributes, this function would return an iterator.

    Args:
        analysis_name: (string), name of the analysis specified in the proto

    Returns:
        List[run_metadata_pb2.Analysis]
    """

    analysis = []
    for item in self.attribute_tracker:
      if item.startswith(analysis_name):
        analysis.append(self.attribute_tracker[item])
    return analysis

  def get_all_analysis(self) -> List[run_metadata_pb2.Analysis]:
    """Return all the analysis stored in the attribute tracker"""
    return list(self.attribute_tracker.values())


class AnalysisTracker:
  """
  Tracker for storing the performed analysis results
  """

  def __init__(self, metadata: MetadataDef):
    self.metadata = metadata
    # tracker for tracking all the analysis
    self.analysis_tracker = dict()
    # tracker for tracking all attributes having analysis performed
    self.attribute_tracker = dict()
    # tracker for attributes in different type
    self.attribute_type_tracker = defaultdict(set)

  def add_analysis(self, analysis: run_metadata_pb2.Analysis):
    """Add analysis to two trackers

    Args:
        analysis: (run_metadata_pb2.Analysis)

    Returns:

    """
    analysis_attributes = analysis.features
    # Get the unique name for the analysis
    analysis_unique_name = get_analysis_unique_name(analysis)

    # Add analysis to analysis_tracker
    self.analysis_tracker[analysis_unique_name] = analysis

    # Add analysis to attribute_tracker
    for attr in analysis_attributes:
      if attr.name not in self.attribute_tracker:
        self.attribute_tracker[attr.name] = AttributeAnalysisTracker(
            att_name=attr.name,
            att_type=attr.type)
        self.attribute_type_tracker[attr.type].add(attr.name)

      self.attribute_tracker[attr.name].add_analysis(analysis)

  def get_target(self) -> run_metadata_pb2.Attribute:
    """Get the target attribute"""
    return self.metadata.target_column

  def get_attributes(self) -> List[str]:
    """Get the names of all the involved attributes"""
    return list(self.attribute_tracker.keys())

  def get_numerical_attributes(self) -> Set[str]:
    """Get the names of all numerical attributes"""
    return self.attribute_type_tracker[run_metadata_pb2.Attribute.NUMERICAL]

  def get_categorical_attributes(self) -> Set[str]:
    """Get the names of all categorical attributes"""
    return self.attribute_type_tracker[run_metadata_pb2.Attribute.CATEGORICAL]

  def get_all_analysis(self) -> List[run_metadata_pb2.Analysis]:
    """Get all the stored analyses results"""
    return list(self.analysis_tracker.values())

  def get_all_analysis_unique_names(self):
    """Get the unique name of all sotre analyses"""
    return self.analysis_tracker.keys()

  def get_attribute_analysis(self,
                             attribute_name: str,
                             analysis_name: str
                             ) -> List[run_metadata_pb2.Analysis]:
    """Get all the analyses given attribute name and analysis name"""
    if attribute_name in self.attribute_tracker:
      return self.attribute_tracker[attribute_name].get_analysis(
          analysis_name)

    return []

  def get_attribute_all_analysis(self, attribute_name: str
                                 ) -> List[run_metadata_pb2.Analysis]:
    """Get all the analyses given attribute name"""
    if attribute_name in self.attribute_tracker:
      return self.attribute_tracker[attribute_name].get_all_analysis()

    return []

  def get_analysis(self, analysis_name: str
                   ) -> List[run_metadata_pb2.Analysis]:
    """Get all the analyses given analysis name"""
    analysis = []
    for item in self.analysis_tracker:
      if item.startswith(analysis_name):
        analysis.append(self.analysis_tracker[item])
    return analysis
