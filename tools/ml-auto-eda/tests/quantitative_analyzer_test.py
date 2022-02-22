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

"""Test cases for quantitative analyzer"""

from __future__ import absolute_import
from __future__ import print_function

from unittest import TestCase

import pandas as pd

from ml_eda import constants
from ml_eda.analysis import quantitative_analyzer


class TestCorrelator(TestCase):
  """Test cases for quantitative analysis"""

  _analyzer = quantitative_analyzer.QuantitativeAnalyzer()

  def test_anova_one_way(self):
    """Test case for ANOVA"""
    data = [
        ['1', 10, 11.203, 3.980025, 3, 36],
        ['2', 10, 8.938, 8.8804, 3, 36],
        ['3', 10, 10.683, 1.214404, 3, 36],
        ['4', 10, 8.838, 3.530641, 3, 36]
    ]
    anova_df = pd.DataFrame(data, columns=[
        constants.ANOVA_CATEGORICAL,
        constants.ANOVA_COUNT_PER_CLASS,
        constants.ANOVA_MEAN_PER_CLASS,
        constants.ANOVA_VARIANCE_PER_CLASS,
        constants.ANOVA_DF_GROUP,
        constants.ANOVA_DF_ERROR])
    f_stat = self._analyzer.anova_one_way(anova_df)
    assert abs(f_stat - 3.30444) < 0.00001
