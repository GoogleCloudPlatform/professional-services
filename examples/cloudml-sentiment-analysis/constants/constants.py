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
