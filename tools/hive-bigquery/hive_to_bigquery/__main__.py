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
"""Main Module to migrate Hive tables to BigQuery."""

import logging

from google.api_core import exceptions

from hive_to_bigquery.bigquery_component import BigQueryComponent
from hive_to_bigquery.bigquery_table import BigQueryTable
from hive_to_bigquery import custom_exceptions
from hive_to_bigquery.gcs_storage_component import GCSStorageComponent
from hive_to_bigquery.hive_component import HiveComponent
from hive_to_bigquery.hive_table import HiveTable
from hive_to_bigquery import kms_component
from hive_to_bigquery.mysql_component import MySQLComponent
from hive_to_bigquery.properties_reader import PropertiesReader
from hive_to_bigquery.resource_validator import ResourceValidator
from hive_to_bigquery import init_script

logger = logging.getLogger('Hive2BigQuery')


def compare_row_counts(bq_component, hive_component, gcs_component,
                       hive_table_model, bq_table_model):
    """Compares the number of rows in Hive and BigQuery tables.

     Once all the load jobs are finished, queries on the Hive and BigQuery
     tables and compares the number of rows. If matches, calls the function
     to write comparison metrics to BigQuery. If there is a mismatch in case
     of a partition table, compares the number of rows in every partition and
     gets information about the mismatched partitions.

     Args:
        bq_component (:class:`BigQueryComponent`): Instance of
            BigQueryComponent to do BigQuery operations.
        hive_component (:class:`HiveComponent`): Instance of HiveComponent to
            connect to Hive.
        gcs_component (:class:`GCSStorageComponent`): Instance of
            GCSStorageComponent to do GCS operations.
        hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
            details.
        bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
            table details.
    """

    logger.info("Comparing rows...")
    hive_table_rows = hive_component.get_hive_table_row_count(hive_table_model)
    bq_table_rows = bq_component.get_bq_table_row_count(bq_table_model)
    logger.debug("BigQuery row count %s Hive table row count %s",
                 bq_table_rows, hive_table_rows)

    if hive_table_rows == bq_table_rows:
        logger.info("Number of rows matching in BigQuery and Hive tables")
        if PropertiesReader.get('create_validation_table'):
            bq_component.write_metrics_to_bigquery(gcs_component,
                                                   hive_table_model,
                                                   bq_table_model)

    else:
        logger.error("Number of rows not matching in BigQuery and Hive tables")
        # If table is partitioned, compares rows in each partition and
        # provide suggestions whether to redo that partition.
        if hive_table_model.is_partitioned:
            partition_data = hive_component.list_partitions(
                hive_table_model.db_name, hive_table_model.table_name)
            for data in partition_data:
                clause = data['clause']
                bq_table_rows = bq_component.get_bq_table_row_count(
                    bq_table_model, clause)
                hive_table_rows = hive_component.get_hive_table_row_count(
                    hive_table_model, clause)
                logger.debug("BigQuery row count %s Hive table row count %s",
                             bq_table_rows, hive_table_rows)

                if bq_table_rows == hive_table_rows:
                    logger.debug(
                        "Number of rows matching in BigQuery and Hive tables %s",
                        clause)
                else:
                    logger.error(
                        "Number of rows not matching in BigQuery and Hive "
                        "tables {}".format(clause))
                    logger.error(
                        "You may want to delete data {} and reload it".format(
                            clause))
        else:
            logger.error(
                "You may want to redo the migration since number of rows are "
                "not matching")


def rollback(mysql_component, hive_table_model):
    """In case of encountering an error just after creating tracking table,
    drops the tracking table.

    Args:
        mysql_component (:class:`MySQLComponent`): Instance of MySQLComponent
            to connect to MySQL.
        hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
            details.
    """

    logger.info("Rolling back...")
    mysql_component.drop_table_if_empty(hive_table_model.tracking_table_name)
    logger.info("Rollback success")


def initialize_components():
    # Initializes the components to connect to MySQL, GCS, BigQuery and Hive.
    gcs_component = GCSStorageComponent(PropertiesReader.get('project_id'))

    encrypted_password = gcs_component.download_file_as_string(
        PropertiesReader.get('tracking_db_password_path'))
    decrypted_password = kms_component.decrypt_symmetric(
        PropertiesReader.get('project_id'),
        PropertiesReader.get('location_id'),
        PropertiesReader.get('key_ring_id'),
        PropertiesReader.get('crypto_key_id'), encrypted_password)

    mysql_component = MySQLComponent(
        host=PropertiesReader.get('tracking_database_host'),
        port=PropertiesReader.get('tracking_database_port'),
        user=PropertiesReader.get('tracking_database_user'),
        password=decrypted_password,
        database=PropertiesReader.get('tracking_database_db_name'))

    bq_component = BigQueryComponent(PropertiesReader.get('project_id'))
    hive_component = HiveComponent(
        host=PropertiesReader.get('hive_server_host'),
        port=PropertiesReader.get('hive_server_port'),
        user=PropertiesReader.get('hive_server_username'),
        password=None,
        database=None)

    return gcs_component, mysql_component, bq_component, hive_component


