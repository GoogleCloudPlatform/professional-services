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

"""Definition of utility class for holding the configuration of running
analysis"""

from __future__ import absolute_import
from __future__ import print_function

from typing import List

from ml_eda.constants import c
from ml_eda.proto import analysis_entity_pb2


class JobConfig:
  """Uility class for holding the configuration of running analysis"""
  # pylint: disable-msg=too-many-instance-attributes
  _datasource = analysis_entity_pb2.DataSource()

  def __init__(self,
               datasource_type: str,
               datasource_location: str,
               target_column: str,
               numerical_attributes: List[str],
               categorical_attributes: List[str],
               analysis_run_ops,
               analysis_run_config):
    # pylint: disable-msg=too-many-arguments
    if datasource_type == c.datasources.BIGQUERY:
      self._datasource.type = analysis_entity_pb2.DataSource.BIGQUERY
    elif datasource_type == c.datasources.CSV:
      self._datasource.type = analysis_entity_pb2.DataSource.CSV
    self._datasource.location = datasource_location
    self._datasource.target.name = target_column

    if target_column == c.schema.NULL:
      self._ml_type = c.ml_type.NULL
    elif target_column in numerical_attributes:
      self._datasource.target.type = analysis_entity_pb2.Attribute.NUMERICAL
      self._ml_type = c.ml_type.REGRESSION
    elif target_column in categorical_attributes:
      self._datasource.target.type = analysis_entity_pb2.Attribute.CATEGORICAL
      self._ml_type = c.ml_type.CLASSIFICATION
    else:
      raise ValueError('The specified target column {} does not belong to'
                       'Categorical or Numerical features in the '
                       'job_config.ini'.format(target_column))

    self._numerical_attributes = self._create_numerical_attributes(
        numerical_attributes)
    self._datasource.features.extend(self._numerical_attributes)

    self._categorical_attributes = self._create_categorical_attributes(
        categorical_attributes)
    self._datasource.features.extend(self._categorical_attributes)

    # This is for tracking categorical attributes with limited cardinality
    self._categorical_low_card_attributes = self._categorical_attributes

    # Running configuration
    self._contingency_table_run = analysis_run_ops.getboolean(
        c.analysis_run.CONTINGENCY_TABLE_RUN)
    self._table_descriptive_run = analysis_run_ops.getboolean(
        c.analysis_run.TABLE_DESCRIPTIVE_RUN)
    self._pearson_corr_run = analysis_run_ops.getboolean(
        c.analysis_run.PEARSON_CORRELATION_RUN)
    self._information_gain_run = analysis_run_ops.getboolean(
        c.analysis_run.INFORMATION_GAIN_RUN)
    self._chi_square_run = analysis_run_ops.getboolean(
        c.analysis_run.CHI_SQUARE_RUN)
    self._anova_run = analysis_run_ops.getboolean(
        c.analysis_run.ANOVA_RUN)

    # Analysis configuration
    self._histogram_bin = analysis_run_config.getint(
        c.analysis_config.HISTOGRAM_BIN)
    self._value_counts_limit = analysis_run_config.getint(
        c.analysis_config.VALUE_COUNTS_LIMIT)
    self._general_cardinality_limit = analysis_run_config.getint(
        c.analysis_config.GENERAL_CARDINALITY_LIMIT)

  @staticmethod
  def _create_attributes(attribute_names: List[str],
                         attribute_type: int
                         ) -> List[analysis_entity_pb2.Attribute]:
    """Construct analysis_entity_pb2.Attribute instance for attributes

    Args:
        attribute_names: (List[string]), name list of the attribute
        attribute_type: (int), type of the attribute defined in the proto

    Returns:
      List[analysis_entity_pb2.Attribute]
    """
    return [
        analysis_entity_pb2.Attribute(name=name, type=attribute_type)
        for name in attribute_names
    ]

  def _create_numerical_attributes(self, attribute_names: List[str]
                                   ) -> List[analysis_entity_pb2.Attribute]:
    """Consturct analysis_entity_pb2.Attribute instance for numerical attributes

    Args:
        attribute_names: (List[string]), name list of the attributes

    Returns:
      List[analysis_entity_pb2.Attribute]
    """
    return self._create_attributes(attribute_names,
                                   analysis_entity_pb2.Attribute.NUMERICAL)

  def _create_categorical_attributes(self, attribute_names: List[str]
                                     ) -> List[analysis_entity_pb2.Attribute]:
    """Construct analysis_entity_pb2.Attribute instance for cat attributes.

    Args:
        attribute_names: (List[string]), name list of the attributes

    Returns:
      List[analysis_entity_pb2.Attribute]
    """
    return self._create_attributes(attribute_names,
                                   analysis_entity_pb2.Attribute.CATEGORICAL)

  def update_low_card_categorical(self, features):
    """Update low cardinality attributes"""
    self._categorical_low_card_attributes = features

  @property
  def datasource(self):
    # pylint: disable-msg=missing-docstring
    return self._datasource

  @property
  def target_column(self):
    # pylint: disable-msg=missing-docstring
    return self._datasource.target

  @property
  def ml_type(self):
    # pylint: disable-msg=missing-docstring
    return self._ml_type

  @property
  def numerical_attributes(self):
    # pylint: disable-msg=missing-docstring
    return self._numerical_attributes

  @property
  def categorical_attributes(self):
    # pylint: disable-msg=missing-docstring
    return self._categorical_attributes

  @property
  def low_card_categorical_attributes(self):
    # pylint: disable-msg=missing-docstring
    return self._categorical_low_card_attributes

  # Analysis Running Configuration
  @property
  def contingency_table_run(self):
    # pylint: disable-msg=missing-docstring
    return self._contingency_table_run

  @property
  def table_descriptive_run(self):
    # pylint: disable-msg=missing-docstring
    return self._table_descriptive_run

  @property
  def pearson_corr_run(self):
    # pylint: disable-msg=missing-docstring
    return self._pearson_corr_run

  @property
  def information_gain_run(self):
    # pylint: disable-msg=missing-docstring
    return self._information_gain_run

  @property
  def chi_square_run(self):
    # pylint: disable-msg=missing-docstring
    return self._chi_square_run

  @property
  def anova_run(self):
    # pylint: disable-msg=missing-docstring
    return self._anova_run

  @property
  def histogram_bin(self):
    # pylint: disable-msg=missing-docstring
    return self._histogram_bin

  @property
  def value_counts_limit(self):
    # pylint: disable-msg=missing-docstring
    return self._value_counts_limit

  @property
  def general_cardinality_limit(self):
    # pylint: disable-msg=missing-docstring
    return self._general_cardinality_limit
