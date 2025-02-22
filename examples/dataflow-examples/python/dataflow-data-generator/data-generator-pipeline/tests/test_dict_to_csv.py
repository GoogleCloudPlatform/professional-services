# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
import unittest

from data_generator.CsvUtil import dict_to_csv


class TestDictToCsv(unittest.TestCase):
    def test_dict_to_csv(self):
        test_dict = {
            "a": 0,
            "b": 1,
            "c": 2,
        }

        csv1 = dict_to_csv(test_dict, ['a', 'b', 'c'])
        self.assertEqual(csv1, '0,1,2')

        csv2 = dict_to_csv(test_dict, ['c', 'b', 'a'])
        self.assertEqual(csv2, '2,1,0')


if __name__ == '__main__':
    unittest.main()
