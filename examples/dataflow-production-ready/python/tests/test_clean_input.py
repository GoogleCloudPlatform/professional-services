#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

import logging
import unittest

from ml_preproc.pipeline.features.clean_input import _map_abbreviations

class CleanInputTest(unittest.TestCase):

  def test_map_abbreviations(self):
    abbreviations = {'str': 'street', 'str.': 'street', 'rd': 'road'}
    result = _map_abbreviations("Main str. 8", abbreviations)
    expected = "Main street 8"
    self.assertEqual(result, expected)


if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  unittest.main()
