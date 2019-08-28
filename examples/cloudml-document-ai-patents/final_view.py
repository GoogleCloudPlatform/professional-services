# Copyright 2019 Google Inc. All Rights Reserved.
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
"""Runs some transformation in BigQuery and drops to a new table."""

import argparse
import logging
import os
import yaml

from google.cloud import bigquery


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_table(bq_client, bq_dataset, bq_table, query):
  dataset_ref = bq_client.dataset(bq_dataset)
  table_ref = dataset_ref.table(bq_table)

  try:
      table = bq_client.get_table(table_ref)
      raise ValueError('Table should not exist: {}'.format(bq_table))
  except:
      pass

  job_config = bigquery.QueryJobConfig()
  job_config.query_parameters = []
  job_config.destination = table_ref

  query_job = bq_client.query(
      query,
      job_config=job_config)
  _ = query_job.result()


def create(main_project_id,
           demo_dataset,
           img_table,
           objdet_table,
           text_table,
           ner_table,
           service_acct):
  """Builds a BigQuery Table containing all extracted information for each pdf."""

  logger.info("Combining results to create the final view.")

  query ="""
  WITH table1 AS (
    SELECT DISTINCT NER.*, class.class, class.class_confidence
    FROM `{project_id}.{bq_dataset}.{img_table}` class
    INNER  JOIN `{project_id}.{bq_dataset}.{ner_table}` NER
    ON class.{file_name}=NER.{file_name}),
  table2 AS (
    SELECT table1.*, subj.subject
    FROM table1
    INNER JOIN `{project_id}.{bq_dataset}.{subject_table}` subj
    ON table1.{file_name}=subj.{file_name})

  SELECT DISTINCT table2.*, object.object, object.confidence,
                  object.x_min, object.x_max, object.y_min, object.y_max 
  FROM table2
  LEFT OUTER JOIN `{project_id}.{bq_dataset}.{objdet_table}` object
  ON table2.{file_name}=object.{file_name}
  """.format(
    project_id=main_project_id,
    bq_dataset=demo_dataset,
    img_table=img_table,
    objdet_table=objdet_table,
    subject_table=text_table,
    ner_table=ner_table,
    file_name="file")

  bq_client = bigquery.Client.from_service_account_json(service_acct)
  create_table(
    bq_client=bq_client,
    bq_dataset=demo_dataset,
    bq_table="final_view",
    query=query)
  logger.info("Final view completed.\n")
