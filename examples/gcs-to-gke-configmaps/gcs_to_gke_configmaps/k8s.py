# Copyright 2019 Google LLC
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

import base64
from tempfile import NamedTemporaryFile
import os

from googleapiclient import discovery
import kubernetes.client
from kubernetes.client.rest import ApiException

from gcs_to_gke_configmaps import cloud_logger
from gcs_to_gke_configmaps import get_credentials
from gcs_to_gke_configmaps import get_token
from gcs_to_gke_configmaps import logged


class K8SCluster(object):

    @logged
    def __init__(self, endpoint, token, ca_cert_string_b64="", debug=False):
        """Initialize a new Kubernetes cluster objects.

           using the Kubernetes Python Client under the hood, the
           initializer takes care of setting up the configuration,
           determining if SSL should be used, etc.
        Args:
            endpoint (str): Either an IP address for FQDN of the host endpoint
                for the Kubernetes API server
            token (str): The auth bearer token for accessing the Kubernetes API
            ca_cert_string_b64 (str): The base64 encoded string representation
                of the CA certificate for SSL verification of the server.  If
                provided SSL will be enforced.
            debug (bool): If set to true, this will enable debugging statements
                in calls to the Kubernetes Python CLient.

        """
        self._ca_cert_file_pointer = None
        self.configuration = kubernetes.client.Configuration()
        self.configuration.api_key['authorization'] = token
        self.configuration.api_key_prefix['authorization'] = 'Bearer'
        self.configuration.host = endpoint
        self.configuration.debug = debug

        if ca_cert_string_b64:
            self.ca_cert_string_b64 = ca_cert_string_b64
            self.configuration.verify_ssl = True

            cert_decoded = base64.b64decode(self.ca_cert_string_b64)
            fp = NamedTemporaryFile(delete=False)
            fp.write(cert_decoded)
            fp.seek(0)

            self.configuration.ssl_ca_cert = fp.name

            if endpoint.startswith("http://"):
                self.configuration.host = \
                    endpoint.replace("http://",
                                     "https://")

            elif not endpoint.startswith("https://"):
                self.configuration.host = \
                    'https://' + endpoint

    @property
    @logged
    def core_api_instance(self):
        """Obtains a K8s core API client instance
        Returns:
            kubernetes.client.CoreV1Api
        """
        return kubernetes.client.CoreV1Api(
            kubernetes.client.ApiClient(self.configuration))

    def bounce_k8s_pods(self, label_selector=""):
        """Deletes pods in the v1_pod_list

        Args:
            label_selector (str): A string representation of the labels
                by which to filter the pods.
        Returns:
            v1_statuses (list): A list of V1Status objects

        """
        v1_statuses = []
        v1_pod_list = self.get_k8s_pods(label_selector)
        try:
            for pod in v1_pod_list.items:
                pod_name = pod.metadata.name
                pod_namespace = pod.metadata.namespace
                v1_status = self.core_api_instance.delete_namespaced_pod(
                    name=pod_name, namespace=pod_namespace)
                v1_statuses.append(v1_status)
        except ApiException as e:
            cloud_logger.exception("Exception when calling CoreV1Api->\
                                   list_deployment_for_all_namespaces: %s\n" %
                                   e)
        return v1_statuses

    @logged
    def get_k8s_pods(self, label_selector=""):
        """Obtains a list of V1Pod objects whose labels match the
           label_selector (or all)

        Args:
            label_selector (str): A string representation of the labels
                by which to filter the pods.
        Returns:
            v1_pod_list (V1PodList): A V1PodList object
        """
        v1_pod_list = None

        try:
            # Get all pods matching labels in the cluster
            v1_pod_list = self.core_api_instance.list_pod_for_all_namespaces(
                watch=False,
                label_selector=label_selector)

        except ApiException as e:
            cloud_logger.exception("Exception when calling CoreV1Api->\
                                   list_deployment_for_all_namespaces: %s\n" %
                                   e)
        return v1_pod_list

    @logged
    def get_k8s_configmaps(self, label_selector=""):
        """Obtains a list of V1ConfigMaps objects whose labels
           match the label_selector (or all)
        Args:
            label_selector (str): A string representation of the labels
                by which to filter the pods.
        Returns:
            items (list): A list of V1ConfigMap objects
        """
        items = []
        cloud_logger.info("Labels for search: {}".format(label_selector))

        try:
            api_response = \
                self.core_api_instance.list_config_map_for_all_namespaces(
                    watch=False,
                    label_selector=label_selector)
            items = api_response.items
        except ApiException as e:
            cloud_logger.exception("Exception when calling CoreV1Api->\
                                   list_config_map_for_all_namespaces: %s\n" %
                                   e)
        return items

    @logged
    def update_k8s_configmaps(self, filename, content="",
                              label_selctor="", patch=True):
        """Update the K8s ConfigMaps
        Args:
            filename (str): The name of the GCS object that was updated/added
            content (str): The content of the GCS object to add to the
                ConfigMap.  If no content is provided, the key, determined by
                the filename, will be removed from the configmap
            label_selector (str): A string representation of the labels
                by which to filter the ConfigMaps.
            patch (bool): If set to false, the operation will be a replace
                instead of a patch.

        Returns:
            response (str): The content of the file
        """
        api_response = None
        basename = os.path.basename(filename)
        configmaps = self.get_k8s_configmaps(label_selctor)
        for configmap in configmaps:
            try:
                if configmap.data is None:
                    configmap.data = {}

                cloud_logger.info("Attempting to update/add \
                                  filname: {}".format(basename))

                if content:
                    configmap.data[basename] = content.decode("UTF-8")
                else:
                    try:
                        configmap.data.pop(basename)
                    except:
                        cloud_logger.info("Attempted to remove key {} \
                                          from ConfigMap {} in namespace {},\
                                          but key not found.".format(
                                            basename,
                                            configmap.metadata.name,
                                            configmap.metadata.namespace))

                if patch:
                    api_response = \
                        self.core_api_instance.patch_namespaced_config_map(
                            name=configmap.metadata.name,
                            namespace=configmap.metadata.namespace,
                            body=configmap)
                else:
                    api_response = \
                        self.core_api_instance.replace_namespaced_config_map(
                            name=configmap.metadata.name,
                            namespace=configmap.metadata.namespace,
                            body=configmap)

            except ApiException as e:
                operation = "patch"
                if not patch:
                    operation = "repalce"
                cloud_logger.exception("Exception when calling CoreV1Api\
                                       ->%s_namespaced_config_map: %s\n" %
                                       (operation, e))
        return api_response


