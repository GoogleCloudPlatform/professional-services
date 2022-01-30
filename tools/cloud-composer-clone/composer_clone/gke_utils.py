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
import command_utils
from kubernetes import config
from kubernetes.client import CoreV1Api
import google.auth
from googleapiclient.discovery import build


def set_cluster(cluster: str, zone: str, project: str) -> None:
    """
    Runs the underlying gCloud command for fetching
    cluster endpoint and auth data and generates kubeconfig entry
    """
    command_utils.sh([
        'gcloud', 'container', 'clusters', 'get-credentials', cluster, '--zone',
        zone, '--project', project
    ])


def get_gke_cluster(env_name: str, project_id: str, location: str) -> dict:
    """
    Query the composer API to fetche the GKE cluster path for a composer env
    return: {'p': 'some-project', 'z': 'the-zone', 'c': 'the-gke-cluster'}
    """
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


def create_client() -> CoreV1Api:
    """
    Instantiate a new k8s api client based on the current set
    config on the host
    """
    config.load_kube_config()
    return CoreV1Api()


def extract_composer_namespace(k8s_client: CoreV1Api) -> str:
    """
    Get the first k8s namespace in a given cluster (based on the client config)
    matching the cloud composer / airflow naming pattern.
    """
    all_namespaces = k8s_client.list_namespace(watch=False)
    ns_pattern = re.compile(r'^composer-(\d+)-(\d+)-(\d+)'
                            r'-airflow-(\d+)-(\d+)-(\d+)-([A-Za-z0-9]+)$')
    for ns in all_namespaces.items:
        if (re.match(ns_pattern, ns.metadata.name) and
                ns.status.phase == 'Active'):
            return ns.metadata.name
    raise ValueError('Composer namespace not found')


def extract_worker_pod_by_namespace(k8s_client: CoreV1Api,
                                    namespace: str) -> dict:
    """
    Get the first airflow worker pod in a given namespace, matching the airflow
    worker naming pattern.
    return: {'pod_id':'143.3.4.6', 'pod_name':'whatever-pod'}
    """
    pods = k8s_client.list_namespaced_pod(namespace=namespace)
    pod_name_pattern = r'^airflow-worker-([A-Za-z0-9]+)-([A-Za-z0-9]+)$'
    for pod in pods.items:
        if (pod.status.phase == 'Running' and
                re.match(pod_name_pattern, pod.metadata.name)):
            return {'pod_ip': pod.status.pod_ip, 'pod_name': pod.metadata.name}
    raise ValueError('Airflow worker pod not found')


def extract_airflow_secrets_by_namespace(k8s_client: CoreV1Api,
                                         namespace: str) -> dict:
    """
    Extract the main airflow secrets based on a given namespace
    return: {'fernet_key':'thekey12367', 'sql_password':'examplepass'}
    """
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


def extract_worker_env_vars(k8s_client: CoreV1Api, namespace: str,
                            pod_name: str) -> dict:
    """
    Get all environment variables of a given gke worker pod in a namespace
    """
    pod = k8s_client.read_namespaced_pod(namespace=namespace, name=pod_name)
    for container in pod.spec.containers:
        if 'worker' in container.args:
            return {var.name: var.value for var in container.env}
    raise ValueError('Worker environment variables missing from pod')


def extract_sql_proxy_pod_id(k8s_client: CoreV1Api) -> str:
    """
    Query all namespaces of a given cluster to find the airflow sql proxy pod
    based on the composer / airflow naming pattern. Note: The sql proxy pod
    can be listed under the default namespace and not necessarily under the
    airflow namespace itself in the GKE cluster.
    """
    pods = k8s_client.list_pod_for_all_namespaces()
    sql_proxy_pod_pattern = r'airflow-sqlproxy-([A-Za-z0-9]+)-([A-Za-z0-9]+)'
    for pod in pods.items:
        if re.match(sql_proxy_pod_pattern, pod.metadata.name):
            return pod.status.pod_ip
    raise ValueError('Airflow SQL proxy pod not found')


def rotate_fernet_key(pod_name: str, namespace: str, source_fernet_key: str,
                      destination_fernet_key: str) -> None:
    """
    Executes a command on the target GKE airflow pod, mainly updating the
    environment var fernet key by appending that of another composer env
    and rotating it against the current key in the current env.
    """
    target_key_value = f'{destination_fernet_key},{source_fernet_key}'
    command = [
        'kubectl', 'exec', '-t', '-n', namespace, pod_name, '--', 'bash', '-c',
        f'export AIRFLOW__CORE__FERNET_KEY="{target_key_value}"', '&&',
        'airflow rotate-fernet-key'
    ]

    command_utils.sh(command)
