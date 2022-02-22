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

"""Read bonding box annotations from a file."""

import xml.etree.ElementTree as ET

from tensorflow.io import gfile


class BoundingBox(object):
  """Bounding box coordinates."""

  def __init__(self, xmin: float, ymin: float, xmax: float, ymax: float,
               label: str):
    self.xmin = xmin
    self.ymin = ymin
    self.xmax = xmax
    self.ymax = ymax
    self.label = label


def _safe_divide(a: int, b: int):
  """Divides a and b as a/b if 0 < a <= b. Otherwise, raises ValueError.

  Args:
    a: Numerator.
    b: Denominator.

  Returns:
    Float of division result.
  """

  if a < 0:
    raise ValueError('a ({}) < 0'.format(a))
  elif a > b:
    raise ValueError('a ({}) > b ({})'.format(a, b))

  return a / b


def read(filename: str):
  """Reads bounding boxes from image annotation file.

  Auto-detects annotation format from file extension:
    .xml: PASCAL VOC

  Currently supports only PASCAL VOC format.

  Args:
    filename: Annotation file.

  Returns:
    Generator of `BoundingBox` objects.
  """

  if filename.endswith('.xml'):
    return read_from_pascal(filename)
  else:
    raise NotImplementedError('Only PASCAL VOC XML files supported for now.')


def read_from_pascal(filename: str):
  """Reads bounding boxes from PASCAL VOC XML file.

  Bounding box coordinates will be normalized based on parser image width
  and height.

  Args:
    filename: PASCAL VOC XML filename.

  Returns:
    (image filename, list of `BoundingBox` objects).
  """

  with gfile.GFile(filename) as f:
    tree = ET.parse(f)

  root = tree.getroot()
  image_filename = root.find('filename').text
  size = root.find('size')
  width = int(size.find('width').text)
  height = int(size.find('height').text)

  bounding_boxes = []
  for obj in root.iter('object'):
    # Expected one bounding box per object.
    b = obj.find('bndbox')
    if b:
      label = obj.find('name').text or ''
      bounding_box = BoundingBox(
          _safe_divide(int(b.find('xmin').text), width),
          _safe_divide(int(b.find('ymin').text), height),
          _safe_divide(int(b.find('xmax').text), width),
          _safe_divide(int(b.find('ymax').text), height),
          label,
      )
      bounding_boxes.append(bounding_box)
    else:
      raise AttributeError('Could not find "bndbox" element')

  return image_filename, bounding_boxes

