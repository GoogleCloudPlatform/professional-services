#!/usr/bin/env python3.9
#
# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


from src.bqservice import BQService
from src.lookerstudioservice import LookerStudioService
from src.gcsservice import GCSService
from src.utils import get_logger, read_file, store_file
from string import Template
import os
import argparse
import re
import warnings
from texttable import Texttable

warnings.filterwarnings("ignore")

LOGGER = get_logger('airflow-states-client')

def create_bigquery_resources(args):
  bq = BQService(job_name="airflow-states-client",
                 query_project=args.bq_billing_project_id or args.bq_storage_project_id,
                 default_project=args.bq_storage_project_id,
                 default_dataset=args.bq_storage_dataset,
                 location=args.bq_dataset_location)

  dataset_ref = bq.create_dataset(args.bq_storage_dataset, True)
  if dataset_ref.location != args.bq_dataset_location:
    raise Exception(f"BQ Dataset exists in location '{dataset_ref.location}' which doesn't match with input dataset location '{args.bq_dataset_location}' {os.linesep}Either change location or datasetname")

  replacements = {
      'PROJECT': args.bq_storage_project_id,
      'DATASET': args.bq_storage_dataset,
      'TABLE_NAME': args.bq_table_name,
      'VIEW_NAME': args.bq_view_name,
      'EXPIRY_DAYS': args.bq_partition_expiry_days
  }
  bq.run_queries([f"resources{os.sep}bigquery{os.sep}airflow_states_ddls.sql"],**replacements)
  return replacements


def create_looker_studio_url(args):
  ds_configs = {
      "ds.ds21.datasourceName" : "airflow_merged_view",
      "ds.ds21.billingProjectId" : args.bq_billing_project_id or args.bq_storage_project_id,
      "ds.ds21.projectId" : args.bq_storage_project_id,
      "ds.ds21.datasetId" : args.bq_storage_dataset,
      "ds.ds21.tableId" : args.bq_view_name,
  }

  lookerstudio = LookerStudioService(template_report_id="16565de7-3f5d-4a3f-87e9-5ff407dc0324",
                                     new_report_name=args.report_name,
                                     datasources_config=ds_configs)
  return lookerstudio.get_copy_report_url()


def get_dag_from_template(template_filepath, variables):
  LOGGER.info(f"Reading Template Dag File: {template_filepath}")
  template_dag_content = read_file(template_filepath)
  template = Template(template_dag_content)
  final_dag = template.substitute(**variables)
  return final_dag


def store_dag_file_on_gcs_and_local(args):
  # gcs = GCSService(project=AIRFLOW_PROJECT)
  gcs = GCSService()
  variables = {
    "BQ_PROJECT" : args.bq_storage_project_id,
    "BQ_AUDIT_DATASET" : args.bq_storage_dataset,
    "BQ_AUDIT_TABLE" : args.bq_table_name,
    "SCHEDULE_INTERVAL" : args.airflow_dag_schedule,
    "CURRENT_DAG_ID" : args.airflow_dagid,
    "LAST_NDAYS" : args.ndays_history,
    "SKIP_DAG_LIST" : args.skip_dagids.split(",") or [''], #["airflow_monitoring", AIRFLOW_DAG_ID],
    "INSERT_QUERY_BATCH_SIZE" : args.bq_insert_batch_size
  }
  dagcontent = get_dag_from_template(
      f"resources{os.sep}airflow{os.sep}dagtemplate_airflow_v{args.airflow_version}.txt",
      variables)

  output_local_dag_filename = f"output/{args.airflow_dag_filename}"
  store_file(output_local_dag_filename, dagcontent)
  LOGGER.info(f"Stored Output Local Dag File: {output_local_dag_filename}")

  output_gcs_dag_filename = f"{args.dags_gcs_folder}/{args.airflow_dag_filename}"
  LOGGER.info(f"Uploading DAG to GCS path: {output_gcs_dag_filename}")
  gcs_public_url = gcs.store_gcs_file(output_gcs_dag_filename, dagcontent)
  LOGGER.info(f"Uploading Dag File to GCS complete. GCS Public URL: {gcs_public_url}")
  return {
      "gcs_dag_public_url": gcs_public_url,
      "gcs_dag_location" : output_gcs_dag_filename,
      "local_dag_location": output_local_dag_filename
  }

def gcs_path_validation(gcs_path):
  pattern = re.compile(r"gs://.*/.*/*")
  if pattern.match(gcs_path):
    return gcs_path if gcs_path[-1] != "/" else gcs_path[:-1]

  raise argparse.ArgumentTypeError('Invalid GCS Path property --dags-gcs-path. Should be of the form: gs://<bucket-name>/<dag-folder-path>')

