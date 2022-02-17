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

"""Class implements the functions in data_preprocessor with BigQuery"""

from __future__ import absolute_import
from __future__ import print_function

import sys
import logging
from typing import List, Text

import pandas as pd

from ml_eda.preprocessing.preprocessors.bigquery import bq_client
from ml_eda.preprocessing.preprocessors import data_preprocessor
from ml_eda.preprocessing.analysis_query import query_builder


class BqPreprocessor(data_preprocessor.DataPreprocessor):
  """Class implements the functions in data_preprocessor with BigQuery"""

  def __init__(self, config=None):
    self._bq_client = bq_client.BqClient(key_file=config.key_file)
    self._bq_table = config.bq_table

  def _extract_data(self, query: Text) -> pd.DataFrame:
    """Run query with BigQuery and return result as pandas.DataFrame

    Args:
        query: (string), query string

    Returns:
        pandas.DataFrame
    """
    try:
      result_df = self._bq_client.run_query(query).to_dataframe()
      logging.info(
          'Running query to extract required data')
      logging.debug(result_df)
    # pylint: disable-msg=bare-except
    except:
      # pylint: disable-msg=logging-not-lazy
      logging.error("Unexpected error: " + sys.exc_info()[0])
      result_df = pd.DataFrame()

    return result_df

  def extract_anova_data(
      self,
      categorical_column: Text,
      numeric_column: Text,
      sampling_rate: float = 1
  ) -> pd.DataFrame:
    """Extract ANOVA computation related data from BigQuery.

    Args:
        categorical_column: (string), name of categorical attribute
        numeric_column: (string), name of numerical attribute
        sampling_rate: (float), sampling rate

    Returns:
        pandas.DataFrame
    """
    query = query_builder.build_anova_query(
        table=self._bq_table,
        categorical_column=categorical_column,
        numeric_column=numeric_column,
        sampling_rate=sampling_rate)

    return self._extract_data(query)

  def extract_categorical_aggregation(
      self,
      categorical_columns: List[Text],
      sampling_rate: float = 1
  ) -> pd.DataFrame:
    """Run the query to perform aggregation over multiple categorical
    columns, and return the result as DataFrame.

    Args:
        categorical_columns: (List[string]), list of the names of
        the categorical columns
        sampling_rate: (float), sampling rate

    Returns:
        pandas.DataFrame
    """
    query = query_builder.build_categorical_aggregate_query(
        table=self._bq_table,
        categorical_columns=categorical_columns,
        sampling_rate=sampling_rate)

    return self._extract_data(query)

  def extract_pearson_correlation_data(
      self,
      numerical_columns: List[Text],
      sampling_rate: float = 1
  ) -> pd.DataFrame:
    """Run the query to perform correlation computation,
    and return the result as DataFrame

    Args:
        numerical_columns: (List[string]), list of the names of
        the numerical columns
        sampling_rate: (float), sampling rate

    Returns:
        pandas.DataFrame
    """
    query = query_builder.build_pearson_correlation_query(
        table=self._bq_table,
        numerical_columns=numerical_columns,
        sampling_rate=sampling_rate
    )

    return self._extract_data(query)

  def extract_numerical_descriptive_data(
      self,
      numerical_columns: List[Text]
  ) -> pd.DataFrame:
    """Run the query to perform descriptive analysis on numerical columns,
    and return the result as DataFrame

    Args:
        numerical_columns: (List[string]), list of the names of
        the numerical columns

    Returns:
        pandas.DataFrame
    """
    query = query_builder.build_numerical_descriptive_analysis_query(
        table=self._bq_table,
        numerical_columns=numerical_columns
    )

    return self._extract_data(query)

  def extract_numerical_descrip_categorical_data(
      self,
      categorical_column: Text,
      numeric_column: Text
  ) -> pd.DataFrame:
    """Run the query to perform descriptive analysis on numerical column
    for each group of data defined by distinct value of categorical column

    Args:
        categorical_column: (string), name of categorical column
        numeric_column: (string), name of numerical column

    Returns:
        pandas.DataFrame
    """
    query = \
      query_builder.build_numerical_descrip_categorical_analysis_query(
          table=self._bq_table,
          categorical_column=categorical_column,
          numerical_column=numeric_column
      )

    return self._extract_data(query)

  def extract_categorical_descriptive_data(
      self,
      categorical_columns: List[Text]
  ) -> pd.DataFrame:
    """Run the query to perform descriptive analysis on categorical columns,
    and return the result as DataFrame

    Args:
        categorical_columns: (List[string]), list of the names of
        the categorical columns

    Returns:
        pandas.DataFrame
    """
    query = query_builder.build_categorical_descriptive_analysis_query(
        table=self._bq_table,
        categorical_columns=categorical_columns
    )

    return self._extract_data(query)

  def extract_numerical_histogram_data(
      self,
      numerical_column: Text,
      num_bins: int
  ) -> pd.DataFrame:
    """Run the query to generate histogram for numerical column

    Args:
        numerical_column: (string), name of numerical column
        num_bins: (int), number of bins

    Returns:
        pandas.DataFrame
    """

    query = query_builder.build_numerical_histogram_query(
        table=self._bq_table,
        numerical_column=numerical_column,
        num_bins=num_bins
    )

    return self._extract_data(query)

  def extract_value_counts_data(
      self,
      categorical_column: Text,
      limit: int
  ) -> pd.DataFrame:
    """Run the query to compute value counts for categorical column

    Args:
        categorical_column: (string), name of categorical column
        limit: (int), return top occurrent value

    Returns:
        pandas.DataFrame
    """

    query = query_builder.build_value_counts_query(
        table=self._bq_table,
        categorical_column=categorical_column,
        limit=limit
    )

    return self._extract_data(query)
