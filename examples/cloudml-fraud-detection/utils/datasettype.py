from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from enum import Enum


class DatasetType(Enum):
  """Encodes integer values to differentiate train, validation, test sets."""
  UNSPECIFIED = 0
  TRAIN = 1
  VAL = 2
  TEST = 3
