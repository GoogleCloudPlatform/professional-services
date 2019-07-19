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
import tempfile
import unittest

import testfixtures

from cloud_vision_utils import dataset


class DatasetTest(unittest.TestCase):

  NUM_IMAGES = 3

  def setUp(self):
    super().setUp()
    self.test_images = ['test{}.jpg'.format(i) for i in range(self.NUM_IMAGES)]

  def test_gen_csv_from_images(self):
    with testfixtures.TempDirectory() as d:
      for t in self.test_images:
        d.write(t, b'any')

      f = tempfile.NamedTemporaryFile(mode='r+t', suffix='.csv')
      dataset.gen_csv_from_images(d.path, f.name)

      f.seek(0)
      reader = csv.reader(f, delimiter=',')
      csv_images = []
      for row in reader:
        csv_images.append(row[1])
      self.assertListEqual(sorted(csv_images), self.test_images)


if __name__ == '__main__':
  unittest.main()
