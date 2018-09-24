from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import posixpath

from utils.datasettype import DatasetType

NUM_FEATURES_IN_DATASET = 28
FEATURE_COLUMNS = (
    ['V' + str(i) for i in range(1, NUM_FEATURES_IN_DATASET + 1)
    ] + ['Time', 'Amount'])
LABEL_COLUMN = 'Class'
KEY_COLUMN = 'key'
BQ_DATASET = 'fraud_detection'

PATH_TRANSFORMED_DATA = 'transformed_data'
PATH_TRANSFORMED_DATA_SPLIT = {
    k: posixpath.join(PATH_TRANSFORMED_DATA, k.name) for k in DatasetType
}
PATH_INPUT_TRANSFORMATION = 'input_transformation'
PATH_INPUT_SCHEMA = 'input_schema'
