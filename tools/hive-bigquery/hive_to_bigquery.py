import logging

from bigquery_component import BigQueryComponent
from bigquery_table import BigQueryTable
from gcs_storage_component import GCSStorageComponent
from hive_component import HiveComponent
from hive_table import HiveTable
from mysql_component import MySQLComponent
from properties_reader import PropertiesReader
from resource_validator import ResourceValidator
import init_script
from utilities import print_and_log

logger = logging.getLogger('Hive2BigQuery')


def compare_rows(bq_component, hive_component, gcs_component, hive_table_model,
                 bq_table_model):
    """Compares the number of rows in Hive and BigQuery tables

     Once all the load jobs are finished, queries on the Hive and BigQuery
     tables and compares the number of rows. If matches, calls the function
     to write comparison metrics to BigQuery. If there is a mismatch in case
     of a partition table, compares the number of rows in every partition and
     gets information about the mismatched partitions

     Args:
        bq_component (:class:`BigQueryComponent`): Instance of
            BigQueryComponent to do BigQuery operations
        hive_component (:class:`HiveComponent`): Instance of HiveComponent to
            connect to Hive
        gcs_component (:class:`GCSStorageComponent`): Instance of
            GCSStorageComponent to do GCS operations
        hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
            details
        bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
            table details
    """

    print_and_log("Comparing rows...")
    hive_table_rows = hive_component.get_hive_table_row_count(hive_table_model)
    bq_table_rows = bq_component.get_bq_table_row_count(bq_table_model)
    logger.debug("BigQuery row count %s Hive table row count %s" % (
        bq_table_rows, hive_table_rows))

    if hive_table_rows == bq_table_rows:
        print_and_log("Number of rows matching in BigQuery and Hive tables",
                      logging.INFO)
        bq_component.write_metrics_to_bigquery(hive_component, gcs_component,
                                               hive_table_model, bq_table_model)

    else:
        print_and_log("Number of rows not matching in BigQuery and Hive tables",
                      logging.INFO)
        # If table is partitioned, compares rows in each partition and
        # provide suggestions whether to redo that partition
        if hive_table_model.is_table_partitioned:
            partition_data = hive_component.list_partitions(
                hive_table_model.database_name, hive_table_model.table_name)
            for data in partition_data:
                clause = data['clause']
                bq_table_rows = bq_component.get_bq_table_row_count(
                    bq_table_model, clause)
                hive_table_rows = hive_component.get_hive_table_row_count(
                    hive_table_model, clause)
                logger.debug("BigQuery row count %s Hive table row count %s" % (
                    bq_table_rows, hive_table_rows))

                if bq_table_rows == hive_table_rows:
                    logger.debug(
                        "Number of rows matching in BigQuery and Hive tables "
                        "%s " % clause)
                else:
                    print_and_log(
                        "Number of rows not matching in BigQuery and Hive "
                        "tables %s " % clause,
                        logging.ERROR)
                    print_and_log(
                        "You may want to delete data %s and reload it" % clause,
                        logging.ERROR)
        else:
            print_and_log(
                "You may want to redo the migration since number of rows are "
                "not matching",
                logging.ERROR)


def rollback(mysql_component, hive_table_model):
    """In case of encountering an error just after creating tracking table,
    drops the tracking table

    Args:
        mysql_component (:class:`MySQLComponent`): Instance of MySQLComponent
        to connect to MySQL
        hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
            details
    """

    print_and_log("Rolling back...", logging.INFO)
    mysql_component.drop_table_if_empty(hive_table_model.tracking_table_name)
    print_and_log("Rollback success", logging.INFO)
    exit()


