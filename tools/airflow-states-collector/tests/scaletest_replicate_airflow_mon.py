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

# Note: Ignore this script, it is used for scale testing.

from src.gcsservice import GCSService
from src.utils import get_logger, read_file, store_file
from string import Template
import os
import warnings

warnings.filterwarnings("ignore")

LOGGER = get_logger('airflow-dag-replication-client')

def get_dag_from_template(template_filepath, variables):
  LOGGER.info(f"Reading Template Dag File: {template_filepath}")
  template_dag_content = read_file(template_filepath)
  template = Template(template_dag_content)
  final_dag = template.substitute(**variables)
  return final_dag


def store_dag_file_on_gcs_and_local(dags_gcs_folder, dag_id, file_name):
  # gcs = GCSService(project=AIRFLOW_PROJECT)
  gcs = GCSService()
  variables = {
      "DAG_ID" : dag_id
  }
  dagcontent = get_dag_from_template(
      f"resources{os.sep}airflow{os.sep}template{os.sep}dagtemplate_airflow_mon.txt",
      variables)

  output_local_dag_filename = f"output/{file_name}"
  store_file(output_local_dag_filename, dagcontent)
  LOGGER.info(f"Stored Output Local Dag File: {output_local_dag_filename}")

  output_gcs_dag_filename = f"{dags_gcs_folder}/{file_name}"
  LOGGER.info(f"Uploading DAG to GCS path: {output_gcs_dag_filename}")
  gcs_public_url = gcs.store_gcs_file(output_gcs_dag_filename, dagcontent)
  LOGGER.info(f"Uploading Dag File to GCS complete. GCS Public URL: {gcs_public_url}")
  return {
      "gcs_dag_public_url": gcs_public_url,
      "gcs_dag_location" : output_gcs_dag_filename,
      "local_dag_location": output_local_dag_filename
  }

def main():
  AIRFLOW_1_GCS = "gs://us-central1-airflow-1-test-740d676b-bucket/dags"
  AIRFLOW_2_GCS = "gs://us-central1-test-278acd57-bucket/dags"

  try:
    all_uploaded_files = []
    for i in range(1,50):
      all_uploaded_files.append(store_dag_file_on_gcs_and_local(AIRFLOW_1_GCS, f"airflow_monitoring_{i}", f"dag_airflow_monitoring_{i}.py"))
      all_uploaded_files.append(store_dag_file_on_gcs_and_local(AIRFLOW_2_GCS, f"airflow_monitoring_{i}", f"dag_airflow_monitoring_{i}.py"))

    print(all_uploaded_files)
  except Exception as error:
    LOGGER.error(f"{type(error).__name__} :{os.linesep}{error}")
    raise


if __name__ == "__main__":
  main()