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
Module implements a set of utility functions for interacting with the
airflow / composer GKE cluster and its components.
"""
import re
import base64
import utils
from kubernetes import client, config
import google.auth
from googleapiclient.discovery import build


def set_cluster(cluster, zone, project):
    """
    Runs the underlying gCloud command for fetching
    cluster endpoint and auth data and generates kubeconfig entry
    """
    utils.sh([
        'gcloud', 'container', 'clusters', 'get-credentials', cluster, '--zone',
        zone, '--project', project
    ])


def get_gke_cluster(env_name, project_id, location):
    path = f'projects/{project_id}/locations/{location}/environments/{env_name}'
    auth = google.auth.default()
    credentials = auth[0]
    composer = build('composer', 'v1', credentials=credentials)
    res = composer.projects().locations().environments().get(
        name=path).execute()
    cluster_path = re.search(
        r'projects\/(?P<p>.*)\/zones\/(?P<z>.*)\/clusters\/(?P<c>.*)',
        res['config']['gkeCluster']).groupdict()
    return cluster_path


def create_client():
    config.load_kube_config()
    return client.CoreV1Api()


def extract_worker_pod_by_namespace(k8s_client, namespace):
    pods = k8s_client.list_namespaced_pod(namespace=namespace)
    pod_name_pattern = r'^airflow-worker-([A-Za-z0-9]+)-([A-Za-z0-9]+)$'
    for pod in pods.items:
        if (pod.status.phase == 'Running' and
                re.match(pod_name_pattern, pod.metadata.name)):
            return {'pod_ip': pod.status.pod_ip, 'pod_name': pod.metadata.name}
    raise ValueError('Airflow worker pod not found')


def extract_composer_namespace(k8s_client):
    all_namespaces = k8s_client.list_namespace(watch=False)
    ns_pattern = re.compile(r'^composer-(\d+)-(\d+)-(\d+)'
                            r'-airflow-(\d+)-(\d+)-(\d+)-([A-Za-z0-9]+)$')
    for ns in all_namespaces.items:
        if (re.match(ns_pattern, ns.metadata.name) and
                ns.status.phase == 'Active'):
            return ns.metadata.name
    raise ValueError('Composer namespace not found')


def extract_airflow_secrets_by_namespace(k8s_client, namespace):
    secrets = k8s_client.read_namespaced_secret(namespace=namespace,
                                                name='airflow-secrets')
    if all(k in secrets.data.keys() for k in ('fernet_key', 'sql_password')):
        return {
            'fernet_key':
                base64.b64decode(secrets.data['fernet_key']).decode('utf-8'),
            'sql_password':
                base64.b64decode(secrets.data['sql_password']).decode('utf-8')
        }
    raise ValueError('fernet_key / sql_password missing from airflow secrets')


def extract_worker_env_vars(k8s_client, namespace, pod_name):
    pod = k8s_client.read_namespaced_pod(namespace=namespace, name=pod_name)
    for container in pod.spec.containers:
        if 'worker' in container.args:
            return {var.name: var.value for var in container.env}
    raise ValueError('Worker environment variables missing from pod')


def extract_sql_proxy_pod_id(k8s_client):
    pods = k8s_client.list_pod_for_all_namespaces()
    sql_proxy_pod_pattern = r'airflow-sqlproxy-([A-Za-z0-9]+)-([A-Za-z0-9]+)'
    for pod in pods.items:
        if re.match(sql_proxy_pod_pattern, pod.metadata.name):
            return pod.status.pod_ip
    raise ValueError('Airflow SQL proxy pod not found')


def rotate_fernet_key(pod_name, namespace, source_fernet_key,
                      destination_fernet_key):
    target_key_value = f'{destination_fernet_key},{source_fernet_key}'
    command = [
        'kubectl', 'exec', '-t', '-n', namespace, pod_name, '--', 'bash', '-c',
        f'export AIRFLOW__CORE__FERNET_KEY="{target_key_value}"', '&&',
        'airflow rotate-fernet-key'
    ]

    utils.sh(command)
