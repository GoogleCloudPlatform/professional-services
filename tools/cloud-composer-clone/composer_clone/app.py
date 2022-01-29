# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
The main module that runs the main operations of this tool
The user can invoke it to do the following:
  - Run a full composer environment backup and store on GCS
  - Recover/restore a composer environment from an existing backup on GCS
"""
from datetime import datetime
import gke_utils
import db_utils
import utils
from composer_env import ComposerEnv


def create_backup_datetime() -> str:
  """
  Generates a simple DateTime signature to use for temp
  dump file names and the destination backup folder
  """
  now = datetime.now()
  return now.strftime('%d-%m-%Y_%H:%M:%S')

def backup(env_name, project_id, location, backup_bucket_name) -> None:
  """
  Performs the backup operation with several steps:
    - 
  """
  backup_datetime_str = create_backup_datetime()
  gke_cluster = gke_utils.get_gke_cluster(env_name, project_id, location)

  gke_utils.set_cluster(
      gke_cluster['cluster'],
      gke_cluster['zone'],
      gke_cluster['project'])

  env = ComposerEnv.from_current_context()

  print('Downloading SQL dump...')
  dump_path = db_utils.extract_db_dump(
    env.worker_pod_vars['SQL_USER'],
    env.worker_pod_vars['SQL_PASSWORD'],
    env.sql_proxy_pod_ip,
    '3306',
    env.worker_pod_vars['SQL_DATABASE'],
    f'composer-db-dump-{backup_datetime_str}.sql'
    )

  print('Building sequence file...')
  sequence_file_path = db_utils.build_sequence_file(
    env.worker_pod_vars['SQL_USER'],
    env.worker_pod_vars['SQL_PASSWORD'],
    env.sql_proxy_pod_ip,
    '3306',
    env.worker_pod_vars['SQL_DATABASE'],
    f'composer-db-sequence-{backup_datetime_str}.sql'
  )

  print('Uploading files...')
  utils.upload_blob(
    backup_bucket_name,
    dump_path,
    f'{env_name}_{backup_datetime_str}/composer-db-dump.sql'
    )

  utils.upload_blob(
    backup_bucket_name,
    sequence_file_path,
    f'{env_name}_{backup_datetime_str}/composer-db-sequence.sql'
    )

  utils.copy_gcs_folder(
    env.get_dag_folder_path(),
    f'gs://{backup_bucket_name}/{env_name}_{backup_datetime_str}/dags/'
  )

  utils.copy_gcs_folder(
    env.get_plugins_folder_path(),
    f'gs://{backup_bucket_name}/{env_name}_{backup_datetime_str}/plugins/'
  )

  env.save_to_gcs(
    backup_bucket_name,
    f'{env_name}_{backup_datetime_str}/composer_env.pickle'
    )

def restore(env_name, project_id, location, bucket, folder):
  """
  Entrypoint for performing a restore operation
  """
  gke_cluster = gke_utils.get_gke_cluster(env_name, project_id, location)
  gke_utils.set_cluster(
      gke_cluster['cluster'],
      gke_cluster['zone'],
      gke_cluster['project'])

  destination_env = ComposerEnv.from_current_context()
  source_composer_env = ComposerEnv.from_gcs(
    bucket, f'{folder}/composer_env.pickle')

  print('Copying GCS DAG folder...')
  utils.copy_gcs_folder(
    source_composer_env.get_dag_folder_path(),
    destination_env.get_dag_folder_path()
  )

  print('Importing backup DB...')
  db_utils.import_db(
    destination_env.worker_pod_vars['SQL_USER'],
    destination_env.worker_pod_vars['SQL_PASSWORD'],
    destination_env.sql_proxy_pod_ip,
    '3306',
    destination_env.worker_pod_vars['SQL_DATABASE'],
    f'gs://{bucket}/{folder}/composer-db-dump.sql'
  )

  print('Applying DB sequence')
  db_utils.import_db(
    destination_env.worker_pod_vars['SQL_USER'],
    destination_env.worker_pod_vars['SQL_PASSWORD'],
    destination_env.sql_proxy_pod_ip,
    '3306',
    destination_env.worker_pod_vars['SQL_DATABASE'],
    f'gs://{bucket}/{folder}/composer-db-sequence.sql'
  )

  gke_utils.create_client()

  gke_utils.rotate_fernet_key(
    destination_env.worker_pod['pod_name'],
    destination_env.namespace,
    source_composer_env.worker_pod_vars['AIRFLOW__CORE__FERNET__KEY'],
    destination_env.worker_pod_vars['AIRFLOW__CORE__FERNET__KEY']
    )
