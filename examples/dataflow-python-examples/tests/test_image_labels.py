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

from dataflow_python_examples.image_labels import detect_labels_uri


class TestDataGenerator(unittest.TestCase):
    """The test cases are focused on the business logic.  In this case this is how we parse the
    schemas, generate data and label images.

    Execution Note:
        This script is stored in professional-services/data-analytics/dataflow-python-examples/tests
        but should be copied to professional-services/data-analytics/dataflow-python-examples/ and
        run from there.
    """
    def setUp(self):
        logging.basicConfig(level=logging.DEBUG)

    # It is best practice to have unit tests for the business logic in your pipeline.
    # This pipeline is so simple that this unit test is trivial.
    def test_detect_labels_uri_return(self):
        # Check behavior for an empty list.
        label_list = []
        out = ', '.join(label_list)
        self.assertEqual(out, '')

        # Check behavior for a list with a single element.
        label_list = ['dog']
        out = ', '.join(label_list)
        self.assertEqual(out, 'dog')

        # Check behavior for a list with a single element.
        label_list = ['dog', 'german sheppard']
        out = ', '.join(label_list)
        self.assertEqual(out, 'dog, german sheppard')


if __name__ == '__main__':
    unittest.main()
