# Copyright 2020 Google LLC
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

from airflow import models
from airflow.operators import python_operator
from string import Template
from google.cloud import bigquery
import os
import pytest
import json
import sys
import datetime
import logging
from airflow import DAG

sys.path.append('../composer/')
from main import execute_query, project_label_credit, distribute_commitments, billing_output


class Helper():

    def set_env_var(key, value):
        os.environ[key] = value

    def generateData(dataset, export_table, commitment_table, dir):
        myCmd = 'sh tests/load_test_data_bq_table.sh ' + dataset + " " + export_table + " " + commitment_table + " " + dir
        os.system(myCmd)

    def delete_table(dataset, table):
        myCmd = 'sh tests/delete_table.sh ' + dataset + " " + table
        logging.info("Deleted table... " + dataset + " " + table)
        os.system(myCmd)

    def delete_file(dir):
        myCmd = 'sh tests/delete_file.sh ' + dir
        logging.info("Cleaned Files from /tests directory for testcase - " +
                     dir)
        os.system(myCmd)

    def create_dataset(dataset):
        myCmd = 'sh tests/create_dataset.sh ' + dataset
        logging.info("created test environment dataset " + dataset)
        os.system(myCmd)

    def clean_data(data):
        Helper.delete_table(data['corrected_dataset_id'],
                            data['distribute_commitment_table'])
        Helper.delete_table(data['corrected_dataset_id'],
                            data['corrected_table_name'])
        Helper.delete_table(data['billing_export_dataset_id'],
                            data['load_billing_export_table_name'])
        Helper.delete_table(data['billing_export_dataset_id'],
                            data['commitment_table_name'])

    def clean(dir, data):
        Helper.delete_file(dir)

    def prepare_consolidated_billing(dir, data):

        for key, value in data.items():
            Helper.set_env_var(key, value)

        Helper.generateData(data['billing_export_dataset_id'],
                            data['load_billing_export_table_name'],
                            data['commitment_table_name'], dir)
        bq_client = bigquery.Client()

        project_label_credit(bq_client, data)
        logging.info('...' + dir + '_project_label_credit created ... ')
        distribute_commitments(bq_client, data)
        logging.info('...' + dir + '_distribute_commitment created ... ')
        billing_output(bq_client, data)
        logging.info('...' + dir + '_corrected created ... ')

    def dump_result(project, dataset, consolidated_billing_table, local_output):
        myCmd = 'sh tests/extract.sh ' + project + " " + dataset + " " + consolidated_billing_table + " " + local_output
        os.system(myCmd)
