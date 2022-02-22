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
"""Module to handle BigQuery related utilities such as creating a client,
validating the existence of dataset & table, creating a table, starting a
load job, updating the status of a running load job etc."""

import csv
import logging
import os
import time
from uuid import uuid4

from google.api_core import exceptions
from google.auth import exceptions as auth_exceptions
from google.cloud import bigquery

from hive_to_bigquery import client_info
from hive_to_bigquery import custom_exceptions
from hive_to_bigquery.gcp_service import GCPService
from hive_to_bigquery.properties_reader import PropertiesReader

logger = logging.getLogger('Hive2BigQuery')


class BigQueryComponent(GCPService):
    """Creates BigQuery client and provides various utility functions.

    Has utilities which do BigQuery operations using the BigQuery client,
    such as creating table, retrieving dataset location, creating load job,
    fetch status of a running load job, create comparison metrics table once
    migrated successfully etc.

    Attributes:
        project_id (str): GCP Project ID.
        client (google.cloud.bigquery.client.Client): BigQuery client.

    """
    def __init__(self, project_id):

        logger.debug("Initializing BigQuery Component")
        super(BigQueryComponent, self).__init__(project_id, "BigQuery service")

    def get_client(self):
        """Creates BigQuery client.

        Returns:
            google.cloud.bigquery.client.Client: BigQuery client
        """

        logger.debug("Getting BigQuery client")
        try:
            info = client_info.get_http_client_info()
            client = bigquery.Client(project=self.project_id, client_info=info)
            return client
        except auth_exceptions.DefaultCredentialsError as error:
            raise custom_exceptions.ConnectionError from error

    def check_dataset_exists(self, dataset_id):
        """Checks whether the provided BigQuery dataset exists.

        Args:
            dataset_id (str): BigQuery dataset id.

        Returns:
            boolean: True if exists, False if doesn't exist.
        """

        dataset_ref = self.client.dataset(dataset_id)
        try:
            self.client.get_dataset(dataset_ref)
            return True
        except exceptions.NotFound as error:
            logger.exception(error)
            return False

    def check_bq_table_exists(self, dataset_id, table_name):
        """Checks whether the provided BigQuery table exists.

        Args:
            dataset_id (str): BigQuery dataset id.
            table_name (str): BigQuery table name.

        Returns:
            boolean: True if exists, False if doesn't exist.
        """

        table_ref = self.client.dataset(dataset_id).table(table_name)
        try:
            self.client.get_table(table_ref)
            return True
        except exceptions.NotFound:
            return False

    def get_dataset_location(self, dataset_id):
        """BigQuery dataset location.

        Args:
            dataset_id (str): BigQuery dataset id.

        Returns:
            str: Location of the dataset.
        """

        dataset_ref = self.client.dataset(dataset_id)
        return self.client.get_dataset(dataset_ref).location

    def create_table(self, dataset_id, table_name, schema):
        """Creates BigQuery table.

        Args:
            dataset_id (str): BigQuery dataset id.
            table_name (str): BigQuery table name.
            schema (List[google.cloud.bigquery.schema.SchemaField]): Schema
                of the table to be created.
        """

        dataset_ref = self.client.dataset(dataset_id)
        table_ref = dataset_ref.table(table_name)
        table = bigquery.Table(table_ref, schema)
        self.client.create_table(table)

    def delete_table(self, dataset_id, table_name):
        """Deletes BigQuery table.

        Args:
            dataset_id (str): BigQuery dataset id.
            table_name (str): BigQuery table name.
        """

        table_ref = self.client.dataset(dataset_id).table(table_name)
        try:
            self.client.delete_table(table_ref)
            logger.debug("Deleted table %s from %s dataset", table_name,
                         dataset_id)
        except exceptions.NotFound as error:
            logger.debug(error)
            logger.debug("Table %s not found in %s dataset. No need to delete",
                         table_name, dataset_id)

    def check_bq_write_mode(self, mysql_component, hive_table_model,
                            bq_table_model):
        """Validates the bq_table_write_mode provided by user.

        If the mode is overwrite, drops the tracking table and deletes the
        BigQuery table. If the mode is create, checks if the tracking table
        and BigQuery table exist. If the mode is append, checks whether the
        BigQuery table exists.

        Args:
            mysql_component (:class:`MySQLComponent`): Instance of
                MySQLComponent to connect to MySQL.
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.

        Returns:
            boolean: True if the write mode is okay to use, else False.
        """
        write_mode = PropertiesReader.get('bq_table_write_mode')
        if write_mode == "overwrite":
            logger.debug("Deleting tracking table and BigQuery table...")
            mysql_component.drop_table(hive_table_model.tracking_table_name)
            mysql_component.update_tracking_meta_table(hive_table_model,
                                                       "DELETE")
            self.delete_table(bq_table_model.dataset_id,
                              bq_table_model.table_name)
            hive_table_model.is_first_run = True

        elif write_mode == "create":
            if not hive_table_model.is_first_run:
                raise exceptions.AlreadyExists(
                    "Tracking Table {} already exist".format(
                        hive_table_model.tracking_table_name))
            if self.check_bq_table_exists(bq_table_model.dataset_id,
                                          bq_table_model.table_name):
                raise exceptions.AlreadyExists(
                    "BigQuery Table {} already exist in {} dataset".format(
                        bq_table_model.table_name, bq_table_model.dataset_id))

        else:
            if hive_table_model.is_first_run is False:
                query = "SELECT COUNT(*) FROM {} WHERE " \
                        "bq_job_status='RUNNING' OR " \
                        "bq_job_status='DONE'".format(
                            hive_table_model.tracking_table_name)
                results = mysql_component.execute_query(query)
                if results[0][0] != 0:
                    if not self.check_bq_table_exists(
                            bq_table_model.dataset_id,
                            bq_table_model.table_name):
                        raise exceptions.NotFound(
                            "Found the tracking table but BigQuery Table {} "
                            "doesn't exist in {} dataset. Clean up the "
                            "resources and try again".format(
                                bq_table_model.table_name,
                                bq_table_model.dataset_id))
            else:
                raise exceptions.NotFound(
                    "Tracking Table {} doesn't exist".format(
                        hive_table_model.tracking_table_name))

    def start_load_job(self, bq_table_model, source_uri, job_id):
        """Starts BigQuery load job asynchronously.

        Starts a load job with given job ID for loading data into BigQuery
        table from the given GCS URI.

        Args:
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.
            source_uri (str): URI of data file to be loaded.
            job_id (str): BigQuery job ID.
        """

        dataset_ref = self.client.dataset(bq_table_model.dataset_id)
        # Configures the load job.
        # job_config is of type: google.cloud.bigquery.job.LoadJobConfig
        job_config = bigquery.LoadJobConfig()

        if bq_table_model.is_partitioned:
            # Specifies time-based partitioning for the table.
            job_config.time_partitioning = bigquery.table.TimePartitioning(
                type_=bigquery.table.TimePartitioningType.DAY,
                field=bq_table_model.partition_column)
            if bq_table_model.is_clustered:
                # Fields defining clustering for the table.
                job_config.clustering_fields = bq_table_model.clustering_columns

        # Configures the file format of the data.
        if bq_table_model.data_format == "ORC":
            job_config.source_format = bigquery.SourceFormat.ORC
        elif bq_table_model.data_format == "Parquet":
            job_config.source_format = bigquery.SourceFormat.PARQUET
        else:
            job_config.source_format = bigquery.SourceFormat.AVRO
            job_config.use_avro_logical_types = True

        # Creates load job
        self.client.load_table_from_uri(source_uri,
                                        dataset_ref.table(
                                            bq_table_model.table_name),
                                        job_config=job_config,
                                        job_id=job_id)

    def get_bq_table_row_count(self, bq_table_model, clause=''):
        """Queries the migrated BigQuery table to get a count of rows.

        Args:
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.
            clause (str): where clause to filter the table on partitions, if any.

        Returns:
            int: Number of rows as an output from the query.
        """

        query = "SELECT COUNT(*) AS n_rows FROM {0}.{1} {2}".format(
            bq_table_model.dataset_id, bq_table_model.table_name, clause)
        query_job = self.client.query(query)
        results = query_job.result()
        for row in results:
            n_rows = row.n_rows
            return n_rows

    def load_gcs_to_bq(self, mysql_component, hive_table_model,
                       bq_table_model):
        """Loads data from GCS to BigQuery.

        Queries the tracking table and fetches information about the files
        that have been copied to GCS and are ready to be loaded into
        BigQuery, creates loading jobs and updates the job ID & job status in
        the tracking table.

        Args:
            mysql_component (:class:`MySQLComponent`): Instance of
                MySQLComponent to connect to MySQL.
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.
        """

        logger.info(
            "Fetching information about files to load to BigQuery from "
            "tracking table...")
        query = "SELECT gcs_file_path FROM {} WHERE gcs_copy_status='DONE' " \
                "AND bq_job_status='TODO'".format(
                    hive_table_model.tracking_table_name)
        results = mysql_component.execute_query(query)
        if not results:
            logger.info("No gcs files to load to BigQuery")

        for row in results:
            gcs_source_uri = row[0]
            bq_job_id = "hive2bq-job-{}".format(uuid4())
            # Starts the load job asynchronously.
            self.start_load_job(bq_table_model, gcs_source_uri, bq_job_id)
            # Updates the job status as RUNNING.
            query = "UPDATE {0} SET bq_job_id='{1}',bq_job_status='RUNNING' " \
                    "WHERE gcs_file_path='{2}'".format(
                        hive_table_model.tracking_table_name,
                        bq_job_id, gcs_source_uri)
            mysql_component.execute_transaction(query)
            logger.info(
                "Updated BigQuery load job ID {} status TODO --> RUNNING for "
                "file path {}".format(bq_job_id, gcs_source_uri))

    def update_bq_job_status(self, mysql_component, gcs_component,
                             hive_table_model, bq_table_model,
                             gcs_bucket_name):
        """Updates the status of running BigQuery load jobs.

        Queries the tracking table and fetches information about the load
        jobs that are 'RUNNING 'and polls the job status. If the job has
        finished successfully with no errors, updates the status as 'DONE'.
        In case of job completion with errors, it updates the status to
        'TODO' and increases the bq_job_retries count by 1. Waits for 1
        minute and polls the job status again, until all the load jobs finish.

        Args:
            mysql_component (:class:`MySQLComponent`): Instance of
                MySQLComponent to connect to MySQL.
            gcs_component (:class:`GCSStorageComponent`): Instance of
                GCSStorageComponent to do GCS operations.
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.
            gcs_bucket_name (str): GCS bucket name.
        """

        # Uodate this value to increase the maximum number of load job retries.
        bq_load_job_max_retries = 3
        logger.info(
            "Fetching information about BigQuery load jobs from tracking "
            "table...")
        query = "SELECT gcs_file_path,bq_job_id,bq_job_retries FROM {} WHERE " \
                "bq_job_status='RUNNING'".format(
                    hive_table_model.tracking_table_name)
        results = mysql_component.execute_query(query)
        if not results:
            logger.info(
                "No BigQuery job is in RUNNING state. No values to update")

        # Waits till all the load jobs finish.
        while results:
            count = 0
            for row in results:
                gcs_file_path, bq_job_id, bq_job_retries = row
                # Gets information about the running job.
                job = self.client.get_job(bq_job_id,
                                          location=self.get_dataset_location(
                                              bq_table_model.dataset_id))

                if job.state == 'DONE':
                    # Job finished successfully.
                    if job.errors is None:
                        query = "UPDATE {0} SET bq_job_status='DONE' WHERE " \
                                "bq_job_id='{1}'".format(
                                    hive_table_model.tracking_table_name,
                                    bq_job_id)
                        mysql_component.execute_transaction(query)
                        logger.info(
                            "Updated BigQuery load job {} status RUNNING --> "
                            "DONE".format(bq_job_id))
                        # Deletes the data file in GCS.
                        gcs_component.delete_file(gcs_bucket_name,
                                                  gcs_file_path)
                    # Job finished with error.
                    elif job.errors is not None:

                        if bq_job_retries == bq_load_job_max_retries:
                            query = "UPDATE {0} SET bq_job_status='FAILED' " \
                                    "WHERE bq_job_id='{1}'".format(
                                        hive_table_model.tracking_table_name,
                                        bq_job_id)
                            mysql_component.execute_transaction(query)
                            logger.info(
                                "BigQuery job {} failed.Tried for a maximum "
                                "of 3 times.Updated status RUNNING --> "
                                "FAILED".format(bq_job_id))
                        else:
                            query = "UPDATE {0} SET bq_job_status='TODO'," \
                                    "bq_job_retries={1} WHERE " \
                                    "bq_job_id='{2}'".format(
                                        hive_table_model.tracking_table_name,
                                        bq_job_retries + 1, bq_job_id)
                            mysql_component.execute_transaction(query)
                            logger.info(
                                "BigQuery job {} failed.Updated status "
                                "RUNNING --> TODO & increased retries count "
                                "by 1".format(bq_job_id))

                elif job.state == 'RUNNING':
                    # Count of jobs which are still in running state.
                    count += 1
                else:
                    logger.debug("job id %s job state %s", bq_job_id,
                                 job.state)
            if count == 0:
                logger.info(
                    "No BigQuery job is in RUNNING state. No values to update")
                break
            logger.info("Waiting for 1 min..")
            time.sleep(60)
            logger.info(
                "Fetching information about BigQuery load jobs from tracking "
                "table...")
            query = "SELECT gcs_file_path,bq_job_id,bq_job_retries FROM {} " \
                    "WHERE bq_job_status='RUNNING'".format(
                        hive_table_model.tracking_table_name)
            results = mysql_component.execute_query(query)

    @staticmethod
    def generate_metrics_table_schema(columns_list):
        """Creates schema for the BigQuery comparison metrics table.

        Args:
            columns_list (List[str]): List of column names.

        Returns:
            List[google.cloud.bigquery.schema.SchemaField]: Schema of the
                comparison metrics table.
        """

        schema = [
            bigquery.SchemaField('operation',
                                 'STRING',
                                 mode='REQUIRED',
                                 description='operation'),
            bigquery.SchemaField('table_name',
                                 'STRING',
                                 mode='REQUIRED',
                                 description='Table name'),
            bigquery.SchemaField('column_count',
                                 'STRING',
                                 mode='REQUIRED',
                                 description='Number of columns'),
        ]
        for col in columns_list:
            schema.append(
                bigquery.SchemaField(str(col), 'STRING', mode='REQUIRED'))
        return schema

    @staticmethod
    def analyze_hive_table(hive_table_model):
        """Gets information about the Hive table.

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.

        Returns:
            dict: A dictionary of metrics about the Hive table.
        """

        table_analysis = dict()
        table_analysis['operation'] = "Hive"
        table_analysis['table_name'] = hive_table_model.table_name
        table_analysis['num_cols'] = str(hive_table_model.n_cols)
        table_analysis['schema'] = hive_table_model.flat_schema
        return table_analysis

    @staticmethod
    def analyze_bq_table(bq_table_model):
        """Gets information about the BigQuery table.

        Args:
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.

        Returns:
            dict: A dictionary of metrics about the BigQuery table.
        """

        table_analysis = dict()
        table_analysis['operation'] = "BigQuery"
        table_analysis['table_name'] = bq_table_model.table_name
        table_analysis['num_cols'] = str(bq_table_model.n_cols)
        table_analysis['schema'] = bq_table_model.flat_schema
        return table_analysis

    @staticmethod
    def append_row_to_metrics_file(filename, row, columns_list):
        """Writes comparison metrics row to CSV file.

        Args:
            filename (str): Comparison metrics CSV filename.
            row (dict): Data to be written to CSV file.
            columns_list (List[str]): List of flattened column names.
        """

        data = [row['operation'], row['table_name'], row['num_cols']]
        for item in columns_list:
            data.append(row['schema'][item])
        with open(filename, 'a+') as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(data)

    @staticmethod
    def do_health_checks(hive_table_analysis, bq_table_analysis, columns_list):
        """Populates the Health checks values by comparing Hive and BigQuery
        tables.

        Args:
            hive_table_analysis (dict): A dictionary of metrics about the
                Hive table.
            bq_table_analysis (dict): A dictionary of metrics about the
                BigQuery table.
            columns_list (List[str]): List of flattened column names.
        """
        def read_validations():
            """Reads the set of Hive-BigQuery data type validation rules into a
            list."""

            validations_csv_filename = 'validations.csv'
            with open(validations_csv_filename, 'r') as file_content:
                reader = csv.reader(file_content)
                validations_list = [row for row in reader]
            return validations_list

        logger.debug("Reading the validations CSV file")
        validation_rules = read_validations()

        healths = {
            "operation": "Health Check",
            "table_name": "NA",
            "num_cols": "Fail",
            "schema": {}
        }
        if hive_table_analysis['num_cols'] == bq_table_analysis['num_cols']:
            healths["num_cols"] = "Pass"

        for item in columns_list:
            # Reduce strings of array_ in the data type field.
            if 'array_' in hive_table_analysis['schema'][item]:
                hive_table_analysis['schema'][item] = '_'.join(
                    hive_table_analysis['schema'][item].split('_')[-2:])

            if ([
                    hive_table_analysis['schema'][item],
                    bq_table_analysis['schema'][item]
            ] in validation_rules):
                healths['schema'][str(item)] = "Pass"
            else:
                healths['schema'][str(item)] = "Fail"
        return healths

    def load_csv_to_bigquery(self, csv_uri, dataset_id, table_name):
        """Loads metrics CSV data to BigQuery comparison table.

        Args:
            csv_uri (str): Cloud Storage URI of the metrics CSV file.
            dataset_id (str): BigQuery dataset ID.
            table_name (str): BigQuery comparison metrics table name.
        """

        dataset_ref = self.client.dataset(dataset_id)
        # Load job configuration.
        job_config = bigquery.LoadJobConfig()
        # Source format is set to CSV.
        job_config.source_format = bigquery.SourceFormat.CSV
        # Start load job.
        load_job = self.client.load_table_from_uri(
            csv_uri, dataset_ref.table(table_name), job_config=job_config)
        logger.info('Loading metrics data to BigQuery... Job {}'.format(
            load_job.job_id))
        # wait for the job to completed.
        load_job.result()

        destination_table = self.client.get_table(
            dataset_ref.table(table_name))
        logger.info(
            "Loaded {} rows in metrics table\nMigrated data successfully from "
            "Hive to BigQuery\nComparison metrics of tables available in "
            "BigQuery table {}".format(destination_table.num_rows, table_name))

    def write_metrics_to_bigquery(self, gcs_component, hive_table_model,
                                  bq_table_model):
        """Writes comparison metrics to BigQuery.

        Flattens the schema of both the Hive table and BigQuery table,
        reads the data types validation rules list, does health checks of the
        migration and loads the metrics data into a BigQuery comparison table.

        Args:
            gcs_component (:class:`GCSStorageComponent`): Instance of
                GCSStorageComponent to do GCS operations.
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details.
            bq_table_model (:class:`BigQueryTableModel`): Wrapper to BigQuery
                table details.
        """

        metrics_table_name = PropertiesReader.get('hive_bq_comparison_table')
        metrics_csv_filename = PropertiesReader.get('hive_bq_comparison_csv')

        logger.info("Analyzing the Hive and BigQuery tables...")

        # Flattens the Hive table schema and writes row to CSV file.
        flat_list_columns = hive_table_model.flat_schema.keys()
        hive_table_analysis = self.analyze_hive_table(hive_table_model)
        self.append_row_to_metrics_file(metrics_csv_filename,
                                        hive_table_analysis, flat_list_columns)
        logger.debug("Analyzed Hive table metrics")

        # Flattens the BigQuery table schema and writes row to CSV file.
        bq_table_analysis = self.analyze_bq_table(bq_table_model)
        self.append_row_to_metrics_file(metrics_csv_filename,
                                        bq_table_analysis, flat_list_columns)
        logger.debug("Analyzed BigQuery table metrics")

        # Does Health checks by comparing Hive and BigQuery metrics.
        healths = self.do_health_checks(hive_table_analysis, bq_table_analysis,
                                        flat_list_columns)
        self.append_row_to_metrics_file(metrics_csv_filename, healths,
                                        flat_list_columns)
        logger.debug("Health checks are done")

        logger.debug("Getting metrics table schema")

        logger.debug("Creating BigQuery metrics table")
        self.create_table(
            bq_table_model.dataset_id, metrics_table_name,
            self.generate_metrics_table_schema(flat_list_columns))
        # Uploads metrics CSV file to GCS bucket.
        blob_name = "BQ_staging/{}".format(metrics_csv_filename)
        csv_uri = gcs_component.upload_file(
            PropertiesReader.get('gcs_bucket_name'), metrics_csv_filename,
            blob_name)
        logger.debug("metrics CSV file is uploaded at %s", csv_uri)
        # Deletes local csv file.
        os.remove(metrics_csv_filename)
        # Loads CSV file to BigQuery metrics table.
        self.load_csv_to_bigquery(csv_uri, bq_table_model.dataset_id,
                                  metrics_table_name)
        # Deletes uploaded metrics CSV file in GCS bucket.
        gcs_component.delete_file(PropertiesReader.get('gcs_bucket_name'),
                                  blob_name)
        logger.debug("Deleting metrics CSV file at %s", csv_uri)
