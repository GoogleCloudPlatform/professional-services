# Copyright 2019 Google Inc.
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
"""Reads the input configuration file, validates them and enables logging."""

import argparse
import datetime
import json
import logging
import re
from google.api_core import exceptions

from hive_to_bigquery import custom_exceptions

TIME_FORMAT = datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S_%f")
LOG_FILE_NAME = "hive_bq_migration_{}.log".format(TIME_FORMAT)


def configure_logger():
    """Configures logging properties such as logging level, filename and format."""

    logger = logging.getLogger('Hive2BigQuery')
    logger.setLevel(logging.DEBUG)
    # Sets log formatter with time,log level,filename,line no and function
    # name which produced that log statement.
    formatter = logging.Formatter(
        "[%(asctime)s - %(levelname)s - %(filename)25s:%(lineno)s - %("
        "funcName)20s() ] %(message)s")
    log_handler = logging.FileHandler(filename=LOG_FILE_NAME)
    log_handler.setLevel(logging.DEBUG)
    log_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    # create formatter and add it to the handlers
    formatter = logging.Formatter('%(asctime)s - %(message)s')
    console_handler.setFormatter(formatter)

    # Adds the above defined handlers.
    logger.addHandler(log_handler)
    logger.addHandler(console_handler)

    print("Check the log file {} for detailed logs".format(LOG_FILE_NAME))
    return logger


logger = configure_logger()


def parse_args_for_hive_to_bq():
    """Argument Parser.

    Returns:
        dict: dictionary of arguments.
    """

    parser = argparse.ArgumentParser(
        description="Framework to migrate Hive tables to BigQuery using "
        "Cloud SQL to keep track of the migration progress.")
    parser.add_argument('--config-file',
                        required=True,
                        help="Input configurations JSON file.")

    return parser.parse_args()


def validate_bq_table_name(table_name):
    """Validates provided BigQuery table name for maximum character limit and
    permitted characters."""

    max_characters = 1024
    patterns = '^[a-zA-Z0-9_]*$'
    error_msg = "Invalid table name {}. Table name must be alphanumeric" \
                "(plus underscores) and must be at most 1024 characters" \
                " long.".format(table_name)

    if len(table_name) > max_characters:
        raise exceptions.BadRequest(error_msg)

    if not re.search(patterns, table_name):
        raise exceptions.BadRequest(error_msg)


def validate_config_parameters(data):
    """Checks for all the parameters in the input configuration file and
    validates them."""

    tracking_metatable_name = "tracking_table_info"
    try:
        project_id = data['GCP']['project_id']
        gcs_bucket_name = data['GCP']['bucket']

        hive_host = data['Hive']['host']
        hive_port = data['Hive']['port']
        hive_user = data['Hive']['user']
        hive_database = data['Hive']['database']
        hive_table = data['Hive']['table']
        incremental_col = data['Hive']['incremental_col']

        bq_dataset = data['BigQuery']['dataset']
        bq_table = data['BigQuery']['table']
        use_clustering = data['BigQuery']['use_clustering']
        bq_write_mode = data['BigQuery']['write_mode']

        tracking_db_host = data['Tracking_DB']['host']
        tracking_db_port = data['Tracking_DB']['port']
        tracking_db_user = data['Tracking_DB']['user']
        tracking_db_name = data['Tracking_DB']['database']
        tracking_db_password_path = data['Tracking_DB']['password_file_path']

        kms_location = data['KMS']['location_id']
        kms_key_ring_id = data['KMS']['key_ring_id']
        kms_crypto_key_id = data['KMS']['crypto_key_id']

        create_validation_table = data['create_validation_table']

    except KeyError:
        raise

    hive_table = hive_table.lower()
    if bq_table is None:
        bq_table = hive_table

    validate_bq_table_name(bq_table)

    if not isinstance(hive_port, int):
        raise TypeError("Hive port must be an integer")

    if not isinstance(tracking_db_port, int):
        raise TypeError("Tracking database port must be an integer")

    if gcs_bucket_name.startswith('gs://'):
        gcs_bucket_name = gcs_bucket_name.split('gs://')[1]
    if gcs_bucket_name[-1] == '/':
        gcs_bucket_name = gcs_bucket_name[:-1]

    if not tracking_db_password_path.startswith('gs://'):
        raise ValueError(
            "Tracking database password path must start with gs://")

    bq_write_mode = bq_write_mode.lower()

    hive_bq_comparison_csv = "{}_metrics_hive_bq_{}.csv".format(
        hive_table, TIME_FORMAT)
    hive_bq_comparison_table = "{}_metrics_hive_bq_{}".format(
        hive_table, TIME_FORMAT)

    config = {
        "project_id": project_id,
        "gcs_bucket_name": gcs_bucket_name,
        "hive_server_host": hive_host,
        "hive_server_port": hive_port,
        "hive_server_username": hive_user,
        "hive_database": hive_database,
        "hive_table_name": hive_table,
        "incremental_col": incremental_col,
        "dataset_id": bq_dataset,
        "bq_table": bq_table,
        "bq_table_write_mode": bq_write_mode,
        "use_clustering": use_clustering,
        "tracking_database_host": tracking_db_host,
        "tracking_database_port": tracking_db_port,
        "tracking_database_user": tracking_db_user,
        "tracking_database_db_name": tracking_db_name,
        "tracking_db_password_path": tracking_db_password_path,
        "tracking_metatable_name": tracking_metatable_name,
        "location_id": kms_location,
        "key_ring_id": kms_key_ring_id,
        "crypto_key_id": kms_crypto_key_id,
        "create_validation_table": create_validation_table,
        "hive_bq_comparison_csv": hive_bq_comparison_csv,
        "hive_bq_comparison_table": hive_bq_comparison_table,
        "log_file_name": LOG_FILE_NAME
    }

    return config


def initialize_variables():
    """Initializes variables from the input configuration file.

    Returns:
        dict: A dictionary of validated input arguments.
    """

    args = parse_args_for_hive_to_bq()

    try:
        with open(args.config_file) as config_json:
            try:
                config = json.load(config_json)
            except ValueError:
                raise
        config = validate_config_parameters(config)
    except (exceptions.BadRequest, TypeError, ValueError, KeyError) as error:
        raise custom_exceptions.ArgumentInitializationError from error

    logger.debug(config)

    return config
