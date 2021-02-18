#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Copyright 2019 Google LLC All Rights Reserved.
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
"""
This module has logic to update coliumn
descriptions in the data lake tables.
It reads the data dictionary
from files and appplies it to BQ tables.

function clean_column_name: cleans any column names
    that are not BQ compatible to make it compatible
function derive_metadata_filename: derives the name of the
    data dictionary file
function get_metadata_file: reads the contents of
    the data dictionary file
function apply_metadata_from_file: patches metadata from
    the data dictionary file to BQ table columns
function metadata_update: retrieves the list of all tables
    populated based on source files and
    calls apply_metadata_from_file to apply data dictionary

"""
import csv
import json
import logging
import re
import time
import os
from google.cloud import bigquery
from google.api_core.exceptions import NotFound
from airflow.contrib.hooks.gcs_hook import GoogleCloudStorageHook
from hooks.custom_gcs_hook import GoogleCloudStorageCustomHook
# class MetadataUpdate:

etl_audit_cols = [
    "is_active",
    "record_start_ts",
    "record_end_ts",
    "record_ins_ts",
    "record_upd_ts"
]

def clean_column_name(col_name):
    """
    This function cleans the column name read from
    the metadata file to conform the column naming standards in BQ.
    The logic in this function is identical to that used by
    Data Fusion Autoloader custom plugin to clean column names.

    param col_name: columns name
    returns (string) cleansed column name
    """

    col_prefix = "C_"
    if col_name is None or col_name=="":
        logging.debug("Column name is null or blank")
        return col_name
    else:
        cleaned_col_name = re.sub("[^0-9a-zA-Z_]+", "", col_name)

        if not cleaned_col_name[0].isalpha():
            cleaned_col_name = col_prefix + cleaned_col_name
        if col_name  != cleaned_col_name:
            logging.debug(
                f"Cleaned column name from "
                f"{col_name} to {cleaned_col_name}")
        return cleaned_col_name

def derive_metadata_filename(
    system_name,src_file_name,source_regex=None):
    """
    Derives the name of the metadata file
    system_name (string): source system name
    src_file_name (string): name of souce data file
    source_regex (string): regex pattern based on which
        data dictionary file name will be derived
    returns (string) metadata file name corresponding to the file
    """
    src_file_nm = src_file_name.split("/")[-1] # Split the path
    logging.debug(f"metadata file: {src_file_nm}")
    if source_regex is not None and source_regex != "":
        logging.debug(f"re.search: {re.search(source_regex, src_file_nm)}")
        match = re.search(source_regex, src_file_nm)
        g = match.group("metadata")
        logging.debug(f"g: {g}")
        if g is not None:
            metadata_file = g
        else:
            logging.error(
                "Regex naming group error. "
                "Metadata group not specified in regex.")
    else:
        metadata_file = src_file_nm
    logging.debug(f"metadata_file: {metadata_file}")
    metadata_filename = f"{system_name}_{metadata_file}_description.csv"
    metadata_file_path = f"metadata/{system_name}/{metadata_filename}"

    logging.debug(f"metadata_filename: {metadata_filename}")
    logging.debug(f"metadata_file_path: {metadata_file_path}")

    return metadata_file_path

def get_metadata_file(gcs_hook, bucket, dag_run_id_det, obj):
    """
    Reads the contents of the data dictionary file

    param: gcs_hook (GCS Hook): GCS Hook
    param: bucket (string): name of bucket where file exists
    param: dag_run_id_det (string): dag run id of the worker dag
    param: obj (string): metadata file path
    returns (dict) data dictionary read from the file
    # """

    try:
        dest_filename = "/tmp/metadata_file_"+ dag_run_id_det +".csv"
        if os.path.exists(dest_filename):
            os.remove(dest_filename)
        else:
            print(f"{dest_filename} file does not pre-exist")

        gcs_hook.download(bucket, obj, filename=dest_filename)

    except NotFound:
        logging.error(f"Metadata file not found in GCS: {obj}")
        raise

    try:
        with open(dest_filename) as fh:
            metadata_file = csv.DictReader(fh, delimiter=",")
            logging.debug("downloaded metadata file")
            logging.debug(metadata_file)
            metadata = {}
            for row in metadata_file:
                cleaned_col_name = clean_column_name(row["ColumnName"])
                metadata[cleaned_col_name] = \
                    {"description": row["Description"]}
                logging.debug(f"cleaned_col_name {cleaned_col_name}")
                logging.debug(f"row Description {row['Description']}")
            return metadata
        os.remove(dest_filename)
    except IOError:
        logging.error(
            f"Error reading metadata_file content "
            f"using CSV: {obj}")
        raise

def apply_metadata_from_file(
    client,dataset,table_name,metadata,etl_cols):
    """
    Applies the data dictionary to BQ table
    param: client (BQ Client): BQ Client
    param: dataset (string): name of the table dataset
    param: table_name (string):
        table to which dictionary will be applied
    param: metadata (dict):
        data dictionary read from the file
    returns: (boolean) flag to indicate if data dictionary
    was provided for all columns in table
    """
    table_id = f"{dataset}.{table_name}"

    table = client.get_table(table_id)

    new_schema = []
    all_metadata_exists = True
    for column in table.schema:
        if column.name in etl_cols:
            columntxt = "Ingestion audit column"
        else:
            try:
                d = metadata[column.name]
                columntxt = d["description"]
            except Warning:
                logging.debug(
                    f"description not available for column "
                    f"{dataset}.{table_name}.{metadata[column.name]}")
                columntxt = "description not available"
                all_metadata_exists = False

        new_schema.append(bigquery.SchemaField(
            column.name,
            column.field_type,
            fields=column.fields,
            description=columntxt,
            mode=column.mode))

    table.schema = new_schema
    table = client.update_table(table, ["schema"])

    return all_metadata_exists

