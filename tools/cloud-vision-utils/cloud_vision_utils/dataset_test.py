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

"""Test dataset.py."""

import csv
import os
import tempfile
import unittest

import mock
import testfixtures

from cloud_vision_utils import annotation
from cloud_vision_utils import dataset


class GenCsvFromImagesTest(unittest.TestCase):

  NUM_IMAGES = 3

  def setUp(self):
    super().setUp()
    self.test_images = [
        'test{}.jpg'.format(i) for i in range(self.NUM_IMAGES)
    ]
    self.test_labels = [
        'label{}'.format(i) for i in range(self.NUM_IMAGES)
    ]

  def _test_helper(self, *args, **kwargs):
    with testfixtures.TempDirectory() as d:
      for image, label in zip(self.test_images, self.test_labels):
        d.write(os.path.join(label, image), b'any')

      f = tempfile.NamedTemporaryFile(mode='r+t', suffix='.csv')
      dataset.gen_csv_from_images(d.path, f.name, *args, **kwargs)
      f.seek(0)
      reader = csv.reader(f)
      return reader

  def test_add_label_false(self):
    result = self._test_helper(add_label=False)
    labels = [row[2] for row in result]
    exp_labels = ['']*self.NUM_IMAGES
    self.assertCountEqual(labels, exp_labels)

  def test_add_label_true(self):
    result = self._test_helper(add_label=True)
    labels = [row[2] for row in result]
    self.assertCountEqual(labels, self.test_labels)

  def test_input_dir_does_not_exist(self):
    test_dir = '/path/to/non/existent/dir'
    test_csv = 'test.csv'
    dataset.gen_csv_from_images(test_dir, test_csv)
    self.assertFalse(os.path.isfile(test_csv))

  def test_dataset_type(self):
    dataset_type = 'sometype'
    result = self._test_helper(dataset_type=dataset_type)
    dataset_types = [row[0] for row in result]
    self.assertCountEqual(dataset_types, [dataset_type]*self.NUM_IMAGES)

  def test_out_path_prefix(self):
    # Check that the out_path_prefix is present in output CSV
    out_path_prefix = 'gs://path/to/images'
    result = self._test_helper(out_path_prefix=out_path_prefix)
    for row in result:
      self.assertIn(out_path_prefix, row[1])


class GenCsvFromAnnotationsTest(unittest.TestCase):

  NUM_FILES = 3
  NUM_BOUNDING_BOXES = 2
  NUM_CSV_ROWS = NUM_FILES * NUM_BOUNDING_BOXES

  def setUp(self):
    super().setUp()
    self.files = ['test{}.jpg'.format(i) for i in range(self.NUM_FILES)]
    self.bounding_box = annotation.BoundingBox(0.1, 0.1, 0.2, 0.2, 'somelabel')

  def _test_helper(self, *args, **kwargs):
    with testfixtures.TempDirectory() as d:
      for f in self.files:
        d.write(f, b'any')

      f = tempfile.NamedTemporaryFile(mode='r+t', suffix='.csv')
      mock_ret_val = ('image.csv', [self.bounding_box]*self.NUM_BOUNDING_BOXES)
      with mock.patch.object(
          annotation, 'read', return_value=mock_ret_val):
        dataset.gen_csv_from_annotations(d.path, f.name, *args, **kwargs)
        f.seek(0)
        reader = csv.reader(f)
      return reader

  def test_default(self):
    result = self._test_helper()
    num_rows = 0
    for row in result:
      self.assertEqual(len(row), 11)
      num_rows += 1

    self.assertEqual(num_rows, self.NUM_CSV_ROWS)

  def test_out_path_prefix(self):
    out_path_prefix = '/path/to/image/dir'
    result = self._test_helper(out_path_prefix=out_path_prefix)
    for row in result:
      self.assertIn(out_path_prefix, row[1])

  def test_input_dir_does_not_exist(self):
    test_dir = '/path/to/non/existent/dir'
    test_csv = 'test.csv'
    with self.assertRaises(ValueError):
      dataset.gen_csv_from_annotations(test_dir, test_csv)
    self.assertFalse(os.path.isfile(test_csv))

  def test_dataset_type(self):
    dataset_type = 'sometype'
    result = self._test_helper(dataset_type=dataset_type)
    dataset_types = [row[0] for row in result]
    self.assertCountEqual(dataset_types, [dataset_type]*self.NUM_CSV_ROWS)


if __name__ == '__main__':
  unittest.main()
