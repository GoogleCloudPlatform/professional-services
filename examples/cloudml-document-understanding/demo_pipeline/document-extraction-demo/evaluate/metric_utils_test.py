# Copyright 2016 The TensorFlow Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================
"""Tests for metric_utils."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import unittest

import metric_utils


class TestGeneralEquality(unittest.TestCase):

  def test_correct_usage(self):
    equality = metric_utils.GeneralEquality()

    extracted_values = [
      'This is a test',
      'This is a test.',
      'This is a test [].',
      '  This is a test.',
      ]

    true_value = 'This is a test'

    for _value in extracted_values:
      self.assertTrue(equality.is_equal(true_value, _value))

  def test_wrong_usage(self):
    equality = metric_utils.GeneralEquality()
    extracted_values = [
      'This is a wrong test',
      'This is a asd test.',
      'This is a te.st',
      'This is a test 1 . ']

    true_value = 'This is a test'

    for _value in extracted_values:
      self.assertFalse(equality.is_equal(true_value, _value))



class TestPostprocessClassification(unittest.TestCase):

  def test_correct_usage(self):
    postprocess = metric_utils.PostprocessClassification()

    extracted_values = [
      '21100', 
      '7104',
      '3117088',
      '00000',
      'A24F 47/00',
      ]

    expected_output = [
      '21/00',
      '7/04',
      '31/7088',
      '00000',
      'A24F 47/00']

    for i, _value in enumerate(extracted_values):
      self.assertEqual(postprocess.process(_value), expected_output[i])

if __name__ == '__main__':
  unittest.main()

