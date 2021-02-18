#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Copyright 2021 Google LLC All Rights Reserved.
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
This module is called by the worker DAG to create authorised views.
function create_views: main function that will be caled by the DAG
function get_view_queries: Decides views to be created
    for the specified source table,
    calls the _create_query() function
    to generate view queries
function _create_query: generates the view query based on input parameters
"""
import logging

from airflow import AirflowException
from airflow.contrib.hooks.bigquery_hook import BigQueryHook

from google.cloud import bigquery
from googleapiclient.errors import HttpError

from hooks.custom_gcs_hook import GoogleCloudStorageCustomHook
from hooks.custom_bq_hook import BigQueryCustomHook
# class AuthorisedViews:
def _create_query(
    view_name,
    table_id,
    select_statement,
    where_clause):
    """
    Creates the view query based on input parameters
    :param view_name(string):
        name by which the view will be created
    :param table_id(string):
        name of table from which view will select data
    :param select_statement(string):
        SELECT clause for the view
    :param where_clause(string):
        WHERE clause for the view
    :return query(string) generated
    """
    query = f"""
        CREATE or REPLACE VIEW `{view_name}` AS
        {select_statement}
        FROM `{table_id}` tbl
        {where_clause}
    """
    return query

def get_view_queries(view_name,table_name):
    """
    Get the list of views that need to be created
    for the specified source table
    and calls the _create_query() function to generate
    all the view queries applicable to a table

    This function currently generates one view  for each table.
    This can can be customized based on requirements to generate
    more view definitions for the same table.

    :param view_name(string):
        name by which the view will be generated
    :param table_name(string):
        name of the table on which the view is based

    :return query(list) list of all the views' queries for the table
    """
    queries = {}

    queries[f"{view_name}"] = _create_query(
        view_name=f"{view_name}",
        table_id=table_name,
        select_statement = "SELECT * ",
        where_clause=""
    )

    return queries

def create_views(
    refresh_authorized_views_flag,
    **context
    ):
    """
    Wrapper function that will be called by the Composer DAG
    to generate authorized views
    :param refresh_authorized_views_flag(string):
        true/false indicator based on parameter file
        to specify whether or not the views
        should be refreshed by the DAG
    """

    if refresh_authorized_views_flag != "true":
        logging.debug("Authorized views not created or refreshed\
            since refresh_authorized_views_flag is not true")
    else:
        map_src_dl_target_abs_filename=\
            context["ti"].xcom_pull(key="map_src_dl_target_abs_filename")
        composer_bucket = context["ti"].xcom_pull(key="composer_bucket")

        map_src_dl_target = GoogleCloudStorageCustomHook(
            google_cloud_storage_conn_id="google_cloud_storage_default"
            ).read_file(
                bucket=composer_bucket,
                abs_file_path=map_src_dl_target_abs_filename)

        location = context["ti"].xcom_pull(key="location")
        logging.debug(f"location: {location}")
        logging.debug("map_src_dl_target")
        logging.debug(map_src_dl_target)

        if len(map_src_dl_target) == 0:
            raise AirflowException(
        "No tables received in list to create views. Failing task."
        )

        client = bigquery.Client()

        logging.debug("Starting to create views...")

        for entry in map_src_dl_target:
            for file in entry["src_list"]:
                project_id =\
                    file["gcp_project_id.target_dataset"].split(".")[0]
                dataset_name =\
                    file["gcp_project_id.target_dataset"].split(".")[1]
                table_name = file["dl_table_name"]
                table_id =\
                    file["gcp_project_id.target_dataset"]+"."+table_name

                # Dataset name for tables is expected to end with _raw suffix # pylint: disable=line-too-long
                # To generate name of view dataset, remove _raw from the name # pylint: disable=line-too-long

                if "_raw" in dataset_name:
                    dataset_name = dataset_name.replace("_raw", "")

                logging.debug(f"Project_id: {project_id}, \
                    Dataset_name: {dataset_name}, \
                        Table_name: {table_name}")

                view_dataset_name =\
                    f"{project_id}.{dataset_name}_views"
                dataset_id=f"{dataset_name}_views"
                view_name =\
                    f"{view_dataset_name}.{table_name}"
                try:
                    table = client.get_table(table_id)
                except:
                    logging.error(f"Failed to get the table with table ID:\
                        {table_id}")
                    raise

                # for schema_field in table.schema:
                #     col_name = schema_field.name
                #     col_description = schema_field.description

                queries = get_view_queries(
                    view_name,table_id)

                hook = BigQueryHook(use_legacy_sql=False, location=location)
                conn = hook.get_conn()
                bq_cursor = conn.cursor()

                if not BigQueryCustomHook(
                    bigquery_conn_id="bigquery_default").dataset_exists(
                        project_id,
                        dataset_id):
                    try:
                        bq_cursor.create_empty_dataset(
                            dataset_id,
                            project_id,
                            {"location": location})
                    except HttpError as e:
                        if e.resp["status"] == "409":
                            logging.debug(
                                f"Dataset {dataset_id} already exists")

                # Create views
                logging.debug("Creating views...")
                for k,query in queries.items():
                    try:
                        # Create views
                        query_job = client.query(query)
                        results = query_job.result()
                    except Exception as e:
                        logging.debug(
                            f"Failed to create the view with query:{query}")
                        logging.error(e)
                        raise
