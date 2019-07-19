# python3

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

"""Test annotation.py."""

import os
import unittest

from cloud_vision_utils import annotation


TEST_XML = os.path.join(os.path.dirname(__file__), 'test_data.xml')


class TestAnnotation(unittest.TestCase):

  def setUp(self):
    super().setUp()
    self.filename = TEST_XML

  def test_read_from_pascal(self):
    """Test reading of bounding boxes from PASCAL VOC XML file."""

    boxes = list(annotation.read(self.filename))
    self.assertEqual(len(boxes), 2)

    width = 400
    height = 300
    b = boxes[0]
    self.assertEqual(b.xmin, 10 / width)
    self.assertEqual(b.ymin, 20 / height)
    self.assertEqual(b.xmax, 30 / width)
    self.assertEqual(b.ymax, 40 / height)


if __name__ == '__main__':
  unittest.main()
