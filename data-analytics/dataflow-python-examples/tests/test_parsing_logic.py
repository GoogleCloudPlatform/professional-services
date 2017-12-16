# Copyright 2017 Google Inc.
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

import mock


class TestHandlers(unittest.TestCase):
    def setUp(self):
        logging.basicConfig(level=logging.DEBUG)

    def test_parsing(self):
        """Dummy test for travis CI testing."""

        self.assertEquals(200, 200)

if __name__ == '__main__':
    unittest.main()

