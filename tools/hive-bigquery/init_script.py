"""Parses arguments and writes the variables initialized to a config file"""

import argparse
import datetime
import getpass
import json
import logging


def arg_pars():
    """Argument Parser

    Returns:
        dict: dictionary of arguments
    """

    parser = argparse.ArgumentParser(
        description="Migrate Hive data to BigQuery")
    parser.add_argument(
        '--hive-server-host', required=False,
        default='localhost',
        help="Hive server IP address or hostname, defaults to localhost")
    parser.add_argument(
        '--hive-server-port', required=False,
        default=10000, type=int, help="Hive server port, defaults to 10000")
    parser.add_argument(
        '--hive-server-username', required=False,
        default=None, help="Hive username, defaults to None")
    parser.add_argument('--hive-database', required=True,
                        help="Hive database name")
    parser.add_argument('--hive-table', required=True, help="Hive table name")
    parser.add_argument('--project-id', required=True, help="GCP Project ID")
    parser.add_argument('--bq-dataset-id', required=True,
                        help="BigQuery dataset ID")
    parser.add_argument('--bq-table', required=False, default='',
                        help="BigQuery table name")
    parser.add_argument(
        '--bq-table-write-mode', required=True, default="create",
        choices=['overwrite', 'create', 'append'],
        help="BigQuery table write mode.\nUse overwrite to overwrite the "
             "previous runs of migration.\nUse create if you are migrating "
             "for the first time.\nUse append to append to the existing "
             "BigQuery table")
    parser.add_argument(
        '--gcs-bucket-name', required=True,
        help="Google Cloud Storage Bucket name. Provide either "
             "gs://BUCKET_NAME or BUCKET_NAME.")
    parser.add_argument(
        '--incremental-col', required=False,
        help="Optional.Provide the incremental column name if present in Hive "
             "table ")
    parser.add_argument(
        '--use-clustering', required=False,
        default="False", choices=["False", "True"],
        help="Boolean to indicate whether to use clustering in BigQuery if "
             "supported")
    parser.add_argument(
        '--tracking-database-host', required=True,
        help="Cloud SQL Tracking database host address")
    parser.add_argument(
        '--tracking-database-port', required=False,
        default=3306, help="Port to connect to tracking database")
    parser.add_argument(
        '--tracking-database-user', required=False,
        default='root', help="Cloud SQL Tracking database user name")
    parser.add_argument(
        '--tracking-database-db-name', required=True,
        help="Cloud SQL Tracking db name.Ensure you provide the same db name "
             "if you have migrated previously")

    return parser.parse_args()


def initialize_variables():
    """Initialize variables"""

    args = arg_pars()

    # Gets password from the user to coonect to Cloud SQL tracking database
    tracking_database_password = getpass.getpass(
        'Enter Cloud SQL tracking database password:')

    time_format = datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
    hive_bq_comparison_csv = args.hive_table + "_metrics_hive_bq_" + \
                             time_format + '.csv'
    hive_bq_comparison_table = args.hive_table + "_metrics_hive_bq_" + \
                               time_format
    log_file_name = args.hive_table + "_metrics_hive_bq_" + time_format + '.log'

    logger = logging.getLogger('Hive2BigQuery')
    logger.setLevel(logging.DEBUG)
    # Sets log formatter with time,log level,filename,line no and function
    # name which produced that log statement
    formatter = logging.Formatter(
        "[%(asctime)s - %(levelname)s - %(filename)25s:%(lineno)s - %("
        "funcName)20s() ] %(message)s")
    log_handler = logging.FileHandler(filename=log_file_name)
    log_handler.setLevel(logging.DEBUG)
    log_handler.setFormatter(formatter)
    # Adds the above defined handler
    logger.addHandler(log_handler)

    # BigQuery table name defaults to Hive table name if not provided
    if args.bq_table == '':
        args.bq_table = args.hive_table

    if args.gcs_bucket_name.startswith('gs://'):
        args.gcs_bucket_name = args.gcs_bucket_name.split('gs://')[1]
    if args.gcs_bucket_name[-1] == '/':
        args.gcs_bucket_name = args.gcs_bucket_name[:-1]

    configuration_properties = {
        "hive_server_host": args.hive_server_host,
        "hive_server_port": args.hive_server_port,
        "hive_server_username": args.hive_server_username,
        "hive_database": args.hive_database,
        "hive_table_name": args.hive_table.lower(),
        "project_id": args.project_id,
        "dataset_id": args.bq_dataset_id,
        "bq_table": args.bq_table,
        "bq_table_write_mode": args.bq_table_write_mode.lower(),
        "gcs_bucket_name": args.gcs_bucket_name,
        "incremental_col": args.incremental_col,
        "use_clustering": args.use_clustering,
        "tracking_database_host": args.tracking_database_host,
        "tracking_database_port": args.tracking_database_port,
        "tracking_database_user": args.tracking_database_user,
        "tracking_database_db_name": args.tracking_database_db_name,
        "tracking_database_password": tracking_database_password,
        "stage_table_name": args.hive_table.lower(),
        "time_format": time_format,
        "hive_bq_comparison_csv": hive_bq_comparison_csv,
        "hive_bq_comparison_table": hive_bq_comparison_table,
        "log_file_name": log_file_name
    }

    print "Check the log file %s for detailed logs" % log_file_name

    logger.debug("Configuration Properties")
    logger.debug(configuration_properties)

    # Writes application properties to a file
    with open('application.properties', 'w') as file_content:
        file_content.write(json.dumps(configuration_properties))
