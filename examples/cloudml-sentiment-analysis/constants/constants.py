# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Contains constants used across files."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function


# Data constants.
SUBDIR_POSITIVE = 'pos'
SUBDIR_NEGATIVE = 'neg'
SUBDIR_TRAIN = 'TRAIN'
SUBDIR_VAL = 'VAL'
FILE_EXTENSION = '.txt'
TFRECORD = '.tfrecord'

# Name of the features that are created in the TF input function and served to
# the model function.
TOKENS = 'tokens'  # Sentence tokens.
LABELS = 'labels'  # Labels of each review.
REVIEW = 'review'  # Raw review.
SEQUENCE_LENGTH = 'sequence_length'  # Length of the tokens sequence.

# Data processing constants.
POSITIVE_SENTIMENT_LABEL = 1
NEGATIVE_SENTIMENT_LABEL = 0
