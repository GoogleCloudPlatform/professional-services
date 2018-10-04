"""Contains utility functions."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import tensorflow as tf

from constants import constants


def get_processed_data_schema():
  return {
      constants.LABELS: tf.FixedLenFeature(shape=[], dtype=tf.int64),
      constants.REVIEW: tf.FixedLenFeature(shape=[], dtype=tf.string)
  }
