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

"""Abstract class holds the signature of functions that the concrete
  preprocessing engine should implement"""

from __future__ import absolute_import
from __future__ import print_function

from abc import ABCMeta, abstractmethod


class DataPreprocessor(metaclass=ABCMeta):
  """Meta class that holds the signature of functions that the concrete
  preprocessing engine should implement."""

  @abstractmethod
  def extract_anova_data(self, categorical_column,
                         numeric_column, sampling_rate):
    """Abstract method for data extraction of anova test"""

  @abstractmethod
  def extract_categorical_aggregation(self, categorical_columns, sampling_rate):
    """Abstract method for data extraction of categorical data aggregation"""

  @abstractmethod
  def extract_pearson_correlation_data(self, numerical_columns, sampling_rate):
    """Abstract method for data extraction of pearson correlation computation"""

  @abstractmethod
  def extract_numerical_descriptive_data(self, numerical_columns):
    """Abstract method for data extraction of descriptive analysis
    on numerical attributes"""

  @abstractmethod
  def extract_categorical_descriptive_data(self, categorical_columns):
    """Abstract method for data extraction of descriptive analysis
    on categorical attributes"""

  @abstractmethod
  def extract_numerical_histogram_data(self, numerical_column, num_bins):
    """Abstract method for data extraction of histogram"""

  @abstractmethod
  def extract_numerical_descrip_categorical_data(self,
                                                 categorical_column,
                                                 numeric_column):
    """Abstract method for data extraction of numerical descriptive
    against categorical attribute"""

  @abstractmethod
  def extract_value_counts_data(self, categorical_column, limit):
    """Abstract method for data extraction of categorical value counts"""