def main():
    try:
        init_script.initialize_variables()

        logger.debug("Initializing Properties Reader")
        PropertiesReader('application.properties')

        # Initializes the components to connect to MySQL, GCS, BigQuery and Hive
        mysql_component = MySQLComponent(
            PropertiesReader.get('tracking_database_ip'),
            PropertiesReader.get('tracking_database_user'),
            PropertiesReader.get('tracking_database_password'),
            PropertiesReader.get('tracking_database_db_name'),
            PropertiesReader.get('tracking_database_port'),
        )
        gcs_component = GCSStorageComponent(PropertiesReader.get('project_id'))
        bq_component = BigQueryComponent(PropertiesReader.get('project_id'))
        hive_component = HiveComponent(
            PropertiesReader.get('hive_server_host'),
            PropertiesReader.get('hive_server_port'),
            PropertiesReader.get('hive_server_username')
        )

        # Validates the user provided resources
        logger.debug("Validating the resources")
        if ResourceValidator.validate(hive_component, gcs_component,
                                      bq_component):
            logger.info("All the provided resources are valid")
            pass
        else:
            print_and_log("Check the provided resources", logging.CRITICAL)
            exit()

        hive_table_object = HiveTable(
            hive_component, PropertiesReader.get('hive_database'),
            PropertiesReader.get('hive_table_name'),
            PropertiesReader.get('incremental_col')
        )
        # Wrapper to describe Hive table resource
        hive_table_model = hive_table_object.hive_table_model
        logger.debug(hive_table_model)

        bq_table_object = BigQueryTable(PropertiesReader.get('dataset_id'),
                                        PropertiesReader.get('bq_table'),
                                        hive_table_model)
        # Wrapper to describe BigQuery table resource
        bq_table_model = bq_table_object.bq_table_model
        logger.debug(bq_table_model)

    except Exception as e:
        logger.critical(e)
        print_and_log("Check the log file for detailed errors",
                      logging.CRITICAL)
        exit()

    try:
        # Verifies whether the tracking table exists from the previous run
        mysql_component.verify_tracking_table(hive_table_model)
        # Validates the bq_table_write_mode provided by the user
        bq_component.check_bq_write_mode(mysql_component, hive_table_model,
                                         bq_table_model)

        # If the value of is_first_run is True, it means that the source Hive
        # table is being migrated for the first time
        if hive_table_model.is_first_run:

            # Gets information on data to migrate and creates tracking table
            # in Cloud SQL
            tracking_data = hive_component.get_info_on_data_to_migrate(
                hive_table_model)
            mysql_component.create_tracking_table(hive_table_model)

            # Migrates data to BigQuery
            hive_component.migrate_data(mysql_component, bq_component,
                                        gcs_component, hive_table_model,
                                        bq_table_model,
                                        PropertiesReader.get('gcs_bucket_name'),
                                        tracking_data)

            # Updates BigQuery job status and wait for all the jobs to finish
            bq_component.update_bq_job_status(mysql_component, gcs_component,
                                              hive_table_model, bq_table_model,
                                              PropertiesReader.get(
                                                  'gcs_bucket_name'))

        else:
            print_and_log(
                "Tracking table already exists. Continuing from the previous "
                "iteration...")

            # Copies the pending files from the previous run to GCS and
            # updates the BigQuery load job status
            gcs_component.stage_to_gcs(mysql_component, bq_component,
                                       hive_table_model, bq_table_model,
                                       PropertiesReader.get('gcs_bucket_name'))
            bq_component.update_bq_job_status(mysql_component, gcs_component,
                                              hive_table_model, bq_table_model,
                                              PropertiesReader.get(
                                                  'gcs_bucket_name'))

        # Checks for new data in the Hive table
        tracking_data = hive_component.check_for_new_data(
            mysql_component, bq_component, gcs_component, hive_table_model,
            bq_table_model, PropertiesReader.get('gcs_bucket_name'))

        if tracking_data:
            # Migrates data to BigQuery and updates job status in the tracking
            # table
            hive_component.migrate_data(mysql_component, bq_component,
                                        gcs_component, hive_table_model,
                                        bq_table_model,
                                        PropertiesReader.get('gcs_bucket_name'),
                                        tracking_data)
            bq_component.update_bq_job_status(mysql_component, gcs_component,
                                              hive_table_model, bq_table_model,
                                              PropertiesReader.get(
                                                  'gcs_bucket_name'))

        # Compares the number of rows in BigQuery and Hive tables and creates
        # metrics table if there is a match
        compare_rows(bq_component, hive_component, gcs_component,
                     hive_table_model, bq_table_model)

    except Exception as e:
        logger.critical(e)
        rollback(mysql_component, hive_table_model)


if __name__ == '__main__':
    main()
