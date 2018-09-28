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
dataset_strip_trailing_newlines = True
TFRECORD = '.tfrecord'


# Preprocessing constants.
DATAFLOW_RUNNER = 'DataflowRunner'
DIRECT_RUNNER = 'DirectRunner'

# Name of the features that are created in the TF input function and served to
# the model function.
TOKENS = 'tokens'  # Sentence tokens.
LABELS = 'labels'  # Labels of each review.
REVIEW = 'review'  # Raw review.
SEQUENCE_LENGTH = 'sequence_length'  # Length of the tokens sequence.

# Data processing constants.
BUCKET_MIN_BOUNDARY = 100
BUCKET_MAX_BOUNDARY = 500
BUCKET_LENGTH_STEP = 100
CHAR_TO_FILTER_OUT = r'[!"#$%&()*+,-./:;<=>?@[\]^_`{|}~]'
SHUFFLE_BUFFER_SIZE = 100
POSITIVE_SENTIMENT_LABEL = 1
NEGATIVE_SENTIMENT_LABEL = 0
labels_values = {
    SUBDIR_POSITIVE: POSITIVE_SENTIMENT_LABEL,
    SUBDIR_NEGATIVE: NEGATIVE_SENTIMENT_LABEL
}

# Model training constants.
RNN_CELL_TYPE = 'lstm'
INPUT_SHUFFLING_SEED = 1
EXPORTER_NAME = 'exporter'

# Model scoring constants.
INSTANCE_KEY = 'inputs'
SCORES_KEY = 'scores'
CLASSES_KEY = 'classes'
CONTINUOUS_TYPE = 'continuous_input'
CATEGORICAL_TYPE = 'categorical_input'
METRICS = {CATEGORICAL_TYPE: ['accuracy_score', 'precision_score',
                              'recall_score'],
           CONTINUOUS_TYPE: ['log_loss', 'roc_auc_score']}
ACCURACY_THRESHOLD = 0.5