def main():
    """Migrates Hive tables to BigQuery.

    Establishes connection to Hive, MySQL, GCS and BigQuery. Validates the
    user arguments and continues migration from the previous runs, if any.
    """

    try:
        input_config = init_script.initialize_variables()
    except custom_exceptions.ArgumentInitializationError as error:
        raise RuntimeError from error

    logger.debug("Initializing Properties Reader")
    PropertiesReader(input_config)

    try:
        gcs_component, mysql_component, bq_component, hive_component = \
            initialize_components()
    except custom_exceptions.ConnectionError as error:
        raise RuntimeError from error

    try:
        mysql_component.check_table_exists(
            PropertiesReader.get('tracking_metatable_name'))
    except (exceptions.NotFound,
            custom_exceptions.MySQLExecutionError) as error:
        raise RuntimeError from error

    try:
        # Validates the user provided resources.
        logger.debug("Validating the resources")
        if ResourceValidator.validate(hive_component, gcs_component,
                                      bq_component):
            logger.debug("All the provided resources are valid")
        else:
            logger.error("Check the provided resources")
            logger.info("Check the log file for detailed errors")
            raise RuntimeError
    except custom_exceptions.CustomBaseError as error:
        raise RuntimeError from error

    try:
        hive_table_object = HiveTable(hive_component,
                                      PropertiesReader.get('hive_database'),
                                      PropertiesReader.get('hive_table_name'),
                                      PropertiesReader.get('incremental_col'))
    except custom_exceptions.HiveExecutionError as error:
        raise RuntimeError from error

    # Wrapper to describe Hive table resource.
    hive_table_model = hive_table_object.hive_table_model
    logger.debug(hive_table_model)

    bq_table_object = BigQueryTable(PropertiesReader.get('dataset_id'),
                                    PropertiesReader.get('bq_table'),
                                    hive_table_model)
    # Wrapper to describe BigQuery table resource.
    bq_table_model = bq_table_object.bq_table_model
    logger.debug(bq_table_model)

    try:
        # Verifies whether the tracking table exists from the previous run.
        mysql_component.check_tracking_table_exists(hive_table_model)
    except custom_exceptions.MySQLExecutionError as error:
        raise RuntimeError from error

    try:
        # Validates the bq_table_write_mode provided by the user.
        bq_component.check_bq_write_mode(mysql_component, hive_table_model,
                                         bq_table_model)
    except (custom_exceptions.CustomBaseError, exceptions.NotFound,
            exceptions.AlreadyExists) as error:
        raise RuntimeError from error

    # If the value of is_first_run is True, it means that the source Hive
    # table is being migrated for the first time.
    if hive_table_model.is_first_run:
        logger.debug("Migrating for the first time")
        try:
            # Gets information on data to migrate and creates tracking table
            # in Cloud SQL.
            tracking_data = hive_component.get_info_on_data_to_migrate(
                hive_table_model)
        except (custom_exceptions.IncrementalColumnError,
                custom_exceptions.HiveExecutionError) as error:
            raise RuntimeError from error

        try:
            mysql_component.create_tracking_table(hive_table_model)
        except custom_exceptions.MySQLExecutionError as error:
            raise RuntimeError from error

        try:
            # Migrates data to BigQuery.
            hive_component.migrate_data(
                mysql_component, bq_component, gcs_component,
                hive_table_model, bq_table_model,
                PropertiesReader.get('gcs_bucket_name'), tracking_data)
        except (custom_exceptions.HiveExecutionError,
                custom_exceptions.HDFSCommandError,
                custom_exceptions.MySQLExecutionError) as error:
            raise RuntimeError from error
        try:
            # Updates BigQuery job status and wait for all the jobs to finish.
            # mysql exec error
            bq_component.update_bq_job_status(
                mysql_component, gcs_component, hive_table_model,
                bq_table_model, PropertiesReader.get('gcs_bucket_name'))
        except custom_exceptions.MySQLExecutionError as error:
            raise RuntimeError from error

    else:
        logger.info(
            "Tracking table already exists. Continuing from the previous "
            "iteration...")
        try:
            # Copies the pending files from the previous run to GCS, loads them
            # to BigQuery and updates the BigQuery load job status.
            # mysqlexec
            gcs_component.stage_to_gcs(mysql_component, bq_component,
                                       hive_table_model, bq_table_model,
                                       PropertiesReader.get('gcs_bucket_name'))
            bq_component.load_gcs_to_bq(mysql_component, hive_table_model,
                                        bq_table_model)
            bq_component.update_bq_job_status(
                mysql_component, gcs_component, hive_table_model,
                bq_table_model, PropertiesReader.get('gcs_bucket_name'))
        except custom_exceptions.MySQLExecutionError as error:
            raise RuntimeError from error

    try:
        # Checks for new data in the Hive table.

        tracking_data = hive_component.check_inc_data(
            mysql_component, bq_component, gcs_component, hive_table_model,
            bq_table_model, PropertiesReader.get('gcs_bucket_name'))
    except (custom_exceptions.HiveExecutionError,
            custom_exceptions.MySQLExecutionError, TypeError) as error:
        raise RuntimeError from error

    if tracking_data:
        # Migrates data to BigQuery and updates job status in the tracking table.
        try:
            hive_component.migrate_data(
                mysql_component, bq_component, gcs_component,
                hive_table_model, bq_table_model,
                PropertiesReader.get('gcs_bucket_name'), tracking_data)
        except (custom_exceptions.HiveExecutionError,
                custom_exceptions.MySQLExecutionError) as error:
            raise RuntimeError from error
        try:
            bq_component.update_bq_job_status(
                mysql_component, gcs_component, hive_table_model,
                bq_table_model, PropertiesReader.get('gcs_bucket_name'))
        except custom_exceptions.MySQLExecutionError as error:
            raise RuntimeError from error
    try:
        # Compares the number of rows in BigQuery and Hive tables and
        # creates metrics table if there is a match.
        compare_row_counts(bq_component, hive_component, gcs_component,
                           hive_table_model, bq_table_model)
    except custom_exceptions.HiveExecutionError as error:
        raise RuntimeError from error


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as error:
        logger.exception(error)
        logger.info("Check the log file for detailed errors")