class GKECluster(K8SCluster):

    @logged
    def __init__(self, name, location, project, debug=False):
        """Initialize a new GKE cluster object.

        Args:
            name (str): The name of the GKE cluster
            location (str): The location of the GKE cluster (zone or region)
            project (str): The GCP project in which the GKE cluster exists.
            debug (bool): If set to true, this will enable debugging statements
                in calls to the Kubernetes Python CLient.

        """
        self._info = None
        self._service = None
        self.name = name
        self.location = location
        self.project = project

        super().__init__(
            endpoint=self.info['endpoint'],
            token=get_token(),
            ca_cert_string_b64=self.info['masterAuth']['clusterCaCertificate'],
            debug=debug)

    @property
    @logged
    def id(self):
        """Obtains the GKE cluster ID
        Returns:
            cluster_id (str): The GKE cluster ID in the form of
                projects/_/locations/_/clusters_
        """
        cluster_id = "projects/{0}/locations/{1}/clusters/{2}".format(
                self.project, self.location, self.name)
        return cluster_id

    @property
    @logged
    def info(self):
        """Obtains the GKE cluster information
        Returns:
            response (dict): The GKE cluster information
        """
        if self._info is None:
            service = self.service
            request = service.projects().locations().clusters().get(
                name=self.id)
            self._info = request.execute()

        return self._info

    @property
    @logged
    def service(self):
        """The GKE cluster service
        Returns:
            service (Resource): The GKE cluster service
        """
        if self._service is None:
            self._service = discovery.build(
                'container',
                'v1',
                credentials=get_credentials(),
                cache_discovery=False)
        return self._service
