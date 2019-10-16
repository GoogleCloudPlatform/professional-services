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

"""Holds the main logics of descriptive analysis."""

from __future__ import absolute_import
from __future__ import print_function

import pandas as pd
from typing import Dict

from ml_eda import constants


class DescriptiveAnalyzer:

    def numerical_descriptive(self, ds_df: pd.DataFrame) -> Dict:
        """The entire descriptive analysis is done in BQ, therefore, only
        DataFrame to dict conversion is done here

        Args:
            ds_df: (pd.DataFrame), the computed descriptive result from
            bigquery.

        Returns:
            dict
        """
        return ds_df.set_index(constants.ND_COLUMN_NAME).T.to_dict()

    def categorical_descriptive(self, ds_df: pd.DataFrame) -> Dict:
        """The entire descriptive analysis is done in BQ, therefore, only
        DataFrame to dict conversion is done here

        Args:
            ds_df: (pd.DataFrame), the computed descriptive result from
            bigquery.

        Returns:
            dict
        """
        return ds_df.set_index(constants.CD_COLUMN_NAME).T.to_dict()
