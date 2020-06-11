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

# pylint: disable=g-bad-import-order

"""Utilities for image dataset generation."""

import csv
import os

from tensorflow.io import gfile

from cloud_vision_utils import annotation
from cloud_vision_utils import constants


def basename(path):
  return os.path.basename(os.path.normpath(path))


def gen_csv_from_images(
    input_dir: str,
    output_file=constants.DEFAULT_CSV_FILENAME,
    add_label=False,
    out_path_prefix='',
    dataset_type=constants.DEFAULT_DATASET_TYPE):
  """Generate AutoML dataset CSV from directory of images.

  Args:
    input_dir: Directory of images.
    output_file: Output CSV filename.
    add_label: Whether to include image label based on
      last directory on the image's filepath.
    out_path_prefix: Output path prefix to prepend to each filename.
      (e.g. gs://path/to/the/imagedir)
    dataset_type: AutoML dataset type (TRAIN, VALIDATE, TEST, UNSPECIFIED)
      to use for all the parsed images.
  """

  get_label = basename if add_label else lambda _: ''

  with gfile.GFile(os.path.expanduser(output_file), 'w') as f:
    writer = csv.writer(f, delimiter=',')
    for topdir, _, files in gfile.walk(os.path.expanduser(input_dir)):
      for f in files:
        if out_path_prefix:
          filepath = os.path.join(out_path_prefix, f)
        else:
          filepath = os.path.join(topdir, f)
        label = get_label(topdir)
        row = ([dataset_type, filepath, label] +
               ['']*constants.NUM_BOUNDING_BOX_FIELDS)
        writer.writerow(row)


def gen_csv_from_annotations(
    input_dir: str,
    output_file=constants.DEFAULT_CSV_FILENAME,
    out_path_prefix='',
    dataset_type=constants.DEFAULT_DATASET_TYPE):
  """Generates AutoML dataset CSV from annotation files.

  Args:
    input_dir: Directory of annotation files.
    output_file: Output CSV filename.
    out_path_prefix: Filepath prefix to prepend to the image files.
      e.g.
      src_image_filename = '/tmp/path/to/image.jpg'
      out_path_prefix = 'gs://bucket/images'
      output_image_filename = 'gs://bucket/images/image.jpg'
    dataset_type: Dataset type (TRAIN, VAL, TEST, UNSPECIFIED)
      to use for all the parsed images.
  """

  if not gfile.exists(input_dir):
    raise ValueError('Input directory not found.')

  with gfile.GFile(os.path.expanduser(output_file), 'w') as outf:
    writer = csv.writer(outf, delimiter=',')
    for filename in gfile.listdir(os.path.expanduser(input_dir)):
      filepath = os.path.join(input_dir, filename)
      image_filename, boxes = annotation.read(filepath)
      out_image_filename = os.path.join(out_path_prefix, image_filename)
      for b in boxes:
        row = [
            dataset_type,
            out_image_filename,
            b.label,
            b.xmin,
            b.ymin,
            '',
            '',
            b.xmax,
            b.ymax,
            '',
            '',
        ]
        writer.writerow(row)
