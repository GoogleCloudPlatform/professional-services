# Copyright 2019 Google LLC.
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


"""Bootstrap module launching the extraction of the ML datasets from BigQuery.

Example use:

    Authenticating to the BigQuery API with the default GCP user
        python -m ml_dataprep.runner \
            --source_project=bigquery-public-data \
	        --source_dataset=census_bureau_international \
	        --source_table=age_specific_fertility_rates \
            --destination_project=my_ml_project_id \
            --destination_dataset=my_ml_bq_dataset \
            --destination_gcs_path=gs://my_ml_datasets_bucket \
            --split_ratio=0.75

    Authenticating to the BigQuery API with a service account
        python -m ml_dataprep.runner \
            --key_file=$HOME/keys/analytics_project_id-1234567890ec.json
            --source_project=bigquery-public-data \
	        --source_dataset=census_bureau_international \
	        --source_table=age_specific_fertility_rates \
            --destination_project=my_ml_project_id \
            --destination_dataset=my_ml_bq_dataset \
            --destination_gcs_path=gs://my_ml_datasets_bucket \
            --split_ratio=0.75

    Using parameters to dynamically create column names at runtime
        python -m ml_dataprep.runner \
            --key_file=$HOME/keys/analytics_project_id-1234567890ec.json
            --parameters 15_19 20_24 25_29 30_34 35_39 40_44 45_49 \
            --source_project=bigquery-public-data \
	        --source_dataset=census_bureau_international \
	        --source_table=age_specific_fertility_rates \
            --destination_project=my_ml_project_id \
            --destination_dataset=my_ml_bq_dataset \
            --destination_gcs_path=gs://my_ml_datasets_bucket \
            --split_ratio=0.8
"""

from __future__ import absolute_import
from __future__ import print_function

import argparse
import logging
from ml_dataprep import config
from ml_dataprep import dataprep

def initialise_parameters(args_parser):
    """Initialize the data extraction parameters.

    Define the arguments with the default values, parses the arguments
    passed to the main program and set the PARAMETERS global variable.

    Args:
        args_parser
    """
    args_parser.add_argument(
        '--key_file',
        help='Key file of the service account used to authenticate to the BigQuery API.',
        default=None
    )
    args_parser.add_argument(
        '--parameters',
        help='Columns parameters that should be replaced in the names.',
        nargs='*',
        default=None
    )
    args_parser.add_argument(
        '--source_project',
        help='GCP project from where to extract the data.',
        required=True
    )
    args_parser.add_argument(
        '--source_dataset',
        help='BigQuery dataset from where to extract the data.',
        required=True
    )
    args_parser.add_argument(
        '--source_table',
        help='BigQuery table from where to extract the data.',
        required=True
    )
    args_parser.add_argument(
        '--destination_project',
        help='GCP project where to save the intermediary data.',
        required=True
    )
    args_parser.add_argument(
        '--destination_dataset',
        help='BigQuery dataset where to save the intermediary data.',
        required=True
    )
    args_parser.add_argument(
        '--destination_gcs_path',
        help='Google Cloud Storage where to export the training and validation data in CSV format.',
        required=True
    )
    args_parser.add_argument(
        '--split_ratio',
        help='Split ratio for the train/validation split.',
        required=False,
        default=0.75,
        type=float
    )
    return args_parser.parse_args()

def main():
    """Create training and validation datasets."""
    logging.basicConfig(format='%(asctime)-15s:%(levelname)s:%(module)s:%(message)s',
                        level=logging.INFO)
    args_parser = argparse.ArgumentParser()
    config_params = initialise_parameters(args_parser)
    config_params.all_columns = {
        'feature_columns': config.COLUMNS,
        'target_columns_shuffle': config.TARGET_COLUMNS_SHUFFLE,
        'target_columns_export': config.TARGET_COLUMNS_EXPORT
    }
    logging.info('Parameters:')
    logging.info(config_params)
    data_preparator = dataprep.DataPreparator(config_params)
    data_preparator.extract_all_ml_datasets()


if __name__ == '__main__':
    main()
