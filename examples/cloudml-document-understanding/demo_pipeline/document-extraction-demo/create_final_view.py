# Copyright 2018 Google Inc. All Rights Reserved.
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
import os
import yaml

from google.cloud import bigquery

from utils import constants


def initialise_params():
  """Parses all arguments and assigns default values when missing."""
  
  def boolean_string(s):
    """To parse boolean inputs correctly."""
    # https://stackoverflow.com/questions/44561722/why-in-argparse-a-true-is-always-true
    s = s.lower()
    if s not in {'false', 'true'}:
        raise ValueError('Not a valid boolean string')
    return s == 'true'

  args_parser = argparse.ArgumentParser()
  args_parser.add_argument(
      '--bq_dataset',
      help='Dataset where the outputs are.',
  )
  args_parser.add_argument(
        '--use_object_detection',
        help='Whether object_detection has been run.',
        type=boolean_string,
        required=True,
  )
  args_parser.add_argument(
        '--config_file',
        help='Path to configuration file.',
        required=True
    )
  args = args_parser.parse_args()

  with open(args.config_file, 'r') as stream:
        config = yaml.load(stream, Loader=yaml.FullLoader)
  vars(args)['project_id_bq'] = config['main_project']['main_project_id']
  vars(args)['service_account'] = config['service_keys']['key_bq_and_gcs']
  vars(args)['classified_table'] = constants.TABLE_DOCUMENT_CLASSIFICATION
  vars(args)['subject_table'] = constants.TABLE_DOCUMENT_SUBJECT
  vars(args)['ner_table'] = constants.TABLE_NER_RESULTS
  vars(args)['object_detect_table'] = constants.TABLE_OBJ_DETECT
  vars(args)['output_table'] = constants.TABLE_FINAL_VIEW
  return args


def create_table(bq_client, dataset, table_name, query):
  dataset_ref = bq_client.dataset(dataset)
  table_ref = dataset_ref.table(table_name)

  try:
      table = bq_client.get_table(table_ref)
      raise ValueError('Table should not exist: {}'.format(table_name))
  except:
      pass

  job_config = bigquery.QueryJobConfig()
  job_config.query_parameters = []
  job_config.destination = table_ref

  query_job = bq_client.query(
      query,
      job_config=job_config)
  _ = query_job.result()


def create_final_view(args):
  """Builds a BigQuery Table containing all extracted information for each pdf."""

  print ('Creating final view...')
  if args.use_object_detection:
    query ="""
    WITH table1 AS (
      SELECT DISTINCT NER.*, class.class, class.class_confidence
      FROM `{project_id}.{bq_dataset}.{classified_table}` class
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
    LEFT OUTER JOIN `{project_id}.{bq_dataset}.{object_detect_table}` object
    ON table2.{file_name}=object.{file_name}
    """.format(
      project_id=args.project_id_bq,
      bq_dataset=args.bq_dataset,
      classified_table=args.classified_table,
      ner_table=args.ner_table,
      object_detect_table=args.object_detect_table,
      file_name=constants.FILENAME,
      subject_table=args.subject_table)
  else:
    query ="""
    WITH table1 AS (
      SELECT DISTINCT NER.*, class.class, class.class_confidence 
      FROM `{project_id}.{bq_dataset}.{classified_table}` class
      INNER JOIN `{project_id}.{bq_dataset}.{ner_table}` NER
      ON class.{file_name}=NER.{file_name}),
    table2 AS (
      SELECT table1.*, subj.subject
      FROM table1
      INNER JOIN `{project_id}.{bq_dataset}.{subject_table}` subj
      ON table1.{file_name}=subj.{file_name})

    SELECT DISTINCT * from table2
    """.format(
      project_id=args.project_id_bq,
      bq_dataset=args.bq_dataset,
      classified_table=args.classified_table,
      ner_table=args.ner_table,
      file_name=constants.FILENAME,
      subject_table=args.subject_table)

  bq_client = bigquery.Client.from_service_account_json(
      args.service_account)
  create_table(
    bq_client,
    args.bq_dataset,
    args.output_table,
    query)
  print ('Final view completed.')

if __name__ == '__main__':
  args = initialise_params()
  create_final_view(args)