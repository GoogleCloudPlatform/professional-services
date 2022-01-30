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
Module defining the ComposerEnv class.
"""
from __future__ import annotations
import pickle
import gke_utils
from google.cloud import storage


class ComposerEnv(object):
    """
    ComposerEnv class. Used to instantiate and represent all extracted data
    related to a composer environment.
    """

    def __init__(self, namespace, worker_pod, worker_pod_vars,
                 sql_proxy_pod_ip):
        self.namespace = namespace
        self.worker_pod = worker_pod
        self.worker_pod_vars = worker_pod_vars
        self.sql_proxy_pod_ip = sql_proxy_pod_ip

    @classmethod
    def from_current_context(cls) -> ComposerEnv:
        """
        Initializes a new environment object based on the GKE instance in
        the current kubectl context
        """
        k8s_client = gke_utils.create_client()

        namespace = gke_utils.extract_composer_namespace(k8s_client)
        worker_pod = gke_utils.extract_worker_pod_by_namespace(
            k8s_client, namespace)

        namespace_secrets = gke_utils.extract_airflow_secrets_by_namespace(
            k8s_client, namespace)

        worker_pod_vars = gke_utils.extract_worker_env_vars(
            k8s_client, namespace, worker_pod['pod_name'])
        sql_proxy_pod_ip = gke_utils.extract_sql_proxy_pod_id(k8s_client)
        worker_pod_vars['AIRFLOW__CORE__FERNET__KEY'] = namespace_secrets[
            'fernet_key']
        worker_pod_vars['SQL_PASSWORD'] = namespace_secrets['sql_password']

        composer_env_instance = cls.__new__(cls)
        composer_env_instance.namespace = namespace
        composer_env_instance.worker_pod = worker_pod
        composer_env_instance.worker_pod_vars = worker_pod_vars
        composer_env_instance.sql_proxy_pod_ip = sql_proxy_pod_ip

        return composer_env_instance

    @classmethod
    def from_gcs(cls, gcs_bucket: str, gcs_file_path: str) -> ComposerEnv:
        """
        Initializes a new environment object based on a saved pickle
        available on GCS
        """
        storage_client = storage.Client()
        bucket = storage_client.get_bucket(gcs_bucket)
        blob = bucket.blob(gcs_file_path)
        pickle_input = blob.download_as_string()
        composer_env_instance = pickle.loads(pickle_input)

        return composer_env_instance

    def save_to_gcs(self, gcs_bucket: str, gcs_file_path: str) -> None:
        """
        Persists all elements of the environment object into a target GCS folder
        via pickle
        """
        storage_client = storage.Client()
        bucket = storage_client.get_bucket(gcs_bucket)
        blob = bucket.blob(gcs_file_path)
        pickle_output = pickle.dumps(self)
        blob.upload_from_string(pickle_output)

    def get_dag_folder_path(self) -> str:
        """
        Returns the full GCS path associated with the dag folder
        of the current env
        """
        return f'gs://{self.worker_pod_vars["GCS_BUCKET"]}/dags/'

    def get_plugins_folder_path(self) -> str:
        """
        Returns the GCS path associated with the plugins folder of the
        current env
        """
        return f'gs://{self.worker_pod_vars["GCS_BUCKET"]}/plugins/'