def metadata_update(dag_run_id_det, execute_update_flag, **context):
    """
    Main function to be called by the DAG
    param: dag_run_id_det(string): DAG run id generated by Airflow
    param: execute_update_flag (string): indicator specifying
        whether or not dictionary should be updated for this DAG's tables
    returns: (boolean) flag to indicate if data dictionary
    """
    if execute_update_flag == "false":
        logging.debug(
            "Data dictionary is not being updated/applied "
            "to the table since execute_update_flag is false")
    else:
        system_name = context["ti"].xcom_pull(
            key="system")
        source_type = context["ti"].xcom_pull(
            key="source_type")
        source_list = context["ti"].xcom_pull(
            key="source_list")
        data_bucket = context["ti"].xcom_pull(
            key="data_bucket")
        composer_bucket = context["ti"].xcom_pull(
            key="composer_bucket")
        source_regex = context["ti"].xcom_pull(
            key="source_regex")
        target_dataset = context["ti"].xcom_pull(
            key="target_dataset")
        gcp_project_id = context["ti"].xcom_pull(
            key="gcp_project_id")

        logging.debug("printing xcoms received")
        logging.debug(
            f"xcoms> system_name: {system_name},"
            f"source_type: {source_type}, "
            f"gcp_project_id: {gcp_project_id}, "
            f"data_bucket: {data_bucket}, "
            f"target_dataset: {target_dataset}")
        logging.debug(f"xcoms> source_list: {source_list}")
        logging.debug(f"dag_run_id_det: {dag_run_id_det}")

        client = bigquery.Client()

        map_src_dl_target = []
        metadata_update_status_list = []

        # For each file in the source file list,
        # retrieve the list of tables in BQ matching the file name
        for source_file_dict in source_list:
            # for files in source_file_dict["src_list"]:
            src_file_name_qualified = source_file_dict["src_file_name"]

            logging.debug(
                f"src_file_name_qualified: "
                f"{src_file_name_qualified}")

            if source_type in ["gcs", "sftp"]:
                # Split the path and exclude extension from file name
                src_file_name = source_file_dict["src_file_name"].split(
                    "/")[-1][:-4]

            dataset_id = f"{gcp_project_id}.{target_dataset}"
            query = f"""
                SELECT *
                FROM {dataset_id}.INFORMATION_SCHEMA.TABLES
            """

            if source_type in ["gcs", "sftp"]:
                query += f" WHERE table_name = \"{src_file_name}\""

            logging.debug(f"runnning query: {query}")
            try:
                query_job = client.query(query)
                results = query_job.result()
            except:
                logging.error(f"Error running the query: {query}")
                raise

            table_names = []

            for row in results:
                table_names.append(row["table_name"])
            logging.debug("table names:")
            logging.debug(table_names)
            entry_all_metadata_exists = {"src_list": []}
            entry_map_src_dl_target = {"src_list": []}
            all_metadata_exists = None

            if len(table_names) == 0:
                logging.debug(
                    "No new tables were created as part of "
                    "this load job. No metadata is being updated.")
            else:
                for table_name in table_names:
                    # Retrieve data dictionary for each file from
                    # the corresponding metadata / data  dictionary file
                    metadata_file_path =\
                        derive_metadata_filename(
                            system_name,
                            src_file_name_qualified,
                            source_regex)

                    logging.debug(
                        f"metadata_file_path: {metadata_file_path}")

                    logging.debug(
                        f"dag_run_id_det: {dag_run_id_det}")

                    gcs_hook = GoogleCloudStorageHook(
                        "google_cloud_storage_default")

                    metadata = get_metadata_file(
                        gcs_hook,
                        data_bucket,
                        dag_run_id_det,
                        obj=metadata_file_path
                        )

                    if metadata:
                        # Apply data  dictionary to table columns
                        all_metadata_exists = apply_metadata_from_file(
                            client,
                            dataset_id,
                            table_name,
                            metadata,
                            etl_audit_cols)

                    entry_map_src_dl_target["src_list"].append({
                        "gcp_project_id.target_dataset": dataset_id,
                        "src_file_name": src_file_name_qualified,
                        "dl_table_name": table_name
                    })
                    map_src_dl_target.append(entry_map_src_dl_target)

                if not all_metadata_exists:
                    entry_all_metadata_exists["src_list"].append({
                        "src_file_name":src_file_name_qualified,
                        "status": "metadata updated where available"
                        })
                else:
                    entry_all_metadata_exists["src_list"].append({
                        "src_file_name":src_file_name_qualified,
                        "status": "metadata updated for all columns"
                        })
                metadata_update_status_list.append(
                    entry_all_metadata_exists)

        logging.debug("map_src_dl_target:")
        logging.debug(map_src_dl_target)

        map_src_dl_target_filename = f"map_src_dl_target_{dag_run_id_det}"

        orchestrator_dag_run_id = context["ti"].xcom_pull(
            key="orchestrator_dag_run_id")


        map_src_dl_target_abs_filename = GoogleCloudStorageCustomHook(
            google_cloud_storage_conn_id="google_cloud_storage_default"
            ).create_file(
                bucket=composer_bucket,
                filepath=\
                    f"data/{system_name}/{orchestrator_dag_run_id}/",
                filename=map_src_dl_target_filename,
                filecontent=json.dumps(map_src_dl_target))

        context["ti"].xcom_push(
            key="map_src_dl_target_abs_filename",
            value=map_src_dl_target_abs_filename)

        time.sleep(30)
        