def print_final_report(bq_resources, dagid, dagfile_locs, report_url):
  LOGGER.info("Final Report :")
  table = Texttable(max_width=0)
  headers = ["Resource", "Reference"]
  table_rows = []
  table_rows.append(headers)
  table_rows.append(["States BQ Table Name", f"{bq_resources.get('PROJECT')}.{bq_resources.get('DATASET')}.{bq_resources.get('TABLE_NAME')}"])
  table_rows.append(["States BQ Aggregated View", f"{bq_resources.get('PROJECT')}.{bq_resources.get('DATASET')}.{bq_resources.get('VIEW_NAME')}"])
  table_rows.append(["Airflow DAG ID", dagid])
  table_rows.append(["GCS DAG Location", dagfile_locs.get('gcs_dag_location')])
  table_rows.append(["GCS DAG Public URL", dagfile_locs.get('gcs_dag_public_url')])
  table_rows.append(["Local DAG Location ( Just for reference )", dagfile_locs.get('local_dag_location')])
  table_rows.append(["Looker Studio Report URL", report_url])

  table.add_rows(table_rows)
  LOGGER.info(table.draw())


def main(args):
  try:
    LOGGER.info("Creating BigQuery Resources")
    bq_resources = create_bigquery_resources(args)

    LOGGER.info("Creating Airflow Dags and storing on GCS and local")
    dagfile_locs = store_dag_file_on_gcs_and_local(args)

    LOGGER.info("Creating LookerStudio Dashboard")
    report_url = create_looker_studio_url(args)

    print_final_report(bq_resources, args.airflow_dagid, dagfile_locs, report_url)
  except Exception as error:
    LOGGER.error(f"{type(error).__name__} :{os.linesep}{error}")
    raise


if __name__ == "__main__":
  parser = argparse.ArgumentParser(
      description=__doc__,
      formatter_class=argparse.RawDescriptionHelpFormatter
  )

  parser.add_argument('--bq-storage-project-id', required=True, help='(Required) BigQuery Project where airflow States BQ table and views will be created.')
  parser.add_argument('--dags-gcs-folder', required=True, help="(Required) Airflow DAG folder GCS path. Eg: gs://<bucket-name>/dags", type=gcs_path_validation)
  parser.add_argument('--ndays-history', required=True, type=int, help="(Required) Number of days for historic States collection of all airflow Dags")
  parser.add_argument('--airflow-version', required=True, type=int, choices=[1,2], help="(Required) Airflow Version. Choose between 1 or 2")
  parser.add_argument('--bq-billing-project-id', help='(Optional) BigQuery Project which will be billed for Dashboard Queries. Defaults to storage project')
  parser.add_argument('--bq-storage-dataset', default="airflow", help="(Optional) BigQuery Dataset for storing airflow States tables. Defaults to 'airflow'")
  parser.add_argument('--bq-dataset-location', default="US", help="(Optional) BigQuery Dataset Location. Ideal if its in the same location as airflow. Defaults to 'US'")
  parser.add_argument('--bq-table-name', default="airflow_states", help="(Optional) BigQuery Airflow states Table Name. Defaults to 'airflow_states'")
  parser.add_argument('--bq-partition-expiry-days', default=30, help="(Optional) Number of latest partitions to keep in the Airflow States table. Default to 30 days")
  parser.add_argument('--bq-view-name', default="airflow_latest_states_view", help="(Optional) BigQuery Airflow states View Name which contains latest record for every dagrun's task. Defaults to 'airflow_latest_states_view'")
  parser.add_argument('--airflow-dag-filename', default="dag_airflow_states_collector.py", help="(Optional) Airflow dag file name to be stored in GCS. Defaults to 'dag_airflow_states_collector.py'")
  parser.add_argument('--airflow-dagid', default="airflow_states_collector", help="(Optional) Airflow dag ID. Defaults to 'airflow_states_collector'")
  parser.add_argument('--airflow-dag-schedule', default="*/5 * * * *", help="(Optional) Airflow dag schedule. Defaults to every 5 mins i.e. '*/5 * * * *'")
  parser.add_argument('--skip-dagids', default='airflow_monitoring', type=str, help="(Optional) Airflow DagIds (comma-seperated) to be skipped for states collection. Defaults to 'airflow_monitoring'")
  parser.add_argument('--report-name', default="Airflow States Dashboard", help="(Optional) LookerStudio dashboard name that will be created. Defaults to 'Airflow States Dashboard'")
  parser.add_argument('--bq-insert-batch-size', default=150, help="(Optional) Number of records in single BQ Insert Query. Defaults to 150. Decrease this value if you observe BQ Query max length failures")


  args = parser.parse_args()
  LOGGER.info(f"All Input Argument values: {vars(args)}")
  main(args)