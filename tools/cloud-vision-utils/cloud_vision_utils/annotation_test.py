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
import tempfile
import unittest
import xml.etree.ElementTree as ET

from cloud_vision_utils import annotation


TEST_XML = os.path.join(os.path.dirname(__file__), 'test_data.xml')


class ReadFromPascalTest(unittest.TestCase):

  def setUp(self):
    super().setUp()
    self.filename = TEST_XML
    self.root = ET.parse(self.filename).getroot()

  def _test_helper(self, exception=None):
    with tempfile.NamedTemporaryFile(suffix='.xml') as f:
      f.write(ET.tostring(self.root))
      f.seek(0)
      if exception:
        with self.assertRaises(exception):
          _ = annotation.read(f.name)
      else:
        image_filename, boxes = annotation.read(f.name)
        return image_filename, boxes

  def test_nominal_case(self):
    """Test successfully reading bounding boxes from PASCAL VOC XML file."""

    image_filename, boxes = list(annotation.read(self.filename))
    self.assertEqual(image_filename, 'image.jpg')
    self.assertEqual(len(boxes), 2)
    width = 400
    height = 300
    b = boxes[0]
    self.assertEqual(b.xmin, 10 / width)
    self.assertEqual(b.ymin, 20 / height)
    self.assertEqual(b.xmax, 30 / width)
    self.assertEqual(b.ymax, 40 / height)

  def test_error_missing_size(self):
    """Tests error case where `size` element is missing."""

    self.root.remove(self.root.find('size'))
    self._test_helper(AttributeError)

  def test_error_zero_width_height(self):
    """Tests error case where `width` or `height` is zero."""
    for name in ['width', 'height']:
      self.root.find('size').find(name).text = '0'
      self._test_helper(ValueError)

  def test_error_coordinates_too_large(self):
    """Tests error case where b'box coordinates greater than width & height."""

    for name in ['xmin', 'ymin', 'xmax', 'ymax']:
      self.root.find('object').find('bndbox').find(name).text = str(1000)
      self._test_helper(ValueError)

  def test_one_object_multi_bndbox(self):
    """Tests case where there's one object that has multi bndbox children.

    This won't result in an error, but the function will just ignore "bndbox"
    objects other than the first.
    """

    text_num = '123'
    obj = self.root.find('object')
    bndbox = obj.find('bndbox')
    bndbox.find('xmin').text = text_num
    obj.append(bndbox)
    _, boxes = self._test_helper()
    self.assertEqual(len(boxes), 2)
    self.assertNotEqual(boxes[0].xmin, int(text_num))


if __name__ == '__main__':
  unittest.main()
