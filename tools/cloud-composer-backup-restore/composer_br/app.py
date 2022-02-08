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
import sys
from datetime import datetime
import logging
import gke_utils
import db_utils
import command_utils
from google.cloud import storage
import google.cloud.logging
from composer_env import ComposerEnv

# Setup GCP Cloud logging
log_client = google.cloud.logging.Client()
log_client.setup_logging()

# Setup a handler for printing INFO logs to the console
console = logging.StreamHandler()
console.setLevel(logging.INFO)
formatter = logging.Formatter('%(levelname)-8s %(message)s')
console.setFormatter(formatter)
logging.getLogger('').addHandler(console)


def _create_backup_datetime() -> str:
    """
    Generates a simple DateTime signature to use for temp
    dump file names and the destination backup folder
    """
    now = datetime.now()
    return now.strftime('%d-%m-%Y_%H:%M:%S')


def _upload_blob(bucket_name: str, source_file_name: str,
                 destination_blob_name: str):
    """
    Uploads a local file to a given GCS bucket path
    """
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(source_file_name)


def _copy_gcs_folder(bucket_from: str, bucket_to: str) -> None:
    command_utils.sh(['gsutil', '-m', 'rsync', '-r', bucket_from, bucket_to])


def _check_cli_depdendencies() -> None:
    missing_cmd = command_utils.check_commands(
        ['kubectl', 'gsutil', 'gcloud', 'psql', 'pg_dump'])

    if len(missing_cmd) > 0:
        msg = f'Backup failed {",".join(missing_cmd)} are missing.'
        logging.error(msg)
        sys.exit(msg)


def backup(env_name: str, project_id: str, location: str,
           backup_bucket_name: str) -> None:
    """
    Performs the backup operation
    """
    _check_cli_depdendencies()

    backup_datetime_str = _create_backup_datetime()
    gke_cluster = gke_utils.get_gke_cluster(env_name, project_id, location)

    gke_utils.set_cluster(gke_cluster['c'], gke_cluster['z'], gke_cluster['p'])

    env = ComposerEnv.from_current_context()

    logging.info('Downloading SQL dump...')
    dump_path = db_utils.extract_db_dump(
        env.worker_pod_vars['SQL_USER'], env.worker_pod_vars['SQL_PASSWORD'],
        env.sql_proxy_pod_ip, '3306', env.worker_pod_vars['SQL_DATABASE'],
        f'composer-db-dump-{backup_datetime_str}.sql')

    logging.info('Building sequence file...')
    sequence_file_path = db_utils.build_sequence_file(
        env.worker_pod_vars['SQL_USER'], env.worker_pod_vars['SQL_PASSWORD'],
        env.sql_proxy_pod_ip, '3306', env.worker_pod_vars['SQL_DATABASE'],
        f'composer-db-sequence-{backup_datetime_str}.sql')

    logging.info('Uploading files...')
    logging.info('Airflow DB sql dump')
    _upload_blob(backup_bucket_name, dump_path,
                 f'{env_name}_{backup_datetime_str}/composer-db-dump.sql')

    logging.info('Airflow sequence sql')
    _upload_blob(backup_bucket_name, sequence_file_path,
                 f'{env_name}_{backup_datetime_str}/composer-db-sequence.sql')

    logging.info('Copying dag folder')
    _copy_gcs_folder(
        env.get_dag_folder_path(),
        f'gs://{backup_bucket_name}/{env_name}_{backup_datetime_str}/dags/')

    logging.info('Copying plugins folder')
    _copy_gcs_folder(
        env.get_plugins_folder_path(),
        f'gs://{backup_bucket_name}/{env_name}_{backup_datetime_str}/plugins/')

    logging.info('Uploading composer env pickle')
    env.save_to_gcs(backup_bucket_name,
                    f'{env_name}_{backup_datetime_str}/composer_env.pickle')


def restore(env_name: str, project_id: str, location: str, bucket: str,
            folder: str) -> None:
    """
    Performs a restore operation based on a previous backup
    """
    _check_cli_depdendencies()

    gke_cluster = gke_utils.get_gke_cluster(env_name, project_id, location)
    gke_utils.set_cluster(gke_cluster['c'], gke_cluster['z'], gke_cluster['p'])

    destination_env = ComposerEnv.from_current_context()
    source_composer_env = ComposerEnv.from_gcs(bucket,
                                               f'{folder}/composer_env.pickle')

    logging.info('Importing GCS dag and plugin folders')
    _copy_gcs_folder(source_composer_env.get_dag_folder_path(),
                     destination_env.get_dag_folder_path())

    _copy_gcs_folder(source_composer_env.get_plugins_folder_path(),
                     destination_env.get_plugins_folder_path())

    logging.info('Importing backup DB')
    db_utils.import_db(destination_env.worker_pod_vars['SQL_USER'],
                       destination_env.worker_pod_vars['SQL_PASSWORD'],
                       destination_env.sql_proxy_pod_ip, '3306',
                       destination_env.worker_pod_vars['SQL_DATABASE'],
                       f'gs://{bucket}/{folder}/composer-db-dump.sql')

    logging.info('Importing DB sequence')
    db_utils.import_db(destination_env.worker_pod_vars['SQL_USER'],
                       destination_env.worker_pod_vars['SQL_PASSWORD'],
                       destination_env.sql_proxy_pod_ip, '3306',
                       destination_env.worker_pod_vars['SQL_DATABASE'],
                       f'gs://{bucket}/{folder}/composer-db-sequence.sql')

    gke_utils.create_client()

    logging.info('Rotating fernet key on target airflow worker')
    gke_utils.rotate_fernet_key(
        destination_env.worker_pod['pod_name'], destination_env.namespace,
        source_composer_env.worker_pod_vars['AIRFLOW__CORE__FERNET__KEY'],
        destination_env.worker_pod_vars['AIRFLOW__CORE__FERNET__KEY'])
