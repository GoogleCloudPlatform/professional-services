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
"""Unit tests for the beam pipeline."""

from __future__ import absolute_import

import unittest

import apache_beam as beam
from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.util import assert_that
from apache_beam.testing.util import equal_to

from constants import constants
from preprocessing import preprocess


class TestPreprocess(unittest.TestCase):
  """Tests beam pipeline functions."""

  def test_handle_null_user_tags(self):
    """Tests the _handle_null_user_tags function."""
    source = [
        {constants.USER_TAGS_KEY: []},
        {constants.USER_TAGS_KEY: [1] * constants.USER_TAGS_LENGTH},
    ]
    target = [
        {constants.USER_TAGS_KEY: [0] * constants.USER_TAGS_LENGTH},
        {constants.USER_TAGS_KEY: [1] * constants.USER_TAGS_LENGTH},
    ]

    with TestPipeline() as p:
      features = (p
                  | "CreateStubs" >> beam.Create(source)
                  | "HandleNullUserTags" >> beam.Map(
                      preprocess._handle_null_user_tags))
      assert_that(features, equal_to(target))

  def test_normalize_user_tags(self):
    """Tests the _normalize_user_tags function."""
    n_tags = constants.USER_TAGS_LENGTH
    source = [
        {constants.USER_TAGS_KEY: [0] * n_tags},
        {constants.USER_TAGS_KEY: [1] * n_tags},
    ]
    target = [
        {constants.USER_TAGS_KEY: [0] * n_tags},
        {constants.USER_TAGS_KEY: [n_tags**-1] * n_tags},
    ]

    with TestPipeline() as p:
      features = (p
                  | "CreateStubs" >> beam.Create(source)
                  | "NormalizeUserTags" >> beam.Map(
                      preprocess._normalize_user_tags))
      assert_that(features, equal_to(target))


if __name__ == "__main__":
  unittest.main()
